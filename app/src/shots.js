// HEATSPLIT demo & embed modes.
// ?demo=1 loads the kit sample photos with tuned crops for a lively editor;
// an optional &preset=<name> picks the starting project and &size=WxH
// overrides the canvas size.
// ?embed=1&shot=<name>&px=<width> renders one preset poster only, scaled to
// px CSS pixels — the screenshot path (chrome hidden via body.embed).

const SAMPLES = [
  { src: 'samples/boulevard.jpg', name: 'boulevard' },
  { src: 'samples/pier.jpg', name: 'pier' },
];

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Preset posters. Reframe values were tuned against the sample photos:
// boulevard (572x717) puts a face near (0.42, 0.17) and the red car near
// (0.35, 0.75); pier (719x716) puts a face near (0.42, 0.28) and the rod
// near (0.75, 0.70). The renderer clamps reframe so panels stay covered.
const SHOTS = {
  // 1920x1080 flagship: feature layout over both samples
  'wide-sunset': {
    size: '1920x1080', layout: 'feature', grade: 'sunset',
    title: 'SUNSET SYNDICATE', sub: 'VICE COAST · CHAPTER ONE',
    bandTop: 'HEATSPLIT ORIGINALS', bandBottom: 'EPISODE 01 · THE VICE COAST RUN',
    finishes: ['grain', 'vignette', 'bloom'],
    slots: [
      { photo: 0, reframe: { x: 0.58, y: 2.10 }, zoom: 1.0 },
      { photo: 1, reframe: { x: 0.58, y: 1.10 }, zoom: 1.0 },
      { photo: 1, reframe: { x: 0.20, y: -0.08 }, zoom: 1.35 },
    ],
    seed: 20,
  },
  // editor demo state: quartet, both photos alternating (1080x1080)
  'editor': {
    size: '1080x1080', layout: 'quartet', grade: 'vice',
    title: 'BOULEVARD QUEEN', sub: 'PALM ROWS · GOLDEN HOUR',
    bandTop: 'HEATSPLIT ORIGINALS', bandBottom: 'EPISODE 02 · PALM ROWS',
    finishes: ['grain', 'vignette'],
    slots: [
      { photo: 0, reframe: { x: 0.58, y: 0.95 }, zoom: 1.2 },
      { photo: 1, reframe: { x: 0.58, y: 0.90 }, zoom: 1.2 },
      { photo: 0, reframe: { x: 0.62, y: 0.10 }, zoom: 1.3 },
      { photo: 1, reframe: { x: 0.30, y: 0.35 }, zoom: 1.25 },
    ],
    seed: 7,
  },
  // portrait 1080x1350: feature + duo over pier/boulevard
  'portrait-vice': {
    size: '1080x1350', layout: 'feature', grade: 'heat',
    title: 'PIER FISHER', sub: 'LAST CAST AT DUSK',
    bandTop: 'HEATSPLIT ORIGINALS', bandBottom: 'EPISODE 03 · LAST CAST',
    finishes: ['grain', 'scanlines', 'vignette'],
    slots: [
      { photo: 1, reframe: { x: 0.58, y: 0.92 }, zoom: 1.1 },
      { photo: 0, reframe: { x: 0.58, y: 1.05 }, zoom: 1.0 },
      { photo: 0, reframe: { x: 0.65, y: 0.10 }, zoom: 1.25 },
    ],
    seed: 11,
  },
  // portrait cover 2: diptych, noir
  'portrait-diptych': {
    size: '1080x1350', layout: 'diptych', grade: 'noir',
    title: 'GOLD RUSH', sub: 'MIDNIGHT ON THE BOULEVARD',
    bandTop: 'HEATSPLIT ORIGINALS', bandBottom: 'EPISODE 04 · AFTER HOURS',
    finishes: ['grain', 'vignette', 'frame'],
    slots: [
      { photo: 0, reframe: { x: 0.58, y: 1.00 }, zoom: 1.15 },
      { photo: 1, reframe: { x: 0.40, y: 0.85 }, zoom: 1.2 },
    ],
    seed: 30,
  },
};

export async function bootFromUrl() {
  const params = new URLSearchParams(location.search);
  const demo = params.get('demo') === '1';
  const shotName = params.get('shot');
  const embed = params.get('embed') === '1' || Boolean(shotName);
  if (!demo && !embed) return null;

  const photos = [];
  for (const s of SAMPLES) {
    try { photos.push(await loadImage(s.src)); } catch { /* skip missing sample */ }
  }

  if (embed) {
    const preset = SHOTS[shotName] ?? SHOTS['wide-sunset'];
    const px = Number(params.get('px')) || 0;
    return { photos, preset, embed: true, px };
  }

  // demo mode: editor chrome visible
  const preset = SHOTS[params.get('preset')] ?? SHOTS.editor;
  const sizeParam = params.get('size');
  const size = sizeParam && /^\d+x\d+$/.test(sizeParam) ? sizeParam : null;
  return { photos, preset, embed: false, size };
}

export { SHOTS };
