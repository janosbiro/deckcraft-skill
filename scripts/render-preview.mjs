#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { getSlides, loadPresentationFile } from '@office-kit/pptx/node';
import { auditTextLayout, renderSlideToSvg } from '@office-kit/pptx-preview';
import { buildFontkitMeasurer, renderSlideToImage } from '@office-kit/pptx-preview/node';

const [input, output = 'artifacts/preview'] = process.argv.slice(2);
if (!input) {
  console.error('Usage: node scripts/render-preview.mjs <input.pptx> [output-dir]');
  process.exit(2);
}

const pres = await loadPresentationFile(input);
const slides = getSlides(pres);
const measureText = buildFontkitMeasurer();
await mkdir(output, { recursive: true });

for (const [index, slide] of slides.entries()) {
  const stem = `slide-${String(index + 1).padStart(2, '0')}`;
  await writeFile(join(output, `${stem}.svg`), renderSlideToSvg(pres, slide));
  await writeFile(join(output, `${stem}.png`), renderSlideToImage(pres, slide, { width: 1280, measureText }));
}

const issues = auditTextLayout(pres, { measureText });
await writeFile(join(output, 'text-layout-issues.json'), `${JSON.stringify(issues, null, 2)}\n`);
console.log(`Rendered ${slides.length} slide previews to ${output}; ${issues.length} text-layout findings.`);
if (issues.some((issue) => issue.kind.startsWith('overflow'))) process.exitCode = 1;
