// Boulevard Press — gta6-cover-art-01 entry program (Node 22, standard
// library only). The app is the repository's app/ folder: plain static files
// that open in a desktop browser and run offline — a multi-panel, sunset-neon
// GTA-style cover maker with its own lettering, grades and print finishes.
// This program hands the entry in: it copies app/ and screenshots/ beside it
// into the output directory and writes the dossier the judge reads, using
// the kit's buildDossier library, unchanged, from vendor/.
//
// Try it locally: node serve.ts, then open http://localhost:8080.
// Write the entry locally (MAKEFUN_OUTPUT_DIR stands in for /output):
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outDir, { recursive: true });

// The app ships as-is, fonts and sample photos included.
cpSync(join(here, 'app'), join(outDir, 'app'), { recursive: true });

// The screenshots: the exported cover first by name, then the editor at work.
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
}

// The dossier, under the scorer's own caps so an entry this program writes
// is never one the gate would refuse: 4 screenshots of at most 256 KiB each,
// app/ within 993 files and 48 MiB, and the source text capped at 160 KiB.
writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
