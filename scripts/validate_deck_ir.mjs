#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { validateDeck } from './deck-ir.mjs';

const args = process.argv.slice(2);
const file = args.shift();
let configFile;
if (args.length === 2 && args[0] === '--config') configFile = args[1];
else if (args.length) {
  console.error('Usage: node scripts/validate_deck_ir.mjs <deck-ir.json> [--config <deckcraft.config.json>]');
  process.exit(2);
}
if (!file) {
  console.error('Usage: node scripts/validate_deck_ir.mjs <deck-ir.json> [--config <deckcraft.config.json>]');
  process.exit(2);
}

let deck;
try {
  deck = JSON.parse(await readFile(file, 'utf8'));
} catch (error) {
  console.error(`Could not parse ${file}: ${error.message}`);
  process.exit(1);
}

const config = configFile ? JSON.parse(await readFile(configFile, 'utf8')) : {};
const theme = { ...config.theme };
for (const group of ['colors', 'fonts', 'layout', 'type']) {
  if (deck.theme?.[group] || config.theme?.[group]) theme[group] = { ...config.theme?.[group], ...deck.theme?.[group] };
}
if (deck.theme?.fontFamily && !deck.theme?.fonts?.sans) theme.fonts = { ...theme.fonts, sans: deck.theme.fontFamily };
const errors = validateDeck({ ...deck, theme });
if (errors.length) {
  console.error(`Invalid deck IR (${errors.length} issue${errors.length === 1 ? '' : 's'}):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(`Valid deck IR: ${deck.slides.length} slide${deck.slides.length === 1 ? '' : 's'}.`);
