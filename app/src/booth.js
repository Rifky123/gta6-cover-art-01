// booth.js — Neonpalm entry point. Boots the editor, owns the project, runs the
// live preview loop, and handles the two URL modes:
//   ?demo=1&size=1920x1080  — loads the kit sample photos with tuned crops
//   ?embed=1&shot=cover&px=1280x720 — renders the bare cover only, scaled, for captures

import { SIZES, LAYOUTS, freshProject, syncPanels, assignPhoto } from './boards.js';
import { paintCover, readyFont, makeCanvas } from './render.js';
import { bindEditor, fillAllFromOne, refreshPanelList, bindReframe } from './ui.js';

const params = new URLSearchParams(location.search);
const embed = params.get('embed') === '1';

const project = freshProject();
if (params.get('size') && SIZES[params.get('size')]) project.size = params.get('size');
if (params.get('layout') && LAYOUTS[params.get('layout')]) project.layout = params.get('layout');
if (params.get('grade')) project.grade = params.get('grade');
syncPanels(project, project.layout);

if (embed) document.body.classList.add('embed');

const preview = document.getElementById('art');
const ctx = preview.getContext('2d');

// scale factor between project pixels and on-screen preview pixels
function previewScale() {
  if (embed) {
    const [w, h] = (params.get('px') || '1280x720').split('x').map(Number);
    return Math.min(w / (SIZES[project.size]?.w ?? 1080), h / (SIZES[project.size]?.h ?? 1080));
  }
  return Math.min(
    preview.clientWidth / (SIZES[project.size]?.w ?? 1080) || 0.3,
    1,
  );
}

let paintQueued = false;

function repaint() {
  const dims = SIZES[project.size] ?? SIZES['1080x1080'];
  const cover = paintCover(project, project.size);
  if (embed) {
    // embed: draw the cover at exactly the requested preview pixel size
    const [w, h] = (params.get('px') || '1280x720').split('x').map(Number);
    preview.width = Math.round(w);
    preview.height = Math.round(h);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(cover, 0, 0, preview.width, preview.height);
    return;
  }
  if (preview.width !== dims.w || preview.height !== dims.h) {
    preview.width = dims.w;
    preview.height = dims.h;
  }
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(cover, 0, 0);
  // fit the canvas into the stage box explicitly (percent max-height is flaky
  // inside grid tracks)
  const stage = document.getElementById('stage');
  const scale = Math.min(
    (stage.clientWidth - 36) / dims.w,
    (stage.clientHeight - 36) / dims.h,
    1,
  );
  preview.style.width = `${Math.round(dims.w * scale)}px`;
  preview.style.height = `${Math.round(dims.h * scale)}px`;
}

function schedule() {
  if (paintQueued) return;
  paintQueued = true;
  requestAnimationFrame(() => {
    paintQueued = false;
    repaint();
  });
}

// --- demo photos: the kit's two samples, tuned crops per panel ---
async function loadSample(path) {
  const img = new Image();
  await new Promise((res, rej) => {
    img.onload = res;
    img.onerror = rej;
    img.src = path;
  });
  return img;
}

async function demoPhotos() {
  try {
    const [boulevard, pier] = await Promise.all([
      loadSample('samples/boulevard.jpg'),
      loadSample('samples/pier.jpg'),
    ]);
    fillAllFromOne(project, boulevard);
    // second photo into the lower-right region of the trio/quad layouts
    if (project.panels.length > 1) {
      assignPhoto(project, project.panels.length - 1, pier);
      assignPhoto(project, 1, pier);
    }
    // tuned framing per panel: faces centred, detail crops varied
    const framing = [
      { cx: 0.55, cy: 0.14, zoom: 1 },
      { cx: 0.48, cy: 0.26, zoom: 1 },
      { cx: 0.57, cy: 0.23, zoom: 1.5 },
      { cx: 0.52, cy: 0.26, zoom: 1.35 },
    ];
    project.panels.forEach((p, i) => {
      if (framing[i]) { p.cx = framing[i].cx; p.cy = framing[i].cy; p.zoom = framing[i].zoom; }
    });
    refreshPanelList(project);
    schedule();
  } catch {
    // offline without samples: placeholders already paint a dusk scene
  }
}

// --- boot ---
async function start() {
  await readyFont();

  if (!embed) {
    bindEditor(project, schedule);
    bindReframe(preview, project, previewScale, schedule);

    for (const btn of document.querySelectorAll('[data-export]')) {
      btn.addEventListener('click', () => exportPng(btn.dataset.export));
    }
  }
  if (params.get('demo') === '1') await demoPhotos();

  repaint();
}

// Render at true size and save a PNG named for the project and size.
function exportPng(sizeKey) {
  const cover = paintCover(project, sizeKey);
  cover.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `neonpalm-${project.layout}-${sizeKey}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }, 'image/png');
}

start();
