# Heatwave Studio — GTA-style cover art maker

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Rifky123/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Rifky123/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

A web app that turns your photos and a caption into GTA 6-style cover art: multi-panel poster layouts, Vice City sunset and neon colour grades, big condensed caption lettering, and one-click PNG export in the common post sizes (1080×1080, 1080×1350, 1920×1080). Everything runs offline in your browser — photos are read from your machine and never uploaded.

## Run it

Serve the app (any static server works):

```
node serve.ts
```

then open http://localhost:8080 — or just build the entry package:

```
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` into `$MAKEFUN_OUTPUT_DIR` (default `/output`) and writes `dossier.json`.

## How it works

- Pick a post size and one of four layouts (quartet grid, trilogy split, diptych, solo).
- Drop a photo on any panel — or fill every panel with one photo — then drag and wheel to reframe each panel's crop.
- Style panels with the grade presets (Vice Sunset, Neon Night, Heat Haze, Noir Teal, Daylight) and poster finishes (grain, scanlines, halftone, riso shift, vignette).
- Type your caption, choose the band position, and download the PNG.

Demo photos under `app/samples/` were made for make.fun with an image model and are free to use. Caption lettering is set in [Anton](https://fonts.google.com/specimen/Anton) (SIL Open Font License, shipped in `app/fonts/`).

<sub>Entered on [make.fun](https://make.fun/?ref=essp25st&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
