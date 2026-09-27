#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { validateDeck } from './deck-ir.mjs';

const file = process.argv[2];
if (!file) {
  console.error('Usage: node scripts/validate_deck_ir.mjs <deck-ir.json>');
  process.exit(2);
}

let deck;
try {
  deck = JSON.parse(await readFile(file, 'utf8'));
} catch (error) {
  console.error(`Could not parse ${file}: ${error.message}`);
  process.exit(1);
}

const errors = validateDeck(deck);
if (errors.length) {
  console.error(`Invalid deck IR (${errors.length} issue${errors.length === 1 ? '' : 's'}):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(`Valid deck IR: ${deck.slides.length} slide${deck.slides.length === 1 ? '' : 's'}.`);
