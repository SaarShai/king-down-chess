import { CardName, KINGS, KingChoice, KingName, PowerName, Rules, setRules } from '../rules/rules';
import { POOL_2BEASTS, randomBackRank } from '../rules/setup';
import { mulberry32 } from './rng';
import type { RunSpec } from './spec-plan';
export const ALL_POWERS: readonly PowerName[] = Object.values(KINGS).flat();
const KING_OF = Object.fromEntries(
  (Object.entries(KINGS) as [KingName, readonly PowerName[]][]).flatMap(([king, ps]) => ps.map(p => [p, king])),
) as Record<PowerName, KingName>;
export const choice = (p: PowerName | 'none'): KingChoice | null => (p === 'none' ? null : { king: KING_OF[p], power: p });

/**
 * A power name, `none`, or a variant of a power. `Strike~h200` plays Strike with an unspent use worth
 * 200 cp to that side's search (a calibration entrant). `Sacrifice~vbehind` plays Sacrifice under the
 * spec's rule variant `behind` (`--variant behind:sacrificeBehind=true`), so one round can screen several
 * readings of a power against the same field (a screening entrant). `cards<k>` is a dealt hand of k
 * cards, `card:<Name>` a hand of that one card (e.g. `card:Mimic`, to measure one card against `none`),
 * and `card:<A>+<B>` a hand of those cards (`card:Freeze+Rescue`: a card that needs another).
 */
export type Entrant = PowerName | 'none' | `${PowerName}~h${number}` | `${PowerName}~v${string}` | `cards${number}` | `card:${string}`
  /** Any of the above playing its own evaluation (`--evalParams`): `none@E1-30` plays sim/probes/E1-30.json. */
  | `${string}@${string}`;
/** The entrant without its `@<params>` tag: what it plays apart from its evaluation. */
const bare = (e: Entrant): Entrant => e.split('@')[0] as Entrant;
/** A card-mode entrant (`cards<k>`, `card:<Name>`): its powers are its hand. */
const dealt = (e: Entrant): boolean => e.startsWith('card');
/** A card-mode entrant plays a plain king, so it plays the armies `none` plays (`pairDraw`). */
export const basePower = (e: Entrant): PowerName | 'none' => (dealt(e) ? 'none' : bare(e).split('~')[0] as PowerName | 'none');
/** The one-use powers card mode deals from, unless a spec names its own `cardPool`. */
export const CARD_POOL: readonly CardName[] = ['Freeze', 'IceWall', 'Strike', 'Haste', 'Flight', 'Sacrifice', 'March', 'Leap'];
/** The pool shuffled by the pair's own opening seed: the order cards are dealt and drawn in. */
function dealOrder(t: TournamentSpec, seed: number): CardName[] {
  const pool = [...(t.cardPool ?? CARD_POOL)], rng = mulberry32(seed ^ 0x5bd1e995);
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  return pool;
}
/**
 * A `cards<k>` entrant's hand in one game: the first k cards of the pool shuffled by the pair's own
 * opening seed. So `cards3` holds the first half of the same pair's `cards6`, both sides of a mirror
 * hold the same hand, and every entrant of a `perPair` round sees the same hands on the same army.
 * A `card:<Name>` entrant always holds that one card (`card:<A>+<B>`: those cards).
 */
export function handFor(t: TournamentSpec, e: Entrant, seed: number): CardName[] {
  e = bare(e);
  if (e.startsWith('card:')) return e.slice(5).split('+') as CardName[];
  if (!e.startsWith('cards')) return [];
  return dealOrder(t, seed).slice(0, Number(e.slice(5)));
}
/**
 * A side's draw pile (Growth): the pool in the same deal order, without the cards of its hand. Both
 * sides draw in one order, so a `cards<k>` mirror stays fair: each side's n-th draw is the same card.
 */
export function pileFor(t: TournamentSpec, hand: readonly CardName[], seed: number): CardName[] {
  const left = [...hand];
  return dealOrder(t, seed).filter(x => { const i = left.indexOf(x); if (i < 0) return true; left.splice(i, 1); return false; });
}
const holdOf = (e: Entrant): Partial<Record<string, number>> | undefined => {
  const m = /~h(\d+)$/.exec(bare(e));
  return m ? { [basePower(e)]: Number(m[1]) } : undefined;
};

/**
 * The powers each power rule changes. A rule variant may set only rules of its own power, and a game
 * applies it only when the other side's power does not read that rule (rules are global to a game).
 */
export const RULE_POWERS: Partial<Record<keyof Rules, readonly PowerName[]>> = {
  freezeUses: ['Freeze'], freezeQuiet: ['Freeze'], iceWallUses: ['IceWall'], markFree: ['Freeze', 'IceWall'], markTurns: ['Freeze', 'IceWall'],
  strikeUses: ['Strike'], strikeCaptures: ['Strike'], strikeMode: ['Strike'], strikePawns: ['Strike'],
  hasteUses: ['Haste'], hasteSecond: ['Haste'], hasteCaptures: ['Haste'], hasteApart: ['Haste'], hasteNoThreat: ['Haste'], hasteNoForward: ['Haste'], hasteNoCheck: ['Haste'],
  flightUses: ['Flight'], sacrificeUses: ['Sacrifice'], sacrificeBehind: ['Sacrifice'],
  marchUses: ['March'], leapUses: ['Leap'],
  holyLightTakesPawns: ['HolyLight'], holyLightAura: ['HolyLight'], holyLightKnights: ['HolyLight'], holyLightShelter: ['HolyLight'], holyLightShelterOrtho: ['HolyLight'], mercyCaptures: ['Mercy'], mercyAura: ['Mercy'], mercyAuraOrtho: ['Mercy'], mercyAuraPawns: ['Mercy'],
  mercyAuraPawnsTake: ['Mercy'], mercyTakesPawns: ['Mercy'], mercyNoJump: ['Mercy'],
  deathTouchMoves: ['DeathTouch'], deathTouchReach: ['DeathTouch'], deathTouchReachOrtho: ['DeathTouch'],
  deathTouchReachNoBack: ['DeathTouch'], deathTouchReachForwardBack: ['DeathTouch'], deathTouchReachPieces: ['DeathTouch'],
  darknessKeep: ['Darkness'], darknessMoves: ['Darkness'], darknessTakeAhead: ['Darkness'], darknessStepDiag: ['Darkness'],
  darknessShelter: ['Darkness'], darknessShelterPawnsTake: ['Darkness'],
  darknessPawnArmor: ['Darkness'], darknessAuraPawns: ['Darkness'], darknessKingStep2: ['Darkness'],
  darknessKingStepSafe: ['Darkness'], darknessKingStepTakes: ['Darkness'],
};
const variantOf = (t: TournamentSpec, e: Entrant): Partial<Rules> => {
  const m = /~v(.+)$/.exec(bare(e));
  if (!m) return {};
  const v = t.variants?.[m[1]];
  if (!v) throw new Error(`[${t.id}] entrant ${e}: no variant "${m[1]}" (--variant ${m[1]}:rule=value)`);
  return v;
};
/** Whether `a`'s rule variant would change `b`'s power in their game (then they do not meet). */
const clashes = (t: TournamentSpec, a: Entrant, b: Entrant): boolean => {
  // A card entrant holds its cards' powers: a Haste variant's rule would bind its Haste card too.
  b = bare(b);
  const pb = basePower(b), held: readonly CardName[] = b.startsWith('card:') ? b.slice(5).split('+') as CardName[] : b.startsWith('cards') ? t.cardPool ?? CARD_POOL : pb === 'none' ? [] : [pb];
  return Object.keys(variantOf(t, a)).some(k => RULE_POWERS[k as keyof Rules]?.some(p => held.includes(p)));
};
/** One game's rules: the tournament's, both sides' rule variants, and the two kings. */
export function gameRules(t: TournamentSpec, white: Entrant, black: Entrant): Partial<Rules> {
  return { ...t.rules, ...variantOf(t, white), ...variantOf(t, black), kings: [choice(basePower(white)), choice(basePower(black))] };
}

export interface TournamentSpec {
  id: string;
  entrants: Entrant[];
  /** Colour-swapped game pairs per matchup. */
  pairs: number;
  /**
   * `perPair`: every pair draws its own army and opening seed (`pairDraw`). Absent: pair p of every
   * matchup plays army p (rounds 1–12).
   */
  armies?: 'perPair';
  /**
   * Play only the matchups against this entrant (a star, not a round-robin), plus its mirror with
   * `mirror`: each entrant's value against a reference, e.g. a one-use power (a card) against a plain
   * king. Absent: every matchup.
   */
  anchor?: Entrant;
  /** Play only each entrant against itself (with `mirror`): for `cards<k>`, both sides with the same hand. */
  mirrorOnly?: boolean;
  /** Card mode: the cards `cards<k>` entrants are dealt from, and a Growth card draws from (default `CARD_POOL`). */
  cardPool?: CardName[];
  depth: number;
  seed: number;
  /** The army pool (`POOL` when the round was made). Absent: a round recorded before 2026-10-04, `POOL_2BEASTS`. */
  pool?: string;
  /**
   * Set on rounds made from 2026-10-09: the drawn armies follow `Rules.guardNextToKing`. Absent: an
   * earlier round, whose armies were drawn without it, so `schedule` draws them with it off.
   */
  guardNextToKing?: true;
  /** Rules for every game; `kings` is set per game. */
  rules: Partial<Rules>;
  /** Named rule variants for `Power~v<name>` entrants (each sets rules of that power only). */
  variants?: Record<string, Partial<Rules>>;
  powerHold?: Partial<Record<string, number>>;
  powerPlies?: number;
  /** Also play each entrant against itself (the matchup's colour edge, and a sanity line). */
  mirror: boolean;
  maxPlies: number;
  openingRandomPlies: number;
  /**
   * Entrant → `EvalParams` file (`--evalParams`): that entrant plays this evaluation, every other
   * side the shipped one. Absent: every side plays the shipped evaluation.
   */
  evalParams?: Record<string, string>;
  /**
   * Start positions (`--fens`): a file of FEN lines, each optionally followed by a tab and a tag.
   * Pair p of a matchup starts from line p mod n, and its second game swaps the entrants' sides of
   * that board. In a mirror matchup (an entrant against itself) the second game starts from the
   * mirrored board (ranks flipped, colours and side to move swapped) instead.
   */
  fens?: string;
}

export interface TJob {
  gameId: number; pairId: number; a: Entrant; b: Entrant; white: Entrant; black: Entrant; backRank: string; seed: number;
  /** With `--fens`: the start position as played (mirrored in the pair's second game), and the line's tag. */
  fen?: string; tag?: string;
}

/**
 * Pair p's army and opening seed under `--armies perPair`. They depend only on the seed, p and the
 * two base powers (under the round's rules, which `schedule` sets first), so adding or removing an
 * entrant changes no other matchup's games, and a variant (`Haste~vtrim`) plays the same armies as
 * its base power against each opponent.
 */
export function pairDraw(seed: number, a: Entrant, b: Entrant, p: number, pool = POOL_2BEASTS): { backRank: string; seed: number } {
  // FNV-1a of the key, then mulberry32 from that hash.
  let h = 0x811c9dc5;
  for (const c of `${seed}|${[basePower(a), basePower(b)].sort().join('|')}|${p}`) h = Math.imul(h ^ c.charCodeAt(0), 0x01000193);
  const rng = mulberry32(h);
  const backRank = randomBackRank(rng, pool);
  return { backRank, seed: Math.floor(rng() * 2 ** 32) };
}

/** The schedule: every unordered matchup (and mirrors if asked), `pairs` colour-swapped pairs each. */
export function scheduleJobs(t: TournamentSpec, fens: readonly { fen: string; tag?: string }[] | null = null): TJob[] {
  setRules(t.guardNextToKing ? t.rules : { guardNextToKing: false, ...t.rules });
  const rng = mulberry32(t.seed);
  // Shared across matchups unless `armies` is `perPair`: pair p of every matchup plays army p with opening seed p.
  const pool = t.pool ?? POOL_2BEASTS;
  const armies = Array.from({ length: t.pairs }, () => randomBackRank(rng, pool));
  const seeds = Array.from({ length: t.pairs }, (_, p) => (t.seed * 1_000_003 + p * 7919) >>> 0);
  const jobs: TJob[] = [];
  const e = t.entrants;
  let pairs = 0;
  for (let i = 0; i < e.length; i++) {
    for (let j = t.mirror ? i : i + 1; j < e.length; j++) {
      if (clashes(t, e[i], e[j]) || clashes(t, e[j], e[i])) continue;
      if (t.anchor !== undefined && e[i] !== t.anchor && e[j] !== t.anchor) continue;
      if (t.mirrorOnly && i !== j) continue;
      for (let p = 0; p < t.pairs; p++) {
        const pairId = pairs++;
        const draw = t.armies === 'perPair' ? pairDraw(t.seed, e[i], e[j], p, pool) : { backRank: armies[p], seed: seeds[p] };
        // With start positions, pair p starts from line p mod n (the drawn army is then unused).
        const start = fens?.[p % fens.length];
        // A mirror's colour swap replays the same game exactly, so a mirror-only round plays it once.
        for (const swap of t.mirrorOnly ? [false] : [false, true]) {
          // From a start position, two entrants swap sides of the same board. An entrant against
          // itself has no sides to swap: its second game starts from the mirrored board instead, so
          // each side of the position is played by White once and by Black once.
          const fen = start && (swap && i === j ? mirrorFen(start.fen) : start.fen);
          jobs.push({
            gameId: jobs.length, pairId, a: e[i], b: e[j],
            white: swap ? e[j] : e[i], black: swap ? e[i] : e[j], ...draw,
            ...(start ? { fen: fen!, ...(start.tag ? { tag: start.tag } : {}) } : {}),
          });
        }
      }
    }
  }
  return jobs;
}

/**
 * The same position with the colours exchanged: ranks flipped, piece colours and the side to move
 * swapped. Castling and en passant are written as `-` (no generated start position has either);
 * the halfmove clock is kept, the move number restarts at 1, and the power field (7) is dropped:
 * the positions of `--fens` carry no power state.
 */
export function mirrorFen(fen: string): string {
  const [board, turn, , , half = '0', , powers] = fen.trim().split(/\s+/);
  if (powers) throw new Error(`mirrorFen: ${fen} carries power state`);
  const swap = (ch: string): string => (ch === ch.toUpperCase() ? ch.toLowerCase() : ch.toUpperCase());
  const rows = board.split('/').reverse().map(r => [...r].map(ch => (/\d/.test(ch) ? ch : swap(ch))).join(''));
  return `${rows.join('/')} ${turn === 'w' ? 'b' : 'w'} - - ${half} 1`;
}

/** The RunSpec `playGame` wants for one tournament game. */
export function gameSpec(t: TournamentSpec, job: TJob): RunSpec {
  const sides = [holdOf(job.white), holdOf(job.black)] as [Partial<Record<string, number>> | undefined, Partial<Record<string, number>> | undefined];
  const hw = handFor(t, job.white, job.seed), hb = handFor(t, job.black, job.seed);
  // Draw piles only where a Growth card can draw, so other rounds' rules stay as they were.
  const piles = [...hw, ...hb].some(x => x === 'Growth' || x === 'GrowthB') ? { piles: [pileFor(t, hw, job.seed), pileFor(t, hb, job.seed)] as const } : {};
  return {
    id: t.id, games: 1, seed: t.seed, ai: { depth: t.depth, ...(t.powerPlies === undefined ? {} : { powerPlies: t.powerPlies }) },
    rules: { ...gameRules(t, job.white, job.black), ...(dealt(job.white) || dealt(job.black) ? { hands: [hw, hb] } : {}), ...piles },
    ...(t.powerHold ? { powerHold: t.powerHold } : {}),
    ...(sides[0] || sides[1] ? { powerHoldSides: sides } : {}),
    maxPlies: t.maxPlies, openingRandomPlies: t.openingRandomPlies,
    ...(t.evalParams && (t.evalParams[job.white] || t.evalParams[job.black])
      ? { evalParams: { white: t.evalParams[job.white], black: t.evalParams[job.black] } } : {}),
  };
}

