import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';
import {
  findShapeByName, getParagraphAlignment, getShapeBoundsResolved,
  getSlideText, getSlides, loadPresentation,
} from '@office-kit/pptx';
import { validateDeck } from '../scripts/deck-ir.mjs';

const project = resolve(import.meta.dirname, '..');
const build = (input, output) => spawnSync(process.execPath,
  [join(project, 'scripts/build-deck.mjs'), input, output], { encoding: 'utf8' });

test('semantic roles stay in the IR, never in rendered slide text', async (t) => {
  const dir = await mkdtemp(join(tmpdir(), 'deckcraft-roles-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const output = join(dir, 'deck.pptx');
  const result = build(join(project, 'examples/enterprise-deck.json'), output);
  assert.equal(result.status, 0, result.stderr);
  const pres = await loadPresentation(await readFile(output));
  const slides = getSlides(pres);
  assert.doesNotMatch(getSlideText(slides[0]), /\bTITLE\b/);
  assert.doesNotMatch(getSlideText(slides[1]), /\bARGUMENT\b/);
  assert.doesNotMatch(getSlideText(slides[2]), /\bEVIDENCE\b/);
});

test('timeline labels and details share each marker center', async (t) => {
  const dir = await mkdtemp(join(tmpdir(), 'deckcraft-timeline-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const output = join(dir, 'deck.pptx');
  const result = build(join(project, 'examples/enterprise-deck.json'), output);
  assert.equal(result.status, 0, result.stderr);
  const pres = await loadPresentation(await readFile(output));
  const slide = getSlides(pres)[4];
  for (let number = 1; number <= 3; number += 1) {
    const marker = findShapeByName(slide, `milestone-${number}`);
    const label = findShapeByName(slide, `milestone-${number}-label`);
    const detail = findShapeByName(slide, `milestone-${number}-detail`);
    assert.ok(marker && label && detail);
    const mid = (shape) => {
      const bounds = getShapeBoundsResolved(pres, shape);
      return bounds.x + bounds.w / 2;
    };
    assert.ok(Math.abs(mid(marker) - mid(label)) < 9144);
    assert.ok(Math.abs(mid(marker) - mid(detail)) < 9144);
    assert.equal(getParagraphAlignment(label, 0), 'ctr');
    assert.equal(getParagraphAlignment(detail, 0), 'ctr');
  }
});

test('content-driven layouts validate and remain editable text', async (t) => {
  const deck = {
    schemaVersion: '0.1', meta: { title: 'Architecture review', audience: 'Security leaders' },
    slides: [
      { id: 'map', role: 'argument', claim: 'One control plane governs agent actions.', layout: 'system-map', eyebrow: 'TRUST BOUNDARY', elements: [
        { type: 'text', style: 'title', text: 'The control plane surrounds the agent' },
        { type: 'system', core: { label: 'Agent', detail: 'Plans an action' }, nodes: [
          { label: 'Identity', detail: 'Who acts' }, { label: 'Tool gate', detail: 'What it can call' },
          { label: 'Runtime', detail: 'What it can change' }, { label: 'Evidence', detail: 'What happened' },
        ] },
      ] },
      { id: 'evidence', role: 'evidence', claim: 'Risk spans the full action path.', layout: 'evidence-map', elements: [
        { type: 'text', style: 'title', text: 'Risk spans the action path' },
        { type: 'evidence', areas: [
          { label: 'Goal', detail: 'Mis-specified objective' }, { label: 'Tools', detail: 'Excessive privilege' },
          { label: 'Runtime', detail: 'Unsafe execution' }, { label: 'Oversight', detail: 'Missing review' },
        ], takeaway: 'Govern the system, not just the model.', source: 'Illustrative taxonomy' },
      ] },
      { id: 'plan', role: 'decision', claim: 'Scale autonomy in stages.', layout: 'phased-plan', elements: [
        { type: 'text', style: 'title', text: 'Earn autonomy in stages' },
        { type: 'phases', steps: [
          { label: 'Inventory', detail: 'Find agents and owners', gate: 'Ownership recorded' },
          { label: 'Pilot', detail: 'Limit tool calls', gate: 'Controls tested' },
          { label: 'Scale', detail: 'Expand carefully', gate: 'Evidence reviewed' },
        ] },
      ] },
      { id: 'stack', role: 'process', claim: 'One platform provides shared capabilities.', layout: 'capability-stack', elements: [
        { type: 'text', style: 'title', text: 'Reuse the platform everywhere' },
        { type: 'capabilities', spine: { label: 'Control plane', detail: 'Shared policy' }, layers: [
          { label: 'Identity', detail: 'Agent IDs and owners' },
          { label: 'Tool gate', detail: 'Approved actions' },
          { label: 'Runtime', detail: 'Bounded execution' },
          { label: 'Evidence', detail: 'Traces and rollback' },
        ] },
      ] },
    ],
  };
  assert.deepEqual(validateDeck(deck), []);
  const dir = await mkdtemp(join(tmpdir(), 'deckcraft-layouts-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const input = join(dir, 'deck.json');
  const output = join(dir, 'deck.pptx');
  await writeFile(input, JSON.stringify(deck));
  const result = build(input, output);
  assert.equal(result.status, 0, result.stderr);
  const pres = await loadPresentation(await readFile(output));
  const slides = getSlides(pres);
  assert.equal(slides.length, 4);
  assert.match(getSlideText(slides[0]), /Tool gate/);
  assert.match(getSlideText(slides[0]), /TRUST BOUNDARY/);
  assert.match(getSlideText(slides[1]), /Govern the system/);
  assert.match(getSlideText(slides[2]), /Ownership recorded/);
  assert.match(getSlideText(slides[3]), /Shared policy/);
  const invalid = structuredClone(deck);
  invalid.slides[0].elements[1].nodes = [];
  assert.ok(validateDeck(invalid).some((error) => error.includes('system')));
});

test('timeline needs a declared temporal or dependent relationship', async () => {
  const deck = JSON.parse(await readFile(join(project, 'examples/enterprise-deck.json'), 'utf8'));
  delete deck.slides[4].elements[1].relation;
  assert.ok(validateDeck(deck).some((error) => error.includes('parallel capabilities belong in system-map')));
});
