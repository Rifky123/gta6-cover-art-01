// HEATSPLIT editor. State lives in one object; the canvas re-renders on
// every change. Panels take reframe (drag) + zoom (wheel); photos come
// from file input or the kit samples; export renders a fresh canvas at
// true export size and downloads a PNG.

import { LAYOUTS, layoutById } from './layouts.js';
import { GRADES, FINISHES } from './grades.js';
import { renderPoster } from './render.js';
import { bootFromUrl, SHOTS } from './shots.js';

const $ = (sel) => document.querySelector(sel);

const state = {
  layout: 'quartet',
  grade: GRADES[0],
  finishes: ['grain', 'vignette'],
  title: 'SUNSET SYNDICATE',
  sub: 'VICE COAST · CHAPTER ONE',
  bandTop: 'HEATSPLIT ORIGINALS',
  bandBottom: 'EPISODE 01 · THE VICE COAST RUN',
  bandTopOn: true,
  bandBottomOn: true,
  slots: [],
  seed: 7,
  size: { w: 1080, h: 1080 },
};

const photos = [];
let activePanel = 0;

const canvas = $('#poster');

function ensureSlots() {
  const n = layoutById(state.layout).panels.length;
  while (state.slots.length < n) {
    state.slots.push({
      photo: state.slots.length % Math.max(1, photos.length || 1),
      reframe: { x: 0.5, y: 0.5 },
      zoom: 1.4,
    });
  }
  state.slots.length = n;
}

function render() {
  ensureSlots();
  renderPoster(canvas, state, photos);
}

// ---- preview sizing: fit stage, keep export aspect ----
function fitPreview() {
  const frame = $('#stage-frame');
  const stage = $('#stage');
  const availW = stage.clientWidth - 36;
  const availH = stage.clientHeight - 60;
  const scale = Math.min(availW / state.size.w, availH / state.size.h, 1);
  canvas.style.width = `${Math.round(state.size.w * scale)}px`;
  canvas.style.height = 'auto';
  frame.style.width = `${Math.round(state.size.w * scale)}px`;
}

function setSize(w, h) {
  state.size = { w, h };
  canvas.width = w;
  canvas.height = h;
  document.querySelectorAll('#size-switch .seg-btn').forEach((b) => {
    b.classList.toggle('on', b.dataset.size === `${w}x${h}`);
  });
  fitPreview();
  render();
}

// ---- photos ----
function addPhotoFiles(files) {
  for (const f of files) {
    if (!f.type.startsWith('image/')) continue;
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => {
      photos.push(img);
      buildTray();
      if (photos.length === 1) fillAllFromPhoto(0);
      render();
    };
    img.src = url;
  }
}

function fillAllFromPhoto(idx) {
  ensureSlots();
  state.slots.forEach((slot, i) => {
    slot.photo = idx;
    const dir = i % 2 === 0 ? 1 : -1;
    slot.reframe = { x: 0.5 + dir * 0.03 * (i + 1), y: 0.42 + 0.05 * (i % 3) };
    slot.zoom = 1.35 + (i % 3) * 0.18;
  });
  render();
}

function buildTray() {
  const tray = $('#photo-tray');
  tray.textContent = '';
  photos.forEach((img, i) => {
    const b = document.createElement('button');
    b.className = 'tray-thumb';
    b.title = `Photo ${i + 1} — click to place into the selected panel`;
    b.style.backgroundImage = `url(${img.src})`;
    b.onclick = () => {
      state.slots[activePanel].photo = i;
      render();
    };
    tray.appendChild(b);
  });
}

// ---- panel interaction: drag reframes, wheel zooms ----
function panelAt(pxX, pxY) {
  const rects = layoutById(state.layout).panels;
  const W = canvas.clientWidth, H = canvas.clientHeight;
  const x = pxX / W, y = pxY / H;
  for (let i = rects.length - 1; i >= 0; i--) {
    const r = rects[i];
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return i;
  }
  return -1;
}

canvas.addEventListener('pointerdown', (e) => {
  const box = canvas.getBoundingClientRect();
  const idx = panelAt(e.clientX - box.left, e.clientY - box.top);
  if (idx === -1) return;
  activePanel = idx;
  const slot = state.slots[idx];
  const startX = e.clientX, startY = e.clientY;
  const from = { ...slot.reframe };
  const move = (ev) => {
    const W = canvas.clientWidth, H = canvas.clientHeight;
    slot.reframe.x = Math.min(1, Math.max(0, from.x + (ev.clientX - startX) / W));
    slot.reframe.y = Math.min(1, Math.max(0, from.y + (ev.clientY - startY) / H));
    render();
  };
  const up = () => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
  };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
});

canvas.addEventListener('wheel', (e) => {
  const box = canvas.getBoundingClientRect();
  const idx = panelAt(e.clientX - box.left, e.clientY - box.top);
  if (idx === -1) return;
  e.preventDefault();
  activePanel = idx;
  const slot = state.slots[idx];
  slot.zoom = Math.min(3, Math.max(1, slot.zoom * (e.deltaY > 0 ? 0.94 : 1.06)));
  render();
}, { passive: false });

// ---- controls ----
function buildLayoutTiles() {
  const grid = $('#layout-grid');
  grid.textContent = '';
  for (const lay of LAYOUTS) {
    const tile = document.createElement('button');
    tile.className = 'tile' + (lay.id === state.layout ? ' on' : '');
    tile.title = lay.name;
    const mini = document.createElement('div');
    mini.style.position = 'relative';
    mini.style.width = '100%';
    mini.style.height = '100%';
    lay.panels.forEach((p) => {
      const blk = document.createElement('i');
      blk.style.position = 'absolute';
      blk.style.left = `${p.x * 100}%`;
      blk.style.top = `${p.y * 100}%`;
      blk.style.width = `${p.w * 100}%`;
      blk.style.height = `${p.h * 100}%`;
      blk.style.background = 'var(--ink-dim)';
      blk.style.borderRadius = '1px';
      mini.appendChild(blk);
    });
    tile.appendChild(mini);
    tile.onclick = () => {
      state.layout = lay.id;
      document.querySelectorAll('.tile').forEach((t) => t.classList.remove('on'));
      tile.classList.add('on');
      render();
    };
    grid.appendChild(tile);
  }
}

function buildChips() {
  const gradeRow = $('#grade-row');
  for (const g of GRADES) {
    const b = document.createElement('button');
    b.dataset.grade = g.id;
    b.className = 'chip' + (g.id === state.grade.id ? ' on' : '');
    b.textContent = g.name;
    b.onclick = () => {
      state.grade = g;
      document.querySelectorAll('#grade-row .chip').forEach((c) => c.classList.remove('on'));
      b.classList.add('on');
      render();
    };
    gradeRow.appendChild(b);
  }
  const finishRow = $('#finish-row');
  for (const f of FINISHES) {
    const b = document.createElement('button');
    b.dataset.finish = f.id;
    b.className = 'chip' + (state.finishes.includes(f.id) ? ' on' : '');
    b.textContent = f.name;
    b.onclick = () => {
      if (state.finishes.includes(f.id)) state.finishes = state.finishes.filter((x) => x !== f.id);
      else state.finishes = [...state.finishes, f.id];
      b.classList.toggle('on');
      render();
    };
    finishRow.appendChild(b);
  }
}

function syncChips() {
  document.querySelectorAll('#grade-row .chip').forEach((c) => {
    c.classList.toggle('on', c.dataset.grade === state.grade.id);
  });
  document.querySelectorAll('#finish-row .chip').forEach((c) => {
    c.classList.toggle('on', state.finishes.includes(c.dataset.finish));
  });
  document.querySelectorAll('.tile').forEach((t) => {
    t.classList.toggle('on', t.title === layoutById(state.layout).name);
  });
}

function bindField(id, key) {
  const el = $(id);
  el.addEventListener('input', () => {
    state[key] = el.value;
    render();
  });
}

function bindCheck(id, key) {
  const el = $(id);
  el.addEventListener('change', () => {
    state[key] = el.checked;
    render();
  });
}

// ---- export ----
function exportPNG(w, h) {
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  renderPoster(off, state, photos);
  off.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `heatsplit-${w}x${h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }, 'image/png');
}

// ---- presets ----
function applyPreset(preset) {
  state.layout = preset.layout;
  state.grade = GRADES.find((g) => g.id === preset.grade) ?? GRADES[0];
  state.finishes = [...preset.finishes];
  state.title = preset.title;
  state.sub = preset.sub;
  state.bandTop = preset.bandTop;
  state.bandBottom = preset.bandBottom;
  state.bandTopOn = true;
  state.bandBottomOn = true;
  state.slots = preset.slots.map((s) => ({ ...s, reframe: { ...s.reframe } }));
  state.seed = preset.seed;
  const [w, h] = preset.size.split('x').map(Number);
  state.size = { w, h };
  $('#cap-title').value = preset.title;
  $('#cap-sub').value = preset.sub;
  $('#band-top').value = preset.bandTop;
  $('#band-bottom').value = preset.bandBottom;
  $('#band-top-on').checked = true;
  $('#band-bottom-on').checked = true;
  syncChips();
}

function loadDemo() {
  applyPreset(SHOTS.editor);
  setSize(state.size.w, state.size.h);
  buildTray();
}

// ---- boot ----
async function loadPosterFont() {
  try {
    const font = new FontFace('Anton', "url('fonts/Anton-Regular.ttf') format('truetype')");
    const loaded = await font.load();
    document.fonts.add(loaded);
  } catch {
    // Anton missing: canvas lettering falls back to Arial Narrow / Impact
  }
}

async function boot() {
  await loadPosterFont();
  buildLayoutTiles();
  buildChips();
  bindField('#cap-title', 'title');
  bindField('#cap-sub', 'sub');
  bindField('#band-top', 'bandTop');
  bindField('#band-bottom', 'bandBottom');
  bindCheck('#band-top-on', 'bandTopOn');
  bindCheck('#band-bottom-on', 'bandBottomOn');

  $('#btn-add').onclick = () => $('#file-add').click();
  $('#file-add').addEventListener('change', (e) => addPhotoFiles(e.target.files));
  $('#btn-fill').onclick = () => { if (photos.length) fillAllFromPhoto(activePanel % photos.length); };
  $('#btn-demo').onclick = () => loadDemo();

  document.querySelectorAll('#size-switch .seg-btn').forEach((b) => {
    b.onclick = () => {
      const [w, h] = b.dataset.size.split('x').map(Number);
      setSize(w, h);
    };
  });
  document.querySelectorAll('[data-export]').forEach((b) => {
    b.onclick = () => {
      const [w, h] = b.dataset.export.split('x').map(Number);
      exportPNG(w, h);
    };
  });

  const bootState = await bootFromUrl();
  if (bootState) {
    for (const p of bootState.photos) photos.push(p);
    applyPreset(bootState.preset);
    if (bootState.embed) {
      // embed: poster only, scaled to ?px CSS width (screenshot path)
      document.body.classList.add('embed');
      const px = bootState.px || 1280;
      canvas.width = state.size.w;
      canvas.height = state.size.h;
      canvas.style.width = `${px}px`;
      canvas.style.height = 'auto';
      render();
      return;
    }
    if (bootState.size) {
      const [w, h] = bootState.size.split('x').map(Number);
      state.size = { w, h };
    }
    buildTray();
  }

  setSize(state.size.w, state.size.h);
  render();
}

boot();
