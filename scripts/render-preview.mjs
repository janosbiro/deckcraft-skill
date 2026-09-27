#!/usr/bin/env node
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { getSlides, loadPresentationFile } from '@office-kit/pptx/node';
import { auditTextLayout, renderSlideToSvg } from '@office-kit/pptx-preview';
import { buildFontkitMeasurer, renderSlideToImage } from '@office-kit/pptx-preview/node';
import { auditSlideGeometry } from './qa-geometry.mjs';
import { parseSlideSelection, parseSlidesFlag } from './slide-selection.mjs';

const args = process.argv.slice(2);
const input = args.shift();
if (!input) {
  console.error('Usage: node scripts/render-preview.mjs <input.pptx> [output-dir] [--slides 3,5-6]');
  process.exit(2);
}
const output = args[0] && !args[0].startsWith('--') ? args.shift() : 'artifacts/preview';

const pres = await loadPresentationFile(input);
const slides = getSlides(pres);
const selected = parseSlideSelection(parseSlidesFlag(args), slides.length);
const measureText = buildFontkitMeasurer();
await mkdir(output, { recursive: true });
const stale = (await readdir(output)).filter((name) => /^slide-\d+\.(?:png|svg)$/i.test(name)
  && !selected.includes(Number(/^slide-(\d+)/i.exec(name)[1])));
if (stale.length) throw new Error(`Output directory contains unselected slide images (${stale.join(', ')}). Use a fresh directory for incremental QA.`);

for (const number of selected) {
  const slide = slides[number - 1];
  const stem = `slide-${String(number).padStart(2, '0')}`;
  await writeFile(join(output, `${stem}.svg`), renderSlideToSvg(pres, slide));
  await writeFile(join(output, `${stem}.png`), renderSlideToImage(pres, slide, { width: 1280, measureText }));
}

const selectedSet = new Set(selected);
const textIssues = auditTextLayout(pres, { measureText }).filter((issue) => selectedSet.has(issue.slideIndex + 1));
const geometryIssues = selected.flatMap((number) => auditSlideGeometry(pres, slides[number - 1], number - 1));
await writeFile(join(output, 'text-layout-issues.json'), `${JSON.stringify(textIssues, null, 2)}\n`);
await writeFile(join(output, 'geometry-issues.json'), `${JSON.stringify(geometryIssues, null, 2)}\n`);
await writeFile(join(output, 'qa-selection.json'), `${JSON.stringify({ slideCount: slides.length, selectedSlides: selected }, null, 2)}\n`);
console.log(`Rendered slides ${selected.join(', ')} of ${slides.length} to ${output}; ${textIssues.length} text and ${geometryIssues.length} geometry findings.`);
if (textIssues.some((issue) => issue.kind.startsWith('overflow')) || geometryIssues.some((issue) => issue.severity === 'error')) process.exitCode = 1;
