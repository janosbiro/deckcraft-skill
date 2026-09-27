import {
  getShapeBoundsResolved, getShapeFlip, getShapeKind, getShapeName,
  getShapeText, getSlideShapes,
} from '@office-kit/pptx/node';

function segmentIntersectsInterior(start, end, bounds) {
  const insetX = bounds.w * 0.05;
  const insetY = bounds.h * 0.05;
  const left = bounds.x + insetX, right = bounds.x + bounds.w - insetX;
  const top = bounds.y + insetY, bottom = bounds.y + bounds.h - insetY;
  const dx = end.x - start.x, dy = end.y - start.y;
  let enter = 0, leave = 1;
  for (const [p, q] of [
    [-dx, start.x - left], [dx, right - start.x],
    [-dy, start.y - top], [dy, bottom - start.y],
  ]) {
    if (p === 0) {
      if (q < 0) return false;
    } else {
      const t = q / p;
      if (p < 0) enter = Math.max(enter, t);
      else leave = Math.min(leave, t);
      if (enter > leave) return false;
    }
  }
  return true;
}

export function detectConnectorTextCrossings(shapes, slideIndex) {
  const connectors = shapes.filter((shape) => shape.kind === 'connector' && shape.bounds);
  const textFrames = shapes.filter((shape) => shape.kind !== 'connector' && shape.text?.trim() && shape.bounds);
  const issues = [];
  for (const connector of connectors) {
    const { x, y, w, h } = connector.bounds;
    const start = { x: x + (connector.flip?.horizontal ? w : 0), y: y + (connector.flip?.vertical ? h : 0) };
    const end = { x: x + (connector.flip?.horizontal ? 0 : w), y: y + (connector.flip?.vertical ? 0 : h) };
    for (const frame of textFrames) {
      if (!segmentIntersectsInterior(start, end, frame.bounds)) continue;
      issues.push({
        slideIndex, kind: 'connector-crosses-text',
        severity: connector.z > frame.z ? 'error' : 'warning',
        connector: connector.name, textShape: frame.name, text: frame.text.slice(0, 80),
      });
    }
  }
  return issues;
}

export function auditSlideGeometry(pres, slide, slideIndex) {
  const shapes = getSlideShapes(slide).map((shape, z) => ({
    kind: getShapeKind(shape),
    name: getShapeName(shape),
    text: getShapeText(shape),
    bounds: getShapeBoundsResolved(pres, shape),
    flip: getShapeFlip(shape),
    z,
  }));
  return detectConnectorTextCrossings(shapes, slideIndex);
}
