// lettering.js — the caption: big gradient title with an outline, a small
// letterspaced sub-line, an optional solid band, and a soft scrim that keeps
// the type readable over bright art (scrim always, band only when asked).

const TITLE_FONT = '"Anton"';
const TRACK = 0.045; // letter-spacing, in em

function setTitleStyle(ctx, sizePx) {
  ctx.font = `${sizePx}px ${TITLE_FONT}`;
  ctx.letterSpacing = `${Math.round(sizePx * TRACK)}px`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
}

// Fit the title inside the safe width; returns {size, textWidth, lines}.
function fitTitle(ctx, text, maxW, startPx, maxPx) {
  let size = Math.min(startPx, maxPx);
  setTitleStyle(ctx, size);
  let width = ctx.measureText(text).width;
  if (width > maxW) {
    size = Math.max(18, size * (maxW / width));
    setTitleStyle(ctx, size);
    width = ctx.measureText(text).width;
  }
  return { size, width };
}

export function drawCaption(ctx, W, H, grade, cap, frameInset) {
  const text = (cap.title || "").trim().toUpperCase();
  const sub = (cap.sub || "").trim().toUpperCase();
  const scale = cap.scale / 100;
  const safe = Math.min(W, H) * 0.03 + frameInset;
  const maxW = W - safe * 2;

  const start = H * 0.26 * scale;
  const { size: fs, width: tw } = fitTitle(ctx, text || " ", maxW, start, H * 0.36);
  const subFs = Math.max(10, Math.min(fs * 0.145, H * 0.045));
  const subGap = fs * 0.22;
  const blockH = (text ? fs : 0) + (sub ? subGap + subFs : 0);
  if (blockH <= 0) return;

  const edge = frameInset + safe * 0.2;
  const baseY = cap.pos === "top" ? edge + blockH + H * 0.028 : H - edge - H * 0.028;

  // Scrim: a soft gradient behind the whole type block.
  const scrim = ctx.createLinearGradient(0, 0, 0, H);
  if (cap.pos === "bottom") {
    scrim.addColorStop(0.55, "rgba(0,0,0,0)");
    scrim.addColorStop(1, hexA(grade.palette.deep, 0.82));
  } else {
    scrim.addColorStop(0, hexA(grade.palette.deep, 0.82));
    scrim.addColorStop(0.45, "rgba(0,0,0,0)");
  }
  ctx.fillStyle = scrim;
  ctx.fillRect(0, 0, W, H);

  // Solid band behind the type block.
  if (cap.band) {
    const bandTop = cap.pos === "top" ? baseY - blockH - subGap : baseY - blockH;
    ctx.save();
    ctx.fillStyle = hexA(grade.palette.deep, 0.72);
    ctx.fillRect(0, cap.pos === "top" ? bandTop - subGap : bandTop, W, blockH + subGap * 2);
    ctx.restore();
  }

  // Sub-line first (it anchors the block edge).
  if (sub) {
    const subCenterX = W / 2;
    ctx.save();
    ctx.font = `${subFs}px ${TITLE_FONT}`;
    ctx.letterSpacing = `${Math.round(subFs * 0.34)}px`;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = grade.palette.bright;
    ctx.shadowColor = hexA(grade.palette.deep, 0.9);
    ctx.shadowBlur = subFs * 0.5;
    ctx.fillText(sub, subCenterX, cap.pos === "top" ? baseY : baseY + subFs);
    ctx.restore();

    // Rules either side of the sub-line, when asked.
    if (cap.underline) {
      const sw = ctx.measureText(sub).width;
      const ruleLen = (maxW - sw) / 2 - subFs * 0.9;
      if (ruleLen > 12) {
        const ry = (cap.pos === "top" ? baseY : baseY + subFs) - subFs * 0.34;
        ctx.save();
        ctx.fillStyle = hexA(grade.palette.accent, 0.85);
        ctx.fillRect(W / 2 - sw / 2 - subFs * 0.5 - ruleLen, ry, ruleLen, Math.max(2, subFs * 0.09));
        ctx.fillRect(W / 2 + sw / 2 + subFs * 0.5, ry, ruleLen, Math.max(2, subFs * 0.09));
        ctx.restore();
      }
    }
  }

  if (!text) return;

  // Title: outline + drop shadow, then the gradient fill.
  const ty = cap.pos === "top"
    ? baseY - (sub ? subFs + subGap : 0)
    : baseY - (sub ? subFs + subGap : 0);

  const grad = ctx.createLinearGradient(0, ty - fs * 0.92, 0, ty + fs * 0.06);
  grad.addColorStop(0, "#ffffff");
  grad.addColorStop(0.18, grade.palette.bright);
  grad.addColorStop(0.62, grade.palette.accent);
  grad.addColorStop(1, shade(grade.palette.accent, 0.55));

  setTitleStyle(ctx, fs);
  ctx.save();
  ctx.shadowColor = hexA(grade.palette.deep, 0.95);
  ctx.shadowBlur = fs * 0.14;
  ctx.shadowOffsetY = fs * 0.045;
  ctx.lineWidth = Math.max(2, fs * 0.035);
  ctx.lineJoin = "round";
  ctx.strokeStyle = hexA(grade.palette.deep, 0.9);
  ctx.strokeText(text, W / 2, ty);
  ctx.restore();

  ctx.fillStyle = grad;
  ctx.fillText(text, W / 2, ty);
}

// ── colour helpers ─────────────────────────────────────────────────

function hexA(hex, alpha) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.round(v * k);
  return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`;
}
