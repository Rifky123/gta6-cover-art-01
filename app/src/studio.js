// Heatwave Studio boot: state, editor wiring, canvas interactions, export
// and the ?demo / ?embed modes used for screenshots.

import { buildPanels } from './layouts.js';
import { renderPoster, paintSelection, setPrintFinish } from './poster.js';
import { GRADE_CYCLE } from './grades.js';
import { buildSidebar } from './controls.js';
import { SIZES, SAMPLES, SHOWCASES, defaultProject } from './presets.js';

const canvas = document.getElementById('poster-canvas');
const sidebar = document.getElementById('sidebar');
const veil = document.getElementById('drop-veil');

const state = defaultProject();
state.photos = new Map();
state.selected = 0;
let photoSeq = 0;
let ui = null;

const params = new URLSearchParams(location.search);
const embedMode = params.get('embed') === '1';

// ---------------------------------------------------------------- photos

function loadImage(path, id) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => { state.photos.set(id, img); resolve(img); };
    img.onerror = reject;
    img.src = path;
  });
}

async function loadSamples() {
  await Promise.all(SAMPLES.map((s) => loadImage(s.path, s.id)));
}

function loadFile(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      photoSeq += 1;
      const id = `photo-${photoSeq}`;
      state.photos.set(id, img);
      resolve(img);
    };
    img.src = url;
  });
}

// ---------------------------------------------------------------- render

const panelRects = () => buildPanels(SIZES[state.size].w, SIZES[state.size].h, state.layout).rects;

function renderPreview() {
  const s = SIZES[state.size];
  canvas.width = s.w;
  canvas.height = s.h;
  const ctx = canvas.getContext('2d');
  renderPoster(ctx, s.w, s.h, state, state.photos);
  if (!embedMode && state.photos.size) {
    paintSelection(ctx, panelRects()[state.selected], s.w / 1080);
  }
}

// ---------------------------------------------------------------- actions

const actions = {
  setSize(id) { state.size = id; state.selected = Math.min(state.selected, state.panels.length - 1); rerender(); },
  setLayout(id) {
    const counts = { solo: 1, diptych: 2, trilogy: 3, quartet: 4 };
    const n = counts[id];
    const old = state.panels;
    state.layout = id;
    state.panels = Array.from({ length: n }, (_, i) => old[i] ?? {
      photoId: null, cx: 0.5, cy: 0.42, zoom: 1.3, grade: GRADE_CYCLE[i % GRADE_CYCLE.length], flip: false,
    });
    state.selected = Math.min(state.selected, n - 1);
    rerender();
  },
  selectPanel(i) { state.selected = i; rerender(); },
  async pickPhoto(i) {
    const file = await pickFile();
    if (!file) return;
    await loadFile(file);
    state.selected = i;
    state.panels[i].photoId = lastPhotoId();
    rerender();
  },
  async fillAll() {
    const file = await pickFile();
    if (!file) return;
    const img = await loadFile(file);
    state.panels.forEach((panel, i) => {
      panel.photoId = lastPhotoId();
      panel.cx = [0.5, 0.5, 0.34, 0.66][i % 4];
      panel.cy = [0.36, 0.55, 0.44, 0.5][i % 4];
      panel.zoom = [1.3, 1.0, 1.7, 1.5][i % 4];
    });
    void img;
    rerender();
  },
  setZoom(v) { state.panels[state.selected].zoom = v; rerender(); },
  setCropY(v) { state.panels[state.selected].cy = v; rerender(); },
  toggleFlip() { const p = state.panels[state.selected]; p.flip = !p.flip; rerender(); },
  setGrade(id) { state.panels[state.selected].grade = id; rerender(); },
  spreadGrade() {
    const g = state.panels[state.selected].grade;
    state.panels.forEach((p) => { p.grade = g; });
    rerender();
  },
  toggleEffect(id) { state.effects[id] = !state.effects[id]; rerender(); },
  setFrame(id) { state.frame = id; rerender(); },
  setCaptionText(v) { state.caption.main = v; rerender(); },
  setSubText(v) { state.caption.sub = v; rerender(); },
  setBand(v) { state.caption.band = v; rerender(); },
  setCaptionScale(v) { state.caption.scale = v; rerender(); },
  exportAs(key) { exportCover(key); },
};

function rerender() {
  renderPreview();
  ui?.refresh();
}

let sharedInput = null;

function pickFile() {
  if (!sharedInput) {
    sharedInput = document.createElement('input');
    sharedInput.type = 'file';
    sharedInput.accept = 'image/*';
  }
  return new Promise((resolve) => {
    sharedInput.onchange = () => resolve(sharedInput.files[0] ?? null);
    sharedInput.click();
  });
}

function lastPhotoId() {
  let last = null;
  for (const id of state.photos.keys()) last = id;
  return last;
}

// ---------------------------------------------------------------- canvas pan & zoom

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * (canvas.width / rect.width),
    y: (event.clientY - rect.top) * (canvas.height / rect.height),
  };
}

function hitPanel(point) {
  return panelRects().findIndex((r) =>
    point.x >= r.x && point.x <= r.x + r.w && point.y >= r.y && point.y <= r.y + r.h);
}

let drag = null;

canvas.addEventListener('pointerdown', (event) => {
  if (embedMode) return;
  const point = canvasPoint(event);
  const hit = hitPanel(point);
  if (hit < 0) return;
  state.selected = hit;
  drag = { point, moved: false };
  canvas.setPointerCapture(event.pointerId);
  rerender();
});

canvas.addEventListener('pointermove', (event) => {
  if (!drag) return;
  const point = canvasPoint(event);
  const dx = point.x - drag.point.x;
  const dy = point.y - drag.point.y;
  if (Math.abs(dx) + Math.abs(dy) < 2 && !drag.moved) return;
  drag.moved = true;
  drag.point = point;
  const panel = state.panels[state.selected];
  const img = state.photos.get(panel.photoId);
  const rect = panelRects()[state.selected];
  if (!img || !rect) return;
  const fit = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight) * panel.zoom;
  const dw = img.naturalWidth * fit;
  const dh = img.naturalHeight * fit;
  panel.cx -= dx / dw;
  panel.cy -= dy / dh;
  renderPreview();
});

canvas.addEventListener('pointerup', () => {
  if (drag?.moved) ui?.refresh();
  drag = null;
});

canvas.addEventListener('wheel', (event) => {
  if (embedMode || hitPanel(canvasPoint(event)) < 0) return;
  event.preventDefault();
  const panel = state.panels[state.selected];
  panel.zoom = Math.min(3, Math.max(0.8, panel.zoom * Math.exp(-event.deltaY * 0.0012)));
  rerender();
}, { passive: false });

// drag & drop a photo straight onto a panel
['dragenter', 'dragover'].forEach((type) =>
  window.addEventListener(type, (event) => {
    if (embedMode) return;
    event.preventDefault();
    veil.hidden = false;
  }));
veil.addEventListener('dragleave', () => { veil.hidden = true; });
window.addEventListener('drop', async (event) => {
  event.preventDefault();
  veil.hidden = true;
  if (embedMode) return;
  const file = [...(event.dataTransfer?.files ?? [])].find((f) => f.type.startsWith('image/'));
  if (!file) return;
  await loadFile(file);
  const hit = hitPanel(canvasPoint(event));
  if (hit >= 0) state.selected = hit;
  state.panels[state.selected].photoId = lastPhotoId();
  rerender();
});

// ---------------------------------------------------------------- export

async function exportCover(sizeKey) {
  const s = SIZES[sizeKey];
  const off = document.createElement('canvas');
  off.width = s.w;
  off.height = s.h;
  const ctx = off.getContext('2d');
  renderPoster(ctx, s.w, s.h, state, state.photos);
  const blob = await new Promise((resolve) => off.toBlob(resolve, 'image/png'));
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `cover-${s.w}x${s.h}.png`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 5000);
}

// ---------------------------------------------------------------- boot

function applyShowcase(project) {
  Object.assign(state, project());
  state.photos = state.photos; // keep loaded samples
  state.selected = 0;
}

async function bootEditor() {
  ui = buildSidebar(sidebar, state, actions);
  document.getElementById('btn-demo').addEventListener('click', async () => {
    await loadSamples();
    applyShowcase(SHOWCASES[state.size] ?? SHOWCASES.portrait);
    rerender();
  });
  renderPreview();
  const wanted = params.get('demo') === '1';
  if (wanted) {
    await loadSamples();
    const which = params.get('size');
    applyShowcase(SHOWCASES[which] ?? SHOWCASES.portrait);
    rerender();
    if (params.get('scroll') === '1') sidebar.scrollTop = sidebar.scrollHeight;
  }
}

async function bootEmbed() {
  document.body.classList.add('embed');
  const shot = params.get('shot') ?? 'portrait';
  Object.assign(state, (SHOWCASES[shot] ?? SHOWCASES.portrait)());
  const px = Math.min(1280, Math.max(480, Number(params.get('px')) || 1024));
  setPrintFinish(Number(params.get('poster')) || 0);
  const s = SIZES[state.size];
  canvas.width = px;
  canvas.height = Math.round((px * s.h) / s.w);
  await Promise.all([document.fonts.ready, loadSamples()]);
  renderPoster(canvas.getContext('2d'), canvas.width, canvas.height, state, state.photos);
}

const boot = embedMode ? bootEmbed() : bootEditor();
void boot;
