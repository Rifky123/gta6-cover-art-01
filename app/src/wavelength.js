// Boulevard Press — colour grades. A grade is a canvas filter applied while
// the photo is drawn, plus overlay layers (flat tints and vertical ramps)
// composited over it, plus the ink gradient the caption lettering wears.

export const GRADES = [
  {
    id: 'sundown',
    label: 'Sundown',
    swatch: ['#2a1052', '#ff5e3c', '#ff2e7e'],
    filter: 'saturate(1.44) contrast(1.1) brightness(1.03)',
    layers: [
      { kind: 'ramp', top: '#3c1370', bottom: '#ff8a4c', alpha: 0.62, blend: 'soft-light' },
      { kind: 'tint', color: '#ff6e5c', alpha: 0.2, blend: 'color' },
      { kind: 'tint', color: '#ff5e7e', alpha: 0.24, blend: 'overlay' },
      { kind: 'ramp', top: '#ffb45c', bottom: '#2a0f4e', alpha: 0.22, blend: 'screen' },
      { kind: 'ramp', top: '#1a0b38', bottom: '#0d0620', alpha: 0.2, blend: 'multiply' },
    ],
    ink: ['#ffe08a', '#ff6a9e', '#b44cff'],
    edge: '#ff7a3c',
  },
  {
    id: 'neon',
    label: 'Neon',
    swatch: ['#0b1030', '#00e5ff', '#ff2ea6'],
    filter: 'saturate(1.45) contrast(1.1) brightness(0.96)',
    layers: [
      { kind: 'tint', color: '#00c8ff', alpha: 0.2, blend: 'multiply' },
      { kind: 'tint', color: '#ff2ea6', alpha: 0.22, blend: 'overlay' },
      { kind: 'ramp', top: '#16005e', bottom: '#001a3a', alpha: 0.26, blend: 'soft-light' },
    ],
    ink: ['#7df9ff', '#ff4fd8', '#8a2cff'],
    edge: '#00e5ff',
  },
  {
    id: 'heat',
    label: 'Heat',
    swatch: ['#40060a', '#ff3c1e', '#ffb03c'],
    filter: 'saturate(1.32) contrast(1.14)',
    layers: [
      { kind: 'tint', color: '#ff3c1e', alpha: 0.26, blend: 'overlay' },
      { kind: 'ramp', top: '#ffb03c', bottom: '#5c0d12', alpha: 0.3, blend: 'soft-light' },
      { kind: 'tint', color: '#38091f', alpha: 0.14, blend: 'multiply' },
    ],
    ink: ['#fff3b0', '#ff9e3c', '#ff3c1e'],
    edge: '#ff5e2e',
  },
  {
    id: 'noir',
    label: 'Noir',
    swatch: ['#0c0c12', '#8fa3c8', '#e8eefc'],
    filter: 'grayscale(1) contrast(1.22) brightness(1.02)',
    layers: [
      { kind: 'tint', color: '#0e1c3c', alpha: 0.22, blend: 'multiply' },
      { kind: 'ramp', top: '#e8eefc', bottom: '#05070f', alpha: 0.16, blend: 'soft-light' },
    ],
    ink: ['#ffffff', '#cfd8ea', '#8fa3c8'],
    edge: '#e8eefc',
  },
  {
    id: 'dayglo',
    label: 'Dayglo',
    swatch: ['#ff2ea6', '#2effc4', '#b3ff3c'],
    filter: 'saturate(1.6) contrast(1.05) brightness(1.04)',
    layers: [
      { kind: 'tint', color: '#ff2ea6', alpha: 0.2, blend: 'overlay' },
      { kind: 'tint', color: '#2effc4', alpha: 0.24, blend: 'soft-light' },
      { kind: 'ramp', top: '#fff95c', bottom: '#ff2ea6', alpha: 0.16, blend: 'soft-light' },
    ],
    ink: ['#eaff8a', '#2effc4', '#ff2ea6'],
    edge: '#ff2ea6',
  },
];

export function gradeById(id) {
  return GRADES.find((g) => g.id === id) ?? GRADES[0];
}

// Paint a grade's overlay layers over one panel rectangle.
export function washLayers(ctx, rect, grade) {
  for (const layer of grade.layers) {
    ctx.save();
    ctx.globalCompositeOperation = layer.blend;
    ctx.globalAlpha = layer.alpha;
    if (layer.kind === 'tint') {
      ctx.fillStyle = layer.color;
    } else {
      const grad = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
      grad.addColorStop(0, layer.top);
      grad.addColorStop(1, layer.bottom);
      ctx.fillStyle = grad;
    }
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.restore();
  }
}

// The caption's vertical ink gradient across a text block.
export function inkGradient(ctx, grade, yTop, yBottom) {
  const grad = ctx.createLinearGradient(0, yTop, 0, yBottom);
  grad.addColorStop(0, grade.ink[0]);
  grad.addColorStop(0.55, grade.ink[1]);
  grad.addColorStop(1, grade.ink[2]);
  return grad;
}
