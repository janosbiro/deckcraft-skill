#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const [input, output] = process.argv.slice(2);
if (!input || !output) {
  console.error('Usage: node scripts/audit-evidence.mjs <deck-ir.json> <evidence-review.md>');
  process.exit(2);
}
const deck = JSON.parse(await readFile(input, 'utf8'));
const sources = new Map((deck.sources ?? []).map((source) => [source.id, source]));
const missing = [];
const lines = [`# Evidence review: ${deck.meta?.title ?? 'Untitled deck'}`, '', 'Claims and factual values below are author-provided assertions. This report checks traceability, not whether the source proves the claim.', ''];
for (const [index, slide] of (deck.slides ?? []).entries()) {
  lines.push(`## Slide ${index + 1} — ${slide.id}`, '', `Claim: ${slide.claim}`, '');
  const facts = slide.evidenceRefs ?? [];
  if (!facts.length) {
    missing.push({ slide: index + 1, claim: slide.claim });
    lines.push('⚠ No explicit source mapping. Add evidenceRefs for material claims, numbers, forecasts, or comparisons.', '');
    continue;
  }
  for (const fact of facts) {
    const refs = (fact.sourceIds ?? []).map((id) => sources.get(id)).filter(Boolean);
    if (!refs.length) missing.push({ slide: index + 1, claim: fact.claim });
    lines.push(`- Fact/claim: ${fact.claim}`);
    if (fact.values?.length) lines.push(`  - Values: ${fact.values.map((value) => `${value}${fact.unit ? ` ${fact.unit}` : ''}`).join(', ')}`);
    if (fact.denominator) lines.push(`  - Denominator/scope: ${fact.denominator}`);
    lines.push(`  - Sources: ${refs.length ? refs.map((source) => {
      const dates = [source.publishedAt && `published ${source.publishedAt}`, source.accessedAt && `accessed ${source.accessedAt}`].filter(Boolean);
      return `[${source.label}](${source.url || source.id})${dates.length ? ` (${dates.join('; ')})` : ''}`;
    }).join('; ') : '**MISSING**'}`);
  }
  lines.push('');
}
lines.push(`## Traceability summary`, '', `Slides: ${(deck.slides ?? []).length}; unreferenced claims/slides: ${missing.length}.`, '');
lines.push('Human review still needs to confirm source quality, date, geography, definition, calculation, and that every displayed value matches its cited source.');
await writeFile(resolve(output), `${lines.join('\n')}\n`);
console.log(`Wrote evidence review with ${missing.length} traceability gap(s) to ${resolve(output)}`);
