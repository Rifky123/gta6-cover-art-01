// Caption lettering: the big gradient headline, its outline and shadow, the sub-line, and the
// small top bar. Auto-fits the caption to the poster width at a size that stays bold.

const FONT = (px) => `400 ${px}px Anton, Impact, sans-serif`;

/** Largest font size, in poster px, at which text fits within maxW. */
function fitText(ctx, text, weight, maxW, maxSize, minSize) {
  let size = maxSize;
  for (; size > minSize; size -= 2) {
    ctx.font = FONT(size);
    if (ctx.measureText(text).width <= maxW) break;
  }
  return size;
}

export function drawCaption(ctx, W, H, g, st) {
  const text = (st.caption || '').toUpperCase().trim();
  const sub = (st.subline || '').trim();
  if (!text && !sub) return;

  const pad = Math.round(W * 0.035);
  const bandTop = H - Math.round(H * 0.17);

  // band plate
  const plate = ctx.createLinearGradient(0, bandTop - H * 0.06, 0, H);
  plate.addColorStop(0, 'rgba(0,0,0,0)');
  plate.addColorStop(0.35, 'rgba(0,0,0,0.55)');
  plate.addColorStop(1, 'rgba(0,0,0,0.82)');
  ctx.fillStyle = plate;
  ctx.fillRect(0, bandTop - H * 0.06, W, H * 0.06 + Math.round(H * 0.17));
  ctx.fillStyle = g.accent;
  ctx.fillRect(0, bandTop - Math.round(H * 0.004), W, Math.max(3, Math.round(H * 0.006)));

  const centerY = bandTop + Math.round((H - bandTop) * 0.46);

  // headline
  if (text) {
    const size = fitText(ctx, text, 1, W - pad * 2, Math.round(H * 0.115), 12);
    ctx.font = FONT(size);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const skew = st.caps.italic ? -0.14 : 0;
    ctx.save();
    ctx.translate(W / 2, centerY);
    ctx.transform(1, 0, skew, 1, 0, 0);

    // drop shadow
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillText(text, size * 0.045, size * 0.05);
    // outline
    ctx.lineWidth = Math.max(3, size * 0.085);
    ctx.strokeStyle = 'rgba(0,0,0,0.92)';
    ctx.lineJoin = 'round';
    ctx.strokeText(text, 0, 0);
    // gradient face
    const grad = ctx.createLinearGradient(0, -size * 0.6, 0, size * 0.6);
    grad.addColorStop(0, g.caption[0]);
    grad.addColorStop(1, g.caption[1]);
    ctx.fillStyle = grad;
    ctx.fillText(text, 0, 0);
    // gloss
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-W, -size * 0.55, W * 2, size * 0.5);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();
  }

  // sub-line
  if (sub) {
    const subSize = Math.round(H * 0.026) + 4;
    ctx.font = `600 ${subSize}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const spaced = sub.toUpperCase().split('').join('\u2009');
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillText(spaced, W / 2 + 2, centerY + Math.round(H * 0.062) + 2);
    ctx.fillStyle = '#f4ecff';
    ctx.fillText(spaced, W / 2, centerY + Math.round(H * 0.062));
  }

  // bottom accent strip
  ctx.fillStyle = g.caption[1];
  ctx.globalAlpha = 0.9;
  ctx.fillRect(0, H - Math.max(4, Math.round(H * 0.008)), W, Math.max(4, Math.round(H * 0.008)));
  ctx.globalAlpha = 1;
}

export function drawTopBar(ctx, W, H, g, st) {
  const barH = Math.round(H * 0.055);
  const grad = ctx.createLinearGradient(0, 0, 0, barH);
  grad.addColorStop(0, 'rgba(0,0,0,0.72)');
  grad.addColorStop(1, 'rgba(0,0,0,0.25)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, barH);

  const size = Math.round(barH * 0.52);
  ctx.font = FONT(size);
  ctx.textBaseline = 'middle';

  // left plate: series mark
  ctx.textAlign = 'left';
  ctx.fillStyle = g.accent;
  ctx.fillRect(Math.round(W * 0.03), Math.round(barH * 0.26), Math.round(barH * 0.48), Math.round(barH * 0.48));
  ctx.fillStyle = '#0a0a12';
  ctx.fillText('PF', Math.round(W * 0.03) + Math.round(barH * 0.1), barH / 2 + Math.round(barH * 0.03));

  // right plate: edition line
  ctx.textAlign = 'right';
  const label = 'PALMFORGE · COAST EDITION';
  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.fillText(label, W - Math.round(W * 0.03), barH / 2);

  // underline
  ctx.fillStyle = g.accent;
  ctx.globalAlpha = 0.7;
  ctx.fillRect(0, barH - 2, W, 2);
  ctx.globalAlpha = 1;
}
