/**
 * Procedural voxel piece models (placeholders until the STL sculpts are voxelized).
 * Grid: 1 voxel = 0.1 tile; x/z in [-4, 4), y up from 0. A box is [x, y, z, w, h, d, paletteKey].
 * Pieces face -z (white's "forward"); black groups are rotated 180°.
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { A, B, C, Color, G, K, L, M, N, O, P, PieceType, Q, R, S, V } from '../rules/engine';

export const VOXEL = 0.16;
type Box = [x: number, y: number, z: number, w: number, h: number, d: number, c: string];

const base: Box = [-2, 0, -2, 4, 1, 4, 's'];
const body = (h: number): Box => [-1, 1, -1, 2, h, 2, 'm'];
const head = (y: number): Box => [-1, y, -1, 2, 2, 2, 'm'];

/**
 * Procedural placeholders. Lab-only types (ogre, catapult) have no entry and no sculpt: the
 * renderer falls back to `head()` on a `base` — a plain box with the piece's letter over it — so a
 * `?fen=` carrying one renders instead of throwing.
 */
export const MODELS: Partial<Record<PieceType, Box[]>> = {
  [P]: [base, body(3), head(4), [2, 1, 0, 1, 7, 1, 'w'], [2, 8, 0, 1, 1, 1, 'i']],
  [N]: [base, body(4), [-1, 5, -3, 2, 2, 4, 'm'], [-1, 7, -3, 2, 1, 2, 'm'], [-1, 8, -3, 1, 1, 1, 's'], [0, 8, -3, 1, 1, 1, 's'], [-1, 6, -4, 1, 1, 1, 'e'], [0, 6, -4, 1, 1, 1, 'e'], [2, 1, 0, 1, 6, 1, 'w'], [2, 7, 0, 1, 1, 1, 'i']],
  [B]: [base, body(5), [-1, 6, -1, 2, 2, 2, 'a'], [0, 8, 0, 1, 2, 1, 'a'], [-1, 9, 0, 3, 1, 1, 'a']],
  [R]: [base, [-2, 1, -2, 4, 5, 4, 'm'], [-2, 6, -2, 1, 1, 1, 'm'], [1, 6, -2, 1, 1, 1, 'm'], [-2, 6, 1, 1, 1, 1, 'm'], [1, 6, 1, 1, 1, 1, 'm'], [-1, 2, -3, 2, 2, 1, 'k']],
  [Q]: [base, [-2, 1, -2, 4, 2, 4, 'm'], body(7), [-1, 8, -1, 2, 1, 2, 'a'], [-1, 9, -1, 1, 1, 1, 'a'], [0, 9, 0, 1, 1, 1, 'a'], [-1, 9, 0, 1, 1, 1, 'a'], [0, 9, -1, 1, 1, 1, 'a'], [0, 10, 0, 1, 1, 1, 'e']],
  [K]: [base, body(6), [-2, 4, -1, 4, 2, 2, 'm'], [-1, 7, -1, 2, 1, 2, 'a'], [0, 8, 0, 1, 3, 1, 'a'], [-1, 9, 0, 3, 1, 1, 'a'], [-2, 1, 0, 1, 3, 1, 's'], [1, 1, 0, 1, 3, 1, 's']],
  [A]: [base, body(4), head(5), [-1, 6, -1, 2, 1, 2, 's'], [2, 1, 0, 1, 6, 1, 'w'], [3, 2, 0, 1, 4, 1, 'l'], [1, 4, -3, 1, 1, 3, 'w']],
  [L]: [base, [-2, 1, -1, 4, 4, 2, 'm'], head(5), [-1, 7, -1, 2, 1, 2, 'i'], [-4, 1, -1, 1, 4, 3, 'a'], [-4, 2, 0, 1, 2, 1, 'e'], [3, 1, 0, 1, 6, 1, 'w'], [2, 6, -1, 3, 2, 2, 'i']],
  [G]: [[-3, 0, -3, 6, 1, 6, 's'], [-3, 1, -2, 6, 4, 4, 'm'], head(5), [-3, 1, -3, 6, 5, 1, 'i'], [-2, 6, -2, 4, 1, 4, 'i'], [-1, 3, -4, 2, 1, 1, 'a']],
  [M]: [base, body(3), head(4), [-2, 6, -2, 4, 1, 4, 'a'], [0, 7, 0, 1, 1, 1, 'a'], [2, 1, 0, 1, 6, 1, 'w'], [2, 7, 0, 1, 1, 1, 'g'], [-1, 5, -2, 2, 1, 1, 'l']],
  [S]: [base, [-2, 1, -2, 4, 3, 3, 'm'], [-2, 2, -4, 4, 3, 2, 'm'], [-2, 1, -4, 4, 1, 1, 'k'], [-2, 2, -5, 1, 1, 1, 'l'], [1, 2, -5, 1, 1, 1, 'l'], [-2, 4, -4, 1, 1, 1, 'e'], [1, 4, -4, 1, 1, 1, 'e'], [-1, 4, -1, 1, 1, 1, 'k'], [0, 4, 0, 1, 1, 1, 'k'], [-1, 4, 1, 1, 1, 1, 'k']],
};

const SHARED: Record<string, number> = { k: 0x222034, w: 0x8f563b, i: 0x9badb7, e: 0xd95763, l: 0xffffff, g: 0x99e550 };
/**
 * Per-army palette: m = main, s = shade, a = accent. Index = Color.
 * The two armies differ in luminance, not just hue (docs/research/pixel-styles.md §2.4):
 * bone-white vs slate. Piece *type* is told apart by the shared per-voxel accents, not by these.
 */
export const ARMY = [
  { m: 0xf1e9d6, s: 0xcfc4a8, a: 0xfbf236 },
  { m: 0x4a4652, s: 0x8a8698, a: 0xac3232 },
];

export const paletteColor = (key: string, c: Color): number => (ARMY[c] as Record<string, number>)[key] ?? SHARED[key] ?? 0xff00ff;

/** Voxelized sculpts (tools/voxelize.py). Present entries replace the procedural model of that type. */
export interface VoxelModel {
  size: [number, number, number];
  voxels: [number, number, number][];
  /** Optional per-voxel paint (same order as `voxels`): u8 shade, and an sRGB accent or 0. */
  shade?: number[];
  accent?: (number[] | 0)[];
}
export const MODEL_URLS: Partial<Record<PieceType, string>> = {
  [P]: 'models/pawn.json', [N]: 'models/knight.json', [B]: 'models/bishop.json', [R]: 'models/rook.json', [Q]: 'models/queen.json', [K]: 'models/king.json',
  [A]: 'models/archer.json', [L]: 'models/paladin.json', [G]: 'models/guard.json', [M]: 'models/maester.json', [S]: 'models/beast.json',
};
/** Height of each piece type in tiles (voxel model, and the sprite billboard). A type with no art gets 1.1. */
export const TARGET_HEIGHT: Record<PieceType, number> = { [P]: 0.85, [N]: 1.1, [B]: 1.2, [R]: 1.05, [Q]: 1.4, [K]: 1.55, [A]: 1.15, [L]: 1.3, [G]: 1.1, [M]: 1.1, [S]: 1.05, [O]: 1.1, [C]: 1.1, [V]: 1.1 };
const loaded = new Map<PieceType, VoxelModel>();
/** Use the voxelized sculpts (when loaded) instead of the procedural placeholders. */
export let useSculpts = true;
export function setUseSculpts(on: boolean): void { useSculpts = on; }

export async function loadModels(base = import.meta.env.BASE_URL): Promise<void> {
  await Promise.all(Object.entries(MODEL_URLS).map(async ([t, url]) => {
    const res = await fetch(base + url).catch(() => null);
    if (res?.ok) loaded.set(+t as PieceType, await res.json());
  }));
}

const FACES: [number, number, number, number[][]][] = [
  [1, 0, 0, [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]]],
  [-1, 0, 0, [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]]],
  [0, 1, 0, [[0, 1, 0], [0, 1, 1], [1, 1, 1], [1, 1, 0]]],
  [0, -1, 0, [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]]],
  [0, 0, 1, [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]]],
  [0, 0, -1, [[0, 0, 0], [0, 1, 0], [1, 1, 0], [1, 0, 0]]],
];

/** Face-culled mesh from a voxel model: only faces touching empty space are emitted. */
function voxelGeometry(model: VoxelModel, c: Color, height: number): THREE.BufferGeometry {
  const s = height / model.size[1];
  const key = (x: number, y: number, z: number) => `${x},${y},${z}`;
  const filled = new Set(model.voxels.map(v => key(...v)));
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const [x, , z] of model.voxels) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z); }
  const ox = -(minX + maxX + 1) / 2, oz = -(minZ + maxZ + 1) / 2;
  const main = new THREE.Color(ARMY[c].m), shade = new THREE.Color(ARMY[c].s), paint = new THREE.Color();
  const pos: number[] = [], nor: number[] = [], col: number[] = [], idx: number[] = [];
  for (let vi = 0; vi < model.voxels.length; vi++) {
    const [x, y, z] = model.voxels[vi];
    // Paint order: accent voxel → army base dimmed by the shade byte → (unpainted model) darker base rows.
    const rgb = model.accent?.[vi];
    const color = rgb ? paint.setRGB(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255, THREE.SRGBColorSpace)
      : model.shade ? paint.copy(main).multiplyScalar(0.6 + (0.4 * model.shade[vi]) / 255)
        : y < 2 ? shade : main;
    // Smooth normal = direction of empty space around the voxel (occupancy gradient), so voxel
    // staircases shade like the original sculpt instead of flickering between face normals.
    let gx = 0, gy = 0, gz = 0;
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) {
      if ((dx || dy || dz) && !filled.has(key(x + dx, y + dy, z + dz))) { gx += dx; gy += dy; gz += dz; }
    }
    const gl = Math.hypot(gx, gy, gz);
    for (const [nx, ny, nz, corners] of FACES) {
      if (filled.has(key(x + nx, y + ny, z + nz))) continue;
      const i0 = pos.length / 3;
      const [sx, sy, sz] = gl > 0 ? [gx / gl, gy / gl, gz / gl] : [nx, ny, nz];
      for (const [cx, cy, cz] of corners) {
        pos.push((x + cx + ox) * s, (y + cy) * s, (z + cz + oz) * s);
        nor.push(sx, sy, sz);
        col.push(color.r, color.g, color.b);
      }
      idx.push(i0, i0 + 1, i0 + 2, i0, i0 + 2, i0 + 3);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  return g;
}

const cache = new Map<string, THREE.BufferGeometry>();

/** Merged, vertex-coloured geometry for a piece type and army (cached). */
export function pieceGeometry(t: PieceType, c: Color): THREE.BufferGeometry {
  const key = `${t}:${c}:${useSculpts ? 's' : 'p'}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const model = useSculpts ? loaded.get(t) : undefined;
  if (model) {
    const g = voxelGeometry(model, c, TARGET_HEIGHT[t]);
    cache.set(key, g);
    return g;
  }
  const parts = (MODELS[t] ?? [base, body(3), head(4)]).map(([x, y, z, w, h, d, ck]) => {
    const g = new THREE.BoxGeometry(w * VOXEL, h * VOXEL, d * VOXEL);
    g.translate((x + w / 2) * VOXEL, (y + h / 2) * VOXEL, (z + d / 2) * VOXEL);
    const col = new THREE.Color(paletteColor(ck, c));
    const n = g.attributes.position.count;
    const colors = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) colors.set([col.r, col.g, col.b], i * 3);
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return g;
  });
  const merged = mergeGeometries(parts, false);
  if (!merged) throw new Error('mergeGeometries failed');
  parts.forEach(p => p.dispose());
  cache.set(key, merged);
  return merged;
}
