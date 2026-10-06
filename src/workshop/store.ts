/**
 * The designs on this device (docs/WORKSHOP.md §3.4): localStorage `kingdown.workshop` =
 * `{ v: 1, designs }`, at most 50, newest first. Every read and write is in try/catch.
 */
import type { PieceDesign } from './model';

export const KEY = 'kingdown.workshop';
export const MAX = 50;
type Box = Pick<Storage, 'getItem' | 'setItem'>;
const box = (): Box | null => { try { return localStorage; } catch { return null; } };

export function loadDesigns(s: Box | null = box()): PieceDesign[] {
  try {
    const o = JSON.parse(s?.getItem(KEY) ?? 'null') as { v?: number; designs?: unknown };
    return o?.v === 1 && Array.isArray(o.designs) ? (o.designs as PieceDesign[]).filter(d => d && d.kind === 'piece' && typeof d.id === 'string') : [];
  } catch { return []; }
}
/** Saves `d` as the newest design (a design already there moves to the front). False when the device refused. */
export function saveDesign(d: PieceDesign, s: Box | null = box()): boolean {
  const list = [d, ...loadDesigns(s).filter(x => x.id !== d.id)].sort((a, b) => b.updated - a.updated).slice(0, MAX);
  return write(list, s);
}
export const deleteDesign = (id: string, s: Box | null = box()): boolean => write(loadDesigns(s).filter(x => x.id !== id), s);
function write(designs: PieceDesign[], s: Box | null): boolean {
  try { if (!s) return false; s.setItem(KEY, JSON.stringify({ v: 1, designs })); return true; } catch { return false; }
}
