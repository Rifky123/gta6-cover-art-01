// Boulevard Press — panel geometry. Each layout turns the poster's content
// area into a set of rectangles, adapting to the poster's aspect: wide,
// square and portrait projects each get a composition that suits them.

export function bandsFor(H) {
  return { top: Math.round(H * 0.075), bottom: Math.round(H * 0.065) };
}

function cells(total, count, gap) {
  return (total - gap * (count - 1)) / count;
}

function grid(x0, y0, w, h, cols, rows, g) {
  const cw = cells(w, cols, g);
  const ch = cells(h, rows, g);
  const rects = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      rects.push({
        x: Math.round(x0 + c * (cw + g)),
        y: Math.round(y0 + r * (ch + g)),
        w: Math.round(cw),
        h: Math.round(ch),
      });
    }
  }
  return rects;
}

function strips(x0, y0, w, h, n, g, vertical) {
  const rects = [];
  if (vertical) {
    const cw = cells(w, n, g);
    for (let i = 0; i < n; i++) {
      rects.push({ x: Math.round(x0 + i * (cw + g)), y: Math.round(y0), w: Math.round(cw), h: Math.round(h) });
    }
  } else {
    const ch = cells(h, n, g);
    for (let i = 0; i < n; i++) {
      rects.push({ x: Math.round(x0), y: Math.round(y0 + i * (ch + g)), w: Math.round(w), h: Math.round(ch) });
    }
  }
  return rects;
}

export const LAYOUTS = [
  {
    id: 'quartet',
    label: 'Quartet',
    slots(area) {
      return grid(area.x, area.y, area.w, area.h, 2, 2, area.g);
    },
  },
  {
    id: 'stripes',
    label: 'Triple Strip',
    slots(area) {
      // Three tall strips across a wide or square poster, three rows on a portrait one.
      return strips(area.x, area.y, area.w, area.h, 3, area.g, area.h <= area.w);
    },
  },
  {
    id: 'diptych',
    label: 'Diptych',
    slots(area) {
      return strips(area.x, area.y, area.w, area.h, 2, area.g, area.h <= area.w);
    },
  },
  {
    id: 'feature',
    label: 'Feature + Trio',
    slots(area) {
      const rects = [];
      if (area.h <= area.w) {
        const bigW = Math.round(area.w * 0.62);
        const sideW = area.w - bigW - area.g;
        rects.push({ x: area.x, y: area.y, w: bigW, h: area.h });
        const ch = cells(area.h, 3, area.g);
        for (let i = 0; i < 3; i++) {
          rects.push({ x: area.x + bigW + area.g, y: area.y + Math.round(i * (ch + area.g)), w: sideW, h: Math.round(ch) });
        }
      } else {
        const bigH = Math.round(area.h * 0.56);
        const rowH = area.h - bigH - area.g;
        rects.push({ x: area.x, y: area.y, w: area.w, h: bigH });
        const cw = cells(area.w, 3, area.g);
        for (let i = 0; i < 3; i++) {
          rects.push({ x: area.x + Math.round(i * (cw + area.g)), y: area.y + bigH + area.g, w: Math.round(cw), h: rowH });
        }
      }
      return rects;
    },
  },
  {
    id: 'solo',
    label: 'Solo',
    slots(area) {
      return [{ x: area.x, y: area.y, w: area.w, h: area.h }];
    },
  },
];

export function layoutById(id) {
  return LAYOUTS.find((l) => l.id === id) ?? LAYOUTS[0];
}

// The area panels may fill: inside the page padding, between the banner bars.
export function contentArea(W, H, bands) {
  const g = Math.max(6, Math.round(Math.min(W, H) * 0.014));
  const pad = Math.max(10, Math.round(Math.min(W, H) * 0.02));
  return {
    x: pad,
    y: pad + bands.top,
    w: W - pad * 2,
    h: H - pad * 2 - bands.top - bands.bottom,
    g,
  };
}

export function slotsFor(layoutId, W, H, bands) {
  return layoutById(layoutId).slots(contentArea(W, H, bands));
}
