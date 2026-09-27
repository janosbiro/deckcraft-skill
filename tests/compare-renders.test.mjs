import assert from 'node:assert/strict';
import test from 'node:test';
import { pairSlideImages } from '../scripts/compare-renders.mjs';

test('pairs all slides in numeric order, regardless of filename order', () => {
  assert.deepEqual(
    pairSlideImages(['slide-02.png', 'slide-01.png'], ['libreoffice-2.png', 'libreoffice-1.png']),
    [
      { index: 1, preview: 'slide-01.png', libreOffice: 'libreoffice-1.png' },
      { index: 2, preview: 'slide-02.png', libreOffice: 'libreoffice-2.png' },
    ],
  );
});

test('rejects a missing LibreOffice page', () => {
  assert.throws(() => pairSlideImages(['slide-01.png', 'slide-02.png'], ['libreoffice-1.png']), /Slide-count mismatch/);
});

test('rejects gaps and duplicate slide numbers', () => {
  assert.throws(() => pairSlideImages(['slide-01.png', 'slide-03.png'], ['libreoffice-1.png', 'libreoffice-3.png']), /Missing slide 2/);
  assert.throws(() => pairSlideImages(['slide-1.png', 'slide-01.png'], ['libreoffice-1.png']), /duplicate slide number/);
});

test('pairs only the selected edited slide', () => {
  assert.deepEqual(pairSlideImages(['slide-03.png'], ['libreoffice-3.png'], [3]), [
    { index: 3, preview: 'slide-03.png', libreOffice: 'libreoffice-3.png' },
  ]);
});

test('rejects stale preview images outside the selected slides', () => {
  assert.throws(
    () => pairSlideImages(['slide-01.png', 'slide-03.png'], ['libreoffice-3.png'], [3]),
    /Slide-count mismatch|Selection has/,
  );
});
