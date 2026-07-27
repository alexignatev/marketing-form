import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const sourcePath = path.resolve('research/real-ui-screenshots/capture.mjs');
const fixedPath = path.resolve('research/real-ui-screenshots/capture.fixed.mjs');
let source = await fs.readFile(sourcePath, 'utf8');
source = source.replace(
  "const flat = manifest.flatMap((m) => m.files.map((f) => ({ ...m, ...f, files: undefined })) ;",
  "const flat = manifest.flatMap((m) => m.files.map((f) => ({ ...m, ...f, files: undefined })));"
);
await fs.writeFile(fixedPath, source);
await import(pathToFileURL(fixedPath).href);
