/** Movement keys use the shipped facing rest, including its runtime pivot and scale. */
import { readFile } from 'node:fs/promises';
import { measureFrame, sha256 } from './frames.mjs';

export async function movementGeometry(geometry, sources, facing) {
  const rest = sources[0];
  if (sources.at(-1).sha256 !== rest.sha256) throw Error('Movement must start and end on the same shipped rest');
  const bytes = await readFile(geometry.authority.path);
  if (sha256(bytes) !== geometry.authority.sha256 || geometry.authority.kind !== 'runtime-manifest') throw Error('Movement needs its unchanged runtime manifest');
  const manifest = JSON.parse(bytes), scale = manifest.sourceToRuntimeScale;
  const banks = manifest.banks.filter(bank => bank.character === geometry.character && bank.army === geometry.army);
  const matches = banks.filter(bank => [
    [bank.frames?.[0], bank.kind === 'turn' ? bank.from : bank.facing],
    [bank.frames?.at(-1), bank.kind === 'turn' ? bank.to : bank.facing],
  ].some(([frame, direction]) => direction === facing && frame?.sourceSha256 === rest.sha256));
  if (!matches.length) throw Error(`Movement rest is not a shipped ${facing} endpoint`);
  const transforms = matches.map(bank => JSON.stringify([bank.pivot, bank.registrationHeightPx, bank.boardScale]));
  if (new Set(transforms).size !== 1) throw Error('Shipped rest has inconsistent runtime transforms');
  const bank = matches[0];
  if (!Number.isFinite(scale) || scale <= 0 || !Array.isArray(bank.pivot) || bank.boardScale != null) throw Error('Unsupported shipped rest transform');
  const pivot = bank.pivot.map(n => n / scale), height = bank.registrationHeightPx / scale;
  const restMeasure = measureFrame(rest);
  if (restMeasure.empty || !Number.isFinite(height) || pivot.some(n => !Number.isInteger(n))) throw Error('Invalid shipped rest geometry');

  // Whole source canvases plus a margin leave room for interpolation beyond the key silhouettes.
  let left = 0, top = 0, right = rest.width, bottom = rest.height;
  for (const source of sources.slice(1, -1)) {
    const m = measureFrame(source);
    if (m.empty) throw Error(`Key has no visible pixels: ${source.path}`);
    const factor = restMeasure.contentHeight / m.contentHeight;
    const dx = Math.round(restMeasure.footCenterX - m.footCenterX * factor);
    const dy = restMeasure.bottom - Math.round(m.bottom * factor);
    left = Math.min(left, dx); top = Math.min(top, dy);
    right = Math.max(right, dx + Math.round(source.width * factor));
    bottom = Math.max(bottom, dy + Math.round(source.height * factor));
  }
  const even = n => Math.ceil(n / 2) * 2;
  const offset = [even(64 - left), even(64 - top)];
  const canvas = [even(right + offset[0] + 64), even(bottom + offset[1] + 64)];
  return { canvas, pivot: pivot.map((n, i) => n + offset[i]), bodyHeightPx: restMeasure.contentHeight,
    footCenterX: restMeasure.footCenterX + offset[0], baseline: restMeasure.bottom + offset[1], registrationHeightPx: height, rest, offset, endpoint: { bank: bank.id, facing } };
}

export function padRest({ rest, canvas, offset }) {
  const data = Buffer.alloc(canvas[0] * canvas[1] * 4);
  for (let y = 0; y < rest.height; y++) rest.data.copy(data, ((y + offset[1]) * canvas[0] + offset[0]) * 4, y * rest.width * 4, (y + 1) * rest.width * 4);
  return { data, width: canvas[0], height: canvas[1] };
}

export function matchesRest(frame, rest, offset) {
  if (offset[0] < 0 || offset[1] < 0 || offset[0] + rest.width > frame.width || offset[1] + rest.height > frame.height) return false;
  for (let y = 0; y < frame.height; y++) for (let x = 0; x < frame.width; x++) {
    const i = (y * frame.width + x) * 4, rx = x - offset[0], ry = y - offset[1];
    if (rx >= 0 && rx < rest.width && ry >= 0 && ry < rest.height) {
      const j = (ry * rest.width + rx) * 4;
      for (let c = 0; c < 4; c++) if (frame.data[i + c] !== rest.data[j + c]) return false;
    } else if (frame.data[i + 3] !== 0) return false;
  }
  return true;
}
