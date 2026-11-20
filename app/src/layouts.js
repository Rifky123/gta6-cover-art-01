// SUNGRID panel layouts. Each layout is a named list of rectangles in unit
// space (x, y, w, h in 0..1) that maps onto the poster canvas.

export const LAYOUTS = [
  {
    id: 'quartet',
    name: 'Quartet 2×2',
    mini: [2, 2],
    panels: [
      { x: 0, y: 0, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0, w: 0.5, h: 0.5 },
      { x: 0, y: 0.5, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
    ],
  },
  {
    id: 'trilogy',
    name: 'Stacked Trilogy',
    mini: [1, 3],
    panels: [
      { x: 0, y: 0, w: 1, h: 0.34 },
      { x: 0, y: 0.34, w: 1, h: 0.33 },
      { x: 0, y: 0.67, w: 1, h: 0.33 },
    ],
  },
  {
    id: 'diptych',
    name: 'Diptych',
    mini: [2, 1],
    panels: [
      { x: 0, y: 0, w: 0.5, h: 1 },
      { x: 0.5, y: 0, w: 0.5, h: 1 },
    ],
  },
  {
    id: 'tower',
    name: 'Tower Column',
    mini: [1, 2],
    panels: [
      { x: 0, y: 0, w: 1, h: 0.5 },
      { x: 0, y: 0.5, w: 1, h: 0.5 },
    ],
  },
  {
    id: 'hero-strip',
    name: 'Hero + Strip',
    mini: [1, 2],
    panels: [
      { x: 0, y: 0, w: 1, h: 0.62 },
      { x: 0, y: 0.62, w: 0.34, h: 0.38 },
      { x: 0.34, y: 0.62, w: 0.33, h: 0.38 },
      { x: 0.67, y: 0.62, w: 0.33, h: 0.38 },
    ],
  },
  {
    id: 'solo',
    name: 'Solo Banner',
    mini: [1, 1],
    panels: [{ x: 0, y: 0, w: 1, h: 1 }],
  },
];

// Panels get a small frame gap so the poster reads as separate plates.
export const PANEL_GAP = 10;

export function layoutById(id) {
  return LAYOUTS.find((l) => l.id === id) || LAYOUTS[0];
}

// Map a unit rect to canvas pixels, inset by the gap on each axis.
export function panelRect(unit, W, H, gap) {
  const g = gap == null ? PANEL_GAP : gap;
  const x = Math.round(unit.x * (W - g * 2)) + g;
  const y = Math.round(unit.y * (H - g * 2)) + g;
  return {
    x,
    y,
    w: Math.max(1, Math.round(unit.w * (W - g * 2))),
    h: Math.max(1, Math.round(unit.h * (H - g * 2))),
  };
}
