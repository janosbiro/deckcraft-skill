#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { parseSlideSelection } from './slide-selection.mjs';

const args = process.argv.slice(2);
const [irPath, previewDir, outputDir] = args.splice(0, 3);
if (!irPath || !previewDir || !outputDir || args.length !== 2 || args[0] !== '--slides') {
  console.error('Usage: node scripts/create-repair-packet.mjs <deck-ir.json> <preview-dir> <output-dir> --slides 2,4-5');
  process.exit(2);
}
const ir = JSON.parse(await readFile(irPath, 'utf8'));
const selectedSlides = parseSlideSelection(args[1], ir.slides.length);
const root = resolve(previewDir);
const [textIssues, geometryIssues, qaSelection] = await Promise.all([
  readJson(join(root, 'text-layout-issues.json')),
  readJson(join(root, 'geometry-issues.json')),
  readJson(join(root, 'qa-selection.json')),
]);
for (const number of selectedSlides) {
  if (!qaSelection.selectedSlides?.includes(number)) throw new Error(`Preview QA selection does not include requested slide ${number}; rerender that slide first.`);
  await readFile(join(root, `slide-${String(number).padStart(2, '0')}.png`));
}
const issuesBySlide = new Map(selectedSlides.map((number) => [number, []]));
for (const issue of textIssues) add(issue.slideIndex + 1, { ...issue, source: 'text-layout' });
for (const issue of geometryIssues) add(issue.slideIndex + 1, { ...issue, source: 'geometry' });
const slides = selectedSlides.map((number) => ({
  slideNumber: number,
  id: ir.slides[number - 1].id,
  claim: ir.slides[number - 1].claim,
  preview: join(root, `slide-${String(number).padStart(2, '0')}.png`),
  findings: issuesBySlide.get(number),
}));
const packet = {
  schemaVersion: '1.0',
  selectedSlides,
  scope: 'Only inspect and repair these slides. Re-render these slide numbers after a local edit; expand only when shared styles or dependencies changed.',
  slides,
};
const out = resolve(outputDir);
await mkdir(out, { recursive: true });
await writeFile(join(out, 'repair-packet.json'), `${JSON.stringify(packet, null, 2)}\n`);
const lines = ['# Targeted repair packet', '', `Review only slides ${selectedSlides.join(', ')}. Do not re-review unchanged slides unless a shared style, template, or dependency changed.`, ''];
for (const slide of slides) {
  lines.push(`## Slide ${slide.slideNumber} — ${slide.id}`, '', `Claim: ${slide.claim}`, `Preview: ${slide.preview}`, '');
  if (!slide.findings.length) lines.push('Automated signals: none. This is not yet a visual PASS; inspect the preview.', '');
  else for (const issue of slide.findings) lines.push(`- [${issue.severity ?? 'review'}] ${issue.source}: ${issue.kind}${issue.text ? ` — ${issue.text}` : ''}`);
  lines.push('', 'Decision: PASS / FIX — record the visual reason in the review receipt.', '');
}
lines.push(`Re-run only the selected slides with: node scripts/render-preview.mjs <current.pptx> <fresh-preview-dir> --slides ${selectedSlides.join(',')}.`);
await writeFile(join(out, 'repair-packet.md'), `${lines.join('\n')}\n`);
console.log(`Wrote a targeted repair packet for slides ${selectedSlides.join(', ')} to ${out}`);

async function readJson(path) {
  try { return JSON.parse(await readFile(path, 'utf8')); }
  catch (error) { throw new Error(`Could not read QA findings ${path}: ${error.message}`); }
}
function add(slideNumber, issue) {
  const findings = issuesBySlide.get(slideNumber);
  if (findings) findings.push(issue);
}
