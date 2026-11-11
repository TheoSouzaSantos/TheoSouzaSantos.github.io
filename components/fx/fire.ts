// Shared fire simulation: the classic heat-propagation ("Doom") fire on a low-res
// grid. Each frame heat moves up one row with a random sideways step and loses a
// little, so a row of hot cells grows flickering flames. The grid is drawn
// upscaled with smoothing, which softens it into flames.

export const FIRE_MAX = 36;

// [position 0–1, r, g, b, alpha]. Cool heat is fully transparent so dying
// flames vanish instead of leaving dark smoke over the page.
const STOPS: [number, number, number, number, number][] = [
  [0, 60, 12, 6, 0],
  [0.22, 120, 25, 10, 0],
  [0.4, 190, 50, 14, 170],
  [0.6, 235, 100, 25, 245],
  [0.8, 255, 175, 60, 255],
  [1, 255, 240, 190, 255],
];

export const PALETTE = (() => {
  const out = new Uint8ClampedArray((FIRE_MAX + 1) * 4);
  for (let h = 1; h <= FIRE_MAX; h++) {
    const t = h / FIRE_MAX;
    let s = 0;
    while (s < STOPS.length - 2 && t > STOPS[s + 1][0]) s++;
    const [t0, ...a] = STOPS[s];
    const [t1, ...b] = STOPS[s + 1];
    const k = (t - t0) / (t1 - t0);
    for (let c = 0; c < 4; c++) out[h * 4 + c] = a[c] + (b[c] - a[c]) * k;
  }
  return out;
})();

// Moves heat up one row. Call before writing this frame's heat sources so the
// sources survive to the next step. `decay` sets flame height: higher is shorter.
export function propagate(heat: Uint8Array, cols: number, rows: number, decay: number) {
  for (let x = 0; x < cols; x++) {
    for (let y = 1; y < rows; y++) {
      const src = y * cols + x;
      const v = heat[src];
      if (v === 0) {
        heat[src - cols] = 0;
        continue;
      }
      const dst = src - cols + 1 - ((Math.random() * 3) | 0);
      if (dst < 0) continue;
      const next = v - ((Math.random() * decay) | 0);
      heat[dst] = next > 0 ? next : 0;
    }
  }
}

// Cheap 2D value noise for ragged edges.
export function makeNoise() {
  const perm = Array.from({ length: 256 }, () => Math.random());
  const hash = (x: number, y: number) => perm[(x * 73 + y * 151) & 255];
  const smooth = (t: number) => t * t * (3 - 2 * t);
  return (x: number, y: number) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = smooth(x - xi);
    const yf = smooth(y - yi);
    const top = hash(xi, yi) + (hash(xi + 1, yi) - hash(xi, yi)) * xf;
    const bottom = hash(xi, yi + 1) + (hash(xi + 1, yi + 1) - hash(xi, yi + 1)) * xf;
    return top + (bottom - top) * yf;
  };
}
