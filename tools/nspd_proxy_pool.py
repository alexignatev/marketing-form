from __future__ import annotations

import json
import os
import re
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Any

import requests
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

CADASTRAL_NUMBERS = [
    "22:43:010001:1229", "22:43:010001:1233", "22:43:010001:1246",
    "22:43:010001:1272", "22:43:040001:1313", "22:43:040001:1564",
    "22:43:040001:1571", "22:43:040001:1575", "22:43:010001:1227",
    "22:43:010001:1235", "22:43:010001:1236", "22:43:040001:1300",
    "22:43:040001:1301", "22:43:040001:1302", "22:43:040002:513",
]
TEST_CAD = CADASTRAL_NUMBERS[0]
NSPD_URL = "https://nspd.gov.ru/api/geoportal/v2/search/geoportal"
OUT = Path("nspd_proxy_result")
RAW = OUT / "raw"
GEO = OUT / "geojson"
for folder in (OUT, RAW, GEO):
    folder.mkdir(parents=True, exist_ok=True)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/131 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "ru-RU,ru;q=0.9,en;q=0.7",
    "Origin": "https://nspd.gov.ru",
    "Referer": "https://nspd.gov.ru/map?thematic=PKK&baseLayerId=235&theme_id=1",
    "Connection": "close",
}

SOURCES = [
    "https://proxylist.geonode.com/api/proxy-list?limit=500&page=1&sort_by=lastChecked&sort_type=desc&country=RU&protocols=http%2Chttps",
    "https://api.proxyscrape.com/v4/free-proxy-list/get?request=displayproxies&protocol=http&timeout=10000&country=ru&ssl=all&anonymity=all",
    "https://raw.githubusercontent.com/proxifly/free-proxy-list/main/proxies/protocols/http/data.txt",
    "https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/http.txt",
    "https://raw.githubusercontent.com/monosans/proxy-list/main/proxies/http.txt",
]


def add_proxy(target: set[str], value: str) -> None:
    value = value.strip()
    if not value:
        return
    value = re.sub(r"^(?:https?|socks\d?)://", "", value, flags=re.I)
    if re.fullmatch(r"[A-Za-z0-9.\-]+:\d{2,5}", value):
        target.add("http://" + value)


def collect_proxies() -> tuple[list[str], list[dict[str, Any]]]:
    proxies: set[str] = set()
    diagnostics: list[dict[str, Any]] = []
    for url in SOURCES:
        try:
            response = requests.get(url, timeout=35, headers={"User-Agent": HEADERS["User-Agent"]})
            diagnostics.append({"url": url, "status": response.status_code, "bytes": len(response.content)})
            if response.status_code != 200:
                continue
            if "geonode" in url:
                payload = response.json()
                for item in payload.get("data", []):
                    ip, port = item.get("ip"), item.get("port")
                    if ip and port:
                        add_proxy(proxies, f"{ip}:{port}")
            else:
                for line in response.text.splitlines():
                    add_proxy(proxies, line)
        except Exception as exc:
            diagnostics.append({"url": url, "error": repr(exc)})
    return list(proxies)[:900], diagnostics


def extract_features(payload: Any) -> list[dict[str, Any]]:
    if isinstance(payload, dict):
        if isinstance(payload.get("features"), list):
            return payload["features"]
        data = payload.get("data")
        if isinstance(data, dict) and isinstance(data.get("features"), list):
            return data["features"]
        if isinstance(data, list):
            return data
    return payload if isinstance(payload, list) else []


def test_proxy(proxy: str) -> dict[str, Any]:
    try:
        response = requests.get(
            NSPD_URL,
            params={"thematicSearchId": 1, "query": TEST_CAD, "limit": 10},
            headers=HEADERS,
            proxies={"http": proxy, "https": proxy},
            timeout=(5, 12),
            verify=False,
            allow_redirects=True,
        )
        text = response.text
        if response.status_code != 200:
            return {"proxy": proxy, "ok": False, "status": response.status_code, "body": text[:120]}
        payload = response.json()
        features = extract_features(payload)
        if not features:
            return {"proxy": proxy, "ok": False, "status": 200, "body": text[:150], "reason": "no features"}
        return {"proxy": proxy, "ok": True, "status": 200, "feature_count": len(features)}
    except Exception as exc:
        return {"proxy": proxy, "ok": False, "error": type(exc).__name__ + ": " + str(exc)[:180]}


def fetch_cad(cad: str, proxy_pool: list[str]) -> dict[str, Any]:
    errors: list[str] = []
    for proxy in proxy_pool:
        try:
            response = requests.get(
                NSPD_URL,
                params={"thematicSearchId": 1, "query": cad, "limit": 20},
                headers=HEADERS,
                proxies={"http": proxy, "https": proxy},
                timeout=(6, 25),
                verify=False,
            )
            if response.status_code != 200:
                errors.append(f"{proxy} HTTP {response.status_code}")
                continue
            payload = response.json()
            features = extract_features(payload)
            if not features:
                errors.append(f"{proxy} no features")
                continue
            return {"cadastral_number": cad, "proxy": proxy, "payload": payload, "features": features, "error": None}
        except Exception as exc:
            errors.append(f"{proxy} {type(exc).__name__}: {str(exc)[:100]}")
    return {"cadastral_number": cad, "proxy": None, "payload": None, "features": [], "error": " | ".join(errors)}


def geometry_stats(feature: dict[str, Any]) -> tuple[str | None, int, int]:
    geometry = feature.get("geometry")
    if not isinstance(geometry, dict):
        return None, 0, 0
    kind = geometry.get("type")
    coords = geometry.get("coordinates")
    if kind == "Polygon" and isinstance(coords, list):
        return kind, 1, sum(len(ring) for ring in coords if isinstance(ring, list))
    if kind == "MultiPolygon" and isinstance(coords, list):
        return kind, len(coords), sum(len(ring) for polygon in coords if isinstance(polygon, list) for ring in polygon if isinstance(ring, list))
    return str(kind) if kind else None, 0, 0


proxies, source_diagnostics = collect_proxies()
print("COLLECTED", len(proxies), flush=True)
working: list[dict[str, Any]] = []
test_results: list[dict[str, Any]] = []
lock = threading.Lock()
with ThreadPoolExecutor(max_workers=120) as executor:
    futures = {executor.submit(test_proxy, proxy): proxy for proxy in proxies}
    for future in as_completed(futures):
        row = future.result()
        test_results.append(row)
        if row.get("ok"):
            with lock:
                working.append(row)
                print("WORKING", row, flush=True)
        if len(working) >= 8:
            break

working_proxies = [row["proxy"] for row in working]
records: list[dict[str, Any]] = []
if working_proxies:
    with ThreadPoolExecutor(max_workers=15) as executor:
        futures = {executor.submit(fetch_cad, cad, working_proxies): cad for cad in CADASTRAL_NUMBERS}
        for future in as_completed(futures):
            row = future.result()
            cad = row["cadastral_number"]
            safe = cad.replace(":", "_")
            if row["payload"] is not None:
                (RAW / f"{safe}.json").write_text(json.dumps(row["payload"], ensure_ascii=False, indent=2), encoding="utf-8")
                (GEO / f"{safe}.geojson").write_text(json.dumps({"type": "FeatureCollection", "features": row["features"]}, ensure_ascii=False, indent=2), encoding="utf-8")
            best_feature = row["features"][0] if row["features"] else {}
            kind, components, vertices = geometry_stats(best_feature)
            props = best_feature.get("properties") if isinstance(best_feature.get("properties"), dict) else {}
            records.append({
                "cadastral_number": cad,
                "proxy": row["proxy"],
                "geometry_type": kind,
                "components": components,
                "vertices": vertices,
                "properties": props,
                "error": row["error"],
            })
            print("CAD", cad, kind, components, row["error"], flush=True)
else:
    records = [{"cadastral_number": cad, "components": 0, "error": "No working proxy found"} for cad in CADASTRAL_NUMBERS]

records.sort(key=lambda item: (item.get("components") or 0, item.get("vertices") or 0), reverse=True)
summary = {
    "github_run_id": os.getenv("GITHUB_RUN_ID"),
    "source_diagnostics": source_diagnostics,
    "proxy_count": len(proxies),
    "working_proxies": working,
    "tested_sample": test_results[:300],
    "selected_candidate": records[0] if records else None,
    "all": records,
}
(OUT / "summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
print("SELECTED", json.dumps(summary["selected_candidate"], ensure_ascii=False), flush=True)
