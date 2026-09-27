import assert from 'node:assert/strict';
import test from 'node:test';
import { detectConnectorTextCrossings } from '../scripts/qa-geometry.mjs';

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
