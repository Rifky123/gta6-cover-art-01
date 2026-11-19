// layouts.js — panel slots for each poster cut, in normalized fractions
// (0..1 of the full canvas). The painter turns these into pixels and
// carves the divider gutters out of them.

export const LAYOUTS = {
  solo:  { label: "solo",  slots: [rect(0, 0, 1, 1)] },
  duo:   { label: "duo",   slots: [rect(0, 0, .5, 1), rect(.5, 0, .5, 1)] },
  trio:  { label: "trio",  slots: [rect(0, 0, 1 / 3, 1), rect(1 / 3, 0, 1 / 3, 1), rect(2 / 3, 0, 1 / 3, 1)] },
  stack: { label: "stack", slots: [rect(0, 0, 1, 1 / 3), rect(0, 1 / 3, 1, 1 / 3), rect(0, 2 / 3, 1, 1 / 3)] },
  grid:  { label: "grid",  slots: [rect(0, 0, .5, .5), rect(.5, 0, .5, .5), rect(0, .5, .5, .5), rect(.5, .5, .5, .5)] },
  hero:  { label: "hero",  slots: [rect(0, 0, 1, .62), rect(0, .62, 1 / 3, .38), rect(1 / 3, .62, 1 / 3, .38), rect(2 / 3, .62, 1 / 3, .38)] },
};

function rect(x, y, w, h) { return { x, y, w, h }; }

// Slots actually used by the active layout (panels[] always holds 6 crops;
// layouts with fewer slots simply ignore the rest).
export function slotsFor(layout) {
  const def = LAYOUTS[layout] ?? LAYOUTS.grid;
  return def.slots;
}

// Divider gutters: fraction of the shorter canvas side, carved between
// neighbouring slots. solo has no internal edges.
export function gutterFor(layout, canvasW, canvasH) {
  if (layout === "solo") return 0;
  return Math.round(Math.min(canvasW, canvasH) * 0.012);
}

// Turn one normalized slot into a pixel rect inset by the gutter on the
// sides that touch another slot (outer edges stay flush with the canvas).
export function pixelRect(slot, layout, W, H, gutter) {
  let { x, y, w, h } = slot;
  let px = Math.round(x * W);
  let py = Math.round(y * H);
  let pw = Math.round(w * W);
  let ph = Math.round(h * H);
  const half = Math.floor(gutter / 2);

  if (layout !== "solo") {
    if (x > 0) { px += half; pw -= half; }
    if (x + w < 0.999) pw -= half;
    if (y > 0) { py += half; ph -= half; }
    if (y + h < 0.999) ph -= half;
  }
  return { x: px, y: py, w: pw, h: ph };
}

// Which slot (if any) holds a canvas point — used for click/drag/wheel.
export function slotAt(px, py, layout, W, H, gutter) {
  const slots = slotsFor(layout);
  for (let i = 0; i < slots.length; i++) {
    const r = pixelRect(slots[i], layout, W, H, gutter);
    if (px >= r.x && px < r.x + r.w && py >= r.y && py < r.y + r.h) return i;
  }
  return -1;
}
