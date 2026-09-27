import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';
import {
  addBlankSlide, addSlideTextBox, createPresentation, findShapeByName,
  getParagraphBullet, getShapeParagraphCount, getSlideCharts, getSlideTables,
  getSlides, getSlideText, inches, loadPresentation, savePresentation,
} from '@office-kit/pptx';
import { validateDeck } from '../scripts/deck-ir.mjs';
import { contrastRatio, resolveDesign } from '../scripts/design-system.mjs';
import { absoluteSlot, layoutSlots } from '../scripts/layout-contracts.mjs';
import { addBulletList } from '../scripts/slide-primitives.mjs';

const project = resolve(import.meta.dirname, '..');
const runBuild = (input, output) => spawnSync(process.execPath, [join(project, 'scripts/build-deck.mjs'), input, output], { encoding: 'utf8' });

test('design tokens validate overrides and essential contrast', () => {
  const d = resolveDesign({ colors: { accent: '#1557B0' }, fonts: { sans: 'Arial' } });
  assert.equal(d.colors.accent, '#1557B0');
  assert.equal(d.fonts.sans, 'Arial');
  assert.ok(contrastRatio(d.colors.ink, d.colors.paper) >= 4.5);
  assert.throws(() => resolveDesign({ colors: { ink: 'blue' } }), /#RRGGBB/);
});

test('layout variants transform semantic slots without changing their meaning', () => {
  const primary = layoutSlots('split');
  const alternate = layoutSlots('split', 'alternate');
  const dense = layoutSlots('split', 'dense');
  assert.ok(primary.left[0] < primary.right[0]);
  assert.ok(alternate.left[0] > alternate.right[0]);
  assert.ok(dense.left[2] > primary.left[2]);
  assert.equal(absoluteSlot(primary, 'left', { x: 1, y: 2, w: 10, h: 4 }).x, 1);
});

test('bullets remain paragraphs in one native text frame', () => {
  const pres = createPresentation();
  const slide = addBlankSlide(pres);
  addBulletList(slide, ['First proof point', 'Second proof point'], { x: 1, y: 1, w: 5, h: 3 }, resolveDesign(), 'proof-bullets');
  const shape = findShapeByName(slide, 'proof-bullets');
  assert.equal(getShapeParagraphCount(shape), 2);
  assert.equal(getParagraphBullet(shape, 0), 'bullet');
  assert.equal(getParagraphBullet(shape, 1), 'bullet');
});

test('enterprise example has all eight valid executable layouts', async () => {
  const deck = JSON.parse(await readFile(join(project, 'examples/enterprise-deck.json'), 'utf8'));
  assert.deepEqual(validateDeck(deck), []);
  assert.equal(new Set(deck.slides.map((slide) => slide.layout)).size, 8);
  const invalid = structuredClone(deck);
  invalid.slides[0].variant = 'unknown';
  assert.ok(validateDeck(invalid).some((error) => error.includes('variant')));
  invalid.slides[0] = null;
  assert.ok(validateDeck(invalid).some((error) => error.includes('must be an object')));
});

test('enterprise builder keeps chart and table native', async (t) => {
  const dir = await mkdtemp(join(tmpdir(), 'deckcraft-build-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const output = join(dir, 'enterprise.pptx');
  const result = runBuild(join(project, 'examples/enterprise-deck.json'), output);
  assert.equal(result.status, 0, result.stderr);
  const pres = await loadPresentation(await readFile(output));
  const slides = getSlides(pres);
  assert.equal(slides.length, 8);
  assert.equal(getSlideCharts(slides[2]).length, 1);
  assert.equal(getSlideTables(slides[5]).length, 1);
});

test('template cloning fills fields without flattening the source slide', async (t) => {
  const dir = await mkdtemp(join(tmpdir(), 'deckcraft-template-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const template = createPresentation();
  const original = addBlankSlide(template);
  addSlideTextBox(original, { x: inches(1), y: inches(1), w: inches(7), h: inches(1), text: '{{headline}}' });
  const templatePath = join(dir, 'template.pptx');
  await writeFile(templatePath, await savePresentation(template));
  const ir = {
    schemaVersion: '0.1', meta: { title: 'Template test', audience: 'Board' },
    template: { source: 'template.pptx' },
    slides: [
      { id: 'one', role: 'title', claim: 'Revenue is growing', templateSlide: 1, fields: { headline: 'Revenue is growing' } },
      { id: 'two', role: 'decision', claim: 'Continue investment', layout: 'close', elements: [
        { type: 'text', style: 'title', text: 'Continue investment' },
        { type: 'text', style: 'action', text: 'Approve the next milestone.' },
      ] },
    ],
  };
  const input = join(dir, 'deck.json');
  const output = join(dir, 'output.pptx');
  await writeFile(input, JSON.stringify(ir));
  const result = runBuild(input, output);
  assert.equal(result.status, 0, result.stderr);
  const pres = await loadPresentation(await readFile(output));
  assert.equal(getSlides(pres).length, 2);
  assert.match(getSlideText(getSlides(pres)[0]), /Revenue is growing/);
  assert.doesNotMatch(getSlideText(getSlides(pres)[0]), /\{\{headline\}\}/);
  assert.match(getSlideText(getSlides(pres)[1]), /Continue investment/);

  ir.slides[0].fields = { missing: 'No silent replacement' };
  await writeFile(input, JSON.stringify(ir));
  const failed = runBuild(input, join(dir, 'invalid.pptx'));
  assert.notEqual(failed.status, 0);
  assert.match(failed.stderr, /template token \{\{missing\}\} was not found/);
});
