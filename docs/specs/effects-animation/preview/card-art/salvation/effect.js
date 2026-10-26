const SIZE = 512;
const TAU = Math.PI * 2;
const clamp = value => Math.max(0, Math.min(1, value));
const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };

function canvas(width = SIZE, height = SIZE) {
  const surface = document.createElement('canvas');
  surface.width = width;
  surface.height = height;
  return surface;
}

export function createEffect(image) {
  const source = canvas();
  const sourceCtx = source.getContext('2d', { willReadFrequently: true });
  sourceCtx.drawImage(image, 0, 0, SIZE, SIZE);
  const pixels = sourceCtx.getImageData(0, 0, SIZE, SIZE).data;

  // These windows contain painted vapour only, with no stone or cross to repeat.
  const vapour = [[346, 175, 112, 140], [248, 118, 134, 112]].map(([left, top, width, height]) => {
    const texture = canvas(width, height), c = texture.getContext('2d');
    const data = c.createImageData(width, height);
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      const p = ((top + y) * SIZE + left + x) * 4, at = (y * width + x) * 4;
      const r = pixels[p], g = pixels[p + 1], b = pixels[p + 2];
      const edge = smooth(x / 24) * smooth((width - 1 - x) / 24)
        * smooth(y / 24) * smooth((height - 1 - y) / 28);
      const paint = smooth((r - 105) / 65) * smooth((g - r - 15) / 28);
      data.data[at] = r;
      data.data[at + 1] = g;
      data.data[at + 2] = b;
      data.data[at + 3] = Math.round(255 * edge * paint);
    }
    c.putImageData(data, 0, 0);
    return texture;
  });

  const stones = canvas(), stoneCtx = stones.getContext('2d');
  const fixed = new Uint8ClampedArray(pixels);
  for (let p = 0; p < pixels.length; p += 4) {
    fixed[p + 3] = Math.round(255 * (1 - smooth((pixels[p] - 91) / 49)));
  }
  stoneCtx.putImageData(new ImageData(fixed, SIZE, SIZE), 0, 0);

  // Light follows the existing cyan brushwork. Overlapping zones breathe upward.
  const light = [432, 407, 382, 357].map(center => {
    const layer = canvas(), c = layer.getContext('2d');
    const data = c.createImageData(SIZE, SIZE);
    for (let y = 318; y < 471; y++) for (let x = 283; x < 451; x++) {
      const p = (y * SIZE + x) * 4, r = pixels[p], g = pixels[p + 1];
      const edge = smooth((x - 283) / 48) * smooth((451 - x) / 50)
        * smooth((y - 318) / 32) * smooth((471 - y) / 31);
      const band = 1 - smooth(Math.abs(y - center) / 43);
      const paint = smooth((r - 106) / 95) * smooth((g - r - 8) / 33);
      data.data[p] = r;
      data.data[p + 1] = g;
      data.data[p + 2] = pixels[p + 2];
      data.data[p + 3] = Math.round(255 * edge * band * paint);
    }
    c.putImageData(data, 0, 0);
    return layer;
  });

  const wisps = [
    { x: 269, y: 357, width: 225, height: 95, travel: 57, rise: 11, phase: .05, alpha: .78, texture: 0 },
    { x: 303, y: 335, width: 165, height: 107, travel: -38, rise: 27, phase: .46, alpha: .60, texture: 1 },
    { x: 135, y: 412, width: 239, height: 70, travel: 67, rise: 8, phase: .36, alpha: .72, texture: 0 },
    { x: 269, y: 433, width: 258, height: 63, travel: -60, rise: 9, phase: .71, alpha: .62, texture: 1 },
    { x: 30, y: 445, width: 253, height: 49, travel: 55, rise: 6, phase: .84, alpha: .48, texture: 1 },
  ];

  return {
    draw(ctx, { time = 0, mode = 'idle', reduced = false } = {}) {
      const seconds = Number.isFinite(time) ? time : 0;
      const wake = mode === 'awaken';
      const t = wake ? Math.max(0, Math.min(3.2, seconds)) : ((seconds % 8) + 8) % 8;
      ctx.save();
      try {
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        ctx.filter = 'none';
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.rect(0, 0, SIZE, SIZE);
        ctx.clip();
        ctx.drawImage(source, 0, 0);
        if (reduced || (wake && (t === 0 || t === 3.2))) return;
        const envelope = wake ? smooth(t / .55) * (1 - smooth((t - 1.9) / 1.3)) : 1;
        const progress = wake ? t / 4.8 : t / 8;

        ctx.globalCompositeOperation = 'screen';
        for (let i = 0; i < light.length; i++) {
          const breath = (1 + Math.cos(TAU * (progress - i * .13 - .2))) / 2;
          ctx.globalAlpha = clamp(envelope * (.045 + .23 * breath ** 2));
          ctx.drawImage(light[i], 0, 0);
        }

        ctx.globalCompositeOperation = 'source-over';
        for (const wisp of wisps) {
          const life = (progress + wisp.phase) % 1;
          const flow = smooth(life);
          const density = Math.sin(Math.PI * life) ** 2;
          ctx.globalAlpha = clamp(envelope * wisp.alpha * density * (wake ? 1.3 : 1));
          ctx.drawImage(vapour[wisp.texture], wisp.x + wisp.travel * (flow - .5),
            wisp.y - wisp.rise * flow, wisp.width, wisp.height);
        }

        // Restore the source's dark contours above the moving haze, at zero offset.
        ctx.globalAlpha = 1;
        ctx.drawImage(stones, 0, 0);
      } finally {
        ctx.restore();
      }
    },
  };
}
