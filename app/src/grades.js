// grades.js — colour grades. Each grade is data: a photo filter, a stack of
// gradient overlays painted over the art, and a palette (bright / accent /
// deep) the lettering and bands borrow so text always matches the mood.

export const GRADES = {
  sunset: {
    label: "Sunset",
    swatch: "linear-gradient(120deg,#ff9a3c,#ff4f7b,#5b2a86)",
    palette: { bright: "#ffd36e", accent: "#ff4f7b", deep: "#1c0b2e" },
    photo: "saturate(1.35) contrast(1.06)",
    overlays: [
      { comp: "soft-light", alpha: 0.9,  stops: [[0, "#ff8a3c"], [0.55, "#ff5f6d"], [1, "#7a3b9e"]] },
      { comp: "multiply",   alpha: 0.18, stops: [[0, "#2e4a5f"], [1, "#3a1030"]] },
      { comp: "screen",     alpha: 0.22, stops: [[0, "#ffcf8a"], [0.5, "#00000000"], [1, "#ff6f91"]] },
    ],
  },
  neon: {
    label: "Neon",
    swatch: "linear-gradient(120deg,#14e0ff,#ff2bd6,#12073a)",
    palette: { bright: "#79f2ff", accent: "#ff2bd6", deep: "#0a0618" },
    photo: "saturate(1.5) contrast(1.1)",
    overlays: [
      { comp: "soft-light", alpha: 0.95, stops: [[0, "#12c8ff"], [0.5, "#b465ff"], [1, "#ff2bd6"]] },
      { comp: "multiply",   alpha: 0.24, stops: [[0, "#062033"], [1, "#2a0630"]] },
      { comp: "screen",     alpha: 0.16, stops: [[0, "#1e9dff"], [1, "#ff4fe0"]] },
    ],
  },
  heat: {
    label: "Heat",
    swatch: "linear-gradient(120deg,#ffd34d,#ff6a2b,#7a1410)",
    palette: { bright: "#ffc247", accent: "#ff5a2e", deep: "#200604" },
    photo: "saturate(1.3) contrast(1.14)",
    overlays: [
      { comp: "soft-light", alpha: 0.95, stops: [[0, "#ffb347"], [1, "#e03318"]] },
      { comp: "multiply",   alpha: 0.2,  stops: [[0, "#5e1a06"], [1, "#200604"]] },
      { comp: "screen",     alpha: 0.18, stops: [[0, "#ffe08c"], [1, "#ff8248"]] },
    ],
  },
  noir: {
    label: "Noir",
    swatch: "linear-gradient(120deg,#f2f2f2,#8a8a8a,#111)",
    palette: { bright: "#f0f0f0", accent: "#9aa3ad", deep: "#0a0a0c" },
    photo: "grayscale(1) contrast(1.22) brightness(0.98)",
    overlays: [
      { comp: "soft-light", alpha: 0.55, stops: [[0, "#dcdcdc"], [1, "#3a3a44"]] },
      { comp: "multiply",   alpha: 0.16, stops: [[0, "#3a3a42"], [1, "#0c0c10"]] },
    ],
  },
  aqua: {
    label: "Aqua",
    swatch: "linear-gradient(120deg,#2fd7b5,#2f7bff,#04182b)",
    palette: { bright: "#8af2d8", accent: "#3f8bff", deep: "#041420" },
    photo: "saturate(1.25) contrast(1.08)",
    overlays: [
      { comp: "soft-light", alpha: 0.9,  stops: [[0, "#3fe8c0"], [1, "#2f6bff"]] },
      { comp: "multiply",   alpha: 0.22, stops: [[0, "#0a3540"], [1, "#061628"]] },
      { comp: "screen",     alpha: 0.14, stops: [[0, "#4de0c2"], [1, "#3f7bff"]] },
    ],
  },
  gold: {
    label: "Gold",
    swatch: "linear-gradient(120deg,#ffe08a,#c98a2e,#26160a)",
    palette: { bright: "#ffe08a", accent: "#d19a3f", deep: "#170d04" },
    photo: "sepia(.35) saturate(1.2) contrast(1.1)",
    overlays: [
      { comp: "soft-light", alpha: 0.9,  stops: [[0, "#ffdf9a"], [1, "#a4661d"]] },
      { comp: "multiply",   alpha: 0.18, stops: [[0, "#5e3a10"], [1, "#1c1006"]] },
    ],
  },
};

// Paint the grade's overlay stack over a rect (already inside a clip).
export function paintOverlays(ctx, grade, x, y, w, h) {
  for (const ov of grade.overlays) {
    const g = ctx.createLinearGradient(x, y, x, y + h);
    for (const [pos, color] of ov.stops) g.addColorStop(pos, color);
    ctx.save();
    ctx.globalCompositeOperation = ov.comp;
    ctx.globalAlpha = ov.alpha;
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  }
}
