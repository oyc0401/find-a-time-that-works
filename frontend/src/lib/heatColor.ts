const STOPS: [number, string][] = [
  [0 / 700, "#ffffff"],
  [50 / 700, "#e8f3ff"],
  [100 / 700, "#c9e2ff"],
  [200 / 700, "#90c2ff"],
  [300 / 700, "#64a8ff"],
  [400 / 700, "#4593fc"],
  [500 / 700, "#3182f6"],
  [600 / 700, "#2272eb"],
  [700 / 700, "#1b64da"],
];

function hexToRgb(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

function lerp(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

/** ratio 0~1 → white ~ blue700 hex color */
export function heatColor(ratio: number): string {
  const clamped = Math.max(0, Math.min(1, ratio));

  if (clamped <= 0) return STOPS[0][1];
  if (clamped >= 1) return STOPS[STOPS.length - 1][1];

  for (let i = 1; i < STOPS.length; i++) {
    if (clamped <= STOPS[i][0]) {
      const [p0, hex0] = STOPS[i - 1];
      const [p1, hex1] = STOPS[i];
      const t = (clamped - p0) / (p1 - p0);
      const [r0, g0, b0] = hexToRgb(hex0);
      const [r1, g1, b1] = hexToRgb(hex1);
      return rgbToHex(lerp(r0, r1, t), lerp(g0, g1, t), lerp(b0, b1, t));
    }
  }

  return STOPS[STOPS.length - 1][1];
}
