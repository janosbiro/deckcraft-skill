#!/usr/bin/env node
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import {
  addBlankSlide, createPresentation, duplicateSlide, findShapeById, getSlides, loadPresentation,
  moveSlide, removeSlide, replaceTokensInSlide, savePresentation, setSlideNotes,
  setShapeText,
} from '@office-kit/pptx';
import { validateDeck } from './deck-ir.mjs';
import { resolveDesign } from './design-system.mjs';
import { renderLayout } from './render-layouts.mjs';

const args = process.argv.slice(2);
const source = args.shift();
const destination = args.shift();
let configPath;
if (args.length === 2 && args[0] === '--config') configPath = args[1];
else if (args.length) {
  console.error('Usage: node scripts/build-deck.mjs <deck-ir.json> <output.pptx> [--config <deckcraft.config.json>]');
  process.exit(2);
}
if (!source || !destination) {
  console.error('Usage: node scripts/build-deck.mjs <deck-ir.json> <output.pptx> [--config <deckcraft.config.json>]');
  process.exit(2);
}

const deck = JSON.parse(await readFile(source, 'utf8'));
const config = configPath ? JSON.parse(await readFile(resolve(configPath), 'utf8')) : {};
const mergedTheme = mergeTheme(config.theme, deck.theme);
const errors = validateDeck({ ...deck, theme: mergedTheme });
if (errors.length) throw new Error(`Invalid deck IR:\n- ${errors.join('\n- ')}`);
const design = resolveDesign(mergedTheme);
const sourceDir = dirname(source);
const pres = deck.template?.source
  ? await loadPresentation(await readFile(resolve(sourceDir, deck.template.source)))
  : createPresentation({ size: '16:9' });
const templateSlides = deck.template?.source ? [...getSlides(pres)] : [];
const authoredSlides = [];
for (const [index, item] of deck.slides.entries()) {
  if (item.templateSlide) {
    const sourceSlide = templateSlides[item.templateSlide - 1];
    if (!sourceSlide) throw new Error(`${item.id}: template slide ${item.templateSlide} does not exist`);
    const clone = duplicateSlide(pres, sourceSlide);
    for (const [key, value] of Object.entries(item.fields ?? {})) {
      if (!replaceTokensInSlide(clone, { [key]: value })) {
        throw new Error(`${item.id}: template token {{${key}}} was not found in one text run`);
      }
    }
    for (const [name, binding] of Object.entries(item.shapeFields ?? {})) {
      const shape = findShapeById(clone, binding.shapeId);
      if (!shape) throw new Error(`${item.id}: shapeFields.${name} points to missing shape id ${binding.shapeId}`);
      setShapeText(shape, binding.value);
    }
    if (item.speakerNotes) setSlideNotes(clone, item.speakerNotes);
    authoredSlides.push(clone);
  } else {
    const slide = addBlankSlide(pres);
    await renderLayout(slide, item, design, index + 1, deck.slides.length, deck.meta.title, sourceDir);
    authoredSlides.push(slide);
  }
}
for (const original of templateSlides) removeSlide(pres, original);
for (const [index, slide] of authoredSlides.entries()) moveSlide(pres, slide, index);

await mkdir(dirname(destination), { recursive: true });
await writeFile(destination, await savePresentation(pres));
console.log(`Wrote ${deck.slides.length} editable slides to ${destination}`);

function mergeTheme(base = {}, override = {}) {
  const result = structuredClone(base);
  for (const group of ['colors', 'fonts', 'layout', 'type']) {
    if (result[group] || override[group]) result[group] = { ...result[group], ...override[group] };
  }
  if (override.fontFamily && !override.fonts?.sans) result.fonts = { ...result.fonts, sans: override.fontFamily };
  return result;
}
