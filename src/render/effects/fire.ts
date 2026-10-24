/** A rising, warped heat field. One cached image per seed and layer also serves stationary card wards. */
const SIZE = 144, TOP = -126, HEIGHT = 156;
const lattice = new Float32Array(256 * 256);
let bits = 0x6d2b79f5;
for (let i = 0; i < lattice.length; i++) {
  bits ^= bits << 13; bits ^= bits >>> 17; bits ^= bits << 5;
  lattice[i] = (bits >>> 0) / 4294967296;
}
function noise(x: number, y: number) {
  const ix = Math.floor(x), iy = Math.floor(y);
  let u = x - ix, v = y - iy;
  u = u * u * (3 - 2 * u); v = v * v * (3 - 2 * v);
  const a = lattice[((iy & 255) << 8) + (ix & 255)];
  const b = lattice[((iy & 255) << 8) + ((ix + 1) & 255)];
  const c = lattice[(((iy + 1) & 255) << 8) + (ix & 255)];
  const d = lattice[(((iy + 1) & 255) << 8) + ((ix + 1) & 255)];
  return a + (b - a) * u + (c - a + (a - b - c + d) * u) * v;
}
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const colours = [[125, 13, 2], [216, 34, 3], [255, 77, 4], [255, 140, 12], [255, 206, 61], [255, 246, 174]];
const palette = new Uint8ClampedArray(256 * 4);
for (let i = 0; i < 256; i++) {
  const heat = i / 255, c = heat * (colours.length - 1), lo = Math.min(4, Math.floor(c)), mix = c - lo;
  for (let channel = 0; channel < 3; channel++) palette[i * 4 + channel] = colours[lo][channel] * (1 - mix) + colours[lo + 1][channel] * mix;
  palette[i * 4 + 3] = 255 * clamp(heat * 4) * clamp(heat * 4);
}
const cache = new Map<string, { canvas: HTMLCanvasElement; progress: number }>();
export function fireTexture(progress: number, seed: number, front: boolean, grow: number, melt: number) {
  const key = `${seed}:${front}`;
  let entry = cache.get(key);
  if (entry?.progress === progress) return entry.canvas;
  if (!entry) {
    if (cache.size >= 128) cache.clear();
    const canvas = document.createElement('canvas'); canvas.width = SIZE; canvas.height = HEIGHT;
    entry = { canvas, progress: -1 }; cache.set(key, entry);
  }
  const ctx = entry.canvas.getContext('2d')!, image = ctx.createImageData(SIZE, HEIGHT), pixels = image.data;
  const time = progress * 19, offset = seed * 13.71, rise = grow * (1 - melt * .94);
  for (let py = 0; py < HEIGHT; py++) for (let px = 0; px < SIZE; px++) {
    const x = px - SIZE / 2, y = TOP + py, rim = Math.sqrt(Math.max(0, 1 - (x / 64) ** 2));
    const base = (front ? 20 : -18) * rim;
    const z = base - y;
    if (z < -3 || Math.abs(x) > 68 || rise <= 0) continue;
    // Low in front of the boots, tall on the flanks. The centre remains a sheltered pocket.
    const flank = Math.abs(x) / 64;
    const height = (front ? 22 + 85 * flank ** 2 : 65 + 43 * flank) * rise * clamp((70 - Math.abs(x)) / 16);
    const h = z / height;
    if (h > 1.5) continue;
    const warp = noise(x * .039 + offset, z * .025 - time * .7) - .5;
    const wx = x * .09 + warp * 2.8 * Math.min(1, h + .2) + offset;
    const wy = z * .037 - time + (noise(x * .045 + offset + 37, z * .04 - time * .8) - .5) * 1.1;
    const billow = noise(wx, wy) * .6 + noise(wx * 2.07 + 8, wy * 1.73 - time * .22) * .28 + noise(wx * 4.1, wy * 3.6) * .12;
    const edge = clamp((68 - Math.abs(x + warp * 8 * h)) / 10);
    const heat = clamp((.97 - h + (billow - .5) * 1.65) * edge);
    const temperature = clamp(heat * .86 + noise(wx * 2.4 + 91, wy * 1.3) * .2 - .05);
    const index = Math.floor(temperature * 255) * 4, dest = (py * SIZE + px) * 4;
    pixels[dest] = palette[index]; pixels[dest + 1] = palette[index + 1]; pixels[dest + 2] = palette[index + 2];
    pixels[dest + 3] = palette[Math.floor(heat * 255) * 4 + 3] * clamp((z + 3) / 5) * clamp((1.4 - h) * 4) * (1 - melt);
  }
  ctx.putImageData(image, 0, 0); entry.progress = progress;
  return entry.canvas;
}
