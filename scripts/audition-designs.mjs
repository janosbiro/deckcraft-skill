#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const [irPath, slideText, outputPath] = process.argv.slice(2);
if (!irPath || !slideText || !outputPath || !/^\d+$/.test(slideText)) {
  console.error('Usage: node scripts/audition-designs.mjs <deck-ir.json> <slide-number> <output-dir>');
  process.exit(2);
}
const ir = JSON.parse(await readFile(irPath, 'utf8'));
const slideNumber = Number(slideText);
if (slideNumber < 1 || slideNumber > ir.slides.length) throw new Error(`Slide ${slideNumber} is outside this deck`);
if (ir.slides[slideNumber - 1].templateSlide) throw new Error('Style auditions currently target generated slides; a branded template slide keeps its source master and theme as the design authority.');
const sourceDir = dirname(resolve(irPath));
const outputDir = resolve(outputPath);
const targetSlide = ir.slides[slideNumber - 1];
const presets = {
  corporate: { colors: { ink: '#172033', accent: '#175CD3', paper: '#FFFFFF', surface: '#F3F6FA', muted: '#475467', line: '#D0D5DD', inkSoft: '#243047', accentOnDark: '#84CAFF' }, fonts: { sans: 'Arial', serif: 'Georgia', mono: 'Courier New' } },
  editorial: { colors: { ink: '#24211D', accent: '#9A4D2E', paper: '#FFFCF6', surface: '#F4EEE4', muted: '#524A40', line: '#D8CDBE', inkSoft: '#352D25', accentOnDark: '#F1B58F' }, fonts: { sans: 'Arial', serif: 'Georgia', mono: 'Courier New' } },
  technical: { colors: { ink: '#142B3B', accent: '#087E8B', paper: '#F8FBFC', surface: '#EAF2F4', muted: '#3F5964', line: '#C6D7DC', inkSoft: '#1C3B4D', accentOnDark: '#7AD7D0' }, fonts: { sans: 'Arial', serif: 'Georgia', mono: 'Courier New' } },
};
await mkdir(outputDir, { recursive: true });
for (const [name, theme] of Object.entries(presets)) {
  const audition = structuredClone(ir);
  audition.slides = [structuredClone(targetSlide)];
  audition.theme = theme;
  if (audition.template?.source) audition.template.source = resolve(sourceDir, audition.template.source);
  for (const element of audition.slides[0].elements ?? []) {
    if (element.type === 'image') element.src = resolve(sourceDir, element.src);
  }
  const stem = `slide-${String(slideNumber).padStart(2, '0')}-${name}`;
  const auditionIr = join(outputDir, `${stem}.json`);
  const pptx = join(outputDir, `${stem}.pptx`);
  await writeFile(auditionIr, `${JSON.stringify(audition, null, 2)}\n`);
  run(process.execPath, [join(import.meta.dirname, 'build-deck.mjs'), auditionIr, pptx]);
  run(process.execPath, [join(import.meta.dirname, 'render-preview.mjs'), pptx, join(outputDir, `${stem}-preview`), '--slides', '1']);
}
await writeFile(join(outputDir, 'audition.md'), `# Design audition: slide ${slideNumber}\n\nAll variants preserve the same claim, content, and layout; only the semantic palette and typography change. Review the three preview PNGs side-by-side, choose one, then apply its theme tokens to the project config or deck IR.\n`);
console.log(`Created three same-content style auditions in ${outputDir}`);

function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} failed with status ${result.status}`);
}
