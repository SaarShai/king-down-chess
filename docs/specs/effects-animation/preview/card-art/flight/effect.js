const SIZE = 512;
const TAU = Math.PI * 2;
const clamp = value => Math.max(0, Math.min(1, value));
const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };

function canvas() {
  const surface = document.createElement('canvas');
  surface.width = surface.height = SIZE;
  return surface;
}

// Source colours supply the edge. Bounds only choose the painted object.
function component(pixels, bounds, seed, test) {
  const mask = new Float32Array(SIZE * SIZE);
  const queue = [seed[1] * SIZE + seed[0]];
  mask[queue[0]] = 1;
  for (let head = 0; head < queue.length; head++) {
    const at = queue[head], x = at % SIZE;
    for (const next of [x ? at - 1 : -1, x < SIZE - 1 ? at + 1 : -1, at - SIZE, at + SIZE]) {
      if (next < 0 || next >= mask.length || mask[next]) continue;
      const nx = next % SIZE, ny = Math.floor(next / SIZE), p = next * 4;
      if (!bounds(nx, ny) || !test(pixels[p], pixels[p + 1], pixels[p + 2], nx, ny)) continue;
      mask[next] = 1;
      queue.push(next);
    }
  }
  // Include the antialiased painted edge, with a one-pixel soft outer join.
  const edge = mask.slice();
  for (const at of queue) {
    const x = at % SIZE, y = Math.floor(at / SIZE);
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || nx >= SIZE || ny < 0 || ny >= SIZE || !bounds(nx, ny)) continue;
      const next = ny * SIZE + nx;
      edge[next] = Math.max(edge[next], Math.max(Math.abs(dx), Math.abs(dy)) < 2 ? 1 : .3);
    }
  }
  return edge;
}

// shortcut: adjacent paint fills the few exposed pixels; more travel needs a clean plate.
function separate(pixels, mask) {
  const plate = canvas(), layer = canvas();
  const back = new Uint8ClampedArray(pixels.length), front = new Uint8ClampedArray(pixels.length);
  const nearest = new Int32Array(mask.length).fill(-1), queue = new Int32Array(mask.length);
  let head = 0, end = 0;
  for (let at = 0; at < mask.length; at++) {
    if (mask[at] === 0) { nearest[at] = at; queue[end++] = at; }
  }
  while (head < end) {
    const at = queue[head++], x = at % SIZE;
    for (const next of [x ? at - 1 : -1, x < SIZE - 1 ? at + 1 : -1, at - SIZE, at + SIZE]) {
      if (next < 0 || next >= mask.length || nearest[next] !== -1) continue;
      nearest[next] = nearest[at]; queue[end++] = next;
    }
  }
  for (let at = 0; at < mask.length; at++) {
    if (!mask[at]) continue;
    const p = at * 4, from = nearest[at] * 4;
    for (let c = 0; c < 3; c++) { back[p + c] = pixels[from + c]; front[p + c] = pixels[p + c]; }
    back[p + 3] = front[p + 3] = Math.round(255 * clamp(mask[at]));
  }
  plate.getContext('2d').putImageData(new ImageData(back, SIZE, SIZE), 0, 0);
  layer.getContext('2d').putImageData(new ImageData(front, SIZE, SIZE), 0, 0);
  return { plate, layer };
}

function distance(points, x, y) {
  let nearest = Infinity;
  for (let i = 1; i < points.length; i++) {
    const [ax, ay] = points[i - 1], [bx, by] = points[i];
    const dx = bx - ax, dy = by - ay;
    const t = clamp(((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy));
    nearest = Math.min(nearest, Math.hypot(x - ax - t * dx, y - ay - t * dy));
  }
  return nearest;
}

export function createEffect(image) {
  const source = canvas(), sourceCtx = source.getContext('2d', { willReadFrequently:true });
  sourceCtx.drawImage(image, 0, 0, SIZE, SIZE);
  const pixels = sourceCtx.getImageData(0, 0, SIZE, SIZE).data;
  const red = (r, g, b) => r > g * 1.32 && r > b * 1.24 && r - g > 25 && g < 175;
  const gold = (r, g, b) => r > g * 1.1 && r > b * 1.25 && r - g > 10;
  const left = separate(pixels, component(pixels,
    (x, y) => x > 48 && x < 238 && y > 4 && y < 194, [111, 70],
    (r, g, b, x, y) => red(r, g, b) || (x < 107 && y < 66 && gold(r, g, b))));
  const right = separate(pixels, component(pixels,
    (x, y) => x > 310 && x < 458 && y > 278 && y < 385, [365, 315],
    (r, g, b, x, y) => red(r, g, b) || (x > 396 && y > 345 && gold(r, g, b))));

  const upper = [[318,59],[364,70],[404,91],[423,119],[423,145],[407,176],[377,199],[328,218],[308,223]];
  const lower = [[175,235],[139,253],[99,273],[77,294],[74,316],[94,338],[137,357],[191,372],[256,383],[326,391]];
  const wind = [upper, lower].map((guide, index) => {
    const mask = new Float32Array(SIZE * SIZE);
    for (let y = 45; y < 398; y++) for (let x = 45; x < 450; x++) {
      if ((index === 0 && (x < 307 || y > 233)) || (index === 1 && (y < 226 || x > 337))) continue;
      const near = distance(guide, x, y);
      if (near > 19) continue;
      const p = (y * SIZE + x) * 4, r = pixels[p], g = pixels[p + 1], b = pixels[p + 2];
      mask[y * SIZE + x] = smooth((r - 180) / 40) * smooth((r - g - 8) / 17)
        * smooth((g - b - 9) / 18) * smooth((g - 170) / 32) * smooth((19 - near) / 5);
    }
    return separate(pixels, mask);
  });
  const frame = canvas(), paint = frame.getContext('2d');
  const cream = (r, g, b) => r > 180 && r - g > 12 && g > b + 12;
  const leaves = [
    { x:336, y:149, rx:12, ry:8, dx:13, dy:-9, turn:-.12, offset:0 },
    { x:374, y:105, rx:7, ry:10, dx:5, dy:12, turn:.15, offset:1.1 },
    { x:162, y:215, rx:11, ry:7, dx:-13, dy:7, turn:-.14, offset:2.2 },
    { x:79, y:328, rx:7, ry:10, dx:7, dy:12, turn:.12, offset:3.3 },
  ].map(leaf => ({ ...leaf, ...separate(pixels, component(pixels,
    (x, y) => Math.abs(x - leaf.x) < leaf.rx && Math.abs(y - leaf.y) < leaf.ry,
    [leaf.x, leaf.y], cream)) }));

  return {
    draw(ctx, { time = 0, mode = 'idle', reduced = false } = {}) {
      const seconds = Number.isFinite(time) ? time : 0;
      const wake = mode === 'awaken';
      const t = wake ? Math.max(0, Math.min(3.2, seconds)) : ((seconds % 8) + 8) % 8;
      ctx.save();
      try {
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(image, 0, 0, SIZE, SIZE);
        if (reduced || t === 0 || (wake && t === 3.2)) return;
        const phase = (wake ? t / 3.2 : t / 8) * TAU;
        const envelope = wake ? Math.sin(Math.PI * t / 3.2) ** 2 : 1;
        const breath = Math.sin(phase), flutter = Math.sin(phase * 2);
        const leftShear = envelope * (.031 * breath + .010 * flutter);
        const rightShear = envelope * (.039 * (Math.sin(phase - .35) + Math.sin(.35)) + .012 * Math.sin(phase * 3));

        paint.clearRect(0, 0, SIZE, SIZE);
        paint.drawImage(source, 0, 0);
        for (const part of [left, right, ...wind, ...leaves]) paint.drawImage(part.plate, 0, 0);
        // One affine source layer per end keeps all brush marks continuous.
        paint.save();
        paint.transform(1, leftShear, 0, 1, 0, -238 * leftShear);
        paint.drawImage(left.layer, 0, 0);
        paint.restore();
        paint.save();
        paint.transform(1, rightShear, 0, 1, 0, -310 * rightShear);
        paint.drawImage(right.layer, 0, 0);
        paint.restore();
        for (let i = 0; i < wind.length; i++) {
          paint.save();
          const turn = envelope * .014 * (Math.sin(phase + i * .7) - Math.sin(i * .7));
          const x = i ? 232 : 290, y = i ? 243 : 222;
          paint.translate(x, y); paint.rotate(turn); paint.translate(-x, -y);
          paint.drawImage(wind[i].layer, 0, 0);
          paint.restore();
        }
        for (const leaf of leaves) {
          const drift = envelope * (Math.sin(phase + leaf.offset) - Math.sin(leaf.offset));
          paint.save();
          paint.translate(leaf.x + leaf.dx * drift, leaf.y + leaf.dy * drift);
          paint.rotate(leaf.turn * drift); paint.translate(-leaf.x, -leaf.y);
          paint.drawImage(leaf.layer, 0, 0);
          paint.restore();
        }
        ctx.globalAlpha = clamp(wake ? envelope : smooth(Math.sin(Math.PI * t / 8) * 5));
        ctx.drawImage(frame, 0, 0);
      } finally { ctx.restore(); }
    },
  };
}
