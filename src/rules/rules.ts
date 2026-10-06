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
/**
 * Archer shot set. `plusDiagFwd2` (2026-09-17) is the measured middle ground: classic plus the two
 * **forward** two-square diagonals, so each side's widening faces the enemy. It is colour-dependent,
 * like `forward3` — see `archerShotsFor` in engine.ts. Three lab sets between it and `classic`
 * (2026-10-04): `plusDiagFwd2Clear` (the same shots, but a forward diagonal-2 shot needs the
 * square between empty), `fwd2NoBack` (without the shot 2 straight back) and `fwd2NoSide` (without
 * the two shots 2 to the side).
 */
export type ArcherShots = 'classic' | 'plusDiag2' | 'ring2' | 'forward3' | 'plusDiagFwd2' | 'plusDiagFwd2Clear' | 'fwd2NoBack' | 'fwd2NoSide';
/** What a guard may take by moving onto it. `any` turns it into a commoner that gives check. */
export type GuardCaptures = 'none' | 'pawns' | 'any';
/** Lab: the guard's double step from its home rank — none, through an empty square, or over anything. */
export type GuardDoubleFirst = 'off' | 'slide' | 'leap';
/**
 * Lab (2026-10-04): the guard starts beside the board and enters as a move (`Rules.guardReserve`).
 * `rank1`: onto any empty square of the side's first rank; `rank12`: of its first two ranks.
 */
export type GuardReserve = 'off' | 'rank1' | 'rank12';
/** Squares a beast may step to (empty only; its captures are a separate rule). */
export type BeastMove = 'forward' | 'any' | 'diagFwdBack';
/**
 * Which squares a beast captures on. `diagForward` is the 2021 concept: the two forward diagonals
 * only. `diagonal` (lab, 2026-09-17) is the colour-independent one-sentence reading: the beast takes
 * on the four diagonal neighbours, all four, and keeps taking from each new square.
 */
export type BeastCapture = 'adjacent' | 'diagForward' | 'diagonal';
/** When a paladin dies of its own capture: after any (shipped), after anything but a pawn, or never. */
export type PaladinKamikaze = 'always' | 'nonPawn' | 'never';
/** Where the Ogre stands after a shove: `repel` = it holds its square, `push` = it follows, Sokoban-style. */
export type OgreMode = 'repel' | 'push';
/**
 * Who an Ogre may shove, never a king under any value: `both` (shipped lab reading) = friends and
 * enemies alike, `enemies` = crowd control only, `friends` = support only. Guards are pieces like
 * any other for a shove, whatever this says.
 */
export type OgreShoveFriends = 'both' | 'enemies' | 'friends';
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
/** Haste's second move: anything (`any`) or a move that captures nothing (`quiet`). */
export type HasteSecond = 'any' | 'quiet';
/** Rage's second move: anything (`any`), a move that captures nothing (`quiet`), or none after a first move that took (`stopOnTake`). */
export type RageSecond = 'any' | 'quiet' | 'stopOnTake';

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
/**
 * What card mode deals (`Rules.hands`): a one-use king power, or a card that no king has (`CARD_ONLY`).
 * A card-only name is never a `PowerName`, so the king picker and the per-power tables never see it.
 */
export type CardName = PowerName | 'Mimic' | 'Vault' | 'Curse' | 'SkyLift' | 'Salvation'
  | 'Rage' | 'RageB' | 'Mirror' | 'MirrorB' | 'Firewall' | 'FirewallB' | 'EarthQuake' | 'EarthQuakeB'
  | 'Burn' | 'FireStarter' | 'Control' | 'Rescue' | 'Growth' | 'GrowthB';
/**
 * The cards no king has (lab, 2026-10-03), each one use and the turn's move:
 * - **Mimic**: a piece (not king or pawn) moves, to an empty square only, the way one of the side's
 *   other piece types moves (not a king or pawn); it keeps its own type.
 * - **Vault**: a rook, bishop or queen passes exactly one piece on its line, of either side.
 * - **Curse**: an enemy piece or pawn (not the king) steps one square onto an empty square.
 * - **SkyLift**: two of the side's own pieces (not king or pawn, not one type) trade squares.
 * - **Salvation** (2026-10-04): one of the side's captured pieces returns to an empty square of its
 *   own first rank. The pieces are Sacrifice's reserve (`Position.lost`) with Sacrifice's limits: no
 *   pawn, no guard, never a king; a captured promoted piece returns as what it was when taken.
 *
 * The 2014 cards (owner, 2026-10-04: "cards - let's add all"), a `B` name the softer variant; the
 * texts are `cardText` in src/powers-ui.ts, the readings `docs/research/cards-2026-10-03.md`:
 * - **Rage** / **RageB**: one piece moves twice in the turn (Haste's shape, the second move may be
 *   skipped); Rage may take on either move, RageB's second move must take.
 * - **Mirror**: play the card the opponent played last; **MirrorB**: play another card of the hand,
 *   which stays in the hand. Either is the copied card's move, with that card's rules.
 * - **Firewall**: no piece of the side can be taken (nor cursed or swapped) on the opponent's next
 *   turn, a mark like Ice Wall's on every piece; **FirewallB**: an own piece (not the king) and an
 *   enemy piece (not the king) next to it trade squares.
 * - **EarthQuake**: the pieces next to a square (not kings) are pushed one square straight away
 *   from it where the square beyond is empty; **EarthQuakeB**: a square next to an own piece.
 * - **Burn**: an own piece (not a pawn or king) takes an enemy (not the king) on d4 e4 d5 e5 as a
 *   queen would; **FireStarter**: the same on the enemy's back rank.
 * - **Control**: an own piece (not a pawn or king) moves and takes as a friendly piece next to it
 *   (not a pawn or king) does.
 * - **Rescue**: the side's Freeze, Ice Wall or Firewall from its previous turn binds one more turn.
 * - **Growth** / **GrowthB**: draw the next card of the side's pile (`Rules.piles`), as the turn
 *   (Growth) or then make the move (GrowthB).
 */
export const CARD_ONLY: readonly CardName[] = [
  'Mimic', 'Vault', 'Curse', 'SkyLift', 'Salvation',
  'Rage', 'RageB', 'Mirror', 'MirrorB', 'Firewall', 'FirewallB', 'EarthQuake', 'EarthQuakeB', 'Burn', 'FireStarter', 'Control', 'Rescue', 'Growth', 'GrowthB',
];

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
 * The king each side shows when it has no power: White's is Spirit, Black's is Shadow (owner,
 * 2026-10-03). Not a rule: for the rules a king with no power is `null` in `Rules.kings`.
 */
export const PLAIN_KINGS: readonly [KingName, KingName] = ['Spirit', 'Shadow'];

/** The stateless powers: pure rule modifiers of the board plus this field, always on. */
export const TIER1: readonly PowerName[] = ['HolyLight', 'Mercy', 'DeathTouch', 'Darkness', 'March', 'Leap'];

/** Every power the engine plays — all twelve since 2026-10-02 (docs/RULES.md §4). */
export const BUILT: readonly PowerName[] = [
  'Freeze', 'IceWall', 'Strike', 'Haste', 'Flight', 'Sacrifice', 'March', 'Leap', 'HolyLight', 'Mercy', 'DeathTouch', 'Darkness',
];

/**
 * The powers a player *spends*: each use is a move tagged with `Move.power`, and the side's count of
 * spent uses travels with the position (`Position.used`). The count each side may spend is a rule
 * (`Rules.freezeUses` and the rest): the 2017 rulebook's numbers are the defaults (docs/RULES.md
 * §6.5), and 0 means unlimited. March and Leap at 0 are the stateless always-on readings measured in
 * docs/research/sim-kings-2026-09-16.md.
 */
export const USES_RULE: Readonly<Partial<Record<PowerName, keyof Rules>>> = Object.freeze({
  Freeze: 'freezeUses', IceWall: 'iceWallUses', Strike: 'strikeUses', Haste: 'hasteUses',
  Flight: 'flightUses', Sacrifice: 'sacrificeUses', March: 'marchUses', Leap: 'leapUses',
});

/** Every card card mode deals: the one-use powers, then the card-only cards. Its order is the card's hash slot (`Z_LAST`): append only. */
export const ALL_CARDS: readonly CardName[] = [...(Object.keys(USES_RULE) as PowerName[]), ...CARD_ONLY];

/** `"Spirit:Mercy"` (case-insensitive), or `"none"` / `"-"` / `""` for a king with no power. */
export function parseKing(text: string): KingChoice | null {
  const t = text.trim();
  if (!t || t === 'none' || t === '-') return null;
  const [k = '', p = ''] = t.split(':');
  const king = (Object.keys(KINGS) as KingName[]).find(n => n.toLowerCase() === k.toLowerCase());
  if (!king) throw new Error(`unknown king "${k}" (${Object.keys(KINGS).join(' | ')} | none)`);
  const power = KINGS[king].find(n => n.toLowerCase() === p.toLowerCase());
  if (!power) throw new Error(`king ${king} has no power "${p}" (${KINGS[king].join(' | ')})`);
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
   * Lab (2026-10-04), `off` by default: "Your Guard starts beside the board; as a move, place it on
   * any empty square of your first rank" (`rank1`; `rank12`: of your first two ranks). The start
   * position leaves each guard's back-rank square empty and the guard waits (`Position.waiting`,
   * FEN field 7 `g1.1`); the back ranks are drawn as before. Placing it is an ordinary move with no
   * power (`Move.drop`, written `G@b1`): it may answer a check by blocking, never leaves the
   * own king in check, and lands only where a guard may land (`guardNoSecondRank` keeps it off rank
   * 2). Once placed it is an ordinary guard.
   */
  guardReserve: GuardReserve;
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
   * Lab-only, off by default (C5, `docs/MATRIX.md` §B.2): a piece standing on a capital square
   * (d4 e4 d5 e5) cannot capture. Every generated move whose **`from` square** is in the capital
   * and whose `captures` array is non-empty is dropped, for both colours and every piece; the same
   * piece's quiet moves are untouched, and a capture **into** the capital is the separate mirror
   * reading (`capitalSanctuary`, C2). The two compose: with both on, a capital square both protects
   * its occupant and disarms it. Check and mate detection stay standard: `isAttacked` is
   * deliberately unchanged, so a capital piece still counts as attacking (and therefore still gives
   * check) even though no capture of its victim can be generated.
   */
  capitalNoCapture: boolean;
  /**
   * Lab-only, off by default (C3, `docs/MATRIX.md` §B.2): a guard whose **own square** is in the
   * capital (d4 e4 d5 e5) may step 2 squares in any of the 8 directions — the same second square of
   * each ray as `guardStep: 2`, through an empty middle square, move-only, so `isAttacked` never
   * changes. The mirror of `guardNoCapital`: holding the centre buys reach.
   */
  guardCapitalStep: boolean;
  /**
   * Lab-only, off by default (C4, `docs/MATRIX.md` §B.2): a pawn whose **own square** is in the
   * capital (d4 e4 d5 e5) may also capture **straight ahead** — the square one rank forward, onto
   * an enemy piece `canCapture` allows. The centre bonus is a capture the ordinary pawn does not
   * have; every other square of the board is untouched. The move goes through the same `push()`
   * path as the ordinary advance, so on the last rank it promotes exactly like a push does. A
   * straight capture is a *move*, not a new attack: `isAttacked` keeps the ordinary two diagonals
   * (a pawn's straight capture is generated for `all` and `captures`, never for `attacks`), the
   * same deliberate check-detection split as `capitalSanctuary`.
   */
  pawnCapitalCapture: boolean;
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
   * `ring2` (+ the whole Chebyshev-2 ring), `forward3` (the 2 forward diagonals + the square 2 ahead),
   * `plusDiagFwd2` (classic + the 2 forward diagonal-2 squares) and its three lab trims (see `ArcherShots`).
   */
  archerShots: ArcherShots;
  /** A beast steps straight ahead, in any of the 8 directions, or on the 4 diagonals (empty squares). */
  beastMove: BeastMove;
  /** Which squares a beast captures on: the 8 neighbours, the two forward diagonals, or the four diagonals. */
  beastCapture: BeastCapture;
  /**
   * A beast also captures straight ahead, removing its blind spot. It means something only for
   * `beastCapture: 'adjacent'`, the one reading with a blind spot; it is inert for `'diagForward'`
   * and `'diagonal'`.
   */
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
   * Lab-only, off by default (movement reading, 2026-09-17): the Ogre may **hop over one adjacent
   * piece** — friend or enemy, a king included, because a hop jumps a piece and displaces nothing —
   * and land on the empty square directly beyond it, in any of the 8 directions. A hop is a move:
   * it is neither a capture nor a shove, the jumped piece stays where it stands, and the square
   * beyond must be empty, so a hop never lands on a second piece. Move-only, so `isAttacked` keeps
   * the Ogre's ordinary king-step attack — the same split as `guardStep` and `maesterStep`.
   * Report: `docs/research/sim-ogre-movement-2026-09-17.md`.
   */
  ogreHop: boolean;
  /**
   * Lab-only, off by default (movement reading, 2026-09-17): the Ogre may step **2 squares** in any
   * of the 8 directions, through an empty intermediate square and onto an empty landing square —
   * the plain mobility reading, the same second-square shape as `guardStep: 2` and `maesterStep: 2`.
   * Move-only, so `isAttacked` does not change: the two-square reach adds no attacked square.
   * Report: `docs/research/sim-ogre-movement-2026-09-17.md`.
   */
  ogreStep2: boolean;
  /**
   * The Ogre's shove (piece type `O`, lab-only — it is not in `POOL` and enters only through
   * `--pool` or an explicit `backRanks`). `repel` (shipped shape): the shoved piece moves one
   * square straight away and the Ogre holds its ground. `push`: the Ogre steps into the square the
   * piece left, so the pair advances together. Neither reading is a capture and neither creates an
   * attack, so `isAttacked` sees only the Ogre's ordinary king-step capture.
   */
  ogreMode: OgreMode;
  /**
   * Lab (2026-09-17), off by default: the Ogre **cannot capture**. `canCapture` refuses it, so no
   * generator produces a capture by an Ogre and the shove is its only way to affect an enemy.
   * Check and mate follow the same rule of capture: a no-capture Ogre attacks nothing, so it can
   * never give check or mate, a king may stand beside it safely, and `isAttacked` mirrors that
   * (`crossCheckAttacks` holds the two together). `insufficientMaterial` drops it from the mating
   * material for the same reason: K+O vs K is a draw under this reading. It stays a commoner for
   * everything else — it is still a piece on the board, so it blocks and can be taken.
   */
  ogreNoCapture: boolean;
  /**
   * Lab (2026-09-17): which pieces an Ogre may shove. `both` (shipped lab default) shoves friends
   * and enemies alike; `enemies` is a pure crowd-control reading; `friends` a pure support reading
   * (reposition your own pieces). Guards are shovable under every value — that is the point of the
   * piece — and kings never are. Inert with no Ogre on the board.
   */
  ogreShoveFriends: OgreShoveFriends;
  /** Strike (Flame A) reading: `move` (as written) or `capture` (capture without moving). */
  strikeMode: StrikeMode;
  /**
   * Strike may capture (the rulebook). Off (balance lab, 2026-10-02): the queen-like move goes only
   * to an empty square — a reposition, like Flight but along the piece's queen lines.
   */
  strikeCaptures: boolean;
  /**
   * Per-game uses of each spendable king power (`USES_RULE`); 0 = unlimited. The defaults are the
   * 2017 rulebook's token counts (docs/RULES.md §6.5): Freeze 2, Ice Wall 2, Strike 1, Haste 1,
   * Flight 1, Sacrifice 1, March 3, Leap 3. March and Leap at 0 are the always-on readings: a
   * marching pawn's double step and a leaping slider's ray are then ordinary moves and attacks.
   * Counted, they are power moves like the others — never a king capture, never an attack.
   */
  freezeUses: number;
  iceWallUses: number;
  /**
   * Haste's second move (balance lab, 2026-10-02): `any` (the rulebook) or `quiet` — the second
   * move may not capture, so a Haste can take and escape, or set up, but never take twice.
   */
  hasteSecond: HasteSecond;
  /**
   * The Rage card's second move (balance lab, 2026-10-05): `any` (the card as written), `quiet` (it
   * may not capture), or `stopOnTake` (a first move that takes ends the turn). RageB keeps its own.
   */
  rageSecond: RageSecond;
  /** A Haste turn may capture (the rulebook). Off (balance lab): neither of its two moves captures. */
  hasteCaptures: boolean;
  /**
   * Haste readings (balance lab, 2026-10-03), each a limit on top of the others; the `pass` that
   * skips the second move stays. `hasteApart`: the second move may not end next to an enemy piece
   * (the 8 neighbours, the king included). `hasteNoThreat`: it may not end where the moved piece
   * could capture an enemy piece or take the king by its own capture rules, on the board after the
   * move. `hasteNoForward`: it may not end on a rank nearer the enemy's back rank than the one it
   * starts from. `hasteNoCheck`: neither move may leave the enemy king in check.
   */
  hasteApart: boolean;
  hasteNoThreat: boolean;
  hasteNoForward: boolean;
  hasteNoCheck: boolean;
  /**
   * Freeze and Ice Wall as a free action (balance lab, 2026-10-02): the mark does not end the turn;
   * the marking side then makes an ordinary move (or ends the turn). Off: the mark is the whole turn.
   */
  markFree: boolean;
  /**
   * After a free Freeze (`markFree`), the ordinary move of that turn takes nothing (balance lab,
   * 2026-10-02): a Freeze can stop a piece but cannot open the capture it was guarding that turn.
   */
  freezeQuiet: boolean;
  /** How many of the opponent's turns a Freeze or Ice Wall mark covers (balance lab; the rulebook: 1). */
  markTurns: 1 | 2;
  /**
   * Mercy (balance lab, 2026-10-02): the king keeps its ordinary adjacent capture. Off (the
   * rulebook): it takes nothing but a guard. The two-square reach stays move-only either way.
   */
  mercyCaptures: boolean;
  /**
   * Mercy's shelter (balance lab, 2026-10-02): no capture takes a piece standing next to its own
   * Mercy king. The king itself is not sheltered. Off (the rulebook): nothing is.
   */
  mercyAura: boolean;
  /** Strike by a pawn (the rulebook: "any own piece (not king)"). Off (balance lab): pieces only. */
  strikePawns: boolean;
  /**
   * Sacrifice as a comeback (balance lab, 2026-10-02): usable only while the side has fewer pieces
   * than the opponent, kings and pawns not counted. Off (the rulebook): whenever a piece was lost.
   */
  sacrificeBehind: boolean;
  /** Holy Light (balance lab): the king may take pawns. Off (the rulebook): it takes none. */
  holyLightTakesPawns: boolean;
  /**
   * Holy Light (balance lab): the light covers the king's neighbours too — no enemy pawn takes a
   * piece standing next to a Holy Light king. Off (the rulebook): only the king is covered.
   */
  holyLightAura: boolean;
  /**
   * Holy Light (balance lab): Mercy's shelter under the light — no capture at all takes a piece next
   * to the Holy Light king. Off (the rulebook): only the king is covered, and only from pawns.
   */
  holyLightShelter: boolean;
  /** The Holy Light shelter covers only the four orthogonal neighbours (balance lab). */
  holyLightShelterOrtho: boolean;
  /** Mercy's shelter covers only the four orthogonal neighbours (balance lab). */
  mercyAuraOrtho: boolean;
  /** Mercy's shelter stops only pawn captures (balance lab), like Holy Light's aura. */
  mercyAuraPawns: boolean;
  /** Mercy's shelter stops every capture but a pawn's (balance lab). `mercyAuraPawns` takes precedence. */
  mercyAuraPawnsTake: boolean;
  /** Mercy (balance lab): the king may also take enemy pawns next to it. Off (the rulebook): only a guard. */
  mercyTakesPawns: boolean;
  /** Mercy (balance lab): the two-square step needs an empty square between — the king jumps nothing. */
  mercyNoJump: boolean;
  /** Holy Light (balance lab): no enemy knight takes the king either. Off (the rulebook): pawns only. */
  holyLightKnights: boolean;
  /**
   * Darkness (balance lab): the pawns also keep their ordinary moves (one or two straight ahead from
   * the start), but still take only straight ahead. A half step between the rulebook and `darknessKeep`.
   */
  darknessMoves: boolean;
  /**
   * Darkness (balance lab): the pawns keep their ordinary moves as well, so a pawn moves and takes
   * one square forward, straight or diagonal (its first double step too). Off (the rulebook): the
   * two verbs swap and the double step is gone.
   */
  darknessKeep: boolean;
  /**
   * Darkness (balance lab, round 8): ordinary pawns that may also take straight ahead — no diagonal
   * steps. Takes precedence over `darknessMoves` and `darknessKeep`.
   */
  darknessTakeAhead: boolean;
  /**
   * Darkness (balance lab, round 8): ordinary pawns that may also step diagonally forward — no
   * straight capture. Takes precedence over `darknessMoves` and `darknessKeep`.
   */
  darknessStepDiag: boolean;
  /**
   * Darkness (balance lab, 2026-10-03): no capture takes a piece standing diagonally next to its own
   * Darkness king — the diagonal twin of `holyLightShelterOrtho`. The king itself is not sheltered.
   */
  darknessShelter: boolean;
  /** The Darkness shelter stops every capture but a pawn's (balance lab). */
  darknessShelterPawnsTake: boolean;
  /**
   * Darkness (balance lab, round 16): enemy pawns cannot take your pawns. Any other piece still can.
   * The pawn pair is decided in `canCapture`, like Holy Light's pawns and king.
   */
  darknessPawnArmor: boolean;
  /**
   * Darkness (balance lab, round 16): enemy pawns cannot take your pieces next to your king (all 8
   * neighbours, pawns too; not the king). `darknessShelter` takes precedence.
   */
  darknessAuraPawns: boolean;
  /**
   * Darkness (round 16; official since 2026-10-04, owner): the king may also step two squares in a
   * straight line (8 directions), over an empty square, to an empty square. The middle square may be
   * attacked. Move-only, like Mercy's two-square step.
   */
  darknessKingStep2: boolean;
  /**
   * Darkness (balance lab, round 17), with `darknessKingStep2`: the two-square step may not pass over
   * a square an enemy attacks (like castling). Move-only. `darknessKingStepTakes` takes precedence.
   */
  darknessKingStepSafe: boolean;
  /**
   * Darkness (balance lab, round 17), with `darknessKingStep2`: the two-square step may also end on an
   * enemy piece and take it, by the ordinary king capture's rules. So it adds attacked squares.
   */
  darknessKingStepTakes: boolean;
  /**
   * Death Touch (balance lab, round 8): the king also touches two squares away in a straight line,
   * over an empty square. Off (the rulebook): adjacent only.
   */
  deathTouchReach: boolean;
  /** The two-square touch reaches along files and ranks only, not diagonals (balance lab). */
  deathTouchReachOrtho: boolean;
  /** The two-square touch never goes backward, toward its own back rank (balance lab, round 14). */
  deathTouchReachNoBack: boolean;
  /** The two-square touch goes only straight forward or back, never sideways (balance lab, round 14). */
  deathTouchReachForwardBack: boolean;
  /** The two-square touch takes pieces only, never pawns; the adjacent touch still does (balance lab, round 14). */
  deathTouchReachPieces: boolean;
  strikeUses: number;
  hasteUses: number;
  flightUses: number;
  sacrificeUses: number;
  marchUses: number;
  leapUses: number;
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
   * All twelve powers are built. The always-on ones (**Holy Light**, **Mercy**, **Death Touch**,
   * **Darkness**, and March and Leap at 0 uses) are pure functions of the board plus this
   * field. The spendable ones (**Freeze**, **Ice Wall**, **Strike**, **Haste**, **Flight**,
   * **Sacrifice**, and counted March/Leap) carry game state on `Position` — uses spent, a Freeze or
   * Ice Wall mark, a pending Haste square, the Sacrifice reserve — which FEN field 7, the search's
   * hash and the repetition key all include.
   */
  kings: readonly [KingChoice | null, KingChoice | null];
  /**
   * Card mode (lab, 2026-10-03): each side's hand of one-use cards, `[white, black]`. A card is one
   * use of a spendable power, with that power's rules, or a card no king has (`CARD_ONLY`, off unless
   * a hand names it); a side plays at most one a turn (each power
   * move is the turn, or a free mark then the ordinary move). Which cards are played travels in
   * `Position.used` as a bit per hand index. Empty hands (the default) = no card mode; the kings'
   * powers stay as they are, so give the kings no power in card mode.
   */
  hands: readonly [readonly CardName[], readonly CardName[]];
  /**
   * Card mode, Growth (2026-10-04): each side's draw pile, `[white, black]`, in the order it is
   * drawn; a drawn card joins the hand after the dealt ones (`Position.drawn` counts them), so its
   * played bit is the next index of `Position.used`. A hand holds at most 8 cards, dealt and drawn.
   * Empty (the default) = nothing to draw.
   */
  piles: readonly [readonly CardName[], readonly CardName[]];
  /** Setup: reject a back rank whose two bishops share a square colour (Chess960 spirit). */
  bishopsOppositeColours: boolean;
  /** Which pieces a pawn may become on the last rank. */
  promotionSet: PromotionSet;
  /** 100 plies without a capture or a pawn move is a draw. */
  fiftyMove: boolean;
  /** The third occurrence of a position is a draw. Game, search and simulation honor this switch. */
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
  guardReserve: 'off' as GuardReserve,
  capitalSanctuary: false,
  capitalNoCapture: false,
  guardCapitalStep: false,
  pawnCapitalCapture: false,
  guardCaptureLimit: 0 as 0 | 1,
  archerMove: 'any' as ArcherMove,
  // Adopted 2026-09-17 (owner call): the forward diagonal-2 squares on top of classic. Confirmed
  // at depth 4 (decisive +8.8, draws -8.2, fairness clean) at the cost of the archer's value,
  // 3.73 ± 0.42 -> > 4.66 pawns; ARCHER_V in src/ai/eval.ts is re-priced with it.
  // docs/research/sim-piece-balance-2026-09-17.md
  archerShots: 'plusDiagFwd2' as ArcherShots,
  beastMove: 'any' as BeastMove,
  beastCapture: 'adjacent' as BeastCapture,
  // The blind spot goes (2026-09-17): "the 7 adjacent squares except straight ahead" cost more to
  // remember than it earned. All three simplifications were measured at 1,600/arm depth 4; removing
  // the blind spot is the only price-neutral one (beast 4.34 ± 0.42 pawns, captures +29%); the
  // diagonal readings halve the piece's value. The blind spot stays a lab reading.
  beastCaptureForward: true,
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
  ogreHop: false,
  ogreStep2: false,
  ogreMode: 'push' as OgreMode,
  ogreNoCapture: false,
  ogreShoveFriends: 'both' as OgreShoveFriends,
  strikeMode: 'move' as StrikeMode,
  strikeCaptures: true,
  freezeUses: 2,
  iceWallUses: 2,
  hasteSecond: 'any' as HasteSecond,
  rageSecond: 'any' as RageSecond,
  hasteCaptures: true,
  hasteApart: false,
  hasteNoThreat: false,
  hasteNoForward: false,
  hasteNoCheck: false,
  markFree: false,
  freezeQuiet: false,
  markTurns: 1 as 1 | 2,
  mercyCaptures: false,
  mercyAura: false,
  strikePawns: true,
  sacrificeBehind: false,
  holyLightTakesPawns: false,
  holyLightAura: false,
  darknessKeep: false,
  holyLightKnights: false,
  holyLightShelter: false,
  holyLightShelterOrtho: false,
  mercyAuraOrtho: false,
  mercyAuraPawns: false,
  mercyAuraPawnsTake: false,
  mercyTakesPawns: false,
  mercyNoJump: false,
  darknessMoves: false,
  darknessTakeAhead: false,
  darknessStepDiag: false,
  darknessShelter: false,
  darknessShelterPawnsTake: false,
  darknessPawnArmor: false,
  darknessAuraPawns: false,
  darknessKingStep2: false,
  darknessKingStepSafe: false,
  darknessKingStepTakes: false,
  deathTouchReach: false,
  deathTouchReachOrtho: false,
  deathTouchReachNoBack: false,
  deathTouchReachForwardBack: false,
  deathTouchReachPieces: false,
  strikeUses: 1,
  hasteUses: 1,
  flightUses: 1,
  sacrificeUses: 1,
  marchUses: 3,
  leapUses: 3,
  reaverStep: 'ortho' as ReaverStep,
  catapultCapture: 'stay' as CatapultCapture,
  kings: [null, null] as readonly [KingChoice | null, KingChoice | null],
  hands: [[], []] as readonly [readonly CardName[], readonly CardName[]],
  piles: [[], []] as readonly [readonly CardName[], readonly CardName[]],
  bishopsOppositeColours: true,
  // Reverted to the chess set on 2026-09-17 (designer guideline: do not keep a rule that adds
  // nothing measurable). Fairy promotions were 1.3% of all promotions and moved no outcome metric;
  // `anyNonKingNoGuard` and `anyNonKing` stay as lab readings.
  promotionSet: 'standard' as PromotionSet,
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
  // 2017 had the beast's blind spot; the 2026-09-17 simplification is a shipped-game adoption.
  beastCaptureForward: false,
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

/**
 * The kings' powers as balanced on 2026-10-02 (docs/research/kings-powers-balance-2026-10-02.md):
 * the readings the game applies whenever a king has a power. The rule defaults stay the 2017
 * rulebook's, so `?rules=2017` and the lab can still play the powers as printed.
 */
export const POWERS_BALANCED: Readonly<Partial<Rules>> = Object.freeze({
  markFree: true,            // Freeze and Ice Wall: mark, then make your move
  freezeUses: 1,             // Freeze once a game
  hasteCaptures: false,      // Haste: neither move captures
  strikePawns: false,        // Strike: pieces only
  strikeCaptures: false,     // Strike: to an empty square
  mercyAura: true,           // Mercy: the pieces next to the king cannot be taken,
  mercyAuraPawnsTake: true,  //   except by pawns, and the king may take pawns
  mercyTakesPawns: true,     //   (reading M2, owner 2026-10-03)
  marchUses: 0,              // March: always on
  holyLightTakesPawns: true, // Holy Light: the king may take pawns
  holyLightShelter: true,    // Holy Light: the pieces beside, in front of or behind the king
  holyLightShelterOrtho: true, //   cannot be taken (round 6)
  darknessMoves: true,       // Darkness: pawns keep their straight steps,
  darknessKingStep2: true,   //   and the king may step two squares over an empty square (owner 2026-10-04)
  deathTouchReach: true,     // Death Touch: also two squares away, straight forward, back or
  deathTouchReachOrtho: true, //   sideways, over an empty square (round 10)
});

/** Reset to the defaults, then apply `over`. Call with no argument to restore today's rules. */
export function setRules(over?: Partial<Rules>): Rules {
  Object.assign(RULES, DEFAULT_RULES, over);
  // A hand replaces its side's spendable king power, which would vanish unnoticed: refuse the mix.
  for (const c of [0, 1] as const) {
    const p = RULES.kings[c]?.power, key = p && USES_RULE[p];
    const spendable = !!key && !((p === 'March' || p === 'Leap') && RULES[key] === 0);
    if (RULES.hands[c].length && spendable) throw new Error(`side ${c} has a hand and the king power ${p}: card mode plays kings without spendable powers`);
  }
  return RULES;
}

/** The values a non-boolean rule accepts; every other rule takes `true` or `false`. */
const CHOICES: Record<string, readonly (string | number)[]> = {
  promotionSet: ['anyNonKing', 'standard', 'anyNonKingNoFairy', 'anyNonKingNoGuard'],
  guardCaptures: ['none', 'pawns', 'any'],
  guardStep: [1, 2],
  guardDoubleFirst: ['off', 'slide', 'leap'],
  guardReserve: ['off', 'rank1', 'rank12'],
  guardCaptureLimit: [0, 1],
  archerMove: ['ortho', 'any', 'fwdBack'],
  archerShots: ['classic', 'plusDiag2', 'ring2', 'forward3', 'plusDiagFwd2', 'plusDiagFwd2Clear', 'fwd2NoBack', 'fwd2NoSide'],
  beastMove: ['forward', 'any', 'diagFwdBack'],
  beastCapture: ['adjacent', 'diagForward', 'diagonal'],
  maesterStep: [1, 2],
  paladinKamikaze: ['always', 'nonPawn', 'never'],
  ogreMode: ['repel', 'push'],
  ogreShoveFriends: ['both', 'enemies', 'friends'],
  strikeMode: ['move', 'capture'],
  freezeUses: [0, 1, 2, 3, 4, 5, 6],
  iceWallUses: [0, 1, 2, 3, 4, 5, 6],
  hasteSecond: ['any', 'quiet'],
  rageSecond: ['any', 'quiet', 'stopOnTake'],
  markTurns: [1, 2],
  strikeUses: [0, 1, 2, 3, 4, 5, 6],
  hasteUses: [0, 1, 2, 3, 4, 5, 6],
  flightUses: [0, 1, 2, 3, 4, 5, 6],
  sacrificeUses: [0, 1, 2, 3, 4, 5, 6],
  marchUses: [0, 1, 2, 3, 4, 5, 6],
  leapUses: [0, 1, 2, 3, 4, 5, 6],
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
  // `hands=Freeze+Haste` gives both sides that hand, `hands=Freeze+Haste,Flight` names them apart.
  // `piles=` the same way: the cards each side draws, in order (Growth).
  if (key === 'hands' || key === 'piles') {
    const side = (t: string): CardName[] => t.split('+').filter(Boolean).map(n => {
      const p = ALL_CARDS.find(x => x.toLowerCase() === n.toLowerCase());
      if (!p) throw new Error(`${key}: "${n}" is not a one-use power or card (${ALL_CARDS.join(', ')})`);
      return p;
    });
    const [w, b = w] = value.split(',');
    return { [key]: [side(w), side(b)] } as Partial<Rules>;
  }
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
