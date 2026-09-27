import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  addSlideChart,
  addSlideImage,
  addSlideTable,
  getTableCell,
  groupShapes,
  inches,
  setSlideBackground,
  setSlideNotes,
  setTableCellFill,
  setTableCellTextFormat,
} from '@office-kit/pptx';
import { absoluteSlot, layoutSlots } from './layout-contracts.mjs';
import { addBulletList, addEvidencePanel, addHeader, addMarker, addRule, addText } from './slide-primitives.mjs';

const element = (item, type, style) => item.elements.find((e) => e.type === type && (!style || e.style === style));
const bodyArea = (d) => ({ x: d.layout.margin, y: 1.72, w: d.layout.width - d.layout.margin * 2, h: 5.12 });
const boxFor = (slots, name, d) => absoluteSlot(slots, name, bodyArea(d));
const asEmu = (box) => Object.fromEntries(Object.entries(box).map(([key, value]) => [key, inches(value)]));

function addChart(slide, data, box, design) {
  addSlideChart(slide, {
    ...asEmu(box),
    spec: {
      kind: data.chartType,
      categories: data.categories,
      series: data.series.map((series, index) => ({
        ...series,
        color: [design.colors.accent, design.colors.inkSoft, design.colors.muted][index % 3],
      })),
      categoryAxisLabelStyle: { font: design.fonts.sans, sizePt: 14, color: design.colors.ink },
      valueAxisLabelStyle: { font: design.fonts.sans, sizePt: 14, color: design.colors.muted },
    },
  });
}

function addTable(slide, data, box, design) {
  const table = addSlideTable(slide, { ...asEmu(box), rows: [data.columns, ...data.rows], firstRow: true, bandRow: false });
  for (let row = 0; row <= data.rows.length; row += 1) {
    for (let col = 0; col < data.columns.length; col += 1) {
      const cell = getTableCell(table, row, col);
      setTableCellFill(cell, row === 0 ? design.colors.ink : (row % 2 ? design.colors.paper : design.colors.surface));
      setTableCellTextFormat(cell, {
        font: design.fonts.sans,
        size: row === 0 ? design.type.label : design.type.body - 1,
        color: row === 0 ? design.colors.paper : design.colors.ink,
        bold: row === 0,
      });
    }
  }
}

async function addVisual(slide, item, box, design, sourceDir) {
  const chart = element(item, 'chart');
  if (chart) return addChart(slide, chart, box, design);
  const table = element(item, 'table');
  if (table) return addTable(slide, table, box, design);
  const image = element(item, 'image');
  if (image) {
    const imagePath = resolve(sourceDir, image.src);
    addSlideImage(slide, await readFile(imagePath), { ...asEmu(box), fit: 'contain', name: 'supporting-image' });
    return;
  }
  const metric = element(item, 'text', 'metric');
  addText(slide, metric.text, { x: box.x + 0.22, y: box.y + 0.8, w: box.w - 0.44, h: 1.2 },
    { size: design.type.metric + 18, font: design.fonts.sans, color: design.colors.accent, bold: true, name: 'split-metric' });
  const label = element(item, 'text', 'label');
  if (label) addText(slide, label.text, { x: box.x + 0.22, y: box.y + 2.12, w: box.w - 0.44, h: 0.85 },
    { size: design.type.label, font: design.fonts.sans, color: design.colors.muted, name: 'split-metric-label' });
}

function addHero(slide, item, design, number, total, deckTitle, slots) {
  const { colors: c, fonts: f, layout: l, type: t } = design;
  setSlideBackground(slide, c.ink);
  addRule(slide, l.margin, 0.9, l.margin + 1.25, 0.9, c.accentOnDark, 4, 'hero-accent');
  addText(slide, item.role.toUpperCase(), { x: l.margin, y: 0.48, w: 6, h: 0.36 },
    { size: t.label, font: f.sans, color: c.accentOnDark, bold: true, name: 'hero-role' });
  const main = boxFor(slots, 'main', design);
  addText(slide, element(item, 'text', 'title').text, { ...main, h: main.h + 0.35 },
    { size: t.hero, font: f.sans, color: c.paper, bold: true, name: 'hero-title' });
  const support = element(item, 'text', 'body');
  if (support) addText(slide, support.text, boxFor(slots, 'support', design),
    { size: t.body + 2, font: f.sans, color: c.accentOnDark, name: 'hero-support' });
  addText(slide, `${deckTitle}  •  ${number} / ${total}`,
    { x: l.margin, y: l.height - 0.38, w: l.width - 2 * l.margin, h: 0.22 },
    { size: t.footnote, font: f.sans, color: c.paper, name: 'hero-footer' });
}

function addComparison(slide, item, design, slots) {
  const data = element(item, 'comparison');
  for (const side of ['left', 'right']) {
    const box = boxFor(slots, side, design);
    addRule(slide, box.x, box.y, box.x + box.w, box.y, design.colors.accent, 3, `comparison-${side}-rule`);
    addText(slide, data[side].heading, { x: box.x, y: box.y + 0.34, w: box.w, h: 0.5 },
      { size: design.type.label + 2, font: design.fonts.sans, color: design.colors.ink, bold: true, name: `comparison-${side}-heading` });
    addText(slide, data[side].body, { x: box.x, y: box.y + 1.15, w: box.w, h: Math.min(2.5, box.h - 1.25) },
      { size: design.type.body + 3, font: design.fonts.sans, color: design.colors.ink, name: `comparison-${side}-body` });
  }
  const left = boxFor(slots, 'left', design);
  const right = boxFor(slots, 'right', design);
  const dividerX = (left.x + left.w + right.x) / 2;
  addRule(slide, dividerX, left.y + 0.35, dividerX, left.y + 3.3, design.colors.line, 1, 'comparison-divider');
}

function addTimeline(slide, item, design, slots) {
  const steps = element(item, 'timeline').steps;
  const box = boxFor(slots, 'track', design);
  const column = box.w / steps.length;
  const lineY = box.y + 0.55;
  addRule(slide, box.x + column / 2, lineY, box.x + box.w - column / 2, lineY, design.colors.line, 2, 'timeline-track');
  steps.forEach((step, index) => {
    const cx = box.x + column * (index + 0.5);
    const circle = addMarker(slide, cx, lineY, 0.105, design, `milestone-${index + 1}`);
    const label = addText(slide, step.label, { x: box.x + column * index + 0.08, y: lineY + 0.42, w: column - 0.16, h: 0.52 },
      { size: design.type.label, font: design.fonts.sans, color: design.colors.ink, bold: true, name: `milestone-${index + 1}-label` });
    const detail = addText(slide, step.detail, { x: box.x + column * index + 0.08, y: lineY + 1.02, w: column - 0.16, h: 1.4 },
      { size: design.type.label - 1, font: design.fonts.sans, color: design.colors.muted, name: `milestone-${index + 1}-detail` });
    groupShapes([circle, label, detail], { name: `milestone-${index + 1}-group` });
  });
}

function addQuote(slide, item, design, slots) {
  const q = boxFor(slots, 'quote', design);
  addRule(slide, q.x - 0.17, q.y, q.x - 0.17, q.y + q.h, design.colors.accent, 4, 'quote-rule');
  addText(slide, `“${element(item, 'text', 'quote').text}”`, q,
    { size: design.type.title, font: design.fonts.serif, color: design.colors.ink, italic: true, name: 'quote' });
  addText(slide, element(item, 'text', 'attribution').text, boxFor(slots, 'source', design),
    { size: design.type.label, font: design.fonts.sans, color: design.colors.muted, name: 'quote-source' });
}

function addClose(slide, item, design, number, total, deckTitle, slots) {
  const { colors: c, fonts: f, layout: l, type: t } = design;
  setSlideBackground(slide, c.ink);
  addRule(slide, l.margin, 0.9, l.margin + 1.25, 0.9, c.accentOnDark, 4, 'close-accent');
  addText(slide, element(item, 'text', 'title').text, boxFor(slots, 'main', design),
    { size: t.hero, font: f.sans, color: c.paper, bold: true, name: 'close-title' });
  addText(slide, element(item, 'text', 'action').text, boxFor(slots, 'action', design),
    { size: t.body + 2, font: f.sans, color: c.accentOnDark, name: 'close-action' });
  addText(slide, `${deckTitle}  •  ${number} / ${total}`,
    { x: l.margin, y: l.height - 0.38, w: l.width - 2 * l.margin, h: 0.22 },
    { size: t.footnote, font: f.sans, color: c.paper, name: 'close-footer' });
}

export async function renderLayout(slide, item, design, number, total, deckTitle, sourceDir) {
  const slots = layoutSlots(item.layout, item.variant ?? 'primary');
  if (item.speakerNotes) setSlideNotes(slide, item.speakerNotes);
  if (item.layout === 'hero') return addHero(slide, item, design, number, total, deckTitle, slots);
  if (item.layout === 'close') return addClose(slide, item, design, number, total, deckTitle, slots);

  setSlideBackground(slide, design.colors.paper);
  addHeader(slide, element(item, 'text', 'title').text, item.role, design, number, total, deckTitle);
  if (item.layout === 'split') {
    const left = boxFor(slots, 'left', design);
    const right = boxFor(slots, 'right', design);
    const bullets = element(item, 'bullets');
    if (bullets) addBulletList(slide, bullets.items, { ...left, x: left.x + 0.14, w: left.w - 0.14, y: left.y + 0.37, h: left.h - 0.37 }, design, 'split-bullets');
    else addText(slide, element(item, 'text', 'body').text, { ...left, y: left.y + 0.37, h: left.h - 0.37 },
      { size: design.type.body, font: design.fonts.sans, color: design.colors.ink, name: 'split-argument' });
    return addVisual(slide, item, right, design, sourceDir);
  }
  if (item.layout === 'proof') {
    addChart(slide, element(item, 'chart'), boxFor(slots, 'visual', design), design);
    const body = element(item, 'text', 'body')?.text ?? item.claim;
    return addEvidencePanel(slide, boxFor(slots, 'takeaway', design), 'What the data says', body, design, 'proof-takeaway');
  }
  if (item.layout === 'comparison') return addComparison(slide, item, design, slots);
  if (item.layout === 'timeline') return addTimeline(slide, item, design, slots);
  if (item.layout === 'matrix') return addTable(slide, element(item, 'table'), boxFor(slots, 'table', design), design);
  if (item.layout === 'quote') return addQuote(slide, item, design, slots);
  throw new Error(`Renderer has no implementation for ${item.layout}`);
}
