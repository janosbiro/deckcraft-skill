#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';

const [pptxPath, previewPath, reviewPath, outputPath] = process.argv.slice(2);
if (!pptxPath || !previewPath || !reviewPath || !outputPath) {
  console.error('Usage: node scripts/create-review-receipt.mjs <current.pptx> <preview-dir> <review.json> <receipt.json>');
  process.exit(2);
}
const review = JSON.parse(await readFile(reviewPath, 'utf8'));
if (!review.reviewer || !Array.isArray(review.items) || !review.items.length) throw new Error('review.json needs reviewer and non-empty items');
const ids = new Set();
const items = [];
for (const item of review.items) {
  if (!Number.isSafeInteger(item.slide) || item.slide < 1 || !['PASS', 'FIX'].includes(item.verdict) || !item.rationale?.trim()) {
    throw new Error('Each review item needs slide, PASS/FIX verdict, and a concise rationale');
  }
  if (ids.has(item.slide)) throw new Error(`Duplicate review for slide ${item.slide}`);
  ids.add(item.slide);
  const preview = join(resolve(previewPath), `slide-${String(item.slide).padStart(2, '0')}.png`);
  items.push({ ...item, preview: basename(preview), previewSha256: hash(await readFile(preview)) });
}
const receipt = {
  schemaVersion: '1.0',
  reviewer: review.reviewer,
  reviewedAt: review.reviewedAt ?? new Date().toISOString(),
  pptx: basename(pptxPath),
  pptxSha256: hash(await readFile(resolve(pptxPath))),
  items,
};
await writeFile(resolve(outputPath), `${JSON.stringify(receipt, null, 2)}\n`);
console.log(`Recorded ${items.length} slide review(s) with PPTX and preview hashes to ${resolve(outputPath)}`);

function hash(bytes) { return createHash('sha256').update(bytes).digest('hex'); }
