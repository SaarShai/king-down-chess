/** RGBA frame input, measurement and registration for the animation bank pipeline. */
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';

export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
export const MATTE = [32, 42, 37];

/** Decode a PNG to raw RGBA. The metadata keeps the stored channel count, so a gate can see a missing alpha channel. */
export async function readFrame(path) {
  const bytes = await readFile(path);
  const metadata = await sharp(bytes).metadata();
  const { data, info } = await sharp(bytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { path, bytes, sha256: sha256(bytes), metadata, data, width: info.width, height: info.height };
}

export function decodeFrame(bytes) {
  return sharp(bytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true }).then(({ data, info }) => ({ data, width: info.width, height: info.height }));
}

export async function encodeFrame({ data, width, height }) {
  return sharp(data, { raw: { width, height, channels: 4 } }).png().toBuffer();
}

/** Content box and contact point of one frame. Alpha 8 is the visible threshold used by the retained alpha tools. */
export function measureFrame(frame, threshold = 8) {
  const { data, width, height } = frame;
  let top = height, bottom = -1, left = width, right = -1, borderOpaque = 0, alphaMin = 255, alphaMax = 0;
  for (let y = 0; y < height; y++) {
    const row = y * width;
    for (let x = 0; x < width; x++) {
      const alpha = data[(row + x) * 4 + 3];
      if (alpha < alphaMin) alphaMin = alpha;
      if (alpha > alphaMax) alphaMax = alpha;
      if (alpha <= threshold) continue;
      if (y < top) top = y;
      if (y > bottom) bottom = y;
      if (x < left) left = x;
      if (x > right) right = x;
    }
  }
  for (let x = 0; x < width; x++) {
    if (data[x * 4 + 3] > 0) borderOpaque++;
    if (data[((height - 1) * width + x) * 4 + 3] > 0) borderOpaque++;
  }
  for (let y = 1; y < height - 1; y++) {
    if (data[(y * width) * 4 + 3] > 0) borderOpaque++;
    if (data[(y * width + width - 1) * 4 + 3] > 0) borderOpaque++;
  }
  if (bottom < 0) return { empty: true, top, bottom, left, right, width, height, borderOpaque, alphaMin, alphaMax };
  const contentHeight = bottom - top + 1;
  const bandTop = Math.max(top, bottom - Math.max(2, Math.round(contentHeight * 0.08)));
  let weight = 0, weightedX = 0;
  for (let y = bandTop; y <= bottom; y++) for (let x = left; x <= right; x++) {
    const alpha = data[(y * width + x) * 4 + 3];
    if (alpha > threshold) { weight += alpha; weightedX += x * alpha; }
  }
  return {
    empty: false, top, bottom, left, right, width, height, borderOpaque, alphaMin, alphaMax, contentHeight,
    contentWidth: right - left + 1,
    footCenterX: weight ? weightedX / weight : (left + right) / 2,
  };
}

/**
 * A numeric matte-fringe screen. A halo is a visible rim of the interpolation matte where the figure edge should show
 * its own colour. The screen compares low-coverage exterior-adjacent pixels with the nearest opaque interior.
 */
export function matteFringe(frame, measure) {
  const { data, width, height } = frame;
  if (measure.empty) return { ratio: 0, edgePixels: 0, mattePixels: 0 };
  let edgePixels = 0, mattePixels = 0;
  const opaque = (x, y) => data[((y * width + x) * 4) + 3] > 240;
  const nearMatte = (x, y) => {
    const p = (y * width + x) * 4;
    return Math.abs(data[p] - MATTE[0]) <= 18 && Math.abs(data[p + 1] - MATTE[1]) <= 18 && Math.abs(data[p + 2] - MATTE[2]) <= 18;
  };
  const differsFromInterior = (x, y) => {
    const p = (y * width + x) * 4;
    const matteDistance = MATTE.reduce((sum, channel, i) => sum + Math.abs(data[p + i] - channel), 0);
    let nearest = Infinity, colourDistance = Infinity;
    for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height || !opaque(nx, ny)) continue;
      const distance = dx * dx + dy * dy, q = (ny * width + nx) * 4;
      const colour = Math.abs(data[p] - data[q]) + Math.abs(data[p + 1] - data[q + 1]) + Math.abs(data[p + 2] - data[q + 2]);
      if (distance < nearest) { nearest = distance; colourDistance = colour; }
      else if (distance === nearest) colourDistance = Math.min(colourDistance, colour);
    }
    return nearest < Infinity && colourDistance >= matteDistance + 72;
  };
  for (let y = 1; y < height - 1; y++) for (let x = 1; x < width - 1; x++) {
    const alpha = data[(y * width + x) * 4 + 3];
    if (alpha < 8 || alpha > 200) continue;
    let exterior = false;
    for (let dy = -2; dy <= 2 && !exterior; dy++) for (let dx = -2; dx <= 2; dx++) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      if (data[(ny * width + nx) * 4 + 3] === 0) { exterior = true; break; }
    }
    if (!exterior) continue;
    edgePixels++;
    if (nearMatte(x, y) && differsFromInterior(x, y)) mattePixels++;
  }
  return { ratio: edgePixels ? mattePixels / edgePixels : 0, edgePixels, mattePixels };
}

/**
 * Place one key on the locked canvas. A key that is already within 2 px of the locked body height and baseline keeps
 * every pixel: the artist's placement is the authority, and the shared endpoints must stay byte-identical.
 * Another key scales by body height and puts its measured foot contact on the locked pivot.
 */
export async function registerFrame(frame, geometry) {
  const measure = measureFrame(frame);
  if (measure.empty) throw Error(`Key has no visible pixels: ${frame.path}`);
  const [canvasWidth, canvasHeight] = geometry.canvas;
  const baseline = measure.bottom - geometry.pivot[1], heightDelta = measure.contentHeight - geometry.bodyHeightPx;
  if (frame.width === canvasWidth && frame.height === canvasHeight && Math.abs(baseline) <= 2 && Math.abs(heightDelta) <= 4) {
    return { frame: { data: frame.data, width: frame.width, height: frame.height }, transform: { scale: 1, dx: 0, dy: 0, identity: true, baseline, height: heightDelta } };
  }
  const scale = geometry.bodyHeightPx / measure.contentHeight;
  const width = Math.max(1, Math.round(frame.width * scale)), height = Math.max(1, Math.round(frame.height * scale));
  const resized = await sharp(frame.data, { raw: { width: frame.width, height: frame.height, channels: 4 } })
    .resize(width, height, { fit: 'fill', kernel: 'lanczos3' }).ensureAlpha().raw().toBuffer();
  let dx = Math.round(geometry.pivot[0] - measure.footCenterX * scale);
  let dy = geometry.pivot[1] - Math.round(measure.bottom * scale);
  const place = (data, dx, dy) => {
    const x0 = Math.max(0, dx), y0 = Math.max(0, dy), x1 = Math.min(canvasWidth, dx + width), y1 = Math.min(canvasHeight, dy + height);
    if (x1 <= x0 || y1 <= y0) throw Error(`Registered key falls outside the locked canvas: ${frame.path}`);
    for (let y = y0; y < y1; y++) {
      const source = ((y - dy) * width + (x0 - dx)) * 4, target = (y * canvasWidth + x0) * 4;
      resized.copy(data, target, source, source + (x1 - x0) * 4);
    }
  };
  let data = Buffer.alloc(canvasWidth * canvasHeight * 4);
  place(data, dx, dy);
  for (let attempt = 0; attempt < 3; attempt++) {
    const delta = measureFrame({ data, width: canvasWidth, height: canvasHeight }).bottom - geometry.pivot[1];
    if (delta === 0) break;
    dy -= delta;
    data = Buffer.alloc(canvasWidth * canvasHeight * 4);
    place(data, dx, dy);
  }
  for (let i = 0; i < data.length; i += 4) if (data[i + 3] === 0) { data[i] = 0; data[i + 1] = 0; data[i + 2] = 0; }
  return { frame: { data, width: canvasWidth, height: canvasHeight }, transform: { scale, dx, dy, identity: false, baseline, height: heightDelta } };
}

export function samePixels(left, right) {
  if (left.width !== right.width || left.height !== right.height) return false;
  return left.data.equals(right.data);
}
