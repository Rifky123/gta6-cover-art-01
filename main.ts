// DUSKLINE entry point for the gta6-cover-art-01 gate.
//
// The app itself is app/ — plain static files, no build step: index.html
// plus ES modules that paint multi-panel GTA-style cover art on a canvas
// and export it as PNG in the three common post sizes. This program hands
// the entry in: it copies app/ and screenshots/ into /output (or
// $MAKEFUN_OUTPUT_DIR outside the grader) and writes dossier.json with the
// kit's vendored buildDossier library. Two runs must produce byte-identical
// output — nothing here reads the clock or the network.
//
// Try the app locally:  node serve.ts   →  http://localhost:8080
// Hand it in yourself:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function copyTree(from: string, to: string) {
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true });
}

copyTree(join(here, 'app'), join(out, 'app'));

const shotsFrom = join(here, 'screenshots');
if (existsSync(shotsFrom)) copyTree(shotsFrom, join(out, 'screenshots'));

// The scorer caps (from the kit's reference/gate.json): refuse here what the
// scorer would refuse there, so a broken entry fails loudly before submit.
function countEntries(dir: string): number {
  let n = 0;
  for (const name of readdirSync(dir)) {
    n += 1;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) n += countEntries(full);
  }
  return n;
}
const appEntries = countEntries(join(out, 'app'));
if (appEntries > 993) throw new Error(`app/ holds ${appEntries} entries, cap is 993`);

const shotFiles = existsSync(shotsFrom) ? readdirSync(shotsFrom).filter((f) => !f.startsWith('.')) : [];
if (shotFiles.length > 4) throw new Error(`${shotFiles.length} screenshots, cap is 4`);
for (const f of shotFiles) {
  const bytes = statSync(join(shotsFrom, f)).size;
  if (bytes > 262144) throw new Error(`screenshot ${f} is ${bytes} bytes, cap is 262144`);
}

writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
