/**
 * The designs on this device (revision 3 §3.4): localStorage `kingdown.workshop` =
 * `{ v: 1, designs }`, at most 50, newest first. Every read and write is in try/catch. An entry
 * that is not a whole design is skipped, never shown or judged, and kept in storage as it was.
 * "Revision 3" and the section numbers (§, W) cite docs/visual-design/workshop/WORKSHOP-revision-3-2026-10-07.md.
 */
import { validStored, type PieceDesign } from './model';

export const KEY = 'kingdown.workshop';
export const MAX = 50;
/** saved; full: 50 designs and this one is new (nothing is dropped); failed: the device refused. */
export type SaveResult = 'saved' | 'full' | 'failed';
type Box = Pick<Storage, 'getItem' | 'setItem'>;
const box = (): Box | null => { try { return localStorage; } catch { return null; } };

function read(s: Box | null): { designs: PieceDesign[]; bad: unknown[] } {
  try {
    const o = JSON.parse(s?.getItem(KEY) ?? 'null') as { v?: number; designs?: unknown };
    const all: unknown[] = o?.v === 1 && Array.isArray(o.designs) ? o.designs : [];
    return { designs: all.filter(validStored), bad: all.filter(d => !validStored(d)) };
  } catch { return { designs: [], bad: [] }; }
}
/** The designs, and how many entries could not be read. */
export const loadShelf = (s: Box | null = box()): { designs: PieceDesign[]; bad: number } => { const r = read(s); return { designs: r.designs, bad: r.bad.length }; };
export const loadDesigns = (s: Box | null = box()): PieceDesign[] => read(s).designs;
/** Saves `d` as the newest design (a design already there moves to the front). A new design on a full shelf is not saved. */
export function saveDesign(d: PieceDesign, s: Box | null = box()): SaveResult {
  const { designs, bad } = read(s), others = designs.filter(x => x.id !== d.id);
  if (others.length === designs.length && designs.length >= MAX) return 'full';
  return write([d, ...others].sort((a, b) => b.updated - a.updated), bad, s) ? 'saved' : 'failed';
}
export function deleteDesign(id: string, s: Box | null = box()): boolean {
  const { designs, bad } = read(s);
  return write(designs.filter(x => x.id !== id), bad, s);
}
function write(designs: PieceDesign[], bad: unknown[], s: Box | null): boolean {
  try { if (!s) return false; s.setItem(KEY, JSON.stringify({ v: 1, designs: [...designs, ...bad] })); return true; } catch { return false; }
}
