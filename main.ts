// HEATSPLIT entrypoint for the make.fun grader (Node 22, stdlib only).
// The deliverable is this directory's app/ folder — plain static files a
// desktop Chrome loads offline (ES modules, zero dependencies, no network
// request) — plus the screenshots the judge reviews. This program copies
// both into $MAKEFUN_OUTPUT_DIR (the grader's /output) and writes
// dossier.json with the vendored make.fun library, untouched.
//
// Deterministic: copies file bytes as-is, no timestamps or state leak into
// the output, so two runs diff byte-identical.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// the app bundle + the judge's 3-4 screenshots go out together
mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// same caps the scorer enforces (reference/gate.json): keep text files under
// the byte cap and the screenshot set within count/size limits so the dossier
// reflects exactly what the judge is allowed to read
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

console.log(`HEATSPLIT entry written to ${out} (app/ + screenshots/ + dossier.json)`);
