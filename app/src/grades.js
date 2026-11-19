// Colour grades: canvas overlays painted over each panel's photo to get the
// Vice City sunset / neon look. Each grade lists its swatch for the UI chips.

export const GRADES = {
  sunset: {
    label: 'Vice Sunset',
    swatch: 'linear-gradient(135deg,#ff9a3d,#ff2e88)',
    paint(ctx, r) {
      ctx.save();
      ctx.globalCompositeOperation = 'overlay';
      let g = ctx.createLinearGradient(0, r.y, 0, r.y + r.h);
      g.addColorStop(0, 'rgba(255,154,61,0.62)');
      g.addColorStop(0.55, 'rgba(255,90,120,0.34)');
      g.addColorStop(1, 'rgba(210,40,150,0.58)');
      ctx.fillStyle = g;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.globalCompositeOperation = 'multiply';
      g = ctx.createLinearGradient(0, r.y + r.h * 0.45, 0, r.y + r.h);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(1, 'rgba(214,36,110,0.34)');
      ctx.fillStyle = g;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.restore();
    },
  },
  neon: {
    label: 'Neon Night',
    swatch: 'linear-gradient(135deg,#29d8ff,#b03bff)',
    paint(ctx, r) {
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = 'rgba(56,32,96,0.34)';
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.globalCompositeOperation = 'screen';
      let g = ctx.createRadialGradient(r.x + r.w * 0.18, r.y + r.h * 0.95, 0, r.x + r.w * 0.18, r.y + r.h * 0.95, r.w * 1.05);
      g.addColorStop(0, 'rgba(255,64,150,0.5)');
      g.addColorStop(1, 'rgba(255,64,150,0)');
      ctx.fillStyle = g;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      g = ctx.createRadialGradient(r.x + r.w * 0.85, r.y + r.h * 0.15, 0, r.x + r.w * 0.85, r.y + r.h * 0.15, r.w);
      g.addColorStop(0, 'rgba(64,210,255,0.45)');
      g.addColorStop(1, 'rgba(64,210,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.globalCompositeOperation = 'overlay';
      ctx.fillStyle = 'rgba(120,60,200,0.18)';
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.restore();
    },
  },
  gold: {
    label: 'Heat Haze',
    swatch: 'linear-gradient(135deg,#ffd08a,#e2542e)',
    paint(ctx, r) {
      ctx.save();
      ctx.globalCompositeOperation = 'overlay';
      let g = ctx.createLinearGradient(0, r.y, 0, r.y + r.h);
      g.addColorStop(0, 'rgba(255,208,138,0.55)');
      g.addColorStop(1, 'rgba(226,84,46,0.42)');
      ctx.fillStyle = g;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.globalCompositeOperation = 'soft-light';
      g = ctx.createLinearGradient(0, r.y, 0, r.y + r.h);
      g.addColorStop(0, 'rgba(255,240,200,0.5)');
      g.addColorStop(1, 'rgba(120,20,60,0.4)');
      ctx.fillStyle = g;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.restore();
    },
  },
  noir: {
    label: 'Noir Teal',
    swatch: 'linear-gradient(135deg,#20303a,#ffd9a0)',
    filter: 'grayscale(1) contrast(1.06)',
    paint(ctx, r) {
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = 'rgba(32,48,58,0.30)';
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = 'rgba(255,217,160,0.12)';
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.restore();
    },
  },
  fresh: {
    label: 'Daylight',
    swatch: 'linear-gradient(135deg,#bff2ff,#ff9a8a)',
    paint(ctx, r) {
      ctx.save();
      ctx.globalCompositeOperation = 'overlay';
      ctx.fillStyle = 'rgba(120,220,255,0.16)';
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.restore();
    },
  },
};

export const GRADE_CYCLE = ['sunset', 'neon', 'gold', 'noir'];

/**
 * Draw a photo cover-cropped into the panel rect, then apply the grade.
 * cx / cy pick the focal point of the crop, zoom scales it around it.
 */
export function drawGradedPhoto(ctx, img, r, spec, gradeName) {
  const grade = GRADES[gradeName] ?? GRADES.sunset;
  const fit = Math.max(r.w / img.width, r.h / img.height);
  const scale = fit * (spec.zoom || 1);
  const dw = img.width * scale;
  const dh = img.height * scale;
  const cx = clampFocal(spec.cx, r.w, dw);
  const cy = clampFocal(spec.cy, r.h, dh);
  const dx = r.x + r.w / 2 - cx * dw;
  const dy = r.y + r.h / 2 - cy * dh;
  ctx.save();
  ctx.beginPath();
  ctx.rect(r.x, r.y, r.w, r.h);
  ctx.clip();
  if (spec.flip) {
    ctx.translate(r.x * 2 + r.w, 0);
    ctx.scale(-1, 1);
  }
  if (grade.filter) ctx.filter = grade.filter;
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.filter = 'none';
  ctx.restore();
  grade.paint(ctx, r);
}

function clampFocal(f, view, drawn) {
  const v = Number.isFinite(f) ? f : 0.5;
  if (drawn <= view) return 0.5;
  const half = view / 2 / drawn;
  return Math.min(1 - half, Math.max(half, v));
}
