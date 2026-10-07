/**
 * Names (revision 3 §4.8): an adjective from the strongest trait and a noun from the body.
 * The name follows the design until the player types or rolls one. The letter is the first free
 * letter of the name.
 * "Revision 3" and the section numbers (§, W) cite docs/visual-design/workshop/WORKSHOP-revision-3-2026-10-07.md.
 */
import { FREE_LETTERS, PRESETS, keyOf, type PieceDesign } from './model';

type D = Pick<PieceDesign, 'squares' | 'lines' | 'rules' | 'look'>;
export const NOUN: Record<string, string> = { P: 'Squire', N: 'Rider', B: 'Seer', R: 'Tower', Q: 'Regent', A: 'Bowman', L: 'Champion', G: 'Warden', M: 'Scholar', S: 'Brute', O: 'Giant', token: 'Spirit' };
const PLAIN = ['Ash', 'Moss', 'Iron', 'Amber', 'Night', 'Dawn'];
/** The pool's names and the cards': a player's name equal to one gets " (yours)" on save. */
const TAKEN = [...PRESETS.map(p => p.name), 'King', 'Templar', 'Reaver', 'Catapult', 'Haste', 'Rage', 'Freeze', 'Mirror', 'Morph', 'Spawn'];

/** The traits of a design, strongest first. */
export function traits(d: D): string[] {
  const has = (a: string) => d.rules.some(r => r.does.a === a), out: string[] = [];
  if (has('chain')) out.push('Hungry');
  if (d.squares.some(s => s.mark === 'shoot' || s.mark === 'moveShoot')) out.push('Far-eyed');
  if (has('linesPass')) out.push('Leaping');
  if (d.lines.length) out.push('Swift');
  if (has('cannotBeTaken')) out.push('Stone');
  if (has('push')) out.push('Shoving');
  if (has('swap')) out.push('Tricky');
  if (has('becomes')) out.push('Rising');
  if (has('removedAfter')) out.push('Doomed');
  if (d.rules.some(r => r.when.on === 'zone' && r.when.zone === 'capital')) out.push('Central');
  return out;
}
const hash = (s: string): number => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
const bodyOf = (d: D, auto: string): string => (d.look.auto ? auto : d.look.body);

/** The name a design has until the player names it. */
export function autoName(d: D, auto = d.look.body): string {
  return `${traits(d)[0] ?? PLAIN[hash(keyOf(d)) % PLAIN.length]} ${NOUN[bodyOf(d, auto)]}`;
}
/** The die: another adjective, from the design's traits and the plain words. */
export function rollName(d: D, auto = d.look.body, rand = Math.random): string {
  const words = [...new Set([...traits(d), ...PLAIN])];
  return `${words[Math.floor(rand() * words.length)]} ${NOUN[bodyOf(d, auto)]}`;
}
/** A typed name that equals a pool piece or a card gets " (yours)". */
export const saveName = (name: string): string => (TAKEN.some(t => t.toLowerCase() === name.trim().toLowerCase()) ? `${name.trim().slice(0, 10)} (yours)` : name.trim());
/** The first free letter of the name, else the first free letter. */
export const letterOf = (name: string): string => [...name.toUpperCase()].find(c => FREE_LETTERS.includes(c)) ?? FREE_LETTERS[0];
/** The letter follows the name until the player taps it. A design saved before `ownLetter`: while it matches the name. */
export const letterFollows = (d: Pick<PieceDesign, 'name' | 'letter' | 'ownLetter'>): boolean =>
  !d.letter || (d.ownLetter === undefined ? d.letter === letterOf(d.name) : !d.ownLetter);
/** A tap on the letter steps to the next free one. */
export const nextLetter = (l: string): string => FREE_LETTERS[(FREE_LETTERS.indexOf(l) + 1) % FREE_LETTERS.length];
