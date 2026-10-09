/**
 * The judge (revision 3 §6), ported from the prototype `judge-v2.mjs` (its memory score from
 * `judge-v1.mjs`): features over the 64 from-squares, the piece formula, the rule terms, the band,
 * the label and metal, the flags, the memory score, the like line, Why?, the fixes, the rule-book
 * badges and the stats. Pure and without options: the same design always gets the same verdict.
 *
 * One change from the prototype (revision 3 §6.2 asks for "the largest value"): where layers
 * overlap on a target square, the prototype kept the entry with the largest weight even when a
 * cheaper kind of take replaced a dearer one, so painting a square could lower the worth. Here each
 * target keeps its largest *worth*, and the take count and the chain count keep their own largest
 * weights, so no edit that adds a square, a line or an ability ever lowers the number.
 * "Revision 3" and the section numbers (§, W) cite docs/visual-design/workshop/WORKSHOP-revision-3-2026-10-07.md.
 */
import { DIAG, DIR, DIRS, ORTHO, PRESETS, empty, keyOf, likeSquares, limit, presetOf, ruleKey, type Body, type Dir, type PieceDesign, type Rule, type Square, type When } from './model';
import { anchorNote, anchorOf, MAESTER_NOTE, type Anchor } from './anchors';
import { BLOCKS, BODY, blockOf, whenWords } from './vocab';
import { cap, groupPhrase, groupsOf, halves, lineWords, orbitOf, pawns } from './text';

type D = Pick<PieceDesign, 'squares' | 'lines' | 'rules'>;
/** Every line the owner may move (§6.9). */
export const THRESHOLDS = { weak: 2.5, op: 5.0, wideHi: 5.5, wideHalf: 1.0, queen: 7.5, quietHinge: 8, quietW: 0.4, idle: 0.3, hairline: 4.5, gold: 3.5, silver: 3.0 } as const;
export type Label = 'fair' | 'possiblyOP' | 'likelyOP' | 'untestedOP' | 'possiblyWeak' | 'likelyWeak';
export type Metal = 'stone' | 'bronze' | 'silver' | 'gold' | 'hairline' | 'cracked' | 'broken';
export type FlagCode = 'F1' | 'F2' | 'F3' | 'F7' | 'F8' | 'F9' | 'F10' | 'F11' | 'F12' | 'F+';
export interface Flag { code: FlagCode; level: 'info' | 'warn' | 'good'; line: string; evidence: string }
export interface Features { Q: number; Xfar: number; Xshot: number; Xstep: number; Xopen: number; chainX: number; M: number; T: number }
export interface Verdict {
  worth: { point: number; lo: number; hi: number; half: number; measured?: Anchor & { label: Label } };
  label: Label;
  metal: Metal;
  like: string;
  flags: Flag[];
  memory: { points: number; level: 0 | 1 | 2 | 3 };
  /** Rules that change the worth by less than 0.3 pawn: "Simpler without it?" */
  idle: string[];
  /** At most 3 removal comparisons ("Without “takes again”: about 4 pawns."), the largest change first, then the hinges. */
  why: string[];
  /** The note for a measured design (or the Maester's), else ''. */
  note: string;
  /** At most 2 removals that bring the point into the band, the smallest change first. */
  fixes: { label: string; design: D; worth: number }[];
  stats: { moves: number; takes: number };
  /** Rule-book badges by ability: the change in worth (shown by badgeText), `unsure` when never measured; absent = the row cannot work. */
  deltas: Partial<Record<Rule['does']['a'], { v: number; unsure: boolean }>>;
  /** The warning chip shows. */
  warn: boolean;
  /** At most 90 characters. */
  line: string;
  /** An unchanged Pawn or Queen: it keeps its own words in every view (bandOf, whyTitle). */
  own: '' | 'pawn' | 'queen';
  /** A hard limit (§4.9) the design breaks, or ''. */
  blocked: string;
  g: Features;
}

/* ---- features (§6.2) ---- */

const P = 0.4, GAME = 45, C_FAR = 0.487, C_STEP = 0.258;
const SHARE: Record<string, number> = { startRank: 0.25, ownHalf: 0.65, enemyHalf: 0.35, lastRank: 0.05, capital: 0.05, near: 0.5, afterFirstCapture: 0.5, afterCard: 0.1 };
/** How often a state rule's When holds (§6.5). Events count 1. */
export const share = (w: When): number => w.on === 'always' ? 1 : w.on === 'zone' ? SHARE[w.zone] : w.on === 'near' ? SHARE.near
  : w.on === 'fromMove' ? 1 - w.n / GAME : w.on === 'beforeMove' ? w.n / GAME : SHARE[w.on] ?? 1;
const cheb = (x: number, y: number): number => Math.max(Math.abs(x), Math.abs(y));
const knightish = (x: number, y: number): boolean => cheb(x, y) > 1 || Math.abs(x) + Math.abs(y) > 2;
interface Layer { squares: readonly Square[]; lines: readonly Dir[]; wt: number }

/** Averages over the 64 from-squares, White's view, every other square occupied with chance 0.4. */
export function features(layers: readonly Layer[]): Features {
  const g: Features = { Q: 0, Xfar: 0, Xshot: 0, Xstep: 0, Xopen: 0, chainX: 0, M: 0, T: 0 };
  const q = new Float64Array(64), st = new Float64Array(64), fa = new Float64Array(64), sh = new Float64Array(64), mob = new Uint8Array(64), tk = new Uint8Array(64);
  const up = (a: Float64Array, k: number, v: number) => { if (v > a[k]) a[k] = v; };
  for (let f = 0; f < 8; f++) for (let r = 0; r < 8; r++) {
    q.fill(0); st.fill(0); fa.fill(0); sh.fill(0); mob.fill(0); tk.fill(0);
    for (const { squares, lines, wt } of layers) {
      for (const s of squares) {
        const tf = f + s.x, tr = r + s.y;
        if (tf < 0 || tf > 7 || tr < 0 || tr > 7) continue;
        const k = tf * 8 + tr;
        if (s.mark !== 'take' && s.mark !== 'shoot') { up(q, k, wt); if (wt === 1) mob[k] = 1; }
        if (s.mark === 'shoot' || s.mark === 'moveShoot') up(sh, k, wt);
        else if (s.mark !== 'move') up(knightish(s.x, s.y) ? fa : st, k, wt);
        if (s.mark !== 'move' && wt === 1) tk[k] = 1;
      }
      for (const d of lines) {
        const [x, y] = DIR[d];
        for (let i = 1, tf = f + x, tr = r + y; tf >= 0 && tf < 8 && tr >= 0 && tr < 8; i++, tf += x, tr += y) {
          const k = tf * 8 + tr;
          up(q, k, wt * (1 - P) ** i); up(fa, k, wt * (1 - P) ** (i - 1));
          if (wt === 1) { mob[k] = 1; tk[k] = 1; }
        }
      }
    }
    for (let k = 0; k < 64; k++) {
      g.Q += q[k];
      const hi = Math.max(fa[k], sh[k]);
      if (hi && C_FAR * hi >= C_STEP * st[k]) { if (fa[k] >= sh[k]) g.Xfar += fa[k]; else g.Xshot += sh[k]; }
      else g.Xstep += st[k];
      g.Xopen += Math.max(hi, st[k]); g.chainX += Math.max(fa[k], st[k]); g.M += mob[k]; g.T += tk[k];
    }
  }
  for (const k in g) g[k as keyof Features] /= 64;
  return g;
}

/* ---- the estimate (§6.3–6.6) ---- */

/** How far forward one move reaches; a forward line counts 4. */
const forwardReach = (d: D): number => Math.max(d.lines.some(l => l.startsWith('n')) ? 4 : 0, ...d.squares.filter(s => s.mark !== 'take' && s.mark !== 'shoot').map(s => s.y), 0);
interface Estimate { W: number; half: number; g: Features; codes: Set<FlagCode>; rate: number; parts: { key: string; v: number }[] }

function estimate(d: D): Estimate {
  const R = d.rules, has = (a: Rule['does']['a']) => R.find(x => x.does.a === a), codes = new Set<FlagCode>(), unc = [0.35];
  const layers: Layer[] = [{ squares: d.squares, lines: d.lines, wt: 1 }];
  let extraQ = 0;
  for (const { when, does } of R) {
    if (does.a === 'movesLike') layers.push({ ...likeSquares(does.as), wt: share(when) });
    if (does.a === 'step2') extraQ += 0.6 * share(when) * 0.875;
  }
  const g = features(layers);
  g.Q += extraQ;
  const hingeX = 0.46 * Math.max(0, g.Xopen - 7), hingeQ = THRESHOLDS.quietW * Math.max(0, g.Q - THRESHOLDS.quietHinge);
  const parts = [{ key: 'quiet', v: 0.123 * g.Q + hingeQ }, { key: 'far', v: C_FAR * g.Xfar }, { key: 'shot', v: C_FAR * g.Xshot }, { key: 'step', v: C_STEP * g.Xstep }, { key: 'hingeX', v: hingeX }];
  let W = 0.077 + parts.reduce((s, p) => s + p.v, 0);
  const T = (v: number, e: number) => { unc.push(e); W += v; };
  if (has('chain')) T(0.229 * g.chainX, 0.5);
  for (const { when, does } of R) {
    const s = share(when);
    switch (does.a) {
      case 'linesPass': T((does.over === 'any' ? 0.6 : 0.3) * s, 1.0); if (does.over === 'any') codes.add('F8').add('F10'); break;
      case 'cannotTake': if (does.what === 'king') T(-1.0 * s, 0.8); if (does.what === 'pawns') T(-0.3 * s, 0.5); break;
      case 'cannotBeTaken': T(does.by === 'pawns' ? 0.2 * s : 0, does.by === 'pawns' ? 0.5 : 1.0); if (does.by !== 'pawns') codes.add('F1'); break;
      case 'push': T(0, does.then === 'stay' ? 0.7 : 0.5); break;
      case 'swap': T(does.with === 'friend' ? 0.7 * s : 0, does.with === 'friend' ? 0.4 : 0.5); break;
    }
  }
  const rem = has('removedAfter');
  if (rem?.does.a === 'removedAfter') {
    // A flaw never raises the worth (§6.4), so the factor applies only above the base.
    const base = 0.077 + 0.123 * g.Q;
    W = Math.min(W, base + (rem.does.what === 'any' ? 0.32 : 0.41) * (W - base)); unc.push(1.0);
  }
  const bec = has('becomes');
  if (bec?.does.a === 'becomes') {
    // The measured worth of the piece it becomes (anchors.ts); "choice" is the queen.
    const into = anchorOf(presetOf(BODY[bec.does.into === 'choice' ? 'Q' : bec.does.into].name))!.value;
    const f = forwardReach(d), p = bec.when.on === 'firstTake' ? 0.6 : Math.min(0.9, 0.05 * f ** 3);
    const v = Math.max(0, p * (into - W));
    T(v, Math.max(0.5, v));
    if (into > 9 && (f > 1 || bec.when.on === 'firstTake')) codes.add('F12');
  }
  if (g.Xopen === 0) { W = Math.min(W, 1.3); codes.add('F1'); }
  if (R.some(r => r.does.a === 'cannotTake' && r.does.what === 'any')) W = Math.min(W, 1.3);
  if (g.Xopen > 7) unc.push(0.25 * (g.Xopen - 7));
  if (g.Xshot > 8.3) unc.push(0.3 * (g.Xshot - 8.3));
  if (g.Q > 7.5 || g.Q < 3) unc.push(0.4 * (g.Q > 7.5 ? g.Q - 7.5 : 3 - g.Q));
  if (g.Q > THRESHOLDS.quietHinge) codes.add('F11');
  if (R.some(x => x.when.on !== 'always' && !blockOf(x.does.a).event)) unc.push(0.5);
  if (R.some(x => x.when.on === 'afterCard')) codes.add('F7');
  const rate = (g.Xshot ? 0.18 * g.Xshot + 0.8 : 0) + (g.Xfar ? 0.09 * g.Xfar + 0.2 : 0) + (has('chain') ? 0.165 : 0.08) * g.Xstep;
  if (g.Xshot >= 4 || rate > 1.5) codes.add('F2');
  W = Math.max(0, W);
  return { W, half: Math.sqrt(unc.reduce((s, e) => s + e * e, 0)), g, codes, rate, parts };
}
/** The formula worth alone (the rule cards' badges). */
export const worthOf = (d: D): number => estimate(d).W;

/* ---- labels, metal, flags ---- */

export function labelOf(point: number, lo: number, hi: number, half: number): Label {
  const t = THRESHOLDS;
  return lo > t.op ? 'likelyOP' : point > t.op ? 'possiblyOP' : hi > t.wideHi && half >= t.wideHalf ? 'untestedOP'
    : hi < t.weak ? 'likelyWeak' : point < t.weak ? 'possiblyWeak' : 'fair';
}
export const metalOf = (w: number): Metal => w >= THRESHOLDS.queen ? 'broken' : w > THRESHOLDS.op ? 'cracked' : w > THRESHOLDS.hairline ? 'hairline'
  : w >= THRESHOLDS.gold ? 'gold' : w >= THRESHOLDS.silver ? 'silver' : w >= THRESHOLDS.weak ? 'bronze' : 'stone';
export const BAND_WORD: Record<Label, string> = { fair: 'Fair', possiblyOP: 'Possibly overpowered', likelyOP: 'Likely overpowered', untestedOP: 'Possibly overpowered', possiblyWeak: 'Possibly too weak', likelyWeak: 'Likely too weak' };
/** The label in words, the same on the stage, the gauge, the card, the shelf and in Why?; a Pawn and a Queen keep their own. */
export const bandOf = (v: Pick<Verdict, 'own' | 'label'>): string => (v.own === 'pawn' ? 'The unit of worth' : v.own === 'queen' ? 'The queen’s worth' : BAND_WORD[v.label]);
/** The title of the Why? sheet, from the editor and from SAVED alike. */
export const whyTitle = (v: Pick<Verdict, 'own' | 'label' | 'warn'>): string => (v.own ? 'Why this worth?'
  : v.label !== 'fair' ? `Why “${BAND_WORD[v.label].toLowerCase()}”?` : v.warn ? 'Why this warning?' : 'Why “fair”?');

/** A rule counts as measured when a measured design has the same rule; "lines pass over" and "becomes" never do (§6.4). */
const MEASURED = new Set(PRESETS.flatMap(p => p.rules).concat([{ when: { on: 'zone', zone: 'capital' }, does: { a: 'movesLike', as: 'queen' } }])
  .filter(r => r.does.a !== 'linesPass' && r.does.a !== 'becomes').map(ruleKey));
export const unmeasured = (r: Rule): boolean => !MEASURED.has(ruleKey(r));

function flagsOf(d: D, e: Estimate): Flag[] {
  const { codes, g } = e, R = d.rules, out: Flag[] = [], allButKing = R.some(r => r.does.a === 'cannotBeTaken' && r.does.by === 'allButKing');
  const swap = R.some(r => r.does.a === 'swap' && r.does.with === 'friend');
  if (codes.has('F1')) out.push({ code: 'F1', level: 'warn', line: allButKing ? 'May lead to more draws: only a king can take it, like the Guard.' : 'May lead to more draws: it takes nothing.', evidence: 'A guard in an army adds 3.2 draws in 100 games; two guards, 8.8 (pa-r1).' });
  else if (swap) out.push({ code: 'F1', level: 'info', line: 'May lead to a few more draws: it swaps with a friend, like the Maester.', evidence: 'The maester adds 3.1 draws in 100 games, 1.5 to 4.6 (pa-r1).' });
  if (codes.has('F2')) out.push({ code: 'F2', level: 'warn', line: 'Takes very often, like the Archer. Games may end fast and one-sided.', evidence: `It takes about ${e.rate.toFixed(1)} times as often as the average piece; the archer, 2.1 (criterion 2).` });
  if (d.squares.some(s => (s.mark === 'shoot' || s.mark === 'moveShoot') && cheb(s.x, s.y) > 1)) out.push({ code: 'F3', level: 'info', line: 'Its shots pass over pieces, so a check cannot be blocked.', evidence: 'docs/RULES.md §3; fairy-values.md S15.' });
  const state = R.filter(r => !blockOf(r.does.a).event);
  const zone = state.length && state.length === R.length && state.every(r => share(r.when) <= 0.05);
  const named = (r: Rule): string => `“${blockOf(r.does.a).short(r)}”`, card = R.find(r => r.when.on === 'afterCard');
  if (codes.has('F7') && card) out.push({ code: 'F7', level: 'warn', line: `May often wait: ${named(card)} works only in card games.`, evidence: 'A side plays about 4.4 cards a game (cards m2).' });
  else if (zone) out.push({ code: 'F7', level: 'warn', line: `May often wait: ${named(state[0])} works only ${whenWords(state[0].when)}.`, evidence: 'Burn was played in 50% of games, Fire Starter in 40% (cards-2026-10-03.md:379-380).' });
  else if (g.M < 3) out.push({ code: 'F7', level: 'warn', line: 'May often wait: it has few squares to go to.', evidence: 'The guard moved in 70–80% of games (criterion 5).' });
  if (codes.has('F8')) out.push({ code: 'F8', level: 'warn', line: 'Hard to judge: we have no reliable estimate for lines that pass over any piece.', evidence: 'The paladin over enemies (sim-lm-buffs).' });
  if (R.some(unmeasured)) out.push({ code: 'F9', level: 'info', line: 'Never measured: play-test it.', evidence: 'revision 3 §6.4, status column.' });
  if (codes.has('F10')) out.push({ code: 'F10', level: 'warn', line: 'Hard to stop: it moves through pieces, so no piece can block it.', evidence: 'MATRIX A.3, the Wraith.' });
  if (codes.has('F11')) out.push({ code: 'F11', level: 'warn', line: 'It moves to more squares than any piece we measured.', evidence: `About ${Math.round(g.Q)} quiet squares; no measured piece has more than 7.33.` });
  if (codes.has('F12')) out.push({ code: 'F12', level: 'warn', line: 'It can become a queen early in the game.', evidence: 'A pawn needs about 6 moves to promote; a knight, about 3.' });
  if (g.Xshot > 0 || R.some(r => r.does.a === 'chain')) out.push({ code: 'F+', level: 'good', line: 'May mean fewer draws.', evidence: 'Archer −6.2 draws, beast −3.1 (in 100 games).' });
  return out;
}

/* ---- memory (§6.11), from the prototype judge-v1 ---- */

const KNOWN_GROUPS = ['1,0 1,1', '2,1'];
function groupPoints(pts: { x: number; y: number }[]): { pts: number; partial: boolean } {
  const gs = groupsOf(pts), full = gs.every(g => g.pts.length === (g.orbit[1] === 0 || g.orbit[0] === g.orbit[1] ? 4 : 8));
  if (full && KNOWN_GROUPS.includes(gs.map(g => g.orbit.join()).join(' '))) return { pts: 0.5, partial: false };
  return { pts: gs.length, partial: !full };
}
const PAWN_KEY = keyOf(presetOf('pawn')), QUEEN_KEY = keyOf(presetOf('queen'));
export function memoryOf(d: D): { points: number; level: 0 | 1 | 2 | 3; rules: number; exceptions: number } {
  let pts = 0, dir = false, exceptions = 0;
  if (keyOf(d) === PAWN_KEY) pts = 0.5;
  else {
    const mv = d.squares.filter(s => s.mark !== 'take' && s.mark !== 'shoot'), tk = d.squares.filter(s => s.mark !== 'move');
    const same = d.squares.every(s => s.mark === 'both');
    const add = (gr: { pts: number; partial: boolean }) => { pts += gr.pts; dir ||= gr.partial; };
    if (d.squares.length) { if (same) add(groupPoints(mv)); else { if (mv.length) add(groupPoints(mv)); if (tk.length) add(groupPoints(tk)); pts += 1; } }
    if (d.lines.length) { const known = [ORTHO, DIAG, DIRS].some(L => L.length === d.lines.length && L.every(x => d.lines.includes(x))); pts += known ? 0.5 : 1; dir ||= !known; }
    if (!tk.length && !d.lines.length && same) pts += 1;
    for (const { when, does } of d.rules) {
      pts += 1;
      if (['zone', 'near', 'fromMove', 'beforeMove'].includes(when.on)) pts += 1;
      if (when.on === 'afterFirstCapture') pts += 1.5;
      if (when.on === 'afterCard') pts += 2.5;
      if (does.a === 'chain' || (does.a === 'removedAfter' && does.what === 'piece')) { pts += 1.5; exceptions++; }
      if (does.a === 'cannotTake' || does.a === 'becomes' || (when.on === 'near' && when.who.length === 1)) { pts += 0.5; exceptions++; }
    }
    if (dir) pts += 0.5;
  }
  return { points: pts, level: pts <= 2 ? 0 : pts <= 3.5 ? 1 : pts <= 5 ? 2 : 3, rules: d.rules.length, exceptions };
}

/* ---- the like line and Auto look (§6.7) ---- */

/** The parts two designs can share: a rule counts 2, a square group or a line set 1. */
function partsOf(d: D): Map<string, number> {
  const m = new Map<string, number>();
  for (const r of d.rules) m.set(`r${ruleKey(r)}`, 2);
  const byMark = new Map<string, Square[]>();
  for (const s of d.squares) { const k = `${orbitOf(s.x, s.y).join()}:${s.mark}`; byMark.set(k, [...(byMark.get(k) ?? []), s]); }
  for (const [k, ss] of byMark) m.set(`g${k}:${ss.map(s => `${s.x},${s.y}`).sort().join(' ')}`, 1);
  for (const set of [ORTHO, DIAG]) { const l = set.filter(x => d.lines.includes(x)); if (l.length) m.set(`l${l.join()}`, 1); }
  return m;
}
const shared = (a: Map<string, number>, b: Map<string, number>): number => [...a].reduce((s, [k, w]) => s + (b.has(k) ? w : 0), 0);
let presetWorth: { key: string; body: Body; w: number; parts: Map<string, number> }[] | undefined;
const pool = () => (presetWorth ??= PRESETS.map(p => ({ key: p.key, body: p.body as Body, w: worthOf(p), parts: partsOf(p) })));
/** "a knight", "an archer". */
const aPiece = (p: { body: Body }): string => `${BODY[p.body].article} ${BODY[p.body].name}`;

export function likeLine(w: number, d: D): string {
  if (w >= THRESHOLDS.queen) return 'About a queen.';
  if (w > THRESHOLDS.op) return 'More than any pool piece but the queen.';
  // On the 2-decimal values the spec prints (§6.7, §6.12: Hungry Rider 4.48 is "about as strong as a beast", 4.08).
  const r2 = (x: number): number => Math.round(x * 100), mine = partsOf(d), near = pool().filter(p => Math.abs(r2(p.w) - r2(w)) <= 40);
  if (near.length) {
    const best = near.map(p => ({ p, s: shared(mine, p.parts) })).sort((a, b) => b.s - a.s || Math.abs(a.p.w - w) - Math.abs(b.p.w - w))[0].p;
    return `About as strong as ${aPiece(best)}.`;
  }
  const lo = pool().filter(p => p.w < w).sort((a, b) => b.w - a.w)[0], hi = pool().filter(p => p.w > w).sort((a, b) => a.w - b.w)[0];
  return lo ? `Between ${aPiece(lo)} and ${aPiece(hi)}.` : 'Weaker than any pool piece.';
}
/** Auto look (Blank only): the pool piece with the most shared parts; a tie goes to the knight; nothing shared, the token. */
export function autoBody(d: D): Body | 'token' {
  const mine = partsOf(d), scored = pool().map(p => ({ p, s: shared(mine, p.parts) })), top = Math.max(...scored.map(x => x.s));
  if (!top) return 'token';
  const best = scored.filter(x => x.s === top);
  return presetOf((best.find(x => x.p.key === 'knight') ?? best[0]).p.key).body;
}

/* ---- the judge ---- */

const withoutRule = (d: D, i: number): D => ({ ...d, rules: d.rules.filter((_, j) => j !== i) });
const inBand = (w: number): boolean => w >= THRESHOLDS.weak && w <= THRESHOLDS.op;

/** `full: false` skips Why?, the fixes and the badges (the shelf tiles need only the label and the metal). */
export function judge(d: D, full = true): Verdict {
  const e = estimate(d), W = e.W, lo = W - e.half, hi = W + e.half, g = e.g;
  const blocked = limit(d) ?? '';
  const anchor = anchorOf(d), key = keyOf(d);
  const measuredLabel = anchor && (anchor.under ? 'likelyWeak' : labelOf(anchor.value, anchor.value - anchor.pm, anchor.value + anchor.pm, anchor.pm));
  const label = measuredLabel || labelOf(W, lo, hi, e.half);
  const ownKey = key === PAWN_KEY ? 'pawn' : key === QUEEN_KEY ? 'queen' : '';
  const own = ownKey === 'pawn' ? 'A pawn: the unit of worth.' : ownKey === 'queen' ? 'The queen: the one piece above the band. Only the queen stands here.' : '';
  const flags = own ? flagsOf(d, e).filter(f => f.level === 'good') : flagsOf(d, e);
  const memory = memoryOf(d);
  const like = likeLine(W, d);
  // Each rule's own part: the worth without it.
  const ruleV = !full ? [] : d.rules.map((r, i) => { const x = estimate(withoutRule(d, i)); return { r, v: W - x.W, codes: x.codes }; });
  const idle = ruleV.filter(x => Math.abs(x.v) < THRESHOLDS.idle && [...x.codes].sort().join() === [...e.codes].sort().join()).map(x => cap(blockOf(x.r.does.a).short(x.r)));
  // Why? compares the design with itself less one part (a rule, a square group, a line set): the worth without it.
  // The parts overlap, so these are not shares of the worth and do not add up (whyHtml says so once).
  const parts = !full ? [] : removals(d).map(f => ({ ...f, worth: worthOf(f.design) }));
  const why = [
    ...parts.map(f => ({ f, v: W - f.worth })).filter(x => Math.abs(x.v) >= 0.25).sort((a, b) => Math.abs(b.v) - Math.abs(a.v)).slice(0, 3)
      .map(({ f }) => `Without “${f.part.charAt(0).toLowerCase()}${f.part.slice(1)}”${empty(f.design) ? ', it cannot move at all.' : `: about ${pawns(f.worth)}.`}${f.rule && !blockOf(f.rule.does.a).event && share(f.rule.when) < 1 ? ` The estimate assumes it works ${whenWords(f.rule.when)} about ${Math.round(share(f.rule.when) * 100)}% of the time.` : ''}`),
    ...(full ? hingeText(g) : []),
  ];
  const fixes = !full || blocked || inBand(W) ? [] : parts
    .filter(f => inBand(f.worth) && !limit(f.design) && !empty(f.design)).sort((a, b) => Math.abs(a.worth - W) - Math.abs(b.worth - W)).slice(0, 2);
  const deltas: Verdict['deltas'] = {};
  if (full && !blocked) for (const b of BLOCKS) {
    if (d.rules.length >= 3 || d.rules.some(r => r.does.a === b.a) || b.needs?.(d)) continue;
    const next = { ...d, rules: [...d.rules, b.rule] };
    if (limit(next)) continue;
    deltas[b.a] = { v: worthOf(next) - W, unsure: unmeasured(b.rule) };
  }
  const steps = (n: number): number => (n <= 0 ? 0 : n <= 2 ? 1 : n <= 5.5 ? 2 : n <= 9 ? 3 : n <= 15 ? 4 : 5);
  const warnFlag = flags.find(f => f.level === 'warn');
  const warn = !own && !blocked && !empty(d) && (label !== 'fair' || !!warnFlag || memory.level === 3);
  const v: Verdict = {
    worth: { point: W, lo, hi, half: e.half, ...(anchor ? { measured: { ...anchor, label: measuredLabel as Label } } : {}) },
    label, metal: metalOf(W), like, flags, memory: { points: memory.points, level: memory.level }, idle, why,
    note: anchor ? anchorNote(anchor) : key === keyOf(presetOf('maester')) ? MAESTER_NOTE : '',
    fixes, stats: { moves: steps(g.M), takes: steps(g.T) }, deltas, warn, line: '', own: ownKey, blocked, g,
  };
  v.line = own || lineOf(v, d, memory, warnFlag);
  return v;
}

/** Why the parts add so much together: the two hinges of the formula (§6.3), in plain words. */
function hingeText(g: Features): string[] {
  const n = (x: number) => Math.max(1, Math.round(x)), out: string[] = [];
  if (g.Xopen > 7.5) out.push(`In all, it can take on about ${n(g.Xopen)} squares; a rook, about 7; a queen, about 12. Past 7, each one counts double.`);
  if (g.Q > THRESHOLDS.quietHinge) out.push(`It can move to about ${n(g.Q)} empty squares; no piece we measured has more than 7. Past 8, each one counts much more.`);
  return out;
}

/** A change in worth for the rule book and the rule cards: halves, but a change of 0.1 to ¼ pawn shows as ¼, not 0. */
export function badgeText(v: number): string {
  const a = Math.abs(v), sign = v < 0 ? '−' : '+';
  return a < 0.1 ? '+0' : a < 0.25 ? `${sign}¼` : `${sign}${halves(a)}`;
}

/** Every single removal: a rule, a square group (one orbit, one mark), or a line set; `part` names what goes. */
function removals(d: D): { part: string; label: string; design: D; rule?: Rule }[] {
  const out: { part: string; label: string; design: D; rule?: Rule }[] = [];
  const add = (part: string, design: D, rule?: Rule) => out.push({ part, label: `Remove “${part}”`, design, rule });
  d.rules.forEach((r, i) => add(cap(blockOf(r.does.a).short(r)), withoutRule(d, i), r));
  const KIND: Record<Square['mark'], string> = { both: 'Moves and takes', move: 'Moves', take: 'Takes', shoot: 'Shoots', moveShoot: 'Moves or shoots' };
  for (const mark of Object.keys(KIND) as Square['mark'][]) for (const gr of groupsOf(d.squares.filter(s => s.mark === mark))) {
    const gone = (s: Square) => s.mark === mark && gr.pts.some(p => p.x === s.x && p.y === s.y);
    add(`${KIND[mark]} ${groupPhrase(gr.orbit, gr.pts)}`, { ...d, squares: d.squares.filter(s => !gone(s)) });
  }
  for (const set of [ORTHO, DIAG]) {
    const l = set.filter(x => d.lines.includes(x));
    if (l.length) add(cap(lineWords(l)), { ...d, lines: d.lines.filter(x => !l.includes(x)) });
  }
  return out;
}

function lineOf(v: Verdict, d: D, mem: ReturnType<typeof memoryOf>, warnFlag: Flag | undefined): string {
  const w = v.worth.point, likeWords = v.like.charAt(0).toLowerCase() + v.like.slice(1, -1);
  if (v.blocked) return `Not allowed: ${v.blocked.charAt(0).toLowerCase()}${v.blocked.slice(1).replace(/\.$/, '').replace(/\. .*/, '')}.`;
  if (empty(d)) return 'Paint at least one square or line.';
  if (v.label === 'likelyOP' || v.label === 'possiblyOP') return `${BAND_WORD[v.label]}: about ${pawns(w)}, ${likeWords}.`;
  if (v.label === 'untestedOP') return `Possibly overpowered: an untested shape, about ${halves(v.worth.lo)} to ${halves(v.worth.hi)} pawns.`;
  if (warnFlag) return warnFlag.line;
  if (v.label === 'possiblyWeak' || v.label === 'likelyWeak') {
    const cause = v.g.Xopen === 0 ? 'it takes nothing' : d.rules.some(r => r.when.on === 'afterCard') ? "it waits for your opponent's card" : v.g.M < 3 ? 'it has few squares to go to' : 'it reaches few squares';
    return `${BAND_WORD[v.label]}: about ${pawns(w)}; ${cause}.`;
  }
  if (mem.level === 3) return `Possibly hard to remember: ${mem.rules} rule${mem.rules === 1 ? '' : 's'} and ${mem.exceptions} exception${mem.exceptions === 1 ? '' : 's'}.`;
  return `Fair: about ${pawns(w)}. ${v.like}`;
}

/** The head of the Why? sheet (W8). */
export function whyHead(v: Verdict): string {
  const { point, lo, hi } = v.worth;
  if (v.label === 'untestedOP') return `About ${pawns(point)}, but the judge is unsure: the guess runs from ${halves(lo)} to ${halves(hi)}. Nothing we measured looks like this. It may be overpowered.`;
  const range = `About ${pawns(point)} (${halves(lo)} to ${halves(hi)}).`;
  return `${range} Most pieces are worth 2½ to 5 pawns, the shaded part of the gauge. Only the queen is above.`;
}
