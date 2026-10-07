/**
 * `lookOf(design, verdict)`: the stage as pure data (docs/WORKSHOP.md §5.1, §5.2, §5.4): the body,
 * the metal, the cracks, the rim, the floor marks and the props. art.ts draws it; the tests read it.
 */
import { selectedFigure, figureById } from './figures';
import type { KingName } from '../rules/engine';
import { presetOf, type Body, type Dir, type Mark, type PieceDesign, type Zone } from './model';
import { autoBody, type Metal, type Verdict } from './judge';

type D = Pick<PieceDesign, 'squares' | 'lines' | 'rules' | 'look' | 'letter'>;
export interface FloorMark { x: number; y: number; mark: Mark; hatched: boolean }
export interface StageLook {
  figure?: string; body: Body | 'token'; army: 0 | 1; glow: KingName | null; letter: string;
  metal: Metal; cracks: 'none' | 'hairline' | 'cracked' | 'dashed' | 'wide';
  /** 0.94 to 1.08 with the worth [A4]. */
  scale: number;
  /** Possibly too weak: the figure at 90% brightness. */
  dim: boolean;
  /** The rim's colour: the glow's, else the strongest stat's. */
  rim: string;
  marks: FloorMark[]; lines: Dir[]; ghostLines: Dir[];
  ghost: Body | 'K' | null; partner: Body | 'king' | 'friend' | 'enemy' | null; zone: Zone | null; hourglass: number | null; cardBack: boolean;
  footprints: boolean; passOver: 'own' | 'any' | null; chain: boolean; shield: 'feet' | 'dome' | null; push: 'follow' | 'stay' | null;
  swap: boolean; noTake: 'king' | 'pawns' | 'any' | null; afterImage: boolean; sheathed: boolean;
}
export const GLOW: Record<KingName, string> = { Frost: 'rgb(110,196,250)', Flame: 'rgb(255,130,30)', Stratus: 'rgb(130,180,230)', Mud: 'rgb(130,150,50)', Spirit: '#ffe7a6', Shadow: 'rgb(90,40,130)' };
export const GOLD = '#e9b44c', CRIMSON = '#b3261e';
const LIKE_BODY: Record<string, Body | 'K'> = { king: 'K', knight: 'N', bishop: 'B', rook: 'R', queen: 'Q' };
const INTO_BODY: Record<string, Body> = { choice: 'Q', Q: 'Q', R: 'R', B: 'B', N: 'N', A: 'A' };

export function lookOf(d: D, v: Verdict): StageLook {
  const rule = <A extends string>(a: A) => d.rules.find(r => r.does.a === a);
  const like = rule('movesLike'), bec = rule('becomes'), shield = rule('cannotBeTaken'), no = rule('cannotTake'), lp = rule('linesPass'), pu = rule('push');
  const w = v.worth.point, chain = !!rule('chain'), sheathed = v.g.Xopen === 0;
  const ghostBody = like?.does.a === 'movesLike' ? LIKE_BODY[like.does.as] : bec?.does.a === 'becomes' ? INTO_BODY[bec.does.into] : null;
  // The extra squares of "also moves like", hatched on the floor: the king step and the knight jump are squares, the rest lines.
  const extra = like?.does.a === 'movesLike' ? presetOf(like.does.as === 'king' ? 'maester' : like.does.as) : null;
  const own = new Set(d.squares.map(s => `${s.x},${s.y}`));
  const when = like?.when ?? d.rules.find(r => !['takes', 'firstTake', 'reaches', 'always'].includes(r.when.on))?.when;
  return {
    figure: selectedFigure(d).id, body: d.look.auto ? autoBody(d) : d.look.body, army: d.look.army, glow: d.look.glow, letter: d.letter,
    metal: v.metal,
    // An unchanged Pawn or Queen is the measure, not a fault: no cracks, no dimming.
    cracks: v.own ? 'none' : v.label === 'untestedOP' ? 'dashed' : v.metal === 'broken' ? 'wide' : v.metal === 'cracked' ? 'cracked' : v.metal === 'hairline' ? 'hairline' : 'none',
    scale: +(0.94 + 0.14 * Math.min(1, Math.max(0, w) / 10)).toFixed(3),
    dim: !v.own && (v.label === 'possiblyWeak' || v.label === 'likelyWeak'),
    rim: d.look.glow ? GLOW[d.look.glow] : chain || v.stats.takes > v.stats.moves ? CRIMSON : GOLD,
    marks: [...d.squares.map(s => ({ ...s, hatched: false })), ...(extra?.squares.filter(s => !own.has(`${s.x},${s.y}`)).map(s => ({ ...s, hatched: true })) ?? [])],
    lines: [...d.lines], ghostLines: extra ? extra.lines.filter(l => !d.lines.includes(l)) : [],
    ghost: ghostBody, partner: when?.on === 'near' ? when.who : null,
    zone: when?.on === 'zone' ? when.zone : null,
    hourglass: when?.on === 'fromMove' || when?.on === 'beforeMove' ? when.n : null,
    cardBack: d.rules.some(r => r.when.on === 'afterCard'),
    footprints: !!rule('step2'), passOver: lp?.does.a === 'linesPass' ? lp.does.over : null, chain,
    shield: shield?.does.a === 'cannotBeTaken' ? (shield.does.by === 'pawns' ? 'feet' : 'dome') : null,
    push: pu?.does.a === 'push' ? pu.does.then : null, swap: !!rule('swap'),
    noTake: no?.does.a === 'cannotTake' ? no.does.what : null, afterImage: !!rule('removedAfter'), sheathed,
  };
}
/** "Knight look, ivory, gold plinth." The start of the stage's hidden summary. */
export const lookWords = (l: StageLook): string =>
  `${l.figure ? figureById(l.figure)?.name : l.body === 'token' ? 'Token' : { P: 'Pawn', N: 'Knight', B: 'Bishop', R: 'Rook', Q: 'Queen', A: 'Archer', L: 'Paladin', G: 'Guard', M: 'Maester', S: 'Beast', O: 'Ogre' }[l.body]} look, ${l.army ? 'charcoal' : 'ivory'}, ${l.metal === 'hairline' ? 'gold plinth with a hairline crack' : l.metal === 'cracked' || l.metal === 'broken' ? 'cracked gold plinth' : `${l.metal} plinth`}.`;
