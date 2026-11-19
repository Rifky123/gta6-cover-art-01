// Neonpalm entrypoint — hands the app in. Copies app/ and screenshots/ from this
// repository to the output directory and writes dossier.json through the kit's
// buildDossier. Node 22, standard library only.
//
// Outside the grader MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { buildDossier } from './vendor/makefun-app.ts';
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outDir, { recursive: true });
cpSync(join(root, 'app'), join(outDir, 'app'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(join(root, 'screenshots'))) {
  cpSync(join(root, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
}

// Caps mirror the scorer's gate: text budget for the dossier body, screenshot and
// app-size limits that refuse an entry the scorer would refuse anyway.
const dossierPath = join(outDir, 'dossier.json');
writeFileSync(
  dossierPath,
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);

console.log(`Neonpalm handed in: ${outDir} (dossier ${dossierPath})`);
