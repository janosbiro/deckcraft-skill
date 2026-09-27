#!/usr/bin/env node
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import {
  addBlankSlide, createPresentation, duplicateSlide, getSlides, loadPresentation,
  moveSlide, removeSlide, replaceTokensInSlide, savePresentation, setSlideNotes,
} from '@office-kit/pptx';
import { validateDeck } from './deck-ir.mjs';
import { resolveDesign } from './design-system.mjs';
import { renderLayout } from './render-layouts.mjs';

const [source, destination] = process.argv.slice(2);
if (!source || !destination) {
  console.error('Usage: node scripts/build-deck.mjs <deck-ir.json> <output.pptx>');
  process.exit(2);
}

const deck = JSON.parse(await readFile(source, 'utf8'));
const errors = validateDeck(deck);
if (errors.length) throw new Error(`Invalid deck IR:\n- ${errors.join('\n- ')}`);
const design = resolveDesign(deck.theme);
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
    for (const [key, value] of Object.entries(item.fields)) {
      if (!replaceTokensInSlide(clone, { [key]: value })) {
        throw new Error(`${item.id}: template token {{${key}}} was not found in one text run`);
      }
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
