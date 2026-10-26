const SIZE = 512;
const TAU = Math.PI * 2;
const clamp = value => Math.max(0, Math.min(1, value));
const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };

function canvas() {
  const surface = document.createElement('canvas');
  surface.width = surface.height = SIZE;
  return surface;
}

// A seed selects one painted shape; the colour test supplies its contour.
function connected(pixels, allowed, seedX, seedY) {
  const mask = new Uint8Array(SIZE * SIZE);
  const queue = new Int32Array(mask.length);
  let head = 0, end = 1;
  queue[0] = seedY * SIZE + seedX;
  mask[queue[0]] = 1;
  while (head < end) {
    const at = queue[head++], x = at % SIZE;
    for (const next of [x > 0 ? at - 1 : -1, x < SIZE - 1 ? at + 1 : -1, at - SIZE, at + SIZE]) {
      if (next < 0 || next >= mask.length || mask[next]) continue;
      const nx = next % SIZE, ny = Math.floor(next / SIZE), p = next * 4;
      if (!allowed(nx, ny, pixels[p], pixels[p + 1], pixels[p + 2])) continue;
      mask[next] = 1;
      queue[end++] = next;
    }
  }
  return mask;
}

// shortcut: nearby source colours cover short travel; larger travel needs a clean plate.
function separate(pixels, mask) {
  const plate = canvas(), layer = canvas();
  const plateCtx = plate.getContext('2d'), layerCtx = layer.getContext('2d');
  const back = new Uint8ClampedArray(pixels), front = new Uint8ClampedArray(pixels);
  const nearest = new Int32Array(mask.length).fill(-1);
  const queue = new Int32Array(mask.length);
  let head = 0, end = 0;
  for (let at = 0; at < mask.length; at++) {
    back[at * 4 + 3] = front[at * 4 + 3] = Math.round(255 * mask[at]);
    if (!mask[at]) { nearest[at] = at; queue[end++] = at; }
  }
  while (head < end) {
    const at = queue[head++], x = at % SIZE;
    for (const next of [x > 0 ? at - 1 : -1, x < SIZE - 1 ? at + 1 : -1, at - SIZE, at + SIZE]) {
      if (next < 0 || next >= nearest.length || nearest[next] !== -1) continue;
      nearest[next] = nearest[at];
      queue[end++] = next;
    }
  }
  for (let at = 0; at < mask.length; at++) {
    if (!mask[at]) continue;
    const from = nearest[at] * 4, p = at * 4;
    for (let c = 0; c < 3; c++) back[p + c] = pixels[from + c];
  }
  plateCtx.putImageData(new ImageData(back, SIZE, SIZE), 0, 0);
  layerCtx.putImageData(new ImageData(front, SIZE, SIZE), 0, 0);
  return { plate, layer };
}

function expand(mask, allowed) {
  const expanded = mask.slice();
  for (let y = 1; y < SIZE - 1; y++) for (let x = 1; x < SIZE - 1; x++) {
    const at = y * SIZE + x;
    if (!mask[at]) continue;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (allowed(x + dx, y + dy)) expanded[at + dy * SIZE + dx] = 1;
    }
  }
  return expanded;
}

export function createEffect(image) {
  const source = canvas(), sourceCtx = source.getContext('2d', { willReadFrequently: true });
  sourceCtx.drawImage(image, 0, 0, SIZE, SIZE);
  const pixels = sourceCtx.getImageData(0, 0, SIZE, SIZE).data;
  const horseArea = (x, y) => x >= 252 && y > 280 && y < 448;
  const horseMask = connected(pixels, (x, y, r, g, b) =>
    horseArea(x, y) && r < 90 && g < 43 && b < 132 && b > r * 1.24, 388, 321);
  const horse = separate(pixels, expand(expand(horseMask, horseArea), horseArea));
  const cloakArea = (x, y) => x > 12 && x < 177 && y > 165 && y < 305;
  const cloakMask = connected(pixels, (x, y, r, g, b) =>
    cloakArea(x, y) && r > g * 1.8 && r > b * 0.68 && b < 126, 115, 216);
  const cloak = separate(pixels, expand(expand(cloakMask, cloakArea), cloakArea));

  // Both contours come from the original cloud banks, with their painted shading.
  const clouds = [[96, 22, 210, 96], [16, 28, 150, 120]].map(([left, top, width, height]) => {
    const layer = canvas(), cloudCtx = layer.getContext('2d');
    const cloudPixels = new Uint8ClampedArray(pixels.length);
    for (let y = top; y < top + height; y++) for (let x = left; x < left + width; x++) {
      const p = (y * SIZE + x) * 4, r = pixels[p], g = pixels[p + 1], b = pixels[p + 2];
      const alpha = smooth((r - 62) / 32) * smooth((b - g * 1.4) / 24)
        * smooth((x - left) / 15) * smooth((left + width - x) / 15)
        * smooth((y - top) / 9) * smooth((top + height - y) / 12);
      cloudPixels[p] = r; cloudPixels[p + 1] = g; cloudPixels[p + 2] = b;
      cloudPixels[p + 3] = Math.round(alpha * 255);
    }
    cloudCtx.putImageData(new ImageData(cloudPixels, SIZE, SIZE), 0, 0);
    return layer;
  });

  return {
    draw(ctx, { time = 0, mode = 'idle', reduced = false } = {}) {
      const seconds = Number.isFinite(time) ? time : 0;
      const t = mode === 'awaken' ? Math.max(0, Math.min(3.2, seconds)) : ((seconds % 8) + 8) % 8;
      const phase = t / 8 * TAU;
      const wake = mode === 'awaken';
      const envelope = wake ? Math.sin(Math.PI * t / 3.2) ** 2 : 1;
      const reach = wake ? 18 * envelope : 8 * Math.sin(phase);
      const nod = wake ? -10 * envelope * Math.sin(t * 2.4) : -4.5 * Math.sin(phase);
      const flutter = wake ? 3.8 * envelope * Math.sin(t * 8) : 1.9 * Math.sin(phase * 2);
      ctx.save();
      try {
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        ctx.filter = 'none';
        ctx.shadowColor = 'transparent';
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(source, 0, 0);
        if (reduced || (wake && (t === 0 || t === 3.2))) return;

        // Keep the join at the figure still while the horse reaches and rears.
        ctx.drawImage(horse.plate, 0, 0);
        ctx.save();
        ctx.translate(252, 325);
        ctx.transform(1 + reach / 240, nod / 240, 0, 1, 0, 0);
        ctx.drawImage(horse.layer, -252, -325);
        ctx.restore();

        ctx.drawImage(cloak.plate, 0, 0);
        ctx.save();
        ctx.translate(177, 214);
        ctx.transform(1, flutter * 0.009, 0, 1, 0, 0);
        ctx.drawImage(cloak.layer, -177, -214);
        ctx.restore();

        // Reset each travelling wisp only while transparent; the loop has no visible wrap.
        const far = (t / 8 + 0.68) % 1, near = (t / 8 + 0.18) % 1;
        ctx.globalAlpha = 0.72 * Math.sin(Math.PI * far) ** 2 * envelope;
        ctx.drawImage(clouds[1], 16, 28, 150, 120, 248 + 120 * far, 58, 165, 120);
        ctx.globalAlpha = 0.94 * Math.sin(Math.PI * near) ** 2 * envelope;
        ctx.drawImage(clouds[0], 96, 22, 210, 96, 238 + 160 * near, 106, 244, 88);

      } finally {
        ctx.restore();
      }
    },
  };
}
