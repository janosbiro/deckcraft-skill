#!/usr/bin/env node
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import {
  addBlankSlide,
  addSlideChart,
  addSlideTable,
  addSlideTextBox,
  createPresentation,
  inches,
  savePresentation,
  setShapeTextFormat,
} from '@office-kit/pptx';

const [source, destination] = process.argv.slice(2);
if (!source || !destination) {
  console.error('Usage: node scripts/build-deck.mjs <deck-ir.json> <output.pptx>');
  process.exit(2);
}

const deck = JSON.parse(await readFile(source, 'utf8'));
const pres = createPresentation();
const ink = deck.theme?.colors?.ink ?? '#111827';
const accent = deck.theme?.colors?.accent ?? '#2563EB';

for (const item of deck.slides) {
  if (!['hero', 'proof', 'matrix'].includes(item.layout)) {
    throw new Error(`The example renderer does not implement layout ${item.layout}`);
  }
  const slide = addBlankSlide(pres);
  const title = item.elements.find((element) => element.type === 'text' && element.style === 'title');
  if (!title) throw new Error(`${item.id} needs a title text element`);
  const titleShape = addSlideTextBox(slide, {
    x: inches(0.7), y: inches(0.45), w: inches(11.4), h: inches(1.0), text: title.text,
  });
  setShapeTextFormat(titleShape, { size: 30, bold: true, color: ink });

  if (item.layout === 'hero') {
    const body = item.elements.find((element) => element.type === 'text' && element.style === 'body');
    if (body) {
      const bodyShape = addSlideTextBox(slide, {
        x: inches(0.8), y: inches(2.1), w: inches(10.2), h: inches(1.4), text: body.text,
      });
      setShapeTextFormat(bodyShape, { size: 24, color: accent });
    }
  }

  if (item.layout === 'proof') {
    const chart = item.elements.find((element) => element.type === 'chart');
    if (!chart) throw new Error(`${item.id} needs a chart`);
    addSlideChart(slide, {
      x: inches(0.7), y: inches(1.65), w: inches(8.8), h: inches(4.7),
      spec: {
        kind: chart.chartType,
        categories: chart.categories,
        series: chart.series.map((series) => ({ ...series, color: accent })),
      },
    });
    const body = item.elements.find((element) => element.type === 'text' && element.style === 'body');
    if (body) {
      const bodyShape = addSlideTextBox(slide, {
        x: inches(9.7), y: inches(2.1), w: inches(2.6), h: inches(2.0), text: body.text,
      });
      setShapeTextFormat(bodyShape, { size: 18, color: ink });
    }
  }

  if (item.layout === 'matrix') {
    const table = item.elements.find((element) => element.type === 'table');
    if (!table) throw new Error(`${item.id} needs a table`);
    addSlideTable(slide, {
      x: inches(0.7), y: inches(1.75), w: inches(11.2), h: inches(3.2),
      rows: [table.columns, ...table.rows], firstRow: true, bandRow: true,
    });
  }
}

await mkdir(dirname(destination), { recursive: true });
await writeFile(destination, await savePresentation(pres));
console.log(`Wrote ${deck.slides.length} editable slides to ${destination}`);
