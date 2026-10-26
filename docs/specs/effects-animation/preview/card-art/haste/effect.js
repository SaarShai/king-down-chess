const SIZE = 512;
const TAU = Math.PI * 2;
const clamp = value => Math.max(0, Math.min(1, value));
const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
const fract = value => value - Math.floor(value);
const seed = value => fract(Math.sin(value * 127.1 + 311.7) * 43758.5453);

function surface(width = SIZE, height = SIZE) {
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  return canvas;
}

// These knots follow the painted sweep, including its tight left turn and low front.
function dustRoute() {
  const knots = [[285,217,9],[214,216,8],[137,229,12],[72,246,16],
    [35,265,19],[32,283,18],[61,307,21],[112,333,20],
    [182,358,13],[264,380,9],[344,392,12],[418,392,17],
    [461,379,18],[461,363,15],[429,345,12],[382,327,8],
    [332,312,5],[289,279,5]];
  const points = [];
  let length = 0;
  for (let i = 0; i < knots.length; i++) for (let step = 0; step < 20; step++) {
    const p = [knots[(i + knots.length - 1) % knots.length], knots[i],
      knots[(i + 1) % knots.length], knots[(i + 2) % knots.length]];
    const t = step / 20;
    const point = p[0].map((_, axis) => .5 * (2 * p[1][axis]
      + (-p[0][axis] + p[2][axis]) * t
      + (2 * p[0][axis] - 5 * p[1][axis] + 4 * p[2][axis] - p[3][axis]) * t * t
      + (-p[0][axis] + 3 * p[1][axis] - 3 * p[2][axis] + p[3][axis]) * t * t * t));
    const previous = points.at(-1);
    if (previous) length += Math.hypot(point[0] - previous.x, point[1] - previous.y);
    points.push({ x:point[0], y:point[1], width:point[2], distance:length });
  }
  length += Math.hypot(points[0].x - points.at(-1).x, points[0].y - points.at(-1).y);
  let next = 1;
  return Array.from({length:384}, (_, i) => {
    const distance = i / 384 * length;
    while (next < points.length && points[next].distance < distance) next++;
    const a = points[next - 1], b = points[next] || {...points[0],distance:length};
    const mix = (distance - a.distance) / (b.distance - a.distance);
    const angle = Math.atan2(b.y - a.y, b.x - a.x);
    return { x:a.x + (b.x - a.x) * mix, y:a.y + (b.y - a.y) * mix,
      width:a.width + (b.width - a.width) * mix, angle };
  });
}

export function createEffect(image) {
  const source = surface(), sourceCtx = source.getContext('2d', {willReadFrequently:true});
  sourceCtx.drawImage(image, 0, 0, SIZE, SIZE);
  const pixels = sourceCtx.getImageData(0, 0, SIZE, SIZE).data;
  const route = dustRoute();

  // Trace the source edge, so the gold disappears behind solid stone.
  const stone = new Path2D('M223 57 L239 54 L240 80 L252 77 L263 53 '
    + 'Q281 51 298 60 L296 84 L316 90 L320 63 L345 70 L344 96 '
    + 'L354 98 L356 78 L369 84 L360 139 Q359 151 337 158 '
    + 'Q332 164 331 177 L326 267 Q335 274 333 286 Q332 292 326 294 '
    + 'L334 308 Q351 324 352 340 L351 350 L340 356 L348 362 '
    + 'L350 383 L345 395 Q294 390 254 380 L176 361 L147 354 '
    + 'L148 346 L140 337 L140 328 L146 320 L143 314 L146 305 '
    + 'Q164 290 179 282 L187 271 Q182 262 193 256 L201 253 '
    + 'Q215 223 220 192 L229 151 Q212 146 211 132 L210 125 Z');
  const flowClip = new Path2D();
  flowClip.rect(0, 0, SIZE, SIZE);
  flowClip.addPath(stone);

  // The red test keeps the cloth's torn, painted contour; no strip deformation.
  const red = new Uint8Array(SIZE * SIZE);
  for (let y = 10; y < 119; y++) for (let x = 32; x < 255; x++) {
    const p = (y * SIZE + x) * 4, r = pixels[p], g = pixels[p + 1], b = pixels[p + 2];
    if (r > 32 && r > g * 1.5 && r > b * 1.35) red[y * SIZE + x] = 1;
  }
  // A colour alone also selects distant flags; keep only this connected cloth.
  const clothMask = new Uint8Array(red.length), clothQueue = new Int32Array(red.length);
  let clothHead = 0, clothEnd = 1;
  clothQueue[0] = 60 * SIZE + 170; clothMask[clothQueue[0]] = 1;
  while (clothHead < clothEnd) {
    const at = clothQueue[clothHead++], x = at % SIZE;
    for (const next of [x > 0 ? at - 1 : -1, x < SIZE - 1 ? at + 1 : -1, at - SIZE, at + SIZE]) {
      if (next < 0 || next >= red.length || !red[next] || clothMask[next]) continue;
      clothMask[next] = 1; clothQueue[clothEnd++] = next;
    }
  }
  const expanded = clothMask.slice();
  for (let y = 11; y < 118; y++) for (let x = 33; x < 254; x++) {
    if (!clothMask[y * SIZE + x]) continue;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) expanded[(y + dy) * SIZE + x + dx] = 1;
  }
  const cloth = surface(), plate = surface();
  const front = new Uint8ClampedArray(pixels), back = new Uint8ClampedArray(pixels);
  const nearest = new Int32Array(clothMask.length).fill(-1), queue = new Int32Array(clothMask.length);
  let head = 0, end = 0;
  for (let at = 0; at < expanded.length; at++) {
    front[at * 4 + 3] = back[at * 4 + 3] = expanded[at] * 255;
    if (!expanded[at]) { nearest[at] = at; queue[end++] = at; }
  }
  while (head < end) {
    const at = queue[head++], x = at % SIZE;
    for (const next of [x > 0 ? at - 1 : -1, x < SIZE - 1 ? at + 1 : -1, at - SIZE, at + SIZE]) {
      if (next < 0 || next >= nearest.length || nearest[next] !== -1) continue;
      nearest[next] = nearest[at]; queue[end++] = next;
    }
  }
  for (let at = 0; at < expanded.length; at++) {
    if (!expanded[at]) continue;
    for (let c = 0; c < 3; c++) back[at * 4 + c] = pixels[nearest[at] * 4 + c];
  }
  cloth.getContext('2d').putImageData(new ImageData(front, SIZE, SIZE), 0, 0);
  plate.getContext('2d').putImageData(new ImageData(back, SIZE, SIZE), 0, 0);

  const gold = (r, g, b) => smooth((r - b - 30) / 65) * smooth((g - b - 12) / 55) * smooth((r - 135) / 95);
  const tiles = [[44,231],[70,228],[22,246],[104,313],[115,334],[364,388],
    [419,383],[451,389],[481,398],[68,307],[77,325],[126,346]].map(([cx,cy]) => {
    const tile = surface(12,12), data = tile.getContext('2d').createImageData(12,12);
    for (let y = 0; y < 12; y++) for (let x = 0; x < 12; x++) {
      const p = ((cy + y - 6) * SIZE + cx + x - 6) * 4, q = (y * 12 + x) * 4;
      const edge = smooth(Math.min(x,y,11-x,11-y) / 3);
      data.data[q] = pixels[p]; data.data[q+1] = pixels[p+1]; data.data[q+2] = pixels[p+2];
      data.data[q+3] = Math.round(255 * edge * gold(pixels[p], pixels[p+1], pixels[p+2]));
    }
    tile.getContext('2d').putImageData(data,0,0);
    return tile;
  });
  const bands = Array.from({length:16}, () => ({canvas:surface(), data:new Uint8ClampedArray(pixels.length)}));
  for (let y = 199; y < 418; y++) for (let x = 5; x < 505; x++) {
    if (sourceCtx.isPointInPath(stone,x,y)) continue;
    let best = Infinity, along = 0;
    for (let i = 0; i < route.length; i += 2) {
      const p = route[i], d = ((x-p.x) ** 2 + (y-p.y) ** 2) / p.width ** 2;
      if (d < best) { best = d; along = i / route.length; }
    }
    if (best > 1.5) continue;
    const p = (y * SIZE + x) * 4;
    const alpha = gold(pixels[p], pixels[p+1], pixels[p+2]) * smooth((1.5-best) / 1.2);
    const band = bands[Math.floor(along * bands.length)].data;
    band[p] = pixels[p]; band[p+1] = pixels[p+1]; band[p+2] = pixels[p+2];
    band[p+3] = Math.round(alpha * 160);
  }
  for (const band of bands) {
    band.canvas.getContext('2d').putImageData(new ImageData(band.data,SIZE,SIZE),0,0);
    delete band.data;
  }
  const grains = Array.from({length:420}, (_, i) => ({
    phase:seed(i+1), lane:(seed(i+701)-.5) * 2.2,
    size:i < 330 ? 1.2 + seed(i+902) * 3.9 : 4 + seed(i+902) * 7,
    alpha:.3 + seed(i+211) * .65, laps:i % 3 + 2, tile:tiles[i % tiles.length],
  }));

  return {
    draw(ctx, {time = 0, mode = 'idle', reduced = false} = {}) {
      const seconds = Number.isFinite(time) ? time : 0;
      const wake = mode === 'awaken';
      const t = wake ? Math.max(0,Math.min(3.2,seconds)) : ((seconds % 8) + 8) % 8;
      const phase = TAU * t / 8;
      const envelope = wake ? smooth(t / .28) * smooth((3.2-t) / .85) : 1;
      ctx.save();
      try {
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
        ctx.filter = 'none'; ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
        ctx.drawImage(image,0,0,SIZE,SIZE);
        if (reduced || envelope === 0) return;
        ctx.save();
        ctx.clip(flowClip,'evenodd');
        ctx.drawImage(plate,0,0);
        ctx.save();
        ctx.translate(255,24);
        const flutter = (Math.sin(phase * 3) + .32 * Math.sin(phase * 5)) * envelope;
        ctx.transform(1 + flutter * .0018, flutter * .009, 0, 1, 0, 0);
        ctx.drawImage(cloth,-255,-24);
        ctx.restore();

        ctx.globalCompositeOperation = 'screen';
        for (let i = 0; i < bands.length; i++) {
          const travel = fract(i / bands.length - t * (wake ? .65 : .375));
          const pulse = Math.max(0,Math.cos(travel * TAU)) ** 8;
          ctx.globalAlpha = clamp(envelope * pulse * (wake ? .46 : .28));
          ctx.drawImage(bands[i].canvas,0,0);
        }
        ctx.globalCompositeOperation = 'source-over';
        for (const grain of grains) {
          const u = fract(grain.phase + t / 8 * grain.laps * (wake ? 1.6 : 1));
          const p = route[Math.floor(u * route.length)];
          const ripple = .82 + .18 * Math.sin(TAU * (u * 3 + grain.phase));
          const offset = grain.lane * p.width * ripple;
          const x = p.x - Math.sin(p.angle) * offset;
          const y = p.y + Math.cos(p.angle) * offset;
          ctx.globalAlpha = clamp(grain.alpha * envelope * (wake ? 1 : .78));
          ctx.save(); ctx.translate(x,y); ctx.rotate(p.angle);
          ctx.drawImage(grain.tile,-grain.size/2,-grain.size/2,grain.size,grain.size);
          ctx.restore();
        }
        ctx.restore();
      } finally {
        ctx.restore();
      }
    },
  };
}
