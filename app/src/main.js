// SUNGRID app shell: state, editor wiring, demo/embed modes, export.

import { LAYOUTS, layoutById } from './layouts.js';
import { GRADES, FINISHES, DEFAULT_FINISHES } from './grades.js';
import { renderCover, autoCrops, CAPTION_COLORS } from './render.js';

const PREVIEW = document.getElementById('preview');
const CTX = PREVIEW.getContext('2d');

const state = {
  photos: [],
  layoutId: 'quartet',
  gradeId: 'sunset',
  finishes: [...DEFAULT_FINISHES],
  panels: [],
  caption: {
    main: 'SUNGRID',
    sub: 'vice nights',
    colorsId: 'gold',
    bandOn: true,
    bandText: 'sungrid · multi-panel poster studio',
  },
  size: { w: 1920, h: 1080 },
  target: 0,
};

let nextPhotoId = 1;

function ensurePanels() {
  const n = layoutById(state.layoutId).panels.length;
  while (state.panels.length < n) state.panels.push({ photoId: null, cx: 0.5, cy: 0.5, zoom: 1 });
  state.panels.length = n;
}

function repaint() {
  renderCover(CTX, state.size.w, state.size.h, state);
}

// ---- photos ------------------------------------------------------------

function loadFiles(fileList) {
  const files = [...fileList].filter((f) => f.type.startsWith('image/'));
  let pending = files.length;
  if (!pending) return;
  for (const file of files) {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        state.photos.push({ id: nextPhotoId++, name: file.name, img, src: reader.result });
        buildThumbs();
        if (pending === 1 && state.panels.every((p) => !p.photoId)) fillFromPhoto(state.photos[0].id);
        pending -= 1;
        repaint();
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }
}

function loadSample(url, name) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      state.photos.push({ id: nextPhotoId++, name, img, src: url });
      buildThumbs();
      resolve();
    };
    img.src = url;
  });
}

function fillFromPhoto(photoId, spread) {
  state.panels = autoCrops(state.layoutId, photoId);
  if (spread === 'wide') {
    // alternate centres so panels read as distinct shots
    state.panels = state.panels.map((p, i) => (i % 2 ? { ...p, cx: 0.38, cy: 0.5 } : p));
  }
  repaint();
}

const input = document.getElementById('photo-input');
input.addEventListener('change', () => loadFiles(input.files));
const drop = document.getElementById('drop');
drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('is-over'); });
drop.addEventListener('dragleave', () => drop.classList.remove('is-over'));
drop.addEventListener('drop', (e) => {
  e.preventDefault();
  drop.classList.remove('is-over');
  loadFiles(e.dataTransfer.files);
});

function buildThumbs() {
  const holder = document.getElementById('thumbs');
  holder.innerHTML = '';
  state.photos.forEach((p) => {
    const el = document.createElement('button');
    el.className = 'thumb' + (state.targetPhotoId === p.id ? ' is-target' : '');
    el.style.backgroundImage = `url("${p.src}")`;
    el.title = p.name;
    el.type = 'button';
    el.addEventListener('click', () => {
      state.targetPhotoId = p.id;
      const panel = state.panels[state.target] || (state.panels[state.target] = {});
      panel.photoId = p.id;
      buildThumbs();
      repaint();
    });
    holder.appendChild(el);
  });
}

document.getElementById('fill-one').addEventListener('click', () => {
  const pid = state.targetPhotoId || (state.photos[0] && state.photos[0].id);
  if (pid) fillFromPhoto(pid);
});

// ---- layouts / grades / finishes / caption controls --------------------

const layoutHolder = document.getElementById('layouts');
for (const layout of LAYOUTS) {
  const btn = document.createElement('button');
  btn.className = 'layout-btn' + (layout.id === state.layoutId ? ' is-active' : '');
  btn.type = 'button';
  const mini = document.createElement('span');
  mini.className = 'layout-mini';
  mini.style.gridTemplateColumns = `repeat(${layout.mini[0]}, 1fr)`;
  mini.style.gridTemplateRows = `repeat(${layout.mini[1]}, 1fr)`;
  for (let i = 0; i < layout.mini[0] * layout.mini[1]; i++) {
    mini.appendChild(document.createElement('span'));
  }
  btn.appendChild(mini);
  btn.appendChild(document.createTextNode(layout.name));
  btn.dataset.layout = layout.id;
  btn.addEventListener('click', () => {
    state.layoutId = layout.id;
    ensurePanels();
    layoutHolder.querySelectorAll('.layout-btn').forEach((b) => b.classList.toggle('is-active', b.dataset.layout === layout.id));
    repaint();
  });
  layoutHolder.appendChild(btn);
}

function chip(holder, item, isActive, onPick) {
  const btn = document.createElement('button');
  btn.className = 'chip' + (isActive ? ' is-active' : '');
  btn.type = 'button';
  if (item.swatch) {
    const sw = document.createElement('span');
    sw.className = 'swatch';
    sw.style.background = item.swatch;
    btn.appendChild(sw);
  }
  btn.appendChild(document.createTextNode(item.label));
  btn.dataset.id = item.id;
  btn.addEventListener('click', () => onPick(item));
  holder.appendChild(btn);
  return btn;
}

const gradeHolder = document.getElementById('grades');
for (const g of GRADES) {
  chip(gradeHolder, g, g.id === state.gradeId, (item) => {
    state.gradeId = item.id;
    gradeHolder.querySelectorAll('.chip').forEach((b) => b.classList.toggle('is-active', b.dataset.id === item.id));
    repaint();
  });
}

const finishHolder = document.getElementById('finishes');
for (const f of FINISHES) {
  const btn = chip(finishHolder, f, state.finishes.includes(f.id), (item) => {
    const at = state.finishes.indexOf(item.id);
    if (at >= 0) state.finishes.splice(at, 1); else state.finishes.push(item.id);
    btn.classList.toggle('is-active', at < 0);
    repaint();
  });
}

const capMain = document.getElementById('cap-main');
capMain.value = state.caption.main;
capMain.addEventListener('input', () => { state.caption.main = capMain.value; repaint(); });
const capSub = document.getElementById('cap-sub');
capSub.value = state.caption.sub;
capSub.addEventListener('input', () => { state.caption.sub = capSub.value; repaint(); });
const bandOn = document.getElementById('band-on');
bandOn.addEventListener('change', () => { state.caption.bandOn = bandOn.checked; repaint(); });
const bandText = document.getElementById('band-text');
bandText.value = state.caption.bandText;
bandText.addEventListener('input', () => { state.caption.bandText = bandText.value; repaint(); });

const colorHolder = document.getElementById('cap-colors');
for (const c of CAPTION_COLORS) {
  const btn = document.createElement('button');
  btn.className = 'chip' + (c.id === state.caption.colorsId ? ' is-active' : '');
  btn.type = 'button';
  btn.textContent = c.label;
  btn.dataset.id = c.id;
  btn.addEventListener('click', () => {
    state.caption.colorsId = c.id;
    colorHolder.querySelectorAll('.chip').forEach((b) => b.classList.toggle('is-active', b.dataset.id === c.id));
    repaint();
  });
  colorHolder.appendChild(btn);
}

// ---- size + export -----------------------------------------------------

document.querySelectorAll('.size-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    state.size = { w: +btn.dataset.w, h: +btn.dataset.h };
    PREVIEW.width = state.size.w;
    PREVIEW.height = state.size.h;
    document.querySelectorAll('.size-btn').forEach((b) => b.classList.toggle('is-active', b === btn));
    repaint();
  });
});

document.getElementById('export-btn').addEventListener('click', () => {
  const out = document.createElement('canvas');
  out.width = state.size.w;
  out.height = state.size.h;
  renderCover(out.getContext('2d'), state.size.w, state.size.h, state);
  out.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `sungrid-${state.size.w}x${state.size.h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }, 'image/png');
});

// ---- preview drag / wheel reframe --------------------------------------

let dragging = null;
PREVIEW.addEventListener('pointerdown', (e) => {
  const rect = PREVIEW.getBoundingClientRect();
  const sx = state.size.w / rect.width;
  const sy = state.size.h / rect.height;
  const x = (e.clientX - rect.left) * sx;
  const y = (e.clientY - rect.top) * sy;
  const layout = layoutById(state.layoutId);
  for (let i = 0; i < layout.panels.length; i++) {
    const r = layout.panels[i];
    if (x >= r.x * state.size.w && x <= (r.x + r.w) * state.size.w && y >= r.y * state.size.h && y <= (r.y + r.h) * state.size.h) {
      dragging = { index: i, x: e.clientX, y: e.clientY, cx: state.panels[i].cx, cy: state.panels[i].cy };
      state.target = i;
      PREVIEW.setPointerCapture(e.pointerId);
      break;
    }
  }
});
PREVIEW.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const rect = PREVIEW.getBoundingClientRect();
  const sx = state.size.w / rect.width;
  const sy = state.size.h / rect.height;
  const panel = state.panels[dragging.index];
  if (!panel) return;
  panel.cx = clamp01(dragging.cx - ((e.clientX - dragging.x) * sx) / 900);
  panel.cy = clamp01(dragging.cy - ((e.clientY - dragging.y) * sy) / 900);
  repaint();
});
PREVIEW.addEventListener('pointerup', () => { dragging = null; });
PREVIEW.addEventListener('wheel', (e) => {
  const rect = PREVIEW.getBoundingClientRect();
  const sx = state.size.w / rect.width;
  const x = (e.clientX - rect.left) * sx;
  const layout = layoutById(state.layoutId);
  for (let i = 0; i < layout.panels.length; i++) {
    const r = layout.panels[i];
    if (x >= r.x * state.size.w && x <= (r.x + r.w) * state.size.w) {
      const panel = state.panels[i];
      if (panel) {
        panel.zoom = clamp(panel.zoom * (e.deltaY > 0 ? 0.94 : 1.06), 1, 6);
        repaint();
      }
      break;
    }
  }
  e.preventDefault();
}, { passive: false });

function clamp01(v) { return Math.min(1, Math.max(0, v)); }
function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

// ---- demo + embed modes ------------------------------------------------

const params = new URLSearchParams(location.search);
const samples = ['samples/boulevard.jpg', 'samples/pier.jpg'];

(async function boot() {
  ensurePanels();
  if (params.get('demo') || params.get('embed')) {
    await loadSample(samples[0], 'boulevard.jpg');
    await loadSample(samples[1], 'pier.jpg');
    state.targetPhotoId = state.photos[0].id;
    fillFromPhoto(state.photos[0].id);
    // alternate the second sample across odd panels so the collage varies
    state.panels.forEach((p, i) => {
      if (i % 2 === 1) {
        state.panels[i] = { ...p, photoId: state.photos[1].id, cx: i > 1 ? 0.68 : 0.5, cy: 0.55, zoom: 1.25 + (i > 1 ? 0.4 : 0) };
      }
    });
  }
  if (params.get('demo') || params.get('embed')) {
    const cap = params.get('cap') || 'PALM DRIVE';
    const sub = params.get('sub') || 'vice nights';
    state.caption.main = cap;
    state.caption.sub = sub;
    capMain.value = cap;
    capSub.value = sub;
  }
  if (params.get('layout')) {
    const btn = [...layoutHolder.querySelectorAll('.layout-btn')].find((b) => b.dataset.layout === params.get('layout'));
    if (btn) btn.click();
  }
  if (params.get('grade')) {
    const btn = [...gradeHolder.querySelectorAll('.chip')].find((b) => b.dataset.id === params.get('grade'));
    if (btn) btn.click();
  }
  const shot = params.get('shot');
  const px = params.get('px');
  if (shot || params.get('embed')) {
    // embed mode: render the cover only, no chrome — for screenshots
    if (params.get('size')) {
      const [w, h] = params.get('size').split('x').map(Number);
      if (w && h) { state.size = { w, h }; PREVIEW.width = w; PREVIEW.height = h; }
    }
    document.getElementById('shell').style.display = 'none';
    document.body.style.background = '#000';
    PREVIEW.style.display = 'block';
    PREVIEW.style.maxWidth = px ? `${px.split('x')[0]}px` : '1280px';
    PREVIEW.style.maxHeight = px ? `${px.split('x')[1]}px` : '720px';
    PREVIEW.style.margin = '0 auto';
    document.body.appendChild(PREVIEW);
    repaint();
  } else if (params.get('size')) {
    const [w, h] = params.get('size').split('x').map(Number);
    const btn = [...document.querySelectorAll('.size-btn')].find((b) => +b.dataset.w === w && +b.dataset.h === h);
    if (btn) btn.click(); else { state.size = { w, h }; PREVIEW.width = w; PREVIEW.height = h; }
    repaint();
  } else {
    repaint();
  }
  // signal readiness for headless capture
  document.title = 'SUNGRID READY';
})();
