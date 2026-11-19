// Sidebar controls: sections of chips, sliders, photo slots and export
// buttons, all wired straight into editor state actions.

import { LAYOUTS } from './layouts.js';
import { GRADES, GRADE_CYCLE } from './grades.js';
import { EFFECTS } from './texture.js';
import { SIZES } from './presets.js';

export function buildSidebar(root, state, actions) {
  root.replaceChildren();
  const refreshers = [];

  // ---- post size ----
  const sizeRow = chipRow('POST SIZE', SIZES_PORTS, (key) => actions.setSize(key));
  refreshers.push(() => markChips(sizeRow.row, state.size));
  root.append(sizeRow.root);

  // ---- layout ----
  const layoutRow = chipRow('LAYOUT', LAYOUTS.map((id) => ({ id, label: id.toUpperCase() })), (id) => actions.setLayout(id));
  refreshers.push(() => markChips(layoutRow.row, state.layout));
  root.append(layoutRow.root);

  // ---- photos ----
  const photos = section('PHOTOS');
  const slotGrid = document.createElement('div');
  slotGrid.className = 'photo-grid';
  photos.append(slotGrid);
  const fillBtn = document.createElement('button');
  fillBtn.type = 'button';
  fillBtn.className = 'wide';
  fillBtn.textContent = 'Fill every panel with one photo';
  fillBtn.addEventListener('click', () => actions.fillAll());
  photos.append(fillBtn);
  root.append(photos);
  refreshers.push(() => paintSlots(slotGrid, state, actions));

  // ---- selected panel ----
  const panelSec = section('PANEL');
  const panelHead = panelSec.firstChild;
  panelSec.append(
    sliderRow('Zoom', 0.8, 3, 0.01, () => state.panels[state.selected].zoom, (v) => actions.setZoom(v)),
    sliderRow('Crop Y', 0, 1, 0.001, () => state.panels[state.selected].cy, (v) => actions.setCropY(v)),
  );
  const flipRow = chipRowInline([{ id: 'flip', label: 'Mirror panel' }], () => actions.toggleFlip());
  panelSec.append(flipRow);
  const gradeRow = chipRowInline(
    Object.entries(GRADES).map(([id, g]) => ({ id, label: g.label, swatch: g.swatch, cls: 'grade' })),
    (id) => actions.setGrade(id),
  );
  panelSec.append(gradeRow);
  const spreadBtn = document.createElement('button');
  spreadBtn.type = 'button';
  spreadBtn.className = 'ghost';
  spreadBtn.textContent = 'Apply this grade to all panels';
  spreadBtn.style.marginTop = '8px';
  spreadBtn.addEventListener('click', () => actions.spreadGrade());
  panelSec.append(spreadBtn);
  root.append(panelSec);
  refreshers.push(() => {
    const p = state.panels[state.selected];
    panelHead.textContent = `PANEL ${state.selected + 1} / ${state.panels.length}`;
    markChips(flipRow, p.flip ? 'flip' : '');
    markChips(gradeRow, p.grade);
  });

  // ---- look ----
  const lookSec = section('LOOK');
  const effectRow = chipRowInline(EFFECTS.map((e) => ({ id: e.id, label: e.label })), (id) => actions.toggleEffect(id));
  lookSec.append(effectRow);
  const frameRow = chipRowInline(
    [{ id: 'cream', label: 'Cream frame' }, { id: 'ink', label: 'Ink frame' }, { id: 'none', label: 'No frame' }],
    (id) => actions.setFrame(id),
  );
  lookSec.append(frameRow);
  root.append(lookSec);
  refreshers.push(() => {
    const on = Object.entries(state.effects).filter(([, v]) => v).map(([k]) => k);
    [...effectRow.children].forEach((chip) => chip.classList.toggle('on', on.includes(chip.dataset.id)));
    markChips(frameRow, state.frame);
  });

  // ---- caption ----
  const capSec = section('CAPTION');
  capSec.append(textRow('Title', () => state.caption.main, (v) => actions.setCaptionText(v)));
  capSec.append(textRow('Sub line', () => state.caption.sub, (v) => actions.setSubText(v)));
  const bandRow = chipRowInline([{ id: 'bottom', label: 'Caption below' }, { id: 'top', label: 'Caption above' }], (id) => actions.setBand(id));
  capSec.append(bandRow);
  capSec.append(sliderRow('Title size', 0.7, 1.3, 0.01, () => state.caption.scale, (v) => actions.setCaptionScale(v)));
  root.append(capSec);
  refreshers.push(() => markChips(bandRow, state.caption.band));

  // ---- export ----
  const exportSec = section('EXPORT PNG');
  for (const key of Object.keys(SIZES)) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'export-btn';
    const s = SIZES[key];
    btn.innerHTML = `Download <b>${s.w} × ${s.h}</b>`;
    btn.addEventListener('click', () => actions.exportAs(key));
    exportSec.append(btn);
  }
  root.append(exportSec);

  function refresh() {
    refreshers.forEach((fn) => fn());
    refreshInputs(root, state);
  }
  refresh();
  return { refresh };
}

const SIZES_PORTS = Object.entries(SIZES).map(([id, s]) => ({ id, label: s.label.split(' · ')[1] }));

function section(title) {
  const sec = document.createElement('div');
  sec.className = 'section';
  const h = document.createElement('p');
  h.className = 'section-title';
  h.textContent = title;
  sec.append(h);
  return sec;
}

function chipRow(title, items, onPick) {
  const sec = section(title);
  const row = chipRowInline(items, onPick);
  sec.append(row);
  return { root: sec, row };
}

function chipRowInline(items, onPick) {
  const row = document.createElement('div');
  row.className = 'chip-row';
  for (const item of items) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = `chip${item.cls ? ` ${item.cls}` : ''}`;
    chip.textContent = item.label;
    chip.dataset.id = item.id;
    if (item.swatch) chip.style.setProperty('--swatch', item.swatch);
    chip.addEventListener('click', () => onPick(item.id));
    row.append(chip);
  }
  return row;
}

function markChips(row, activeId) {
  [...row.children].forEach((chip) => chip.classList.toggle('on', chip.dataset.id === activeId));
}

function sliderRow(label, min, max, step, read, write) {
  const row = document.createElement('div');
  row.className = 'slider-row';
  row.dataset.slider = label;
  const lab = document.createElement('label');
  lab.textContent = label;
  const input = document.createElement('input');
  input.type = 'range';
  input.min = String(min);
  input.max = String(max);
  input.step = String(step);
  input.addEventListener('input', () => write(Number(input.value)));
  row.append(lab, input);
  row._sync = () => { input.value = String(read()); };
  return row;
}

function textRow(label, read, write) {
  const wrap = document.createElement('div');
  wrap.className = 'text-row';
  wrap.dataset.text = label;
  const input = document.createElement('input');
  input.type = 'text';
  input.maxLength = 48;
  input.placeholder = label;
  input.addEventListener('input', () => write(input.value));
  wrap.append(input);
  wrap._sync = () => { if (input.value !== read()) input.value = read(); };
  return wrap;
}

function refreshInputs(root, state) {
  root.querySelectorAll('.slider-row').forEach((row) => row._sync());
  root.querySelectorAll('.text-row').forEach((row) => row._sync());
}

function paintSlots(grid, state, actions) {
  grid.replaceChildren();
  state.panels.forEach((panel, i) => {
    const slot = document.createElement('button');
    slot.type = 'button';
    slot.className = `slot${i === state.selected ? ' on' : ''}`;
    const thumb = document.createElement('canvas');
    thumb.width = 132;
    thumb.height = 64;
    const label = document.createElement('span');
    label.className = 'slot-label';
    label.textContent = `P${i + 1}${panel.photoId ? ` · ${panel.photoId}` : ' · empty'}`;
    slot.append(thumb, label);
    slot.addEventListener('click', () => actions.pickPhoto(i));
    grid.append(slot);
    const img = state.photos.get(panel.photoId);
    if (img) drawThumb(thumb, img);
  });
}

function drawThumb(canvas, img) {
  const ctx = canvas.getContext('2d');
  const fit = Math.max(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
  const w = img.naturalWidth * fit;
  const h = img.naturalHeight * fit;
  ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
}
