// The editor wiring: segments, chips, photo loading, per-panel drag/zoom on the live canvas,
// and the PNG export. Redraws the stage after every change.

import { drawPoster } from './render.js';
import { panelRects, LAYOUTS } from './boards.js';
import { retargetPanels, fillAll } from './state.js';

const $ = (id) => document.getElementById(id);
const stage = $('stage');

export function initUI(st) {
  const redraw = () => drawPoster(stage, st, { ui: true, selected: st.selected });

  function seg(id, attr, apply) {
    const el = $(id);
    el.addEventListener('click', (e) => {
      const btn = e.target.closest('.segbtn');
      if (!btn) return;
      el.querySelectorAll('.segbtn').forEach((b) => b.classList.toggle('on', b === btn));
      apply(btn.dataset);
      redraw();
    });
    // initial active-state marks are set per-segment below, by value
  }

  seg('sizeSeg', 'w', ({ w, h }) => { st.w = Number(w); st.h = Number(h); });
  seg('layoutSeg', 'layout', ({ layout }) => { st.layout = layout; retargetPanels(st, layout); });
  seg('gradeSeg', 'grade', ({ grade }) => { st.grade = grade; });

  // mark the active size/layout/grade buttons by comparing values
  $('sizeSeg').querySelectorAll('.segbtn').forEach((b) => b.classList.toggle('on', Number(b.dataset.w) === st.w && Number(b.dataset.h) === st.h));
  $('layoutSeg').querySelectorAll('.segbtn').forEach((b) => b.classList.toggle('on', b.dataset.layout === st.layout));
  $('gradeSeg').querySelectorAll('.segbtn').forEach((b) => b.classList.toggle('on', b.dataset.grade === st.grade));

  $('finishChips').addEventListener('change', (e) => {
    const f = e.target.dataset.finish;
    if (f) { st.finishes[f] = e.target.checked; redraw(); }
  });
  $('finishChips').querySelectorAll('input').forEach((c) => { c.checked = !!st.finishes[c.dataset.finish]; });

  $('captionChips').addEventListener('change', (e) => {
    const c = e.target.dataset.cap;
    if (c) { st.caps[c] = e.target.checked; redraw(); }
  });
  $('captionChips').querySelectorAll('input').forEach((c) => { c.checked = !!st.caps[c.dataset.cap]; });

  $('captionInput').value = st.caption;
  $('captionInput').addEventListener('input', (e) => { st.caption = e.target.value; redraw(); });
  $('sublineInput').value = st.subline;
  $('sublineInput').addEventListener('input', (e) => { st.subline = e.target.value; redraw(); });

  $('photoInput').addEventListener('change', async (e) => {
    const files = [...e.target.files];
    if (!files.length) return;
    for (const file of files) {
      const img = await loadImageFile(file);
      const idx = st.photos.push(img) - 1;
      $('photoList').append(makeThumb(img, idx, st));
      // drop into the first empty panel, else the selected one
      const target = st.panels.findIndex((p) => p.photo < 0);
      if (target >= 0) st.panels[target].photo = idx;
      else st.panels[st.selected].photo = idx;
    }
    redraw();
  });

  $('fillAll').addEventListener('click', () => {
    if (!st.photos.length) return;
    fillAll(st, st.photos.length - 1);
    redraw();
  });

  // ---- panel select / drag / zoom ----
  function panelAt(px, py) {
    const scaleX = st.w / stage.clientWidth, scaleY = st.h / stage.clientHeight;
    const x = px * scaleX, y = py * scaleY;
    return panelRects(st.layout, st.w, st.h).findIndex(
      (r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h,
    );
  }

  let dragging = false;
  stage.addEventListener('pointerdown', (e) => {
    const i = panelAt(e.offsetX, e.offsetY);
    if (i < 0) return;
    st.selected = i;
    dragging = { i, lx: e.offsetX, ly: e.offsetY };
    stage.setPointerCapture(e.pointerId);
    redraw();
  });
  stage.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const p = st.panels[dragging.i];
    if (!p || p.photo < 0) return;
    const dx = (e.offsetX - dragging.lx) / stage.clientWidth * p.z;
    const dy = (e.offsetY - dragging.ly) / stage.clientHeight * p.z;
    p.fx = Math.min(1, Math.max(0, p.fx - dx));
    p.fy = Math.min(1, Math.max(0, p.fy - dy));
    dragging.lx = e.offsetX; dragging.ly = e.offsetY;
    redraw();
  });
  stage.addEventListener('pointerup', () => { dragging = false; });
  stage.addEventListener('wheel', (e) => {
    const i = panelAt(e.offsetX, e.offsetY);
    if (i < 0) return;
    e.preventDefault();
    st.selected = i;
    const p = st.panels[i];
    if (!p || p.photo < 0) return;
    p.z = Math.min(4, Math.max(0.8, p.z * (e.deltaY < 0 ? 1.08 : 0.93)));
    redraw();
  }, { passive: false });

  // ---- export ----
  $('exportBtn').addEventListener('click', () => {
    // render a clean copy without editor marks at true size
    const out = document.createElement('canvas');
    drawPoster(out, st, {});
    out.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `palmforge-${st.w}x${st.h}.png`;
      a.click();
      $('status').textContent = `Saved ${a.download}`;
      setTimeout(() => { $('status').textContent = ''; }, 4000);
    }, 'image/png');
  });

  redraw();
}

function loadImageFile(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function makeThumb(img, idx, st) {
  const li = document.createElement('li');
  const thumb = document.createElement('img');
  thumb.src = img.src;
  const use = document.createElement('button');
  use.type = 'button';
  use.textContent = `Panel → Photo ${idx + 1}`;
  use.className = 'btn ghost';
  use.addEventListener('click', () => {
    st.panels[st.selected].photo = idx;
    drawPoster(stage, st, { ui: true, selected: st.selected });
  });
  li.append(thumb, use);
  return li;
}
