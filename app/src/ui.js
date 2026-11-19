// ui.js — Neonpalm editor wiring: binds the rail controls to the project, handles
// photo loading, panel reframing (drag to move the crop, wheel to zoom), and
// notifies booth.js after every change so the preview repaints.

import { SIZES, LAYOUTS, GRADES, FINISHES, syncPanels, assignPhoto } from './boards.js';

// Wire every control. onChange(project, reason) fires after each mutation.
export function bindEditor(project, onChange) {
  const emit = (reason) => onChange(project, reason);

  // --- post size ---
  const sizePicker = document.getElementById('sizePicker');
  for (const btn of sizePicker.querySelectorAll('.chip')) {
    btn.addEventListener('click', () => {
      project.size = btn.dataset.size;
      markOn(sizePicker, 'size', project.size);
      emit('size');
    });
  }
  markOn(sizePicker, 'size', project.size);

  // --- photos ---
  const input = document.getElementById('photoInput');
  document.getElementById('addPhotos').addEventListener('click', () => input.click());
  input.addEventListener('change', async () => {
    const files = [...input.files];
    const imgs = await loadImages(files);
    // fill the empty panels first, then the emptiest reuse in order
    let slot = project.panels.findIndex((p) => !p.img);
    for (const img of imgs) {
      if (slot === -1) slot = 0;
      assignPhoto(project, slot, img);
      slot = project.panels.findIndex((p, i) => i > slot && !p.img);
      if (slot === -1) slot = project.panels.findIndex((p) => !p.img);
    }
    input.value = '';
    refreshPanelList(project);
    emit('photos');
  });

  // fill all panels from one photo with auto-varied crops
  document.getElementById('fillOne').addEventListener('click', () => {
    const input2 = document.createElement('input');
    input2.type = 'file';
    input2.accept = 'image/*';
    input2.onchange = async () => {
      const [img] = await loadImages([...input2.files]);
      if (!img) return;
      fillAllFromOne(project, img);
      refreshPanelList(project);
      emit('fill-one');
    };
    input2.click();
  });

  document.getElementById('shuffleCrops').addEventListener('click', () => {
    varyCrops(project);
    emit('vary');
  });

  // --- layouts ---
  const grid = document.getElementById('layoutGrid');
  for (const chip of grid.querySelectorAll('.layout-chip')) {
    chip.addEventListener('click', () => {
      syncPanels(project, chip.dataset.layout);
      project.layout = chip.dataset.layout;
      markOn(grid, 'layout', project.layout);
      refreshPanelList(project);
      emit('layout');
    });
  }
  markOn(grid, 'layout', project.layout);

  // --- grades ---
  const row = document.getElementById('gradeRow');
  for (const chip of row.querySelectorAll('.grade-chip')) {
    chip.addEventListener('click', () => {
      project.grade = chip.dataset.grade;
      markOn(row, 'grade', project.grade);
      emit('grade');
    });
  }
  markOn(row, 'grade', project.grade);

  // --- finishes ---
  for (const box of document.querySelectorAll('#finishRow input[data-finish]')) {
    box.checked = !!project.finishes[box.dataset.finish];
    box.addEventListener('change', () => {
      project.finishes[box.dataset.finish] = box.checked;
      emit('finish');
    });
  }

  // --- caption ---
  const bindText = (id, key) => {
    const el = document.getElementById(id);
    el.value = project.caption[key];
    el.addEventListener('input', () => {
      project.caption[key] = el.value;
      emit('caption');
    });
  };
  bindText('titleInput', 'title');
  bindText('subInput', 'sub');
  bindText('badgeInput', 'badge');
  for (const id of ['bandTop', 'bandBottom']) {
    const el = document.getElementById(id);
    const key = id === 'bandTop' ? 'topBand' : 'bottomBand';
    el.checked = project.caption[key];
    el.addEventListener('change', () => {
      project.caption[key] = el.checked;
      emit('band');
    });
  }

  refreshPanelList(project);
}

// Fill every panel with one image, each with a deliberately different crop region.
// Crops favour the upper-centre of the frame where faces live.
export function fillAllFromOne(project, img) {
  const spots = [
    { cx: 0.5, cy: 0.38, zoom: 1 },
    { cx: 0.4, cy: 0.3, zoom: 1.35 },
    { cx: 0.62, cy: 0.34, zoom: 1.2 },
    { cx: 0.5, cy: 0.55, zoom: 1.6 },
  ];
  project.panels.forEach((p, i) => {
    p.img = img;
    p.photo = img.src;
    const s = spots[i % spots.length];
    p.cx = s.cx;
    p.cy = s.cy;
    p.zoom = s.zoom;
  });
}

// Nudge every filled panel's crop by a deterministic spread so one photo yields
// visibly different panels.
export function varyCrops(project) {
  const drift = [
    [0.5, 0.38, 1],
    [0.38, 0.3, 1.3],
    [0.64, 0.36, 1.18],
    [0.5, 0.52, 1.55],
  ];
  project.panels.forEach((p, i) => {
    if (!p.img) return;
    const d = drift[(i + project.panels.length) % drift.length];
    p.cx = d[0];
    p.cy = d[1];
    p.zoom = d[2];
  });
}

function loadImages(files) {
  return Promise.all(
    files.map((f) => new Promise((resolve, reject) => {
      const url = URL.createObjectURL(f);
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    })),
  );
}

// The rail's photo list: one row per panel with its source state.
export function refreshPanelList(project) {
  const list = document.getElementById('panelList');
  list.innerHTML = '';
  project.panels.forEach((p, i) => {
    const li = document.createElement('li');
    if (p.img) li.classList.add('has-photo');
    const dot = document.createElement('span');
    dot.className = 'dot';
    const who = document.createElement('span');
    who.className = 'who';
    who.textContent = `Panel ${i + 1}`;
    const what = document.createElement('span');
    what.className = 'what';
    what.textContent = p.img ? `photo ${i + 1} loaded` : 'empty';
    li.append(dot, who, what);
    list.appendChild(li);
  });
}

// Drag / wheel reframing on the preview canvas: the click position maps into the
// panel under it, and dragging pans that panel's crop.
export function bindReframe(canvas, project, getScale, onChange) {
  let drag = null;

  canvas.addEventListener('pointerdown', (e) => {
    const hit = panelAt(project, canvas, getScale(), e);
    if (!hit) return;
    drag = { ...hit, sx: e.clientX, sy: e.clientY, cx: hit.panel.cx, cy: hit.panel.cy };
    canvas.setPointerCapture(e.pointerId);
  });

  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const scale = getScale();
    const ddx = (e.clientX - drag.sx) / scale / drag.frameW;
    const ddy = (e.clientY - drag.sy) / scale / drag.frameH;
    drag.panel.cx = clamp(drag.cx - ddx);
    drag.panel.cy = clamp(drag.cy - ddy);
    onChange(project, 'reframe');
  });

  canvas.addEventListener('pointerup', () => { drag = null; });
  canvas.addEventListener('pointercancel', () => { drag = null; });

  canvas.addEventListener('wheel', (e) => {
    const hit = panelAt(project, canvas, getScale(), e);
    if (!hit) return;
    e.preventDefault();
    hit.panel.zoom = clamp(hit.panel.zoom * (e.deltaY > 0 ? 0.93 : 1.075), 0.6, 4);
    onChange(project, 'reframe');
  }, { passive: false });
}

// Which panel (if any) sits under the pointer, with its frame in art pixels.
function panelAt(project, canvas, scale, e) {
  const rect = canvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) / (scale || 1);
  const my = (e.clientY - rect.top) / (scale || 1);
  const { w: W, h: H } = SIZES[project.size] ?? SIZES['1080x1080'];
  const lay = LAYOUTS[project.layout];
  const bandPx = H * lay.band;
  const artH = H - bandPx;
  for (let i = 0; i < lay.frames.length; i++) {
    const [fx, fy, fw, fh] = lay.frames[i];
    const x = fx * W;
    const y = fy * artH;
    if (mx >= x && mx <= x + fw * W && my >= y && my <= y + fh * artH) {
      return { panel: project.panels[i], frameW: fw * W, frameH: fh * artH, index: i };
    }
  }
  return null;
}

function clamp(v, lo = 0, hi = 1) {
  return Math.min(hi, Math.max(lo, v));
}

function markOn(root, attr, key) {
  for (const el of root.querySelectorAll(`[data-${attr}]`)) {
    el.classList.toggle('on', el.dataset[attr] === key);
  }
}
