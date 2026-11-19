// PALMFORGE — a multi-panel GTA-style cover art maker (Node 22, standard library only).
// The entry is the app/ folder: plain static files a desktop Chrome loads offline, no build step,
// no network request. This program hands it in: it copies app/ and screenshots/ from beside this
// file to /output (MAKEFUN_OUTPUT_DIR stands in for /output outside the grader) and writes
// /output/dossier.json with buildDossier from the vendored make.fun library.
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// Caps mirrored from the scorer's gate: the dossier text budget plus the screenshot and app limits.
// Deterministic by construction: both runs copy the same bytes and buildDossier reads only those files.
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
