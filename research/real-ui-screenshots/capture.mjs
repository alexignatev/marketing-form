import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = path.resolve('SARV_REAL_UI_SCREENSHOTS_2026-07-27');
const targets = JSON.parse(await fs.readFile('research/real-ui-screenshots/targets.json', 'utf8'));
const capturedAt = new Date().toISOString();

const slug = (s) => String(s).normalize('NFKD').replace(/[^\p{L}\p{N}]+/gu, '_').replace(/^_+|_+$/g, '').slice(0, 100) || 'item';
const hash = (b) => crypto.createHash('sha256').update(b).digest('hex');
const mkdir = (d) => fs.mkdir(d, { recursive: true });
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const quote = (v) => `"${String(v ?? '').replaceAll('"', '""')}"`;

function extension(type = '', url = '') {
  const t = type.toLowerCase();
  if (t.includes('png')) return '.png';
  if (t.includes('webp')) return '.webp';
  if (t.includes('svg')) return '.svg';
  if (t.includes('gif')) return '.gif';
  if (t.includes('jpeg') || t.includes('jpg')) return '.jpg';
  const clean = url.split('?')[0].toLowerCase();
  const m = clean.match(/\.(png|webp|svg|gif|jpe?g)$/);
  return m ? `.${m[1].replace('jpeg', 'jpg')}` : '.bin';
}

async function closeOverlays(page) {
  const names = [/accept all/i, /accept cookies/i, /allow all/i, /agree/i, /continue/i, /got it/i, /принять/i, /разрешить/i, /^ok$/i];
  for (const name of names) {
    try {
      const button = page.getByRole('button', { name }).first();
      if (await button.isVisible({ timeout: 350 })) {
        await button.click({ timeout: 1000 });
        await delay(200);
      }
    } catch {}
  }
  try { await page.keyboard.press('Escape'); } catch {}
}

async function scrollPage(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let y = 0;
      const max = Math.min(document.documentElement.scrollHeight, 24000);
      const timer = setInterval(() => {
        window.scrollBy(0, Math.max(600, Math.floor(innerHeight * 0.85)));
        y += Math.max(600, Math.floor(innerHeight * 0.85));
        if (y >= max) {
          clearInterval(timer);
          window.scrollTo(0, 0);
          resolve();
        }
      }, 110);
    });
  });
  await delay(800);
}

async function downloadOriginal(context, url, referer, base) {
  try {
    const response = await context.request.get(url, { timeout: 30000, headers: { referer } });
    if (!response.ok()) return null;
    const type = response.headers()['content-type'] || '';
    if (!type.startsWith('image/')) return null;
    const body = await response.body();
    if (body.length < 5000 || body.length > 30_000_000) return null;
    const file = `${base}${extension(type, url)}`;
    await fs.writeFile(file, body);
    return { file, sha256: hash(body), bytes: body.length, contentType: type };
  } catch {
    return null;
  }
}

await mkdir(ROOT);
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  locale: 'en-US',
  colorScheme: 'light',
  userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/127 Safari/537.36'
});

const manifest = [];
const globalHashes = new Set();

for (let i = 0; i < targets.length; i++) {
  const target = targets[i];
  console.log(`[${i + 1}/${targets.length}] ${target.system} — ${target.page}`);
  const folder = path.join(ROOT, slug(target.category), slug(target.system), `${String(i + 1).padStart(2, '0')}_${slug(target.page)}`);
  await mkdir(folder);
  const page = await context.newPage();
  const row = { ...target, capturedAt, status: 'pending', files: [] };

  try {
    const response = await page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    row.httpStatus = response?.status() ?? null;
    await delay(2200);
    await closeOverlays(page);
    await scrollPage(page);
    await closeOverlays(page);
    row.finalUrl = page.url();
    row.title = await page.title();
    row.status = 'captured';

    const top = await page.screenshot({ type: 'png', fullPage: false });
    const topPath = path.join(folder, '00_OFFICIAL_PAGE_TOP.png');
    await fs.writeFile(topPath, top);
    row.files.push({ kind: 'live_official_page_top', file: path.relative(ROOT, topPath), sha256: hash(top), sourcePage: row.finalUrl });

    try {
      const full = await page.screenshot({ type: 'jpeg', quality: 76, fullPage: true });
      const fullPath = path.join(folder, '01_OFFICIAL_PAGE_FULL.jpg');
      await fs.writeFile(fullPath, full);
      row.files.push({ kind: 'live_official_page_full', file: path.relative(ROOT, fullPath), sha256: hash(full), sourcePage: row.finalUrl });
    } catch (error) {
      row.fullPageError = String(error);
    }

    const images = await page.evaluate(() => {
      const uiWords = /dashboard|screenshot|interface|workspace|builder|view|panel|table|graph|chart|timeline|profile|account|workflow|repository|insight|report|console|inbox|chat|mapping|lineage|trace|product|platform|analytics|journey|funnel/i;
      const noise = /logo|avatar|portrait|headshot|author|customer.logo|quote.icon|decor|icon|badge/i;
      return [...document.querySelectorAll('img')].map((img, index) => {
        const src = img.currentSrc || img.src || '';
        const alt = img.alt || '';
        return { index, src, alt, w: img.naturalWidth, h: img.naturalHeight, score: uiWords.test(`${alt} ${src}`) ? 2 : 0 };
      }).filter((x) => {
        if (!x.src || x.w < 650 || x.h < 320) return false;
        const ratio = x.w / Math.max(1, x.h);
        if (ratio < 0.7 || ratio > 5.2) return false;
        return !(noise.test(x.alt) && x.score === 0);
      }).sort((a, b) => b.score - a.score || b.w * b.h - a.w * a.h).slice(0, 10);
    });

    let n = 0;
    for (const image of images) {
      try {
        const locator = page.locator('img').nth(image.index);
        await locator.scrollIntoViewIfNeeded({ timeout: 3000 });
        await delay(120);
        const rendered = await locator.screenshot({ type: 'png', timeout: 7000 });
        const renderedHash = hash(rendered);
        if (globalHashes.has(renderedHash)) continue;
        globalHashes.add(renderedHash);
        n += 1;
        const renderedPath = path.join(folder, `UI_${String(n).padStart(2, '0')}_RENDERED.png`);
        await fs.writeFile(renderedPath, rendered);
        const item = {
          kind: 'official_page_ui_image_rendered',
          file: path.relative(ROOT, renderedPath),
          sha256: renderedHash,
          sourcePage: row.finalUrl,
          originalAssetUrl: image.src,
          alt: image.alt,
          width: image.w,
          height: image.h
        };
        const original = await downloadOriginal(context, image.src, row.finalUrl, path.join(folder, `UI_${String(n).padStart(2, '0')}_ORIGINAL`));
        if (original) {
          item.originalFile = path.relative(ROOT, original.file);
          item.originalSha256 = original.sha256;
          item.originalBytes = original.bytes;
          item.originalContentType = original.contentType;
        }
        row.files.push(item);
      } catch {}
    }

    const posters = await page.evaluate(() => [...document.querySelectorAll('video[poster]')]
      .map((v) => ({ url: new URL(v.getAttribute('poster'), document.baseURI).href, w: v.clientWidth, h: v.clientHeight }))
      .filter((x) => x.w >= 600 && x.h >= 300).slice(0, 4));
    for (let p = 0; p < posters.length; p++) {
      const original = await downloadOriginal(context, posters[p].url, row.finalUrl, path.join(folder, `VIDEO_POSTER_${String(p + 1).padStart(2, '0')}`));
      if (original) row.files.push({ kind: 'official_video_poster', file: path.relative(ROOT, original.file), sha256: original.sha256, sourcePage: row.finalUrl, originalAssetUrl: posters[p].url });
    }

    await fs.writeFile(path.join(folder, 'SOURCE.json'), JSON.stringify(row, null, 2));
    await fs.writeFile(path.join(folder, 'SOURCE.md'), `# ${target.system} — ${target.page}\n\n- Official source: ${row.finalUrl}\n- Captured: ${capturedAt}\n- HTTP status: ${row.httpStatus}\n- Images: ${row.files.length}\n\nEvery image here is a live capture of the official public page or an image asset published on that page. No generated or reconstructed UI is included.\n`);
  } catch (error) {
    row.status = 'failed';
    row.error = String(error);
    try {
      const failed = await page.screenshot({ type: 'png' });
      const failedPath = path.join(folder, 'CAPTURE_FAILED.png');
      await fs.writeFile(failedPath, failed);
      row.files.push({ kind: 'failure_page', file: path.relative(ROOT, failedPath), sha256: hash(failed), sourcePage: page.url() });
    } catch {}
    await fs.writeFile(path.join(folder, 'ERROR.json'), JSON.stringify(row, null, 2));
  } finally {
    manifest.push(row);
    await page.close();
  }
}

await browser.close();

const flat = manifest.flatMap((m) => m.files.map((f) => ({ ...m, ...f, files: undefined })) ;
await fs.writeFile(path.join(ROOT, 'manifest.json'), JSON.stringify({ capturedAt, manifest }, null, 2));
const columns = ['category','system','page','status','url','finalUrl','kind','file','originalFile','sourcePage','originalAssetUrl','alt','sha256','capturedAt'];
const csv = [columns.map(quote).join(','), ...flat.map((r) => columns.map((c) => quote(r[c])).join(','))].join('\n');
await fs.writeFile(path.join(ROOT, 'manifest.csv'), csv);
await fs.writeFile(path.join(ROOT, 'SHA256SUMS.txt'), flat.filter((r) => r.file).map((r) => `${r.sha256}  ${r.file}`).join('\n'));

const visualFiles = flat.filter((r) => r.kind !== 'failure_page' && /\.(png|jpe?g|webp|gif)$/i.test(r.file));
const cards = visualFiles.map((r) => {
  const file = r.file.split(path.sep).join('/');
  const source = r.finalUrl || r.url;
  return `<article><a href="${file}" target="_blank"><img loading="lazy" src="${file}" alt="${String(r.alt || `${r.system} ${r.page}`).replaceAll('"','&quot;')}"></a><h3>${r.system} · ${r.page}</h3><p>${r.kind}</p><p><a href="${source}" target="_blank">Официальная страница-источник</a></p><code>${file}</code></article>`;
}).join('\n');
const html = `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Реальные интерфейсы похожих систем</title><style>body{margin:0;background:#f2f3f5;color:#151515;font:14px/1.45 system-ui}header{position:sticky;top:0;z-index:2;padding:20px 28px;background:white;border-bottom:1px solid #ddd}main{padding:24px;display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:18px}article{background:white;border:1px solid #ddd;border-radius:12px;padding:12px;min-width:0}img{width:100%;height:240px;object-fit:contain;background:#eee;border-radius:8px}h3{margin:10px 0 4px}p{margin:3px 0}code{display:block;margin-top:8px;overflow-wrap:anywhere;color:#555}</style></head><body><header><h1>Реальные публичные интерфейсы похожих систем</h1><p>${capturedAt}. ${visualFiles.length} изображений с ${manifest.length} официальных страниц. Здесь нет сгенерированных или реконструированных интерфейсов.</p></header><main>${cards}</main></body></html>`;
await fs.writeFile(path.join(ROOT, 'index.html'), html);
await fs.writeFile(path.join(ROOT, 'README.md'), `# Реальные скриншоты похожих систем\n\nДата захвата: ${capturedAt}\n\nСодержимое архива:\n\n1. Реальные браузерные снимки официальных публичных страниц.\n2. Оригинальные изображения интерфейсов, опубликованные на этих страницах, когда исходный файл удалось скачать.\n3. SOURCE.json и SOURCE.md в каждой папке.\n4. Общий manifest.csv, manifest.json и SHA256SUMS.txt.\n\nВ архиве нет сгенерированных, нарисованных или реконструированных интерфейсов. Закрытые экраны за авторизацией не включены.\n`);

console.log(`Captured ${manifest.length} pages; saved ${visualFiles.length} visual files; failed ${manifest.filter((x) => x.status === 'failed').length}`);
