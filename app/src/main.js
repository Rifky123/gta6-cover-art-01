// Bootstraps the booth: font load, query-param scenes (?demo=1 samples, ?embed=1 cover-only for
// screenshots), then hands the state to the editor UI.

import { drawPoster } from './render.js';
import { freshState, retargetPanels, fillAll, DEMO_CROPS } from './state.js';
import { initUI } from './ui.js';

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function boot() {
  const font = new FontFace('Anton', "url('./fonts/Anton-Regular.ttf')");
  await font.load();
  document.fonts.add(font);

  const params = new URLSearchParams(location.search);
  const st = freshState();

  const wantSize = params.get('size');
  if (wantSize) {
    const [w, h] = wantSize.split('x').map(Number);
    if (w && h) { st.w = w; st.h = h; }
  }
  const wantLayout = params.get('layout');
  if (wantLayout) { st.layout = wantLayout; }
  const wantGrade = params.get('grade');
  if (wantGrade) { st.grade = wantGrade; }
  const wantCaption = params.get('caption');
  if (wantCaption) st.caption = wantCaption;
  const wantSub = params.get('sub');
  if (wantSub) st.subline = wantSub;
  retargetPanels(st, st.layout);

  const embed = params.get('embed') === '1';
  const demo = params.get('demo') === '1';

  if (embed) {
    document.body.classList.add('embed');
    const px = Number(params.get('px')) || 960;
    // Demo scene: sample photos, varied crops, all panels filled.
    const shots = params.get('photos') ?? 'boulevard,pier';
    const names = shots.split(',').filter(Boolean);
    st.photos = await Promise.all(names.map((n) => loadImage(`samples/${n}.jpg`).catch(() => null)));
    fillAll(st, 0);
    if (st.panels[1] && st.photos[1]) { st.panels[1].photo = 1; st.panels[1].fx = DEMO_CROPS.pier.fx; st.panels[1].fy = DEMO_CROPS.pier.fy; }
    drawPoster(document.getElementById('stage'), st, {});
    const cv = document.getElementById('stage');
    const scale = px / Math.max(st.w, st.h);
    cv.style.width = `${Math.round(st.w * scale)}px`;
    cv.style.height = `${Math.round(st.h * scale)}px`;
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    window.__shotReady = true;
    return;
  }

  if (demo) {
    st.photos = await Promise.all([
      loadImage('samples/boulevard.jpg').catch(() => null),
      loadImage('samples/pier.jpg').catch(() => null),
    ]);
    st.photos = st.photos.filter(Boolean);
    st.photos.forEach((img, i) => document.getElementById('photoList').append(listItem(img, i)));
    // seed each panel with a sample photo at a tuned crop
    st.panels.forEach((p, i) => {
      const idx = i % Math.max(1, st.photos.length);
      p.photo = idx;
      const crop = DEMO_CROPS[idx === 0 ? 'boulevard' : 'pier'];
      p.fx = crop.fx; p.fy = crop.fy; p.z = crop.z * (1 + i * 0.08);
    });
  }

  initUI(st);
}

function listItem(img, i) {
  const li = document.createElement('li');
  const thumb = document.createElement('img');
  thumb.src = img.src;
  li.append(thumb, document.createTextNode(`Photo ${i + 1}`));
  return li;
}

boot();
