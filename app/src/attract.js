// Boulevard Press — the attract side: the demo project that fills the poster
// with the kit's sample photos (made with an image model, free to use), the
// one-tap vibes that set grade and finish together, and the query-string
// modes the screenshots use (?demo=1&size=… and ?embed=1&shot=…).

import { loadImage, fitPanels, blankPanel, clamp } from './core.js';

const SAMPLES = {
  b: 'samples/boulevard.jpg',
  p: 'samples/pier.jpg',
};

// Tuned crop tables per layout: which sample each slot shows and how it is
// zoomed and panned, so the demo project composes like a made cover.
const DEMO_CROPS = {
  quartet: [
    { src: 'b', z: 1.3, ox: -0.35, oy: 0.58 },
    { src: 'p', z: 1.3, ox: 0.42, oy: 0.6 },
    { src: 'p', z: 1.62, ox: -0.3, oy: 0.72 },
    { src: 'b', z: 1.38, ox: 0.3, oy: 0.5 },
  ],
  stripes: [
    { src: 'b', z: 1.34, ox: -0.5, oy: 0.66 },
    { src: 'p', z: 1.22, ox: 0.0, oy: 0.7 },
    { src: 'b', z: 1.4, ox: 0.52, oy: 0.62 },
  ],
  diptych: [
    { src: 'b', z: 1.2, ox: 0.08, oy: 0.42 },
    { src: 'p', z: 1.26, ox: -0.1, oy: 0.5 },
  ],
  feature: [
    { src: 'b', z: 1.16, ox: 0.06, oy: 0.34 },
    { src: 'p', z: 1.32, ox: 0.35, oy: 0.5 },
    { src: 'b', z: 1.55, ox: -0.4, oy: 0.6 },
    { src: 'p', z: 1.45, ox: 0.1, oy: 0.62 },
  ],
  solo: [{ src: 'b', z: 1.1, ox: 0, oy: 0.36 }],
};

const DEMO_PROJECTS = {
  wide: { layout: 'quartet', grade: 'sundown', caption: 'BOULEVARD', subline: 'SIX STORIES \u00b7 ONE CITY \u00b7 NO BRAKES' },
  square: { layout: 'feature', grade: 'heat', caption: 'REDLINE', subline: 'EVERY EXIT IS AN ENTRANCE \u00b7 DRIVE ANGRY' },
  portrait: { layout: 'stripes', grade: 'neon', caption: 'PALM CITY', subline: 'NEON TURNS ON \u00b7 WHEN THE SUN DROPS OUT' },
};

export async function loadSamples() {
  const [boulevard, pier] = await Promise.all([loadImage(SAMPLES.b), loadImage(SAMPLES.p)]);
  return { b: boulevard, p: pier };
}

export async function loadDemoProject(state, sizeId) {
  const photos = await loadSamples();
  const project = DEMO_PROJECTS[sizeId] ?? DEMO_PROJECTS.wide;
  state.layout = project.layout;
  state.grade = project.grade;
  state.caption = project.caption;
  state.subline = project.subline;
  state.panels = buildDemoPanels(project.layout, photos);
  return state;
}

export function buildDemoPanels(layoutId, photos) {
  const table = DEMO_CROPS[layoutId] ?? DEMO_CROPS.quartet;
  const panels = table.map((crop) => ({
    img: photos[crop.src] ?? null,
    name: crop.src === 'b' ? 'boulevard.jpg' : 'pier.jpg',
    zoom: crop.z,
    ox: crop.ox,
    oy: crop.oy,
  }));
  return fitPanels(panels, panels.length);
}

export const VIBES = [
  {
    id: 'sundowner',
    label: 'Sundowner',
    apply(state) {
      state.grade = 'sundown';
      state.finishes = { grain: 0.38, scan: 0.12, dots: 0, vig: 0.5, frame: true };
    },
  },
  {
    id: 'nightdrive',
    label: 'Night Drive',
    apply(state) {
      state.grade = 'neon';
      state.finishes = { grain: 0.3, scan: 0.2, dots: 0, vig: 0.55, frame: true };
    },
  },
  {
    id: 'redline',
    label: 'Redline',
    apply(state) {
      state.grade = 'heat';
      state.finishes = { grain: 0.45, scan: 0.08, dots: 0, vig: 0.5, frame: true };
    },
  },
  {
    id: 'ghosttown',
    label: 'Ghost Town',
    apply(state) {
      state.grade = 'noir';
      state.finishes = { grain: 0.5, scan: 0.1, dots: 0, vig: 0.62, frame: true };
    },
  },
  {
    id: 'dayglopunk',
    label: 'Dayglo Punk',
    apply(state) {
      state.grade = 'dayglo';
      state.finishes = { grain: 0.26, scan: 0.06, dots: 0.28, vig: 0.36, frame: true };
    },
  },
];

export function bootParams() {
  const q = new URLSearchParams(location.search);
  const shot = q.get('shot');
  const size = q.get('size');
  return {
    demo: q.get('demo') === '1',
    embed: q.get('embed') === '1',
    shot,
    px: clamp(Number(q.get('px')) || 0, 0, 4000),
    sizeId: ['wide', 'square', 'portrait'].includes(size) ? size : null,
  };
}

export const SHOT_SIZES = { wide: 'wide', portrait: 'portrait', square: 'square' };
