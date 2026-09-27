#!/usr/bin/env node
import { mkdir, mkdtemp, rm, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { basename, join } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';

const [input, output = 'artifacts/final'] = process.argv.slice(2);
if (!input) {
  console.error('Usage: node scripts/qa-libreoffice.mjs <input.pptx> [output-dir]');
  process.exit(2);
}

await mkdir(output, { recursive: true });
const profile = await mkdtemp(join(tmpdir(), 'deckcraft-lo-'));
try {
  const cache = join(profile, 'cache');
  await mkdir(cache, { recursive: true });
  let found = false;
  for (const command of ['soffice', 'libreoffice']) {
    const result = spawnSync(command, [`-env:UserInstallation=${pathToFileURL(profile).href}`, '--headless', '--convert-to', 'pdf', '--outdir', output, input], {
      stdio: 'inherit', env: { ...process.env, XDG_CACHE_HOME: cache },
    });
    if (result.error?.code === 'ENOENT') continue;
    found = true;
    if (result.error) throw result.error;
    if (result.status !== 0) {
      process.exitCode = result.status ?? 1;
      break;
    }
    const pdf = join(output, `${basename(input).replace(/\.pptx$/i, '')}.pdf`);
    await stat(pdf);
    console.log(`Final render written to ${pdf}`);
    break;
  }
  if (!found) {
    console.error('LibreOffice is not on PATH. Install it to run final render QA.');
    process.exitCode = 3;
  }
} finally {
  await rm(profile, { recursive: true, force: true });
}
