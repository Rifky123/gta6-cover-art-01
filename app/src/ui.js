// ui.js — editor chrome: chip groups, photo tray, caption fields, panel
// controls, canvas pointer interactions and the three PNG exports.

import { SIZES, state, onChange, touch, setLayout, setGrade, setFinish, setCaption,
         setSize, selectPanel, setPanel, addPhoto, removePhoto, fillAll, clamp } from "./state.js";
import { LAYOUTS, slotsFor, slotAt, pixelRect, gutterFor } from "./layouts.js";
import { GRADES } from "./grades.js";
import { renderAt, paintPoster } from "./painter.js";

const $ = (sel) => document.querySelector(sel);

let canvas, wrap;

export function initUI() {
  canvas = $("#poster");
  wrap = $("#canvas-wrap");

  buildGradeChips();
  wireChipGroups();
  wirePhotos();
  wireCaption();
  wirePanelControls();
  wireCanvas();
  wireExports();

  window.addEventListener("resize", scalePreview);
  onChange(() => { syncControls(); repaint(); });
  document.fonts.ready.then(() => touch());
}

function repaint() {
  const S = SIZES[state.size];
  if (canvas.width !== S.w || canvas.height !== S.h) {
    canvas.width = S.w;
    canvas.height = S.h;
  }
  paintPoster(canvas.getContext("2d"), state, S.w, S.h);
  scalePreview();
}

// ── chip groups ─────────────────────────────────────────────────────

function buildGradeChips() {
  const host = $("#grade-chips");
  for (const [key, g] of Object.entries(GRADES)) {
    const b = document.createElement("button");
    b.className = "chip";
    b.dataset.grade = key;
    b.style.background = g.swatch;
    b.style.color = "#fff";
    b.style.textShadow = "0 1px 2px rgba(0,0,0,.7)";
    b.textContent = g.label;
    b.addEventListener("click", () => setGrade(key));
    host.appendChild(b);
  }
}

function wireChipGroups() {
  $("#size-chips").addEventListener("click", (e) => {
    const b = e.target.closest("[data-size]");
    if (b) setSize(b.dataset.size);
  });
  $("#layout-chips").addEventListener("click", (e) => {
    const b = e.target.closest("[data-layout]");
    if (b) setLayout(b.dataset.layout);
  });
  $("#finish-chips").addEventListener("click", (e) => {
    const b = e.target.closest("[data-finish]");
    if (b) setFinish(b.dataset.finish, !state.finishes[b.dataset.finish]);
  });
  $("#cap-pos").addEventListener("click", (e) => {
    const b = e.target.closest("[data-pos]");
    if (b) setCaption({ pos: b.dataset.pos });
  });
}

// ── photos ──────────────────────────────────────────────────────────

function wirePhotos() {
  $("#photo-input").addEventListener("change", (e) => {
    for (const file of e.target.files) loadFilePhoto(file);
    e.target.value = "";
  });
  $("#fill-all").addEventListener("click", () => {
    if (!state.photos.length) return;
    const idx = state.panels[state.selected]?.photo;
    fillAll(idx >= 0 ? idx : 0);
  });
  $("#photo-thumbs").addEventListener("click", (e) => {
    const kill = e.target.closest(".kill");
    if (kill) {
      removePhoto(Number(kill.dataset.i));
      return;
    }
    const t = e.target.closest(".thumb");
    if (t) setPanel(state.selected, { photo: Number(t.dataset.i) });
  });
}

function loadFilePhoto(file) {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    // Keep the blob URL alive: photo thumbs render straight from it.
    const i = addPhoto(file.name.replace(/\.[^.]+$/, ""), img);
    const used = state.panels.some((p) => p.photo >= 0);
    if (!used) fillAll(i);
    else setPanel(state.selected, { photo: i });
  };
  img.src = url;
}

// Called by sessions.js when sample photos finish loading.
export function registerSample(name, img) {
  const i = addPhoto(name, img, true);
  return i;
}

// ── caption ─────────────────────────────────────────────────────────

function wireCaption() {
  $("#cap-title").addEventListener("input", (e) => setCaption({ title: e.target.value }));
  $("#cap-sub").addEventListener("input", (e) => setCaption({ sub: e.target.value }));
  $("#cap-band").addEventListener("change", (e) => setCaption({ band: e.target.checked }));
  $("#cap-underline").addEventListener("change", (e) => setCaption({ underline: e.target.checked }));
  $("#cap-scale").addEventListener("input", (e) => setCaption({ scale: Number(e.target.value) }));
}

// ── panel section ───────────────────────────────────────────────────

function wirePanelControls() {
  $("#panel-photo").addEventListener("change", (e) => {
    setPanel(state.selected, { photo: Number(e.target.value) });
  });
  $("#panel-zoom").addEventListener("input", (e) => {
    setPanel(state.selected, { zoom: Number(e.target.value) / 100 });
  });
  $("#panel-reset").addEventListener("click", () => {
    setPanel(state.selected, { cx: 0.5, cy: 0.45, zoom: 1.1 });
  });
}

// ── canvas interactions ─────────────────────────────────────────────

function wireCanvas() {
  let dragging = false;
  let lastX = 0;
  let lastY = 0;

  const toCanvas = (e) => {
    const r = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (canvas.width / r.width),
      y: (e.clientY - r.top) * (canvas.height / r.height),
    };
  };

  canvas.addEventListener("pointerdown", (e) => {
    const S = SIZES[state.size];
    const pt = toCanvas(e);
    const slot = slotAt(pt.x, pt.y, state.layout, S.w, S.h, gutterFor(state.layout, S.w, S.h));
    if (slot < 0) return;
    selectPanel(slot);
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  });

  canvas.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const S = SIZES[state.size];
    const p = state.panels[state.selected];
    const img = p.photo >= 0 ? state.photos[p.photo]?.img : null;
    if (!img) return;
    const r = panelPixelRect(state.selected, S);
    const scale = Math.max(r.w / img.naturalWidth, r.h / img.naturalHeight) * p.zoom;
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    const rct = canvas.getBoundingClientRect();
    const kx = (e.clientX - lastX) * (canvas.width / rct.width) / dw;
    const ky = (e.clientY - lastY) * (canvas.height / rct.height) / dh;
    lastX = e.clientX;
    lastY = e.clientY;
    setPanel(state.selected, { cx: clamp(p.cx - kx, 0, 1), cy: clamp(p.cy - ky, 0, 1) });
  });

  canvas.addEventListener("pointerup", () => { dragging = false; });

  canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    const p = state.panels[state.selected];
    if (!p) return;
    const factor = Math.exp((e.deltaY > 0 ? 1 : -1) * 0.08);
    setPanel(state.selected, { zoom: clamp(p.zoom * factor, 1, 2.6) });
  }, { passive: false });
}

function panelPixelRect(i, S) {
  const slots = slotsFor(state.layout);
  const slot = slots[Math.min(i, slots.length - 1)];
  return pixelRect(slot, state.layout, S.w, S.h, gutterFor(state.layout, S.w, S.h));
}

// ── exports ─────────────────────────────────────────────────────────

function wireExports() {
  document.querySelectorAll("[data-export]").forEach((b) => {
    b.addEventListener("click", () => exportSize(b.dataset.export));
  });
}

async function exportSize(key) {
  await document.fonts.ready;
  const S = SIZES[key];
  const out = renderAt(state, S.w, S.h);
  const blob = await new Promise((res) => out.toBlob(res, "image/png"));
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `duskline-${S.w}x${S.h}.png`;
  a.click();
  URL.revokeObjectURL(a.href);
}

// ── preview scaling + control sync ──────────────────────────────────

export function scalePreview() {
  const S = SIZES[state.size];
  const box = wrap.getBoundingClientRect();
  const k = Math.min((box.width - 24) / S.w, (box.height - 24) / S.h, 1);
  canvas.style.width = `${Math.round(S.w * k)}px`;
  canvas.style.height = `${Math.round(S.h * k)}px`;
}

function syncControls() {
  markOn("#size-chips [data-size]", state.size);
  markOn("#layout-chips [data-layout]", state.layout);
  markOn("#grade-chips [data-grade]", state.grade);
  markOn("#cap-pos [data-pos]", state.caption.pos);
  for (const [k, v] of Object.entries(state.finishes)) {
    const chip = document.querySelector(`#finish-chips [data-finish="${k}"]`);
    if (chip) chip.classList.toggle("on", v);
  }
  $("#cap-title").value = state.caption.title;
  $("#cap-sub").value = state.caption.sub;
  $("#cap-band").checked = state.caption.band;
  $("#cap-underline").checked = state.caption.underline;
  $("#cap-scale").value = state.caption.scale;

  // Panel section follows the selection.
  const slotCount = slotsFor(state.layout).length;
  const sel = Math.min(state.selected, slotCount - 1);
  $("#panel-no").textContent = `${sel + 1} / ${slotCount} · ${LAYOUTS[state.layout].label}`;
  const p = state.panels[sel];
  const selEl = $("#panel-photo");
  selEl.innerHTML = '<option value="-1">— none —</option>' +
    state.photos.map((ph, i) => `<option value="${i}">${escapeHtml(ph.name)}</option>`).join("");
  selEl.value = String(p ? p.photo : -1);
  $("#panel-zoom").value = Math.round((p ? p.zoom : 1.1) * 100);

  // Photo tray.
  const tray = $("#photo-thumbs");
  tray.innerHTML = "";
  state.photos.forEach((ph, i) => {
    const d = document.createElement("div");
    d.className = "thumb" + (p && p.photo === i ? " on" : "");
    d.dataset.i = String(i);
    d.title = ph.name;
    d.style.background = `url(${thumbSrc(ph)}) center/cover`;
    const kill = document.createElement("button");
    kill.className = "kill";
    kill.dataset.i = String(i);
    kill.textContent = "×";
    d.appendChild(kill);
    tray.appendChild(d);
  });
}

function thumbSrc(ph) {
  // Samples keep their own src; file photos draw from the decoded image.
  return ph.sample ? ph.img.src : ph.img.src;
}

function markOn(selector, value) {
  document.querySelectorAll(selector).forEach((el) => {
    el.classList.toggle("on", el.dataset.size === value || el.dataset.layout === value ||
                              el.dataset.grade === value || el.dataset.pos === value);
  });
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
