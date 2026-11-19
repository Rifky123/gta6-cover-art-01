// Boulevard Press — the deck: the editor around the press. Chip groups for
// vibe, size, layout and grade; the selected panel's photo tools; caption
// fields; finish sliders; PNG export; and the pointer work (pick a panel,
// drag to reframe, scroll to zoom). Also boots the demo and embed modes the
// screenshots use.

import {
  SIZES, SIZE_ORDER, makeState, fitPanels, clamp, rngFrom, reframe, shuffleAll, loadImage,
} from './core.js';
import { LAYOUTS, slotsFor, bandsFor } from './mosaic.js';
import { GRADES } from './wavelength.js';
import { renderPoster, panelAt } from './press.js';
import { VIBES, loadDemoProject, loadSamples, buildDemoPanels, bootParams, SHOT_SIZES } from './attract.js';

const state = makeState();
const params = bootParams();
let selected = 0;
let currentRects = [];
let vibeId = 'sundowner';

const $ = (id) => document.getElementById(id);
const canvas = $('poster');

/* ---------- rendering ---------- */

function render() {
  const showChrome = !params.embed;
  currentRects = renderPoster(canvas, state, { editor: showChrome, selected });
  syncPanelControls();
}

function rerenderOnFonts() {
  document.fonts.load('80px Anton').then(() => document.fonts.ready).then(render).catch(render);
}

/* ---------- chip groups ---------- */

function chipRow(container, items, { label, isOn, onPick }) {
  const buttons = new Map();
  for (const item of items) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chip';
    btn.innerHTML = label(item);
    btn.addEventListener('click', () => {
      onPick(item);
      refresh();
      render();
    });
    buttons.set(item, btn);
    container.append(btn);
  }
  function refresh() {
    for (const [item, btn] of buttons) btn.setAttribute('aria-pressed', isOn(item) ? 'true' : 'false');
  }
  refresh();
  return refresh;
}

const swatch = (stops) => `<span class="swatch" style="background:linear-gradient(90deg, ${stops.join(', ')})"></span>`;

const refreshers = [];

function buildChips() {
  refreshers.push(
    chipRow($('vibe-chips'), VIBES, {
      label: (v) => v.label,
      isOn: (v) => v.id === vibeId,
      onPick: (v) => {
        vibeId = v.id;
        v.apply(state);
        syncFinishInputs();
      },
    }),
    chipRow($('size-chips'), SIZE_ORDER.map((id) => SIZES[id]), {
      label: (s) => s.label,
      isOn: (s) => s.id === state.size,
      onPick: (s) => {
        state.size = s.id;
      },
    }),
    chipRow($('layout-chips'), LAYOUTS, {
      label: (l) => l.label,
      isOn: (l) => l.id === state.layout,
      onPick: (l) => {
        state.layout = l.id;
        state.panels = fitPanels(state.panels, slotCount());
        selected = Math.min(selected, state.panels.length - 1);
      },
    }),
    chipRow($('grade-chips'), GRADES, {
      label: (g) => `${swatch(g.swatch)}${g.label}`,
      isOn: (g) => g.id === state.grade,
      onPick: (g) => {
        state.grade = g.id;
      },
    }),
  );
  const panelRow = $('panel-chips');
  panelRow.dataset.kind = 'panels';
}

function refreshChips() {
  for (const fn of refreshers) fn();
  refreshPanelChips();
}

function refreshPanelChips() {
  const row = $('panel-chips');
  if (!row) return;
  row.replaceChildren();
  state.panels.forEach((p, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chip';
    btn.setAttribute('aria-pressed', i === selected ? 'true' : 'false');
    btn.textContent = `Panel ${i + 1}`;
    btn.addEventListener('click', () => {
      selected = i;
      refreshPanelChips();
      render();
    });
    row.append(btn);
  });
}

function slotCount() {
  const size = SIZES[state.size];
  const bands = state.bands ? bandsFor(size.h) : { top: 0, bottom: 0 };
  return slotsFor(state.layout, size.w, size.h, bands).length;
}

/* ---------- panel photo tools ---------- */

function assignPhoto(file) {
  const url = URL.createObjectURL(file);
  loadImage(url)
    .then((img) => {
      const p = state.panels[selected];
      if (!p) return;
      p.img = img;
      p.name = file.name;
      URL.revokeObjectURL(url);
      render();
    })
    .catch(() => URL.revokeObjectURL(url));
}

function syncPanelControls() {
  const p = state.panels[selected];
  const zoom = $('zoom');
  if (p && zoom) zoom.value = String(p.zoom);
  const slot = $('file-slot');
  if (slot) slot.textContent = p && p.img ? p.name : 'no photo loaded';
  refreshPanelChips();
}

function fillAllFromSelected() {
  const source = state.panels[selected]?.img
    ? state.panels[selected]
    : state.panels.find((p) => p.img);
  if (!source) return;
  const rng = rngFrom(state.seed + 99);
  state.panels = state.panels.map((p) => {
    const next = { ...p, img: source.img, name: source.name };
    reframe(next, rng);
    return next;
  });
  render();
}

/* ---------- pointer work on the canvas ---------- */

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  const scale = canvas.width / rect.width;
  return { x: (event.clientX - rect.left) * scale, y: (event.clientY - rect.top) * scale, scale };
}

function slackFor(panel, rect) {
  if (!panel?.img || !rect) return { sx: 1, sy: 1 };
  const cover = Math.max(rect.w / panel.img.width, rect.h / panel.img.height);
  const s = cover * panel.zoom;
  return {
    sx: Math.max(1, (panel.img.width * s - rect.w) / 2),
    sy: Math.max(1, (panel.img.height * s - rect.h) / 2),
  };
}

function wireCanvas() {
  let dragging = null;

  canvas.addEventListener('pointerdown', (event) => {
    const pt = canvasPoint(event);
    const hit = panelAt(currentRects, pt.x, pt.y);
    if (hit === -1) return;
    selected = hit;
    refreshPanelChips();
    render();
    const panel = state.panels[selected];
    const rect = currentRects[selected];
    dragging = {
      panel,
      rect,
      startX: event.clientX,
      startY: event.clientY,
      ox: panel.ox,
      oy: panel.oy,
    };
    canvas.setPointerCapture(event.pointerId);
  });

  canvas.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    const pt = canvasPoint(event);
    const dx = (event.clientX - dragging.startX) * pt.scale;
    const dy = (event.clientY - dragging.startY) * pt.scale;
    const { sx, sy } = slackFor(dragging.panel, dragging.rect);
    dragging.panel.ox = clamp(dragging.ox + dx / sx, -1, 1);
    dragging.panel.oy = clamp(dragging.oy + dy / sy, -1, 1);
    render();
  });

  canvas.addEventListener('pointerup', () => {
    dragging = null;
  });

  canvas.addEventListener('wheel', (event) => {
    const panel = state.panels[selected];
    if (!panel) return;
    event.preventDefault();
    panel.zoom = clamp(panel.zoom * (1 - event.deltaY * 0.0011), 1, 2.6);
    render();
  }, { passive: false });
}

/* ---------- captions, finish, export ---------- */

function syncFinishInputs() {
  $('f-grain').value = String(state.finishes.grain);
  $('f-scan').value = String(state.finishes.scan);
  $('f-dots').value = String(state.finishes.dots);
  $('f-vig').value = String(state.finishes.vig);
  $('f-frame').checked = state.finishes.frame;
}

function syncCaptionInputs() {
  $('caption').value = state.caption;
  $('subline').value = state.subline;
  $('topline').value = state.topline;
  $('footline').value = state.footline;
  $('bands').checked = state.bands;
}

function wireControls() {
  $('photo-file').addEventListener('change', (event) => {
    const file = event.target.files?.[0];
    if (file) assignPhoto(file);
    event.target.value = '';
  });

  $('fill-all').addEventListener('click', fillAllFromSelected);
  $('shuffle').addEventListener('click', () => {
    shuffleAll(state);
    render();
  });
  $('zoom').addEventListener('input', (event) => {
    const p = state.panels[selected];
    if (p) {
      p.zoom = Number(event.target.value);
      render();
    }
  });

  const captions = [
    ['caption', 'caption'],
    ['subline', 'subline'],
    ['topline', 'topline'],
    ['footline', 'footline'],
  ];
  for (const [inputId, key] of captions) {
    $(inputId).addEventListener('input', (event) => {
      state[key] = event.target.value;
      render();
    });
  }

  $('bands').addEventListener('change', (event) => {
    state.bands = event.target.checked;
    state.panels = fitPanels(state.panels, slotCount());
    render();
  });

  const finishMap = [
    ['f-grain', 'grain'],
    ['f-scan', 'scan'],
    ['f-dots', 'dots'],
    ['f-vig', 'vig'],
  ];
  for (const [inputId, key] of finishMap) {
    $(inputId).addEventListener('input', (event) => {
      state.finishes[key] = Number(event.target.value);
      render();
    });
  }
  $('f-frame').addEventListener('change', (event) => {
    state.finishes.frame = event.target.checked;
    render();
  });

  for (const btn of document.querySelectorAll('[data-export]')) {
    btn.addEventListener('click', () => exportPng(btn.dataset.export));
  }

  $('load-samples').addEventListener('click', async () => {
    const photos = await loadSamples();
    state.panels = buildDemoPanels(state.layout, photos);
    render();
  });

  const stage = $('stage');
  stage.addEventListener('dragover', (event) => event.preventDefault());
  stage.addEventListener('drop', (event) => {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('image/')) assignPhoto(file);
  });
}

function exportPng(sizeId) {
  const size = SIZES[sizeId] ?? SIZES.wide;
  const sheet = document.createElement('canvas');
  const saved = { size: state.size };
  state.size = size.id;
  renderPoster(sheet, state, {});
  state.size = saved.size;
  sheet.toBlob((blob) => {
    if (!blob) return;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `boulevard-press-${size.w}x${size.h}.png`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 4000);
  }, 'image/png');
}

/* ---------- boot ---------- */

if (params.embed) {
  document.body.classList.add('embed');
  const shot = SHOT_SIZES[params.shot] ?? 'wide';
  state.size = shot;
  loadDemoProject(state, shot).then(render).catch(render);
} else {
  state.size = params.sizeId ?? 'wide';
  buildChips();
  wireControls();
  wireCanvas();
  syncFinishInputs();
  if (params.demo) {
    loadDemoProject(state, state.size)
      .then(() => {
        syncCaptionInputs();
        refreshChips();
        render();
      })
      .catch(render);
  } else {
    render();
  }
}

rerenderOnFonts();
