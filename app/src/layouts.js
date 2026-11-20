// HEATSPLIT panel layouts. Each layout gives panel rects in normalized
// poster coordinates (x, y, w, h with 0..1 on both axes), so the same
// geometry works at square, portrait and wide export sizes. The `stack`
// flag marks layouts whose caption plate sits inside the lowest panel.

export const LAYOUTS = [
  {
    id: 'quartet',
    name: 'Quartet 2x2',
    panels: [
      { x: 0.012, y: 0.012, w: 0.488, h: 0.538 },
      { x: 0.500, y: 0.012, w: 0.488, h: 0.538 },
      { x: 0.012, y: 0.550, w: 0.488, h: 0.288 },
      { x: 0.500, y: 0.550, w: 0.488, h: 0.288 },
    ],
    caption: { y: 0.855, size: 0.145 },
  },
  {
    id: 'trilogy',
    name: 'Stacked trilogy',
    panels: [
      { x: 0.012, y: 0.012, w: 0.976, h: 0.30 },
      { x: 0.012, y: 0.324, w: 0.976, h: 0.24 },
      { x: 0.012, y: 0.576, w: 0.976, h: 0.20 },
    ],
    caption: { y: 0.845, size: 0.130 },
  },
  {
    id: 'diptych',
    name: 'Diptych split',
    panels: [
      { x: 0.012, y: 0.012, w: 0.488, h: 0.700 },
      { x: 0.500, y: 0.012, w: 0.488, h: 0.700 },
    ],
    caption: { y: 0.845, size: 0.140 },
  },
  {
    id: 'hero',
    name: 'Hero solo',
    panels: [
      { x: 0.012, y: 0.012, w: 0.976, h: 0.700 },
    ],
    caption: { y: 0.850, size: 0.150 },
  },
  {
    id: 'feature',
    name: 'Feature + duo',
    panels: [
      { x: 0.012, y: 0.012, w: 0.976, h: 0.430 },
      { x: 0.012, y: 0.442, w: 0.482, h: 0.300 },
      { x: 0.506, y: 0.442, w: 0.482, h: 0.300 },
    ],
    caption: { y: 0.848, size: 0.135 },
  },
  {
    id: 'strip',
    name: 'Frame strip',
    panels: [
      { x: 0.060, y: 0.040, w: 0.420, h: 0.300 },
      { x: 0.520, y: 0.090, w: 0.420, h: 0.300 },
      { x: 0.060, y: 0.420, w: 0.420, h: 0.300 },
      { x: 0.520, y: 0.470, w: 0.420, h: 0.300 },
    ],
    caption: { y: 0.850, size: 0.140 },
    staggered: true,
  },
];

export function layoutById(id) {
  return LAYOUTS.find((l) => l.id === id) ?? LAYOUTS[0];
}
