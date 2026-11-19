// sessions.js — entry modes:
//   plain          → the editor, empty poster with placeholders
//   ?demo=1&size=… → editor with the two sample photos loaded + tuned preset
//   ?embed=1&shot=wide|portrait|square&px=… → cover only, no chrome, sized

import { SIZES, state, setLayout, setGrade, setFinish, setCaption, fillAll,
         addPhoto, selectPanel, touch } from "./state.js";
import { paintPoster } from "./painter.js";

const SAMPLES = [
  { name: "boulevard", url: "samples/boulevard.jpg" },
  { name: "pier", url: "samples/pier.jpg" },
];

function loadImage(url) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = url;
  });
}

// Tuned demo configurations — crops are picked for the two sample photos
// (boulevard: portrait, face high · pier: square, face upper-left).
const PRESETS = {
  wide: {
    size: "wide", layout: "trio", grade: "sunset",
    caption: { title: "DUSK RUNNERS", sub: "PALM COAST · AFTER DARK", pos: "bottom", band: true, underline: true, scale: 100 },
    finishes: { grain: true, scanlines: false, halftone: false, vignette: true, frame: true },
    panels: [
      { photo: 0, cx: 0.50, cy: 0.30, zoom: 1.10 },  // boulevard — face + sky
      { photo: 1, cx: 0.48, cy: 0.38, zoom: 1.22 },  // pier — face over the sea
      { photo: 0, cx: 0.50, cy: 0.13, zoom: 1.50 },  // boulevard — palm strip
    ],
  },
  portrait: {
    size: "portrait", layout: "stack", grade: "neon",
    caption: { title: "BOULEVARD DAWN", sub: "MIDNIGHT MOTORS · VOL 26", pos: "bottom", band: true, underline: true, scale: 100 },
    finishes: { grain: true, scanlines: true, halftone: false, vignette: true, frame: true },
    panels: [
      { photo: 0, cx: 0.50, cy: 0.22, zoom: 1.24 },  // boulevard — palms
      { photo: 1, cx: 0.45, cy: 0.30, zoom: 1.14 },  // pier — face
      { photo: 0, cx: 0.50, cy: 0.55, zoom: 1.18 },  // boulevard — car
    ],
  },
  square: {
    size: "square", layout: "grid", grade: "sunset",
    caption: { title: "DUSK RUNNERS", sub: "PALM COAST · AFTER DARK", pos: "bottom", band: true, underline: true, scale: 100 },
    finishes: { grain: true, scanlines: false, halftone: false, vignette: true, frame: true },
    panels: [
      { photo: 0, cx: 0.50, cy: 0.30, zoom: 1.08 },
      { photo: 1, cx: 0.70, cy: 0.50, zoom: 1.22 },
      { photo: 0, cx: 0.50, cy: 0.55, zoom: 1.16 },
      { photo: 1, cx: 0.72, cy: 0.42, zoom: 1.30 },
    ],
  },
};

async function loadSamplePhotos() {
  for (const s of SAMPLES) {
    const img = await loadImage(s.url);
    addPhoto(s.name, img, true);
  }
}

function applyPreset(key) {
  const p = PRESETS[key] ?? PRESETS.square;
  state.size = p.size;
  state.layout = p.layout;
  state.grade = p.grade;
  Object.assign(state.finishes, p.finishes);
  Object.assign(state.caption, p.caption);
  state.selected = 0;
  fillAll(p.panels[0].photo);
  p.panels.forEach((c, i) => {
    Object.assign(state.panels[i], { cx: c.cx, cy: c.cy, zoom: c.zoom, photo: c.photo });
  });
}

export async function applyUrlParams() {
  const q = new URLSearchParams(location.search);

  // Cover-only render for screenshots and sharing.
  if (q.get("embed") === "1") {
    document.body.classList.add("embed");
    document.querySelector("#stage")?.remove();
    const key = q.get("shot") ?? "wide";
    const preset = PRESETS[key] ?? PRESETS.wide;
    applyPreset(key);
    await loadSamplePhotos();
    await document.fonts.ready;
    const S = SIZES[preset.size];
    const px = Math.max(200, Math.min(1920, Number(q.get("px")) || Math.max(S.w, S.h)));
    const k = px / Math.max(S.w, S.h);
    const W = Math.round(S.w * k);
    const H = Math.round(S.h * k);
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    c.id = "poster";
    document.body.appendChild(c);
    c.style.display = "block";
    c.style.width = "100vw";
    c.style.height = "100vh";
    paintPoster(c.getContext("2d"), state, W, H);
    return "embed";
  }

  // Editor with the samples already on the board.
  if (q.get("demo") === "1") {
    applyPreset(q.get("size") ?? "square");
    await loadSamplePhotos();
    // Deep-link a panel selection (?panel=N) so shared sessions reopen
    // with the intended crop in the Panel inspector.
    const want = Number(q.get("panel"));
    if (Number.isFinite(want) && want > 0) selectPanel(want);
    await document.fonts.ready;
    touch();
    return "demo";
  }

  return "editor";
}
