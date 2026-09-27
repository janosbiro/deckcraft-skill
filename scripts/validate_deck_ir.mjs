#!/usr/bin/env node
import { readFile } from 'node:fs/promises';

const file = process.argv[2];
if (!file) {
  console.error('Usage: node scripts/validate_deck_ir.mjs <deck-ir.json>');
  process.exit(2);
}

const allowedLayouts = new Set(['hero', 'split', 'proof', 'comparison', 'timeline', 'matrix', 'quote', 'close']);
const allowedRoles = new Set(['title', 'context', 'argument', 'evidence', 'comparison', 'process', 'decision', 'appendix']);
const semanticTypes = new Set(['text', 'table', 'chart', 'image']);

let deck;
try {
  deck = JSON.parse(await readFile(file, 'utf8'));
} catch (error) {
  console.error(`Could not parse ${file}: ${error.message}`);
  process.exit(1);
}

const errors = [];
const required = (value, path) => { if (value === undefined || value === null || value === '') errors.push(`${path} is required`); };
required(deck.schemaVersion, 'schemaVersion');
required(deck.meta?.title, 'meta.title');
required(deck.meta?.audience, 'meta.audience');
if (!Array.isArray(deck.slides) || deck.slides.length === 0) errors.push('slides must be a non-empty array');

for (const [index, slide] of (deck.slides ?? []).entries()) {
  const path = `slides[${index}]`;
  required(slide.id, `${path}.id`);
  required(slide.claim, `${path}.claim`);
  if (!allowedRoles.has(slide.role)) errors.push(`${path}.role must be one of ${[...allowedRoles].join(', ')}`);
  if (!allowedLayouts.has(slide.layout)) errors.push(`${path}.layout must be one of ${[...allowedLayouts].join(', ')}`);
  if (!Array.isArray(slide.elements) || slide.elements.length === 0) errors.push(`${path}.elements must be non-empty`);
  for (const [elementIndex, element] of (slide.elements ?? []).entries()) {
    if (!semanticTypes.has(element.type)) errors.push(`${path}.elements[${elementIndex}].type is not semantic`);
    if (element.type === 'text') required(element.text, `${path}.elements[${elementIndex}].text`);
    if (element.type === 'table') {
      if (!Array.isArray(element.columns) || !element.columns.length || !Array.isArray(element.rows) || !element.rows.length) {
        errors.push(`${path}.elements[${elementIndex}] table needs non-empty columns and rows`);
      } else if (element.rows.some((row) => !Array.isArray(row) || row.length !== element.columns.length)) {
        errors.push(`${path}.elements[${elementIndex}] table rows must match column count`);
      }
    }
    if (element.type === 'chart') {
      if (!element.chartType || !Array.isArray(element.categories) || !element.categories.length || !Array.isArray(element.series) || !element.series.length) {
        errors.push(`${path}.elements[${elementIndex}] chart needs chartType, categories, and series`);
      } else if (element.series.some((series) => !series.name || !Array.isArray(series.values) || series.values.length !== element.categories.length || series.values.some((value) => !Number.isFinite(value)))) {
        errors.push(`${path}.elements[${elementIndex}] chart series must contain numeric values for every category`);
      }
    }
    if (element.type === 'image' && !element.src) errors.push(`${path}.elements[${elementIndex}].src is required`);
  }
}

if (errors.length) {
  console.error(`Invalid deck IR (${errors.length} issue${errors.length === 1 ? '' : 's'}):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(`Valid deck IR: ${deck.slides.length} slide${deck.slides.length === 1 ? '' : 's'}.`);
