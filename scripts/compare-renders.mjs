#!/usr/bin/env node
import { mkdir, mkdtemp, readdir, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { join, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

function indexImages(names, pattern, label) {
  const indexed = new Map();
  for (const name of names) {
    const match = pattern.exec(name);
    if (!match) continue;
    const index = Number(match[1]);
    if (!Number.isSafeInteger(index) || index < 1 || indexed.has(index)) {
      throw new Error(`${label} has an invalid or duplicate slide number: ${name}`);
    }
    indexed.set(index, name);
  }
  return indexed;
}

export function pairSlideImages(previewNames, libreOfficeNames) {
  const preview = indexImages(previewNames, /^slide-(\d+)\.png$/i, 'Preview');
  const libreOffice = indexImages(libreOfficeNames, /^libreoffice-(\d+)\.png$/i, 'LibreOffice');
  if (preview.size === 0) throw new Error('No preview PNGs found. Run preview:example first.');
  if (preview.size !== libreOffice.size) {
    throw new Error(`Slide-count mismatch: ${preview.size} preview PNGs, ${libreOffice.size} LibreOffice pages.`);
  }
  return Array.from({ length: preview.size }, (_, position) => {
    const index = position + 1;
    if (!preview.has(index) || !libreOffice.has(index)) {
      throw new Error(`Missing slide ${index} in the preview or LibreOffice render.`);
    }
    return { index, preview: preview.get(index), libreOffice: libreOffice.get(index) };
  });
}

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);

function reportHtml(pairs, previewDir, renderDir, outputDir) {
  const imagePath = (directory, name) => escapeHtml(relative(outputDir, join(directory, name))
    .split(sep).map(encodeURIComponent).join('/'));
  const slides = pairs.map(({ index, preview, libreOffice }) => `
    <section>
      <h2>Slide ${index}</h2>
      <div class="pair">
        <figure><a href="${imagePath(previewDir, preview)}"><img src="${imagePath(previewDir, preview)}" alt="Slide ${index} preview"></a><figcaption>Office Kit preview</figcaption></figure>
        <figure><a href="${imagePath(renderDir, libreOffice)}"><img src="${imagePath(renderDir, libreOffice)}" alt="Slide ${index} LibreOffice render"></a><figcaption>LibreOffice PDF render</figcaption></figure>
      </div>
    </section>`).join('\n');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Deckcraft render comparison</title>
<style>
  body { margin: 2rem; font: 16px system-ui, sans-serif; color: #111827; background: #f8fafc; }
  main { max-width: 1500px; margin: auto; }
  section { margin: 2rem 0 3rem; }
  .pair { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
  figure { margin: 0; }
  img { display: block; width: 100%; height: auto; border: 1px solid #cbd5e1; background: white; }
  figcaption { margin-top: .5rem; font-weight: 600; }
  @media (max-width: 900px) { .pair { grid-template-columns: 1fr; } }
</style>
</head>
<body>
<main>
  <h1>Render comparison</h1>
  <p>Inspect text wrapping, chart axes, table styling, and clipping. Click either image for full size. This report pairs pages but does not score visual similarity.</p>${slides}
</main>
</body>
</html>\n`;
}

async function main() {
  const [previewDir, pdf, outputDir = 'artifacts/comparison'] = process.argv.slice(2);
  if (!previewDir || !pdf) {
    console.error('Usage: node scripts/compare-renders.mjs <preview-dir> <pdf> [output-dir]');
    process.exitCode = 2;
    return;
  }
  await mkdir(outputDir, { recursive: true });
  const renderDir = await mkdtemp(join(outputDir, 'libreoffice-'));
  const result = spawnSync('pdftoppm', ['-png', '-r', '96', pdf, join(renderDir, 'libreoffice')], { encoding: 'utf8' });
  if (result.error?.code === 'ENOENT') throw new Error('pdftoppm is not on PATH. Install Poppler for render comparison.');
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`pdftoppm failed: ${result.stderr.trim() || `exit ${result.status}`}`);
  const pairs = pairSlideImages(await readdir(previewDir), await readdir(renderDir));
  const report = join(outputDir, 'index.html');
  await writeFile(report, reportHtml(pairs, previewDir, renderDir, outputDir));
  console.log(`Paired ${pairs.length} slides in ${report}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await main();
}
