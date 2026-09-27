#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { getShapeId, getShapeKind, getShapeName, getShapeText, getSlideShapes, getSlides, loadPresentationFile } from '@office-kit/pptx/node';
import { buildFontkitMeasurer, renderSlideToImage } from '@office-kit/pptx-preview/node';
import { parseSlideSelection, parseSlidesFlag } from './slide-selection.mjs';

const args = process.argv.slice(2);
const input = args.shift();
const output = args.shift();
if (!input || !output) {
  console.error('Usage: node scripts/template-catalog.mjs <source.pptx> <output-dir> [--slides 1,3-5]');
  process.exit(2);
}

const presentation = await loadPresentationFile(input);
const slides = getSlides(presentation);
const selected = parseSlideSelection(parseSlidesFlag(args), slides.length);
const outputDir = resolve(output);
const thumbDir = join(outputDir, 'thumbnails');
await mkdir(thumbDir, { recursive: true });
const measureText = buildFontkitMeasurer();
const entries = [];
for (const slideNumber of selected) {
  const slide = slides[slideNumber - 1];
  const thumbnail = `thumbnails/slide-${String(slideNumber).padStart(2, '0')}.png`;
  await writeFile(join(outputDir, thumbnail), renderSlideToImage(presentation, slide, { width: 960, measureText }));
  const shapes = getSlideShapes(slide);
  entries.push({
    slideNumber,
    thumbnail,
    visibleText: shapes.map(getShapeText).filter((text) => text?.trim()).join('\n'),
    editableTargets: shapes.filter((shape) => getShapeText(shape)?.trim()).map((shape) => ({
      shapeId: getShapeId(shape),
      name: getShapeName(shape),
      kind: getShapeKind(shape),
      currentText: getShapeText(shape),
    })),
    tags: [],
    usage: '',
    notes: '',
  });
}
const catalog = {
  schemaVersion: '1.0',
  source: resolve(input),
  slideCount: slides.length,
  instructions: 'Review the local thumbnails, fill usage/notes, then use templateSlide and shapeFields in deck IR. Source PPTX stays at its original path; this catalogue is metadata only.',
  slides: entries,
};
await writeFile(join(outputDir, 'catalog.json'), `${JSON.stringify(catalog, null, 2)}\n`);
console.log(`Catalogued ${selected.length} template slides to ${outputDir}`);
