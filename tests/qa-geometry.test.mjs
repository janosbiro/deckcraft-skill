import assert from 'node:assert/strict';
import test from 'node:test';
import { addBlankSlide, addSlideShape, addSlideTextBox, createPresentation, inches, setShapeAlignment } from '@office-kit/pptx';
import { detectConnectorTextCrossings, detectDeckcraftSemantics } from '../scripts/qa-geometry.mjs';

const text = { kind: 'shape', name: 'AGENT', text: 'AGENT', bounds: { x: 10, y: 10, w: 40, h: 20 }, z: 1 };

test('finds a connector drawn over the interior of a text frame', () => {
  const line = { kind: 'connector', name: 'Line 1', bounds: { x: 0, y: 20, w: 60, h: 0 }, z: 2 };
  assert.deepEqual(detectConnectorTextCrossings([text, line], 3), [{
    slideIndex: 3, kind: 'connector-crosses-text', severity: 'error',
    connector: 'Line 1', textShape: 'AGENT', text: 'AGENT',
  }]);
});

test('does not flag a connector that only touches the text-frame boundary', () => {
  const line = { kind: 'connector', name: 'Line 1', bounds: { x: 0, y: 20, w: 10, h: 0 }, z: 2 };
  assert.deepEqual(detectConnectorTextCrossings([text, line], 1), []);
});

test('does not flag a line that misses the text frame', () => {
  const line = { kind: 'connector', name: 'Line 1', bounds: { x: 0, y: 40, w: 60, h: 0 }, z: 2 };
  assert.deepEqual(detectConnectorTextCrossings([text, line], 1), []);
});

test('semantic geometry audit catches role leakage and uncentered timeline labels', () => {
  const pres = createPresentation();
  const slide = addBlankSlide(pres);
  addSlideTextBox(slide, { x: inches(0.7), y: inches(0.2), w: inches(3), h: inches(0.3), text: 'ARGUMENT', name: 'slide-role' });
  addSlideShape(slide, { preset: 'ellipse', x: inches(2.9), y: inches(2.9), w: inches(0.2), h: inches(0.2), name: 'milestone-1' });
  const label = addSlideTextBox(slide, { x: inches(2), y: inches(3.4), w: inches(2), h: inches(0.4), text: 'Identity', name: 'milestone-1-label' });
  setShapeAlignment(label, 'left');
  const issues = detectDeckcraftSemantics(pres, slide, 0);
  assert.ok(issues.some((issue) => issue.kind === 'internal-role-visible'));
  assert.ok(issues.some((issue) => issue.kind === 'milestone-text-misaligned'));
});
