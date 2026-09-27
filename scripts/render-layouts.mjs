import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  addSlideChart,
  addSlideImage,
  addSlideShape,
  addSlideTable,
  getTableCell,
  groupShapes,
  inches,
  setSlideBackground,
  setSlideNotes,
  setShapeFill,
  setShapeNoStroke,
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
  if (item.eyebrow) addText(slide, item.eyebrow, { x: l.margin, y: 0.48, w: 8, h: 0.36 },
    { size: t.label, font: f.sans, color: c.accentOnDark, bold: true, name: 'hero-eyebrow' });
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
      { size: design.type.label, font: design.fonts.sans, color: design.colors.ink, bold: true, align: 'center', name: `milestone-${index + 1}-label` });
    const detail = addText(slide, step.detail, { x: box.x + column * index + 0.08, y: lineY + 1.02, w: column - 0.16, h: 1.4 },
      { size: design.type.label - 1, font: design.fonts.sans, color: design.colors.muted, align: 'center', name: `milestone-${index + 1}-detail` });
    groupShapes([circle, label, detail], { name: `milestone-${index + 1}-group` });
  });
}

function addSystemMap(slide, item, design, slots) {
  const system = element(item, 'system');
  const core = boxFor(slots, 'core', design);
  const names = ['northWest', 'northEast', 'southWest', 'southEast'];
  const boxes = names.map((name) => boxFor(slots, name, design));
  const c = design.colors;
  boxes.forEach((box, index) => {
    const left = index === 0 || index === 2;
    const top = index < 2;
    const a = { x: left ? box.x + box.w : box.x, y: top ? box.y + box.h - 0.12 : box.y + 0.12 };
    const b = { x: left ? core.x : core.x + core.w, y: top ? core.y + 0.12 : core.y + core.h - 0.12 };
    addRule(slide, a.x, a.y, b.x, b.y, c.line, 2, `system-link-${index + 1}`);
  });
  const corePanel = addSlideShape(slide, { preset: 'roundRect', ...asEmu(core), name: 'system-core-panel' });
  setShapeFill(corePanel, c.ink);
  setShapeNoStroke(corePanel);
  const coreLabel = addText(slide, system.core.label, { x: core.x + 0.18, y: core.y + 0.20, w: core.w - 0.36, h: 0.42 },
    { size: design.type.label + 3, font: design.fonts.sans, color: c.paper, bold: true, align: 'center', name: 'system-core-label' });
  const coreDetail = addText(slide, system.core.detail, { x: core.x + 0.18, y: core.y + 0.69, w: core.w - 0.36, h: 0.58 },
    { size: design.type.label - 1, font: design.fonts.sans, color: c.accentOnDark, align: 'center', name: 'system-core-detail' });
  groupShapes([corePanel, coreLabel, coreDetail], { name: 'system-core-group' });
  boxes.forEach((box, index) => {
    const panel = addSlideShape(slide, { preset: 'roundRect', ...asEmu(box), name: `system-node-${index + 1}-panel` });
    setShapeFill(panel, c.surface);
    setShapeNoStroke(panel);
    const rule = addRule(slide, box.x + 0.17, box.y + 0.18, box.x + 0.68, box.y + 0.18, c.accent, 3, `system-node-${index + 1}-accent`);
    const label = addText(slide, system.nodes[index].label, { x: box.x + 0.17, y: box.y + 0.35, w: box.w - 0.34, h: 0.40 },
      { size: design.type.label + 2, font: design.fonts.sans, color: c.ink, bold: true, name: `system-node-${index + 1}-label` });
    const detail = addText(slide, system.nodes[index].detail, { x: box.x + 0.17, y: box.y + 0.86, w: box.w - 0.34, h: 0.43 },
      { size: design.type.label - 1, font: design.fonts.sans, color: c.muted, name: `system-node-${index + 1}-detail` });
    groupShapes([panel, rule, label, detail], { name: `system-node-${index + 1}-group` });
  });
}

function addEvidenceMap(slide, item, design, slots) {
  const data = element(item, 'evidence');
  const areas = boxFor(slots, 'areas', design);
  const takeaway = boxFor(slots, 'takeaway', design);
  const c = design.colors;
  const column = areas.w / data.areas.length;
  data.areas.forEach((area, index) => {
    const x = areas.x + index * column;
    const inset = 0.16;
    const rule = addRule(slide, x + inset, areas.y + 0.30, x + column - inset, areas.y + 0.30, c.accent, 3, `evidence-area-${index + 1}-rule`);
    const indexShape = addText(slide, String(index + 1).padStart(2, '0'), { x: x + inset, y: areas.y + 0.53, w: column - inset * 2, h: 0.52 },
      { size: design.type.label + 7, font: design.fonts.sans, color: c.accent, bold: true, name: `evidence-area-${index + 1}-index` });
    const label = addText(slide, area.label, { x: x + inset, y: areas.y + 1.22, w: column - inset * 2, h: 0.50 },
      { size: design.type.label + 3, font: design.fonts.sans, color: c.ink, bold: true, name: `evidence-area-${index + 1}-label` });
    const detail = addText(slide, area.detail, { x: x + inset, y: areas.y + 1.91, w: column - inset * 2, h: 1.10 },
      { size: design.type.label, font: design.fonts.sans, color: c.muted, name: `evidence-area-${index + 1}-detail` });
    groupShapes([rule, indexShape, label, detail], { name: `evidence-area-${index + 1}-group` });
  });
  addRule(slide, takeaway.x, takeaway.y, takeaway.x + takeaway.w, takeaway.y, c.line, 1, 'evidence-takeaway-rule');
  addText(slide, data.takeaway, { x: takeaway.x, y: takeaway.y + 0.15, w: takeaway.w, h: 0.48 },
    { size: design.type.body, font: design.fonts.sans, color: c.ink, bold: true, name: 'evidence-takeaway' });
  addText(slide, data.source, { x: takeaway.x, y: takeaway.y + 0.68, w: takeaway.w, h: 0.25 },
    { size: design.type.footnote, font: design.fonts.sans, color: c.muted, name: 'evidence-source' });
}

function addPhasedPlan(slide, item, design, slots) {
  const data = element(item, 'phases');
  const box = boxFor(slots, 'rows', design);
  const rowHeight = box.h / data.steps.length;
  const c = design.colors;
  addText(slide, 'ACTION', { x: box.x + 3.28, y: box.y - 0.30, w: 2.2, h: 0.22 },
    { size: design.type.footnote, font: design.fonts.sans, color: c.muted, bold: true, name: 'phase-action-heading' });
  addText(slide, 'EXIT GATE', { x: box.x + 8.2, y: box.y - 0.30, w: 2.6, h: 0.22 },
    { size: design.type.footnote, font: design.fonts.sans, color: c.muted, bold: true, name: 'phase-gate-heading' });
  data.steps.forEach((step, index) => {
    const y = box.y + index * rowHeight;
    const rule = addRule(slide, box.x, y, box.x + box.w, y, c.line, 1, `phase-${index + 1}-rule`);
    const number = addText(slide, String(index + 1).padStart(2, '0'), { x: box.x + 0.08, y: y + 0.20, w: 0.56, h: 0.54 },
      { size: design.type.label + 8, font: design.fonts.sans, color: c.accent, bold: true, name: `phase-${index + 1}-number` });
    const label = addText(slide, step.label, { x: box.x + 0.85, y: y + 0.16, w: 2.33, h: 0.46 },
      { size: design.type.label + 2, font: design.fonts.sans, color: c.ink, bold: true, name: `phase-${index + 1}-label` });
    const detail = addText(slide, step.detail, { x: box.x + 3.28, y: y + 0.19, w: 4.45, h: 0.62 },
      { size: design.type.label, font: design.fonts.sans, color: c.ink, name: `phase-${index + 1}-detail` });
    const gate = addText(slide, step.gate, { x: box.x + 8.2, y: y + 0.19, w: box.w - 8.3, h: 0.70 },
      { size: design.type.label - 1, font: design.fonts.sans, color: c.muted, name: `phase-${index + 1}-gate` });
    groupShapes([rule, number, label, detail, gate], { name: `phase-${index + 1}-group` });
  });
}

function addCapabilityStack(slide, item, design, slots) {
  const data = element(item, 'capabilities');
  const spine = boxFor(slots, 'spine', design);
  const bands = boxFor(slots, 'bands', design);
  const c = design.colors;
  const backbone = addSlideShape(slide, { preset: 'roundRect', ...asEmu(spine), name: 'capability-spine-panel' });
  setShapeFill(backbone, c.ink);
  setShapeNoStroke(backbone);
  const spineLabel = addText(slide, data.spine.label, { x: spine.x + 0.24, y: spine.y + 1.48, w: spine.w - 0.48, h: 0.62 },
    { size: design.type.label + 8, font: design.fonts.sans, color: c.paper, bold: true, name: 'capability-spine-label' });
  const spineDetail = addText(slide, data.spine.detail, { x: spine.x + 0.24, y: spine.y + 2.24, w: spine.w - 0.48, h: 0.72 },
    { size: design.type.label + 1, font: design.fonts.sans, color: c.accentOnDark, name: 'capability-spine-detail' });
  groupShapes([backbone, spineLabel, spineDetail], { name: 'capability-spine-group' });
  const rowHeight = bands.h / data.layers.length;
  data.layers.forEach((layer, index) => {
    const row = { x: bands.x, y: bands.y + index * rowHeight + 0.06, w: bands.w, h: rowHeight - 0.12 };
    const panel = addSlideShape(slide, { preset: 'roundRect', ...asEmu(row), name: `capability-layer-${index + 1}-panel` });
    setShapeFill(panel, c.surface);
    setShapeNoStroke(panel);
    const rule = addRule(slide, row.x + 0.18, row.y + 0.18, row.x + 0.18, row.y + row.h - 0.18, c.accent, 4, `capability-layer-${index + 1}-accent`);
    const label = addText(slide, layer.label, { x: row.x + 0.42, y: row.y + 0.20, w: 2.40, h: 0.49 },
      { size: design.type.label + 3, font: design.fonts.sans, color: c.ink, bold: true, name: `capability-layer-${index + 1}-label` });
    const detail = addText(slide, layer.detail, { x: row.x + 3.00, y: row.y + 0.21, w: row.w - 3.30, h: 0.65 },
      { size: design.type.label, font: design.fonts.sans, color: c.muted, name: `capability-layer-${index + 1}-detail` });
    groupShapes([panel, rule, label, detail], { name: `capability-layer-${index + 1}-group` });
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
  addHeader(slide, element(item, 'text', 'title').text, design, number, total, deckTitle, item.eyebrow);
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
  if (item.layout === 'system-map') return addSystemMap(slide, item, design, slots);
  if (item.layout === 'evidence-map') return addEvidenceMap(slide, item, design, slots);
  if (item.layout === 'phased-plan') return addPhasedPlan(slide, item, design, slots);
  if (item.layout === 'capability-stack') return addCapabilityStack(slide, item, design, slots);
  throw new Error(`Renderer has no implementation for ${item.layout}`);
}
