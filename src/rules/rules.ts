/**
 * Rule toggles for the balance lab. Every default is today's behaviour (docs/RULES.md §6), so a
 * caller that never touches this module plays the game the browser plays.
 *
 * ## Why module-level state and not a field on `Position`
 *
 * The hot paths are `canCapture`, `isAttacked` and `genPiece`. All three take a bare `Uint8Array`,
 * not a `Position`, because the search makes and unmakes moves on one scratch board. A `rules`
 * field on `Position` therefore cannot reach them: each would need a new parameter, and so would
 * every caller, including `src/game.ts` and `src/render/*`, which this work must not touch.
 *
 * One module-level object costs nothing per node: `setRules` writes the *fields* of a single
 * object, so its identity and its shape never change and every property load stays monomorphic.
 * FEN round-trips are unaffected, because rules are not part of a position.
 *
 * The price is one rule set per thread. That is enough: each simulation worker is its own module
 * instance, `playGame` sets the rules before it plays, and the browser never calls `setRules`.
 */

export type PromotionSet = 'anyNonKing' | 'standard' | 'anyNonKingNoFairy' | 'anyNonKingNoGuard';
/** Squares an archer may step to (move-only either way). `fwdBack` is the 2021 concept: 1 ahead or 1 back. */
export type ArcherMove = 'ortho' | 'any' | 'fwdBack';
/** Which squares an archer shoots, blockers ignored. `forward3` is the only asymmetric set, so it is read per side. */
/**
 * Archer shot set. `plusDiagFwd2` (2026-09-17) is the measured middle ground: classic plus the two
 * **forward** two-square diagonals, so each side's widening faces the enemy. It is colour-dependent,
 * like `forward3` — see `archerShotsFor` in engine.ts.
 */
export type ArcherShots = 'classic' | 'plusDiag2' | 'ring2' | 'forward3' | 'plusDiagFwd2';
/** What a guard may take by moving onto it. `any` turns it into a commoner that gives check. */
export type GuardCaptures = 'none' | 'pawns' | 'any';
/** Lab: the guard's double step from its home rank — none, through an empty square, or over anything. */
export type GuardDoubleFirst = 'off' | 'slide' | 'leap';
/** Squares a beast may step to (empty only; its captures are a separate rule). */
export type BeastMove = 'forward' | 'any' | 'diagFwdBack';
/** Which squares a beast captures on. `diagForward` is the 2021 concept: the two forward diagonals only. */
export type BeastCapture = 'adjacent' | 'diagForward';
/** When a paladin dies of its own capture: after any (shipped), after anything but a pawn, or never. */
export type PaladinKamikaze = 'always' | 'nonPawn' | 'never';
/** Where the Ogre stands after a shove: `repel` = it holds its square, `push` = it follows, Sokoban-style. */
export type OgreMode = 'repel' | 'push';
/** Which squares the Reaver's post-capture step may use: all 8 (`any`) or the 4 orthogonal ones (`ortho`). */
export type ReaverStep = 'any' | 'ortho';
/** Where the Catapult stands after a lob: `stay` = it fires from its square, `land` = it moves onto the target. */
export type CatapultCapture = 'stay' | 'land';

/**
 * Strike (Flame A) has two readings under measure. `move` is the proposal as written: the piece
 * moves as a queen. `capture` is the card game's verb (RULES.md §5): the piece *takes* a queen-reach
 * victim without moving. Both spend the side's one use.
 */
export type StrikeMode = 'move' | 'capture';

// -----------------------------------------------------------------------------------------------
// Kings' powers (docs/RULES.md §4, docs/KINGS-POWERS-PLAN.md). Each army has a king; the player
// picks one of that king's two powers. The choice is a **rule**, not a square, so it lives here and
// never enters FEN — and `stampOf()` in src/sim/run.ts hashes the whole rule set, so a run that
// changes kings cannot silently resume onto one that played different ones (LESSONS.md 2026-09-14).

export type KingName = 'Frost' | 'Flame' | 'Stratus' | 'Mud' | 'Spirit' | 'Shadow';
export type PowerName =
  | 'Freeze' | 'IceWall' | 'Strike' | 'Haste' | 'Flight' | 'Sacrifice'
  | 'March' | 'Leap' | 'HolyLight' | 'Mercy' | 'DeathTouch' | 'Darkness';
export interface KingChoice { king: KingName; power: PowerName }

/** Each king's two powers, A first (docs/RULES.md §4). */
export const KINGS: Readonly<Record<KingName, readonly [PowerName, PowerName]>> = Object.freeze({
  Frost: ['Freeze', 'IceWall'],
  Flame: ['Strike', 'Haste'],
  Stratus: ['Flight', 'Sacrifice'],
  Mud: ['March', 'Leap'],
  Spirit: ['HolyLight', 'Mercy'],
  Shadow: ['DeathTouch', 'Darkness'],
});

/**
 * The six powers the engine actually plays: the stateless rule modifiers of the plan's tier 1.
 * The other six need per-side state on `Position` (tier 2) or a captured-pieces reserve (tier 3),
 * and `parseKing` **refuses** them rather than hand the lab a game whose power does nothing — a
 * power used in no game measures nothing (plan §3.4).
 */
export const TIER1: readonly PowerName[] = ['HolyLight', 'Mercy', 'DeathTouch', 'Darkness', 'March', 'Leap'];

/**
 * Everything `parseKing` accepts: tier 1 plus the tier-2 powers that carry their own game state —
 * today only **Strike** (Flame A), whose per-side one-use flag lives on `Position.strike`. The
 * remaining five still need marks, charges or a reserve, and stay refused for the same reason.
 */
export const BUILT: readonly PowerName[] = [...TIER1, 'Strike'];

/** `"Spirit:Mercy"` (case-insensitive), or `"none"` / `"-"` / `""` for a king with no power. */
export function parseKing(text: string): KingChoice | null {
  const t = text.trim();
  if (!t || t === 'none' || t === '-') return null;
  const [k = '', p = ''] = t.split(':');
  const king = (Object.keys(KINGS) as KingName[]).find(n => n.toLowerCase() === k.toLowerCase());
  if (!king) throw new Error(`unknown king "${k}" (${Object.keys(KINGS).join(' | ')} | none)`);
  const power = KINGS[king].find(n => n.toLowerCase() === p.toLowerCase());
  if (!power) throw new Error(`king ${king} has no power "${p}" (${KINGS[king].join(' | ')})`);
  if (!BUILT.includes(power)) {
    throw new Error(`${king}:${power} is not built yet — built powers are ${BUILT.join(' | ')} (docs/KINGS-POWERS-PLAN.md §2)`);
  }
  return { king, power };
}

/** `"spirit:mercy"` gives both sides the same king; `"spirit:mercy,mud:march"` is White, then Black. */
export function parseKings(text: string): [KingChoice | null, KingChoice | null] {
  const parts = text.split(',');
  const white = parseKing(parts[0] ?? '');
  return [white, parts.length > 1 ? parseKing(parts[1]) : white];
}

/** `"Spirit:Mercy"`, or `"none"`. The one place a king choice is written for a human. */
export const kingLabel = (k: KingChoice | null): string => (k ? `${k.king}:${k.power}` : 'none');

export interface Rules {
  /** An archer may shoot a king, so it gives check. Off: an archer can never check or mate. */
  archerChecks: boolean;
  /** A beast may keep capturing from the square it lands on. Off: one capture per turn. */
  beastChains: boolean;
  /** Only a king may capture a guard. Off: a guard is captured like any other piece. */
  guardImmune: boolean;
  /**
   * What a guard takes by moving onto it. `none` is the shipped rule: the guard is a wall and
   * captures nothing, ever. `pawns` lets it clear pawns and nothing else, so it still cannot take
   * a king and still never checks; `any` makes it a commoner. Both are lab-only (§6.9).
   */
  guardCaptures: GuardCaptures;
  /** A guard steps 1 (shipped), or slides up to 2, in a straight line through empty squares. Captures stay adjacent. */
  guardStep: 1 | 2;
  /**
   * Lab (2026-09-14): a guard standing on its **home rank** (rank 1 / rank 8) may step 2 in a straight
   * line, like a pawn's double step — `slide` needs the middle square empty, `leap` jumps whatever
   * stands there. Move-only, so `isAttacked` never changes. Keyed on the rank, not on history, so a
   * FEN, the search's scratch board and the repetition key carry nothing new (a guard that walks
   * home regains it; pawns never do, guards rarely do). `off` is the shipped Wall.
   */
  guardDoubleFirst: GuardDoubleFirst;
  /**
   * A guard may never **end** a move on its own side's second rank (rank 2 for White, rank 7 for
   * Black) — no walling in the pawns from behind. A maester swap that would put one there is
   * illegal too. With `guardCaptures` off (shipped) this changes no attack; with it on, a square
   * a guard may not reach is a square it does not attack, which `isAttacked` mirrors.
   */
  guardNoSecondRank: boolean;
  /** Lab-only, off by default: a guard may never finish a move on a capital square (d4 e4 d5 e5). */
  guardNoCapital: boolean;
  /**
   * Lab-only, off by default (C2, `docs/MATRIX.md` §B.2): a piece standing on a capital square
   * (d4 e4 d5 e5) cannot be captured. Every generated capture whose victim stands there is dropped,
   * for both colours and every piece, so the four centre tiles are a sanctuary. A move onto an
   * *empty* capital square is untouched, and so is a piece that stands there and captures out of it
   * (the mirror reading, C5, is not this rule). Check and mate detection stay standard: `isAttacked`
   * is deliberately unchanged, so a king in the capital can be checked and mated but never taken.
   */
  capitalSanctuary: boolean;
  /**
   * Lab-only, off by default (C3, `docs/MATRIX.md` §B.2): a guard whose **own square** is in the
   * capital (d4 e4 d5 e5) may step 2 squares in any of the 8 directions — the same second square of
   * each ray as `guardStep: 2`, through an empty middle square, move-only, so `isAttacked` never
   * changes. The mirror of `guardNoCapital`: holding the centre buys reach.
   */
  guardCapitalStep: boolean;
  /**
   * 1 = each guard captures **once in its lifetime** and never again; 0 = no limit (shipped).
   *
   * Lab-only, and inert under the defaults: with `guardCaptures: 'none'` a guard never captures,
   * so it can never become spent. It is the one rule that depends on a piece's history and not on
   * the position, so the state rides in the piece byte: bit 5, `SPENT` in `./engine.ts` (types use
   * the low 4 bits, colour is bit 4). `typeOf`/`colorOf` mask it off, `makeMove` and the search's
   * make/unmake set it, `toFen` writes it as the letter `H`/`h`, and the Zobrist key hashes it.
   * A promoted guard is a new guard, so it starts unspent.
   */
  guardCaptureLimit: 0 | 1;
  /** An archer steps 1 orthogonally, in all 8 directions, or 1 forward / 1 back. Steps never capture. */
  archerMove: ArcherMove;
  /**
   * The archer's shot table: `classic` (diagonal-adjacent + orthogonal 2), `plusDiag2` (+ diagonal 2),
   * `ring2` (+ the whole Chebyshev-2 ring), `forward3` (the 2 forward diagonals + the square 2 ahead).
   */
  archerShots: ArcherShots;
  /** A beast steps straight ahead, in any of the 8 directions, or on the 4 diagonals (empty squares). */
  beastMove: BeastMove;
  /** Which squares a beast captures on: the 8 neighbours, or only the two forward diagonals. */
  beastCapture: BeastCapture;
  /** A beast also captures straight ahead, removing its blind spot. Read only with `beastCapture: 'adjacent'`. */
  beastCaptureForward: boolean;
  /** Maester and own king, both on their first rank, swap at any distance. */
  maesterLongSwap: boolean;
  /** The maester–king long swap no longer asks either of them to stand on the first rank. */
  maesterKingSwapAnywhere: boolean;
  /** The maester swaps with **any** friendly piece anywhere. The king keeps `maesterLongSwap`'s condition. */
  maesterSwapAny: boolean;
  /** The maester may trade places with an adjacent enemy instead of taking it. Never with a king. */
  maesterSwapEnemy: boolean;
  /** A maester steps 1 (shipped), or slides up to 2, in a straight line through empty squares. Captures stay adjacent. */
  maesterStep: 1 | 2;
  /**
   * When a paladin removes itself after capturing: `always` (shipped), `nonPawn` (it survives a
   * pawn), or `never` (a friend-jumping queen). Ignored under `paladinReturn`, which is the other
   * way of not dying.
   */
  paladinKamikaze: PaladinKamikaze;
  /** A paladin may capture a king, so it gives check. Off (shipped): it can never check or mate. */
  paladinChecks: boolean;
  /**
   * Death Touch's second reading (lab, 2026-09-17): with the toggle on, a Death Touch king **also**
   * keeps the ordinary displacement capture, so an adjacent enemy may be taken by moving onto it or
   * by shooting it in place. The delivered reading (off) replaces the displacement capture — one
   * verb per piece — and measured *lower* decisive share at both depths
   * (`docs/research/sim-kings-2026-09-16.md`); the proposal's own intent ("the best anti-draw
   * power") is what this reading tests.
   */
  deathTouchMoves: boolean;
  /** "The charge": after capturing, the paladin goes back to the square it left instead of dying. */
  paladinReturn: boolean;
  /** A paladin jumps over friendly pieces (shipped). Off: a friend stops the ray, like a normal slider. */
  paladinJumpsFriends: boolean;
  /** An enemy piece stops a paladin ray. Off: the paladin jumps enemies as well as friends. */
  paladinBlockedByEnemies: boolean;
  /**
   * Compensation for the first move: **Black's first turn is two moves**, then normal alternation.
   * The first of the two may not give check, so White never loses a king while it has no turn in
   * between. Implemented as a ply check (`pos.ply === 1`), not a flag on `Position`: the position
   * already carries `ply`, so a FEN round-trip, the search's scratch board and the repetition key
   * need nothing new and no extra state can drift out of step.
   */
  secondPlayerDoubleFirstTurn: boolean;
  /**
   * The Ogre's shove (piece type `O`, lab-only — it is not in `POOL` and enters only through
   * `--pool` or an explicit `backRanks`). `repel` (shipped shape): the shoved piece moves one
   * square straight away and the Ogre holds its ground. `push`: the Ogre steps into the square the
   * piece left, so the pair advances together. Neither reading is a capture and neither creates an
   * attack, so `isAttacked` sees only the Ogre's ordinary king-step capture.
   */
  ogreMode: OgreMode;
  /** Strike (Flame A) reading: `move` (as written) or `capture` (capture without moving). */
  strikeMode: StrikeMode;
  /**
   * The Reaver's escape step (piece type `V`, lab-only, same pool note as the Ogre). `any` (proposal
   * reading): after a capture the Reaver may step one square in any of the 8 directions onto an
   * empty square. `ortho`: only the 4 orthogonal directions — the designed nerf for "it dodges
   * every recapture" (docs/PIECES-PROPOSED.md #5). The first odds match priced `any` above 4.66
   * pawns against a knight of 2.96, so the reading is a live question, not a detail.
   */
  reaverStep: ReaverStep;
  /**
   * The Catapult's lob (piece type `C`, lab-only, same pool note as the Ogre). `stay`: it fires
   * from where it stands — the archer's rifle shape, `to === from`, which every make/unmake path
   * already handles. `land`: it moves onto the square it just cleared, an ordinary displacement
   * capture. The screen rule and the attack set are the same either way, so `isAttacked` does not
   * read this field.
   */
  catapultCapture: CatapultCapture;
  /**
   * The king each side plays and the power it chose, `[white, black]`; `null` is a plain king with
   * no power. That is what the browser plays (plan decision 21) and it is the control arm of every
   * A/B (decision 20) — "both sides, or neither".
   *
   * Only the six stateless tier-1 powers are built: **Holy Light** and **Mercy** (Spirit),
   * **Death Touch** and **Darkness** (Shadow), **March** and **Leap** (Mud). Each is a pure
   * function of the board plus this field, so there is no new `Position` field, no FEN field, no
   * Zobrist key, no repetition change and no search state. `parseKing` refuses the other six.
   */
  kings: readonly [KingChoice | null, KingChoice | null];
  /** Setup: reject a back rank whose two bishops share a square colour (Chess960 spirit). */
  bishopsOppositeColours: boolean;
  /** Which pieces a pawn may become on the last rank. */
  promotionSet: PromotionSet;
  /** 100 plies without a capture or a pawn move is a draw. */
  fiftyMove: boolean;
  /** The third occurrence of a position is a draw. Read by the simulation runner only. */
  threefold: boolean;
  /** No side keeps material that can force mate: draw. */
  insufficientMaterial: boolean;
}

/**
 * The shipped game: King Down Classic 2017 plus the three changes the balance lab measured and
 * the designer adopted (docs/RULES.md §6.8, §6.15) — the archer steps in any direction, the beast
 * steps in any direction, and a paladin survives a pawn capture (2026-09-14). The guard keeps its 2017 identity: an immortal wall that never
 * captures (§6.9), so the three guard toggles below all sit at their 2017 values.
 */
export const DEFAULT_RULES: Readonly<Rules> = Object.freeze({
  archerChecks: true,
  beastChains: true,
  guardImmune: true,
  guardCaptures: 'none' as GuardCaptures,
  guardStep: 1 as 1 | 2,
  guardDoubleFirst: 'off' as GuardDoubleFirst,
  guardNoSecondRank: false,
  guardNoCapital: false,
  capitalSanctuary: false,
  guardCapitalStep: false,
  guardCaptureLimit: 0 as 0 | 1,
  archerMove: 'any' as ArcherMove,
  // Adopted 2026-09-17 (owner call): the forward diagonal-2 squares on top of classic. Confirmed
  // at depth 4 (decisive +8.8, draws -8.2, fairness clean) at the cost of the archer's value,
  // 3.73 ± 0.42 -> > 4.66 pawns; ARCHER_V in src/ai/eval.ts is re-priced with it.
  // docs/research/sim-piece-balance-2026-09-17.md
  archerShots: 'plusDiagFwd2' as ArcherShots,
  beastMove: 'any' as BeastMove,
  beastCapture: 'adjacent' as BeastCapture,
  beastCaptureForward: false,
  maesterLongSwap: true,
  maesterKingSwapAnywhere: false,
  maesterSwapAny: false,
  maesterSwapEnemy: false,
  maesterStep: 1 as 1 | 2,
  paladinKamikaze: 'nonPawn' as PaladinKamikaze,
  paladinChecks: false,
  deathTouchMoves: false,
  paladinReturn: false,
  paladinJumpsFriends: true,
  paladinBlockedByEnemies: true,
  secondPlayerDoubleFirstTurn: false,
  ogreMode: 'repel' as OgreMode,
  strikeMode: 'move' as StrikeMode,
  reaverStep: 'ortho' as ReaverStep,
  catapultCapture: 'stay' as CatapultCapture,
  kings: [null, null] as readonly [KingChoice | null, KingChoice | null],
  bishopsOppositeColours: true,
  promotionSet: 'anyNonKingNoGuard' as PromotionSet,
  fiftyMove: true,
  threefold: true,
  insufficientMaterial: true,
});

/** The live rule set. Read it; do not replace it — `setRules` keeps the object identity. */
export const RULES: Rules = { ...DEFAULT_RULES };

/**
 * King Down Classic as the 2017 rulebook prints it: the game before the measured buffs. The guard
 * is unchanged from the defaults, so this preset is three fields plus the promotion set.
 */
export const RULES_2017: Readonly<Rules> = Object.freeze({
  ...DEFAULT_RULES,
  archerMove: 'ortho' as ArcherMove,
  // The 2017 game is the classic shot set; the 2026-09-17 widening is a shipped-game adoption, not
  // part of the older preset (the 2021 preset below overrides it with `forward3` anyway).
  archerShots: 'classic' as ArcherShots,
  beastMove: 'forward' as BeastMove,
  // 2017: the paladin removes itself after every capture, a pawn's included (§6.15 lifts the pawn).
  paladinKamikaze: 'always' as PaladinKamikaze,
  // The 2017 rulebook promotes to any piece except a king, the guard included; barring the guard
  // is the designer's 2026-09-13 call and is not part of the older game.
  promotionSet: 'anyNonKing' as PromotionSet,
});

/** The designer's 2021 "Chess Expansion Concept" archer and beast, on the 2017 base. */
export const RULES_2021: Readonly<Rules> = Object.freeze({
  ...RULES_2017,
  archerMove: 'fwdBack' as ArcherMove,
  archerShots: 'forward3' as ArcherShots,
  beastMove: 'diagFwdBack' as BeastMove,
  beastCapture: 'diagForward' as BeastCapture,
});

/** Reset to the defaults, then apply `over`. Call with no argument to restore today's rules. */
export function setRules(over?: Partial<Rules>): Rules {
  Object.assign(RULES, DEFAULT_RULES, over);
  return RULES;
}

/** The values a non-boolean rule accepts; every other rule takes `true` or `false`. */
const CHOICES: Record<string, readonly (string | number)[]> = {
  promotionSet: ['anyNonKing', 'standard', 'anyNonKingNoFairy', 'anyNonKingNoGuard'],
  guardCaptures: ['none', 'pawns', 'any'],
  guardStep: [1, 2],
  guardDoubleFirst: ['off', 'slide', 'leap'],
  guardCaptureLimit: [0, 1],
  archerMove: ['ortho', 'any', 'fwdBack'],
  archerShots: ['classic', 'plusDiag2', 'ring2', 'forward3', 'plusDiagFwd2'],
  beastMove: ['forward', 'any', 'diagFwdBack'],
  beastCapture: ['adjacent', 'diagForward'],
  maesterStep: [1, 2],
  paladinKamikaze: ['always', 'nonPawn', 'never'],
  ogreMode: ['repel', 'push'],
  strikeMode: ['move', 'capture'],
  reaverStep: ['any', 'ortho'],
  catapultCapture: ['stay', 'land'],
};

/** `"beastChains=false"` or `"archerShots=ring2"` -> a one-key patch. Throws on a bad name or value. */
export function parseRule(text: string): Partial<Rules> {
  const [key, value = 'true'] = text.split('=');
  // `kings` is the one rule that is not a scalar. `kings=Spirit:Mercy` gives both sides the same
  // king, `kings=Spirit:Mercy,none` names them apart, and `kingWhite=` / `kingBlack=` name one
  // side each — `parseRuleFlags` merges two such flags instead of letting the second drop the first.
  if (key === 'kings') return { kings: parseKings(value) };
  if (key === 'kingWhite') return { kings: [parseKing(value), null] };
  if (key === 'kingBlack') return { kings: [null, parseKing(value)] };
  const def = DEFAULT_RULES[key as keyof Rules];
  if (def === undefined) throw new Error(`unknown rule "${key}" (${Object.keys(DEFAULT_RULES).join(', ')}, kingWhite, kingBlack)`);
  const choices = CHOICES[key];
  if (!choices) {
    if (value !== 'true' && value !== 'false') throw new Error(`rule "${key}" takes true or false, got "${value}"`);
    return { [key]: value === 'true' } as Partial<Rules>;
  }
  const v: string | number = typeof def === 'number' ? Number(value) : value;
  if (!choices.includes(v)) throw new Error(`bad ${key} "${value}" (${choices.join(' | ')})`);
  return { [key]: v } as unknown as Partial<Rules>;
}

/** Only the fields that differ from the defaults, for a run header or a report line. */
export function ruleDiff(rules: Partial<Rules> = RULES): Partial<Rules> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(rules)) {
    const def = DEFAULT_RULES[k as keyof Rules];
    // `kings` is an array, so a spec that spells out the default pair would be a fresh object and
    // `!==` would print it as a difference. Compare by value for the non-scalars.
    const same = v !== null && typeof v === 'object' ? JSON.stringify(v) === JSON.stringify(def) : v === def;
    if (v !== undefined && !same) out[k] = v;
  }
  return out as Partial<Rules>;
}
