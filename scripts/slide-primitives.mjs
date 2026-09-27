// Header/card helper structure adapted to Office Kit from
// alfonsograziano/pptx-gen src/custom-slide-helpers.ts (MIT).
// See THIRD_PARTY_NOTICES.md. All words remain native editable text.
import {
  addSlideLine,
  addSlideShape,
  addSlideTextBox,
  groupShapes,
  inches,
  pt,
  setShapeFill,
  setShapeNoStroke,
  setShapeBulletStyle,
  setShapeStroke,
  setShapeTextFormat,
  setShapeTextMargins,
} from '@office-kit/pptx';

const emuBox = (box) => Object.fromEntries(Object.entries(box).map(([key, value]) => [key, inches(value)]));

export function addText(slide, text, box, { size, font, color, bold = false, italic = false, name = 'text' }) {
  const shape = addSlideTextBox(slide, { ...emuBox(box), text: String(text), name });
  setShapeTextFormat(shape, { size, font, color, bold, italic });
  setShapeTextMargins(shape, { left: 0, right: 0, top: 0, bottom: 0 });
  return shape;
}

export function addRule(slide, x1, y1, x2, y2, color, width = 1, name = 'rule') {
  return addSlideLine(slide, {
    from: { x: inches(x1), y: inches(y1) },
    to: { x: inches(x2), y: inches(y2) },
    color,
    widthEmu: pt(width),
    name,
  });
}

export function addBulletList(slide, items, box, design, name = 'bullet-list') {
  const shape = addText(slide, items.join('\n'), box,
    { size: design.type.body, font: design.fonts.sans, color: design.colors.ink, name });
  setShapeBulletStyle(shape, 'bullet');
  return shape;
}

export function addHeader(slide, title, role, design, number, total, deckTitle) {
  const { colors: c, fonts: f, layout: l, type: t } = design;
  addText(slide, role.toUpperCase(), { x: l.margin, y: 0.26, w: 5, h: 0.34 },
    { size: t.footnote, font: f.sans, color: c.muted, bold: true, name: 'slide-role' });
  addText(slide, title, { x: l.margin, y: 0.61, w: l.width - 2 * l.margin, h: 0.7 },
    { size: t.title, font: f.sans, color: c.ink, bold: true, name: 'slide-title' });
  addRule(slide, l.margin, 1.42, l.width - l.margin, 1.42, c.line, 1, 'header-rule');
  addRule(slide, l.margin, 1.42, l.margin + 1.05, 1.42, c.accent, 3, 'header-accent');
  addText(slide, deckTitle, { x: l.margin, y: l.height - 0.37, w: 7.8, h: 0.28 },
    { size: t.footnote, font: f.sans, color: c.muted, name: 'deck-footer' });
  addText(slide, `${number} / ${total}`, { x: l.width - l.margin - 0.8, y: l.height - 0.37, w: 0.8, h: 0.28 },
    { size: t.footnote, font: f.sans, color: c.muted, name: 'slide-number' });
}

export function addEvidencePanel(slide, box, heading, body, design, name = 'evidence-panel') {
  const { colors: c, fonts: f, type: t } = design;
  const panel = addSlideShape(slide, { preset: 'rect', ...emuBox(box), name: `${name}-background` });
  setShapeFill(panel, c.surface);
  setShapeStroke(panel, { color: c.line, widthEmu: pt(0.7) });
  const accent = addRule(slide, box.x, box.y, box.x + Math.min(box.w * 0.4, 0.9), box.y, c.accent, 3, `${name}-accent`);
  const headingShape = addText(slide, heading, {
    x: box.x + 0.18, y: box.y + 0.22, w: box.w - 0.36, h: 0.42,
  }, { size: t.label, font: f.sans, color: c.ink, bold: true, name: `${name}-heading` });
  const bodyShape = addText(slide, body, {
    x: box.x + 0.18, y: box.y + 0.77, w: box.w - 0.36, h: Math.max(0.3, box.h - 0.97),
  }, { size: t.body, font: f.sans, color: c.ink, name: `${name}-body` });
  return groupShapes([panel, accent, headingShape, bodyShape], { name });
}

export function addMarker(slide, cx, cy, radius, design, name) {
  const circle = addSlideShape(slide, {
    preset: 'ellipse', x: inches(cx - radius), y: inches(cy - radius), w: inches(radius * 2), h: inches(radius * 2), name,
  });
  setShapeFill(circle, design.colors.accent);
  setShapeNoStroke(circle);
  return circle;
}
