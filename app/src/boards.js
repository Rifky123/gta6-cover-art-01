// Board layouts: how the poster divides into photo panels. Rects are unit coords (0..1) of the
// whole canvas; the caption band is drawn over the bottom of the poster, and layouts may reserve
// a little headroom for it via `bias` (how much extra of the last panel the band eats).

export const LAYOUTS = {
  solo: {
    name: 'Solo',
    panels: [{ x: 0, y: 0, w: 1, h: 1, k: 1.0 }],
    bias: 0.26,
  },
  diptych: {
    name: 'Diptych',
    panels: [
      { x: 0, y: 0, w: 1, h: 0.62, k: 1.0 },
      { x: 0, y: 0.63, w: 1, h: 0.37, k: 0.9 },
    ],
    bias: 0.5,
  },
  trilogy: {
    name: 'Stacked III',
    panels: [
      { x: 0, y: 0, w: 1, h: 0.46, k: 1.0 },
      { x: 0, y: 0.47, w: 1, h: 0.30, k: 0.88 },
      { x: 0, y: 0.78, w: 1, h: 0.22, k: 0.78 },
    ],
    bias: 0.95,
  },
  quartet: {
    name: 'Quartet 2×2',
    panels: [
      { x: 0, y: 0, w: 0.5, h: 0.5, k: 1.0 },
      { x: 0.51, y: 0, w: 0.49, h: 0.5, k: 0.94 },
      { x: 0, y: 0.51, w: 0.49, h: 0.49, k: 0.9 },
      { x: 0.51, y: 0.51, w: 0.49, h: 0.49, k: 0.86 },
    ],
    bias: 0.95,
  },
  skyline: {
    name: 'Skyline',
    panels: [
      { x: 0, y: 0, w: 1, h: 0.55, k: 1.0 },
      { x: 0, y: 0.56, w: 0.55, h: 0.44, k: 0.9 },
      { x: 0.56, y: 0.56, w: 0.44, h: 0.44, k: 0.82 },
    ],
    bias: 0.95,
  },
  marquee: {
    name: 'Marquee',
    panels: [
      { x: 0, y: 0, w: 0.58, h: 1, k: 1.0 },
      { x: 0.59, y: 0, w: 0.41, h: 0.56, k: 0.9 },
      { x: 0.59, y: 0.57, w: 0.41, h: 0.43, k: 0.8 },
    ],
    bias: 0.9,
  },
};

export function panelCount(layoutId) {
  return LAYOUTS[layoutId].panels.length;
}

/** Panel rects in pixels for a canvas of w×h. */
export function panelRects(layoutId, w, h) {
  return LAYOUTS[layoutId].panels.map((p) => ({
    x: Math.round(p.x * w),
    y: Math.round(p.y * h),
    w: Math.round(p.w * w),
    h: Math.round(p.h * h),
  }));
}
