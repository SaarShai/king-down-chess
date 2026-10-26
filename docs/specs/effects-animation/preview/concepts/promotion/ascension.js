// Authored dust masses use pigment from the painted board. No figure is distorted.
export const ARRIVAL_MS = 100;
export const ASCENSION_MS = 740;
export const DURATION_MS = ARRIVAL_MS + ASCENSION_MS;
export const clamp = value => Math.max(0, Math.min(1, value));
export const ease = value => { const t = clamp(value); return t * t * (3 - 2 * t); };

const pigment = document.createElement('canvas');
pigment.width = pigment.height = 160;
const brushes = new Map();
export async function loadPigment() {
  const image = new Image();
  image.src = '/docs/2d-first-pieces/board-art/stone-board.webp';
  await image.decode();
  const ctx = pigment.getContext('2d', { willReadFrequently: true });
  const tile = image.naturalWidth / 8;
  ctx.drawImage(image, tile * .12, tile * .12, tile * .7, tile * .7, 0, 0, 160, 160);
  const pixels = ctx.getImageData(0, 0, 160, 160);
  for (let i = 0; i < pixels.data.length; i += 4) {
    const tone = pixels.data[i] / 255;
    pixels.data[i] = 150 + 105 * tone;
    pixels.data[i + 1] = 74 + 141 * tone;
    pixels.data[i + 2] = 16 + 128 * tone;
    // Static pigment breaks up the mass. It is texture, never a particle simulation.
    const x = (i / 4) % 160, y = Math.floor(i / 640);
    const noise = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    const grain = noise - Math.floor(noise);
    pixels.data[i + 3] = 255 * clamp((tone - .67) * 5) * (.06 + .94 * grain * grain);
  }
  ctx.putImageData(pixels, 0, 0);
  for (const key of [-1, 1, 'fold', 'flake']) brushes.set(key, makeBrush(key));
}

export function frameAt(progress, reduced) {
  const ms = (reduced ? 1 : clamp(progress)) * DURATION_MS;
  const travel = ease(ms / ARRIVAL_MS);
  const t = clamp((ms - ARRIVAL_MS) / ASCENSION_MS);
  // The new figure is opaque at 42% of the transformation, before its midpoint.
  const reveal = ease((t - .13) / .29);
  return { travel, t, reveal, pawn: 1 - ease((t - .27) / .18), material: reduced ? 0 : ease(t / .16) * (1 - ease((t - .42) / .34)) };
}

function dustPath(ctx, side) {
  ctx.beginPath();
  if (side < 0) {
    ctx.moveTo(-35, 3);
    ctx.bezierCurveTo(-53, -15, -50, -36, -39, -48);
    ctx.bezierCurveTo(-58, -62, -35, -76, -38, -93);
    ctx.bezierCurveTo(-43, -110, -28, -109, -28, -119);
    ctx.bezierCurveTo(-16, -130, -8, -121, -12, -112);
    ctx.bezierCurveTo(0, -114, 0, -102, -3, -97);
    ctx.bezierCurveTo(10, -79, -16, -67, -7, -48);
    ctx.bezierCurveTo(6, -34, -2, -14, 7, 2);
    ctx.bezierCurveTo(-5, -4, -25, 10, -35, 3);
  } else {
    ctx.moveTo(-6, 2);
    ctx.bezierCurveTo(10, -11, -6, -27, 8, -45);
    ctx.bezierCurveTo(23, -61, 8, -73, 15, -90);
    ctx.bezierCurveTo(20, -104, 8, -113, 15, -120);
    ctx.bezierCurveTo(25, -125, 33, -115, 28, -108);
    ctx.bezierCurveTo(44, -110, 45, -99, 37, -94);
    ctx.bezierCurveTo(28, -77, 55, -72, 43, -55);
    ctx.bezierCurveTo(37, -42, 56, -23, 39, -6);
    ctx.bezierCurveTo(29, 4, 6, 12, -6, 2);
  }
  ctx.closePath();
}

// Texture is clipped inside a few broad, uneven brush forms; the edges remain soft pigment.
function makeBrush(key) {
  const brush = document.createElement('canvas'); brush.width = 256; brush.height = 340;
  const ctx = brush.getContext('2d'); ctx.scale(2, 2); ctx.translate(64, 154);
  if (typeof key === 'number') dustPath(ctx, key);
  else if (key === 'fold') {
    ctx.beginPath();ctx.moveTo(-43, 9);
    ctx.bezierCurveTo(-44, -8, -29, -5, -27, -17);
    ctx.bezierCurveTo(-17, -8, -12, -23, 1, -16);
    ctx.bezierCurveTo(17, -23, 22, -8, 38, -13);
    ctx.bezierCurveTo(47, -2, 36, 11, 24, 9);
    ctx.bezierCurveTo(6, 20, -2, 5, -18, 15);
    ctx.bezierCurveTo(-26, 20, -36, 12, -43, 9);ctx.closePath();
  } else {
    ctx.beginPath();ctx.moveTo(-10, 0);
    ctx.bezierCurveTo(-4.5, -8, 5, -2.5, 10, -5);
    ctx.bezierCurveTo(6, 6, -1, 6.5, -10, 0);ctx.closePath();
  }
  ctx.clip();
  const gold = ctx.createLinearGradient(-34, 2, 22, -133);
  gold.addColorStop(0, '#dfb557');
  gold.addColorStop(.3, '#ffe4a8');
  gold.addColorStop(.65, '#f8d27e');
  gold.addColorStop(1, '#d29b35');
  ctx.fillStyle = gold;
  ctx.fillRect(-64, -154, 128, 170);
  ctx.globalCompositeOperation = 'destination-in';
  ctx.fillStyle = ctx.createPattern(pigment, 'repeat');
  ctx.fillRect(-64, -154, 128, 170);
  return brush;
}
function paint(ctx, key, opacity) {
  if (opacity <= 0 || !brushes.has(key)) return;
  ctx.save(); ctx.globalAlpha *= opacity;
  ctx.drawImage(brushes.get(key), -64, -154, 128, 170);
  ctx.restore();
}

export function drawVeil(ctx, foot, frame, front) {
  const { t, material } = frame;
  if (material <= 0 || t >= 1) return;
  ctx.save();
  ctx.translate(foot.x, foot.y);
  if (!front) {
    // The rear masses rise from the soles and open apart as the chosen silhouette resolves.
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(side * ease((t - .3) / .32) * 7, 24 * (1 - ease(t / .3)) - 8 * ease(t / .6));
      ctx.filter = 'blur(3px)';
      paint(ctx, side, material * 1.1);
      ctx.filter = 'none';
      ctx.translate(side * 3, -3);
      paint(ctx, side, material * .8);
      ctx.restore();
    }
  } else {
    // One soft front fold climbs across the pawn, then drops below the new face.
    const y = -20 - 73 * ease(t / .42);
    ctx.translate(0, y);
    ctx.filter = 'blur(1.3px)';
    paint(ctx, 'fold', material * (1 - ease((t - .29) / .17)) * 1.4);
  }
  ctx.restore();
}

const flakes = [ { x: -33, top: -105, drift: -6, size: 10, delay: .38, turn: -.6 }, { x: 31, top: -84, drift: 8, size: 8, delay: .43, turn: .6 }, { x: 13, top: -132, drift: 12, size: 11, delay: .48, turn: -.4 } ];
export function drawFlakes(ctx, foot, frame) {
  for (const flake of flakes) {
    const u = clamp((frame.t - flake.delay) / (1 - flake.delay));
    if (u <= 0 || u >= 1) continue;
    ctx.save();
    ctx.translate(foot.x + flake.x + flake.drift * u + Math.sin(u * Math.PI * 2) * 3, foot.y + flake.top * (1 - u * u));
    ctx.rotate(flake.turn + Math.sin(u * 5) * .45);
    ctx.scale(flake.size / 10, flake.size / 10);
    paint(ctx, 'flake', ease(u / .14) * (1 - ease((u - .55) / .45)));
    ctx.restore();
  }
}
