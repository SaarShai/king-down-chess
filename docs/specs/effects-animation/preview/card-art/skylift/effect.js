const SIZE = 512;
const TAU = Math.PI * 2;
const clamp = (n) => Math.max(0, Math.min(1, n));
const smooth = (n) => { const v = clamp(n); return v * v * (3 - 2 * v); };
const wrap = (n) => ((n % 1) + 1) % 1;

function canvas(width = SIZE, height = SIZE) {
  const texture = document.createElement('canvas');
  texture.width = width;
  texture.height = height;
  return texture;
}

// Guides select the existing paint. Color, not the guides, defines each visible edge.
const WIND = [
  { points: [[48, 38], [94, 6], [208, 5], [325, 33], [390, 87], [397, 112]], width: 22, back: true },
  { points: [[171, 53], [249, 40], [325, 61], [362, 99], [355, 126], [323, 148]], width: 16, back: true },
  { points: [[190, 96], [238, 87], [292, 96], [329, 117], [330, 135], [302, 153]], width: 13, back: true },
  { points: [[96, 133], [64, 164], [62, 195], [88, 224], [135, 244]], width: 15, back: true },
  { points: [[211, 139], [172, 156], [145, 183], [153, 214], [201, 244], [275, 270]], width: 14, back: false },
  { points: [[153, 225], [198, 251], [287, 279], [372, 296], [440, 285], [469, 261], [464, 242]], width: 16, back: false },
  { points: [[273, 217], [334, 240], [400, 268], [428, 294], [422, 318], [388, 339]], width: 11, back: false },
  { points: [[167, 262], [190, 294], [257, 322], [332, 340], [387, 335]], width: 12, back: false },
  { points: [[207, 308], [232, 337], [284, 357], [345, 363], [371, 349]], width: 10, back: false },
  { points: [[247, 356], [264, 377], [305, 388], [337, 382]], width: 8, back: false },
  { points: [[281, 389], [295, 406], [316, 412], [306, 429], [300, 448]], width: 7, back: false },
];

function pathInfo(points, x, y) {
  let nearest = Infinity;
  let along = 0;
  let length = 0;
  let tangentX = 0;
  let tangentY = 0;
  for (let i = 1; i < points.length; i++) {
    const [ax, ay] = points[i - 1];
    const [bx, by] = points[i];
    const dx = bx - ax;
    const dy = by - ay;
    const segment = Math.hypot(dx, dy);
    const q = clamp(((x - ax) * dx + (y - ay) * dy) / (segment * segment));
    const distance = Math.hypot(x - ax - dx * q, y - ay - dy * q);
    if (distance < nearest) {
      nearest = distance;
      along = length + segment * q;
      tangentX = dx / segment;
      tangentY = dy / segment;
    }
    length += segment;
  }
  return { distance: nearest, along, length, tangentX, tangentY };
}

function textureFrom(source, x, y, width, height, alpha) {
  const texture = canvas(width, height);
  const context = texture.getContext('2d');
  const pixels = context.createImageData(width, height);
  for (let yy = 0; yy < height; yy++) {
    for (let xx = 0; xx < width; xx++) {
      const at = (yy * width + xx) * 4;
      const from = ((y + yy) * SIZE + x + xx) * 4;
      pixels.data[at] = source[from];
      pixels.data[at + 1] = source[from + 1];
      pixels.data[at + 2] = source[from + 2];
      pixels.data[at + 3] = Math.round(255 * clamp(alpha(x + xx, y + yy, from)));
    }
  }
  context.putImageData(pixels, 0, 0);
  return texture;
}

function liftedRock(pixels, { x, y, w, h, seed, sky, ...motion }) {
  const mask = new Float32Array(w * h);
  const pending = [seed[1] * w + seed[0]];
  const visited = new Uint8Array(w * h);
  while (pending.length) {
    const i = pending.pop();
    if (visited[i]) continue;
    visited[i] = 1;
    const px = i % w;
    const py = Math.floor(i / w);
    const at = ((y + py) * SIZE + x + px) * 4;
    const r = pixels[at], g = pixels[at + 1], b = pixels[at + 2];
    const coverage = Math.max(smooth((205 - Math.max(r, g, b)) / 24),
      smooth((r - b - 26) / 26) * smooth((g - b - 8) / 20) * smooth((251 - Math.max(r, g, b)) / 10));
    if (coverage < 0.04) continue;
    mask[i] = coverage;
    if (px) pending.push(i - 1);
    if (px < w - 1) pending.push(i + 1);
    if (py) pending.push(i - w);
    if (py < h - 1) pending.push(i + w);
  }
  const texture = textureFrom(pixels, x, y, w, h, (px, py) => mask[(py - y) * w + px - x]);
  const gutter = 5;
  const patch = canvas(w + gutter * 2, h + gutter * 2);
  const context = patch.getContext('2d');
  const clean = context.createImageData(patch.width, patch.height);
  const fill = new Float32Array(clean.data.length);
  for (let py = 0; py < patch.height; py++) {
    for (let px = 0; px < patch.width; px++) {
      const xx = x + px - gutter, yy = y + py - gutter;
      let alpha = 0;
      for (let dy = -4; dy <= 4; dy++) {
        for (let dx = -4; dx <= 4; dx++) {
          const mx = xx - x + dx, my = yy - y + dy;
          if (mx >= 0 && mx < w && my >= 0 && my < h && mask[my * w + mx] > 0.04) {
            alpha = Math.max(alpha, 1 - smooth((Math.hypot(dx, dy) - 1.5) / 2.5));
          }
        }
      }
      const at = (py * patch.width + px) * 4;
      const from = ((yy + (alpha ? sky[1] : 0)) * SIZE + xx + (alpha ? sky[0] : 0)) * 4;
      for (let c = 0; c < 3; c++) fill[at + c] = pixels[from + c];
      clean.data[at + 3] = Math.round(255 * alpha);
    }
  }
  // Blend clean source sky into the surrounding paint, without scanline seams.
  for (let pass = 0; pass < 320; pass++) {
    for (let py = 1; py < patch.height - 1; py++) {
      for (let px = 1; px < patch.width - 1; px++) {
        const at = (py * patch.width + px) * 4;
        if (!clean.data[at + 3]) continue;
        for (let c = 0; c < 3; c++) {
          fill[at + c] = (fill[at - 4 + c] + fill[at + 4 + c]
            + fill[at - patch.width * 4 + c] + fill[at + patch.width * 4 + c]) / 4;
        }
      }
    }
  }
  for (let at = 0; at < clean.data.length; at += 4) {
    for (let c = 0; c < 3; c++) clean.data[at + c] = fill[at + c];
  }
  context.putImageData(clean, 0, 0);
  return { x, y, texture, patch, patchX: x - gutter, patchY: y - gutter, ...motion };
}

export function createEffect(image) {
  const source = canvas();
  const sourceContext = source.getContext('2d', { willReadFrequently: true });
  sourceContext.drawImage(image, 0, 0, SIZE, SIZE);
  const pixels = sourceContext.getImageData(0, 0, SIZE, SIZE).data;
  const windColor = (at) => smooth((Math.min(pixels[at], pixels[at + 1]) - 159) / 72)
    * smooth((pixels[at + 2] - 181) / 44);
  const winds = [];

  const stoneColor = (at) => Math.max(
    smooth((183 - Math.max(pixels[at], pixels[at + 1], pixels[at + 2])) / 39),
    smooth((pixels[at] - pixels[at + 2] - 14) / 34),
  );
  const stoneCover = textureFrom(pixels, 0, 0, SIZE, SIZE, (x, y, at) => {
    const left = x > 82 && x < 214 && y > 26 && y < 238;
    const right = x > 286 && x < 435 && y > 150 && y < 354;
    const detached = (x >= 198 && x < 233 && y >= 191 && y < 234)
      || (x >= 410 && x < 449 && y >= 342 && y < 386);
    return (left || right) && !detached ? stoneColor(at) : 0;
  });

  WIND.forEach((guide, band) => {
    const fields = new Array(SIZE * SIZE);
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        if (!windColor((y * SIZE + x) * 4)) continue;
        const field = pathInfo(guide.points, x, y);
        if (field.distance < guide.width) fields[y * SIZE + x] = field;
      }
    }
    const total = pathInfo(guide.points, 0, 0).length;
    const count = Math.max(2, Math.ceil(total / 42));
    for (let part = 0; part <= count; part++) {
      const center = total * part / count;
      const reach = total / count;
      const positions = [];
      for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
          const field = fields[y * SIZE + x];
          if (field && Math.abs(field.along - center) < reach) positions.push([x, y]);
        }
      }
      if (!positions.length) continue;
      const x = Math.min(...positions.map(p => p[0]));
      const y = Math.min(...positions.map(p => p[1]));
      const width = Math.max(...positions.map(p => p[0])) - x + 1;
      const height = Math.max(...positions.map(p => p[1])) - y + 1;
      const middle = positions[Math.floor(positions.length / 2)];
      const direction = fields[middle[1] * SIZE + middle[0]];
      const texture = textureFrom(pixels, x, y, width, height, (px, py, at) => {
        const field = fields[py * SIZE + px];
        if (!field) return 0;
        const across = smooth(1 - field.distance / guide.width);
        const lengthwise = Math.max(0, 1 - Math.abs(field.along - center) / reach);
        return windColor(at) * across * smooth(lengthwise);
      });
      winds.push({ texture, x, y, dx: direction.tangentX, dy: direction.tangentY,
        phase: part / count * 1.3 + band * 0.173, back: guide.back });
    }
  });

  const clouds = [
    { x: 0, y: 32, w: 77, h: 159, dx: 3, dy: -1, phase: 0.4 },
    { x: 0, y: 242, w: 180, h: 181, dx: 4, dy: -2, phase: 1.7 },
    { x: 410, y: 98, w: 102, h: 149, dx: -4, dy: -2, phase: 3.2 },
    { x: 382, y: 317, w: 130, h: 133, dx: -3, dy: -2, phase: 4.7 },
  ].map(cloud => ({ ...cloud, texture: textureFrom(pixels, cloud.x, cloud.y, cloud.w, cloud.h, (x, y, at) => {
    const edge = smooth(Math.min(x - cloud.x, cloud.x + cloud.w - 1 - x,
      y - cloud.y, cloud.y + cloud.h - 1 - y) / 18);
    const warm = smooth((pixels[at] - 183) / 53) * smooth((pixels[at + 1] - 181) / 47);
    return edge * warm * smooth((pixels[at] - pixels[at + 2] + 10) / 32);
  }) }));

  const rocks = [
    { x: 410, y: 342, w: 39, h: 44, seed: [20, 24], sky: [35, -18], rise: 70, drift: 8, phase: 0.06 },
    { x: 25, y: 185, w: 35, h: 50, seed: [16, 27], sky: [72, 70], rise: 58, drift: -4, phase: 0.39 },
    { x: 198, y: 191, w: 35, h: 43, seed: [16, 21], sky: [34, -8], rise: 52, drift: 10, phase: 0.72 },
  ].map(rock => liftedRock(pixels, rock));

  function drawWind(ctx, phase, strength, back) {
    for (const wind of winds) {
      if (wind.back !== back) continue;
      const flow = wrap(phase * 2 - wind.phase);
      const fade = Math.sin(flow * Math.PI) ** 2;
      const distance = (flow - 0.5) * 42 * strength;
      ctx.globalAlpha = fade * strength * (back ? 0.62 : 0.94);
      ctx.drawImage(wind.texture, wind.x + wind.dx * distance, wind.y + wind.dy * distance);
    }
  }

  return {
    draw(ctx, { time, mode, reduced }) {
      ctx.save();
      try {
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(source, 0, 0);
        if (reduced) return;
        const seconds = Number.isFinite(time) ? time : 0;
        const awaken = mode === 'awaken';
        if (awaken && (seconds <= 0 || seconds >= 3.2)) return;
        const phase = awaken ? seconds / 4 : wrap(seconds / 8);
        const strength = awaken ? smooth(seconds / 0.65) * (1 - smooth((seconds - 1.6) / 1.6)) : 0.8;
        const rockStrength = awaken ? smooth(seconds / 0.35) * (1 - smooth((seconds - 2.2) / 1)) : 1;
        for (const rock of rocks) {
          ctx.globalAlpha = rockStrength;
          ctx.drawImage(rock.patch, rock.patchX, rock.patchY);
        }
        for (const cloud of clouds) {
          ctx.globalAlpha = 0.36 * strength;
          const drift = Math.sin(phase * TAU + cloud.phase);
          ctx.drawImage(cloud.texture, cloud.x + cloud.dx * drift * strength, cloud.y + cloud.dy * drift * strength);
        }
        drawWind(ctx, phase, strength, true);
        ctx.globalAlpha = 1;
        ctx.drawImage(stoneCover, 0, 0);
        drawWind(ctx, phase, strength, false);
        for (const rock of rocks) {
          const flow = awaken ? clamp((seconds - rock.phase * 0.45) / 2.7) : wrap(phase + rock.phase);
          const visible = smooth(flow / 0.13) * (1 - smooth((flow - 0.72) / 0.28));
          ctx.globalAlpha = visible * rockStrength;
          ctx.drawImage(rock.texture, rock.x + rock.drift * flow, rock.y - rock.rise * flow);
        }
      } finally {
        ctx.restore();
      }
    },
  };
}
