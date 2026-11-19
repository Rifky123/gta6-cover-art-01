// Panel geometry for the poster layouts. Every layout adapts to the canvas
// aspect: landscape posters split wide, portrait ones stack.

export const LAYOUTS = ['quartet', 'trilogy', 'diptych', 'solo'];

/**
 * Compute the panel rectangles for a poster.
 * @param {number} w poster width in px
 * @param {number} h poster height in px
 * @param {string} layout one of LAYOUTS
 * @returns {{rects: Array<{x:number,y:number,w:number,h:number}>, margin:number, gap:number}}
 */
export function buildPanels(w, h, layout) {
  const margin = Math.round(Math.min(w, h) * 0.045);
  const gap = Math.round(Math.min(w, h) * 0.022);
  const innerX = margin;
  const innerY = margin;
  const innerW = w - margin * 2;
  const innerH = h - margin * 2;
  const wide = w / h >= 1.2;

  const rects = [];
  if (layout === 'solo') {
    rects.push({ x: innerX, y: innerY, w: innerW, h: innerH });
  } else if (layout === 'diptych') {
    if (wide) {
      const each = Math.floor((innerW - gap) / 2);
      rects.push({ x: innerX, y: innerY, w: each, h: innerH });
      rects.push({ x: innerX + each + gap, y: innerY, w: innerW - each - gap, h: innerH });
    } else {
      const each = Math.floor((innerH - gap) * 0.58);
      rects.push({ x: innerX, y: innerY, w: innerW, h: each });
      rects.push({ x: innerX, y: innerY + each + gap, w: innerW, h: innerH - each - gap });
    }
  } else if (layout === 'trilogy') {
    if (wide) {
      const left = Math.floor((innerW - gap) * 0.54);
      const rightW = innerW - left - gap;
      const rightH = Math.floor((innerH - gap) / 2);
      rects.push({ x: innerX, y: innerY, w: left, h: innerH });
      rects.push({ x: innerX + left + gap, y: innerY, w: rightW, h: rightH });
      rects.push({ x: innerX + left + gap, y: innerY + rightH + gap, w: rightW, h: innerH - rightH - gap });
    } else {
      const top = Math.floor((innerH - gap) * 0.46);
      const restH = innerH - top - gap;
      const halfW = Math.floor((innerW - gap) / 2);
      rects.push({ x: innerX, y: innerY, w: innerW, h: top });
      rects.push({ x: innerX, y: innerY + top + gap, w: halfW, h: restH });
      rects.push({ x: innerX + halfW + gap, y: innerY + top + gap, w: innerW - halfW - gap, h: restH });
    }
  } else {
    // quartet: a 2 x 2 grid on every aspect
    const cellW = Math.floor((innerW - gap) / 2);
    const cellH = Math.floor((innerH - gap) / 2);
    const remX = innerW - cellW * 2 - gap;
    const remY = innerH - cellH * 2 - gap;
    rects.push({ x: innerX, y: innerY, w: cellW + remX, h: cellH + remY });
    rects.push({ x: innerX + cellW + gap + remX, y: innerY, w: cellW, h: cellH + remY });
    rects.push({ x: innerX, y: innerY + cellH + gap + remY, w: cellW + remX, h: cellH });
    rects.push({ x: innerX + cellW + gap + remX, y: innerY + cellH + gap + remY, w: cellW, h: cellH });
  }
  return { rects, margin, gap };
}
