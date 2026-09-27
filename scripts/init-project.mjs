#!/usr/bin/env node
import { mkdir, writeFile, access } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const target = resolve(process.argv[2] ?? '.');
const dir = join(target, '.deckcraft');
await mkdir(dir, { recursive: true });
const files = new Map([
  ['config.json', JSON.stringify({
    schemaVersion: '1.0',
    theme: { colors: { ink: '#172033', accent: '#175CD3', paper: '#FFFFFF', surface: '#F3F6FA', muted: '#475467', line: '#D0D5DD' }, fonts: { sans: 'Arial', serif: 'Georgia' } },
  }, null, 2) + '\n'],
  ['DECKCRAFT.md', `# Project presentation rules\n\n- Audience and decision: define for each deck.\n- Brand requirements: add approved colors, fonts, and logo/template locations.\n- Data policy: cite primary sources for material claims and numbers.\n- Accessibility: maintain strong contrast and meaningful chart labels.\n- Do not store secrets or generated binary decks in this folder.\n`],
  ['templates/.gitkeep', ''],
]);
for (const [name, content] of files) {
  const path = join(dir, name);
  try { await access(path); console.log(`Kept existing ${path}`); }
  catch { await mkdir(join(path, '..'), { recursive: true }); await writeFile(path, content, { flag: 'wx' }); console.log(`Created ${path}`); }
}
