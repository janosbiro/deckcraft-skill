import assert from 'node:assert/strict';
import test from 'node:test';
import { parseSlideSelection, parseSlidesFlag } from '../scripts/slide-selection.mjs';

test('selects every slide by default', () => {
  assert.deepEqual(parseSlideSelection(undefined, 4), [1, 2, 3, 4]);
});

test('accepts sorted individual slides and ranges without rendering other slides', () => {
  assert.deepEqual(parseSlideSelection('5,2-3', 6), [2, 3, 5]);
});

test('rejects duplicate, descending, and out-of-range selections', () => {
  assert.throws(() => parseSlideSelection('2,2', 4), /duplicate/i);
  assert.throws(() => parseSlideSelection('4-2', 4), /range/i);
  assert.throws(() => parseSlideSelection('5', 4), /out of range/i);
});

test('accepts both CLI flag forms and rejects unrelated arguments', () => {
  assert.equal(parseSlidesFlag(['--slides', '3,5-6']), '3,5-6');
  assert.equal(parseSlidesFlag(['--slides=2']), '2');
  assert.throws(() => parseSlidesFlag(['--unknown', '2']), /Expected only --slides/);
});
