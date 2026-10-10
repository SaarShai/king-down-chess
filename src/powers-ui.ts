/**
 * The kings' powers in the HUD (docs/RULES.md §4): names and one-line rules, uses left, and which
 * power moves the player must arm first. The engine decides what is legal; this module only says
 * how a person reaches it.
 */
import { B, CardName, Color, KINGS, KingChoice, KingName, Move, moveNumber, N, PowerName, POWERS_BALANCED, PowerTag, Position, Q, R, RULES, type Rules, USES_RULE } from './rules/engine';

export const POWER_NAME: Record<PowerName, string> = {
  Freeze: 'Freeze', IceWall: 'Ice Wall', Strike: 'Strike', Haste: 'Haste', Flight: 'Flight', Sacrifice: 'Sacrifice',
  March: 'March', Leap: 'Leap', HolyLight: 'Holy Light', Mercy: 'Mercy', DeathTouch: 'Death Touch', Darkness: 'Darkness',
};

/**
 * One line per power, as a player reads it, under the rules in force (the balance-lab readings of
 * docs/research/kings-powers-balance-2026-10-02.md change several). Use counts come from the rules.
 */
export function powerText(power: PowerName, r: Rules = RULES, webWords = false): string {
  if (webWords) return powerText(power, r).replace(/captured/g, 'taken').replace(/captures/g, 'takes').replace(/capture/g, 'take');
  const turns = r.markTurns > 1 ? `its next ${r.markTurns} turns` : 'its next turn';
  switch (power) {
    case 'Freeze': return r.markFree
      ? `freeze an enemy piece (not the king), then make your move${r.freezeQuiet ? ', which cannot capture' : ''}: the frozen piece cannot move on ${turns}`
      : `as your move, freeze an enemy piece (not the king): it cannot move on ${turns}`;
    case 'IceWall': return r.markFree
      ? `wall one of your pieces (not the king), then make your move: the walled piece cannot be captured on the next ${r.markTurns > 1 ? `${r.markTurns} turns` : 'turn'}`
      : `as your move, wall one of your pieces (not the king): it cannot be captured on the next ${r.markTurns > 1 ? `${r.markTurns} turns` : 'turn'}`;
    case 'Strike': {
      const who = r.strikePawns ? 'any piece except the king' : 'any piece except a pawn or the king';
      if (r.strikeMode === 'capture') return `${who} takes an enemy a queen\u2019s move away without moving`;
      return `move ${who} as if it were a queen${r.strikeCaptures ? '' : ', to an empty square'}`;
    }
    case 'Haste': return `move one piece twice in one turn (the second move is optional)${!r.hasteCaptures ? '; neither move captures' : r.hasteSecond === 'quiet' ? '; the second move cannot capture' : ''}`
      + `${r.hasteNoCheck ? '; neither move may give check' : ''}${r.hasteApart ? '; the second move may not end next to an enemy piece' : ''}`
      + `${r.hasteNoThreat ? '; the second move may not end where the piece could capture' : ''}${r.hasteNoForward ? '; the second move may not go forward' : ''}`;
    case 'Flight': return 'move any piece except the king to any empty square in your half of the board';
    case 'Sacrifice': return `turn one of your pawns into one of your pieces that was captured earlier${r.sacrificeBehind ? ', while you have fewer pieces than your opponent' : ''}`;
    case 'March': return r.marchUses === 0 ? 'any pawn may step two squares from any rank' : 'a pawn steps two squares from any rank';
    case 'Leap': return 'a rook, bishop or queen passes over your own pawns';
    case 'HolyLight': return `enemy pawns${r.holyLightKnights ? ' and knights' : ''} cannot take your king${r.holyLightAura ? ' or the pieces next to it' : ''}${r.holyLightTakesPawns ? '' : ', and it cannot take pawns'}${r.holyLightShelter ? `; your pieces ${r.holyLightShelterOrtho ? 'beside, in front of or behind it' : 'next to it'} cannot be taken` : ''}`;
    case 'Mercy': return `your king steps 1\u20132 squares${r.mercyNoJump ? '' : ' and jumps your pieces'}${r.mercyCaptures ? ' (it takes only next to itself)' : r.mercyTakesPawns ? ', but takes only a pawn or a guard' : ', but takes only a guard'}${r.mercyAura ? `; your pieces ${r.mercyAuraOrtho ? 'beside, in front of or behind it' : 'next to it'} cannot be taken${r.mercyAuraPawns ? ' by pawns' : r.mercyAuraPawnsTake ? ' except by pawns' : ''}` : ''}`;
    case 'DeathTouch': {
      // The balance-lab trims narrow only the two-square touch: its lines, and pawns (`Pieces`).
      const lines = r.deathTouchReachForwardBack ? (r.deathTouchReachNoBack ? 'straight forward' : 'straight forward or back')
        : r.deathTouchReachOrtho ? (r.deathTouchReachNoBack ? 'straight forward or sideways' : 'straight forward, back or sideways')
        : r.deathTouchReachNoBack ? 'in a straight line but not backward' : 'in a straight line';
      const reach = r.deathTouchReach ? `an enemy next to it, or ${r.deathTouchReachPieces ? 'a piece (not a pawn) ' : ''}two squares away ${lines} over an empty square,` : 'an adjacent enemy';
      return r.deathTouchMoves
        ? `your king takes ${reach} without moving, or by moving onto it`
        : `your king takes ${reach} without moving \u2014 it can only take this way`;
    }
    case 'Darkness': return (r.darknessTakeAhead ? 'your pawns may also take straight ahead'
      : r.darknessStepDiag ? 'your pawns may also step diagonally forward'
      : r.darknessKeep
      ? 'your pawns may also step diagonally and take straight ahead'
      : r.darknessMoves ? 'your pawns may also step diagonally, and take only straight ahead'
      : 'your pawns step diagonally and take straight ahead, with no double step')
      + (r.darknessShelter ? `; your pieces diagonally next to your king cannot be taken${r.darknessShelterPawnsTake ? ' except by pawns' : ''}`
        : r.darknessAuraPawns ? '; enemy pawns cannot take your pieces next to your king' : '')
      + (r.darknessPawnArmor ? '; enemy pawns cannot take your pawns' : '')
      + (!r.darknessKingStep2 ? ''
        : r.darknessKingStepTakes ? '; your king may also move two squares in a straight line over an empty square, and may take there'
        : r.darknessKingStepSafe ? '; your king may also step two squares in a straight line, over an empty square that no enemy attacks, to an empty square'
        : '; your king may also step two squares in a straight line, over an empty square');
  }
}

/**
 * One sentence per card (card mode, lab), as a player reads it under the rules in force: a one-use
 * power's line (`powerText`), or a card no king has. Freeze, Ice Wall, Firewall and Rescue are free
 * actions under `markFree`, as the marks are.
 */
export function cardText(card: CardName, r: Rules = RULES): string {
  if (card in USES_RULE) return powerText(card as PowerName, r);
  const then = (t: string): string => (r.markFree ? `${t}; then make your move` : `as your move, ${t}`);
  switch (card) {
    case 'Mimic': return 'move one of your pieces (not a pawn or the king), to an empty square, the way another of your pieces moves';
    case 'Vault': return 'a rook, bishop or queen passes over one piece on its line';
    case 'Curse': return 'move an enemy piece or pawn (not the king) one square, to an empty square';
    case 'SkyLift': return 'two of your pieces (not pawns or the king, not of one kind) trade squares';
    case 'Salvation': return 'return one of your captured pieces to an empty square of your back rank';
    case 'Rage': return 'one of your pieces moves twice this turn and may take on either move (the second move is optional)';
    case 'RageB': return 'one of your pieces moves twice this turn; its second move, if it makes one, must take';
    case 'Mirror': return 'play the card your opponent played last, as if it were in your hand';
    case 'MirrorB': return 'play another card from your hand; it stays in your hand';
    case 'Firewall': return then('none of your pieces can be taken on your opponent\u2019s next turn');
    case 'FirewallB': return 'swap one of your pieces (not the king) with an enemy piece (not the king) next to it';
    case 'EarthQuake': return 'choose a square: each piece next to it, except a king, is pushed one square straight away from it if that square is empty';
    case 'EarthQuakeB': return 'choose a square next to one of your pieces: each piece next to it, except a king, is pushed one square straight away from it if that square is empty';
    case 'Burn': return 'one of your pieces (not a pawn or the king) takes an enemy piece on d4, e4, d5 or e5 as a queen would';
    case 'FireStarter': return 'one of your pieces (not a pawn or the king) takes an enemy piece on the enemy back rank as a queen would';
    case 'Control': return 'one of your pieces (not a pawn or the king) moves and takes this turn as a friendly piece next to it does';
    case 'Rescue': return then('your Freeze, Ice Wall or Firewall from your previous turn lasts one more turn');
    case 'Growth': return 'as your move, draw the next card';
    case 'GrowthB': return 'draw the next card, then make your move';
    case 'Rally': return 'move one of your pieces, then a different one (the second move is optional); neither move captures';
    case 'Morph': return 'one of your pieces (not a pawn or the king) becomes another kind of piece where it stands (not a pawn or a king, and never a second beast)';
    case 'MorphB': return 'one of your pieces (not a pawn or the king) becomes another kind of piece where it stands (not a pawn, a king or a queen, and never a second beast)';
    case 'Spawn': return 'as your move, a new pawn of yours appears on an empty square of your pawns\u2019 start rank';
    case 'SpawnK': return 'as your move, a new pawn of yours appears on an empty square next to your king (not on the first or last rank)';
    case 'Spawn2': return 'as your move, two new pawns of yours appear on two empty squares of your pawns\u2019 start rank';
    case 'SpawnK2': return 'as your move, two new pawns of yours appear on two empty squares next to your king (not on the first or last rank)';
    case 'MorphP': return 'one of your pawns becomes a knight or a bishop where it stands';
    case 'MorphS': return 'two of your pieces (not pawns or the king, not of one kind) swap places';
  }
  return card;
}

/** The move tag each spendable power leaves (`Move.power`). */
export const POWER_TAG: Partial<Record<PowerName, PowerTag>> = {
  Freeze: 'freeze', IceWall: 'ward', Strike: 'strike', Haste: 'haste', Flight: 'flight', Sacrifice: 'sacrifice',
  March: 'march', Leap: 'leap',
};

/**
 * Power moves a player must arm first, because they share squares with ordinary moves or name a
 * target instead of a destination. March and Leap reach squares no ordinary move reaches, so they
 * simply appear among a piece's moves.
 */
const ARMED: ReadonlySet<PowerTag> = new Set(['freeze', 'ward', 'strike', 'haste', 'flight', 'sacrifice']);
export const needsArming = (m: Move): boolean => m.pass === true || (m.power !== undefined && ARMED.has(m.power));
/** Whether a click can reach `m`: while a power is armed only its moves, otherwise none that need arming. */
export const offered = (m: Move, armedTag: string | null): boolean => (armedTag ? m.power === armedTag : !needsArming(m));
/**
 * Settings → Always promote to queen: when one tap leaves a choice of only queen, rook, bishop and
 * knight promotions, the board plays the queen one. Returns that move, else undefined.
 */
export const autoQueen = (moves: readonly Move[]): Move | undefined =>
  moves.every(m => m.promo === Q || m.promo === R || m.promo === B || m.promo === N) ? moves.find(m => m.promo === Q) : undefined;
/**
 * The moves Hint may suggest: the moves a click can reach now (`offered`), the pass that End turn
 * plays, and, in a lesson, only its goal moves. With `queen` (Always promote to queen) a promotion
 * that `autoQueen` replaces is out. The board uses the same rules, so it never refuses a hint.
 */
export function hintMoves(legal: readonly Move[], armedTag: string | null, goal?: (m: Move) => boolean, queen = false): Move[] {
  const reach = legal.filter(m => offered(m, armedTag) || m.pass);
  // A Sacrifice asks in its own picker, which never promotes to a queen without asking.
  const played = (m: Move): boolean => {
    if (!queen || !m.promo || m.power === 'sacrifice') return true;
    const q = autoQueen(reach.filter(o => o.from === m.from && o.to === m.to));
    return !q || q === m;
  };
  return reach.filter(m => played(m) && (!goal || goal(m)));
}

/** Uses allowed by the rules (0 = unlimited), or null for an always-on power. */
export function usesAllowed(power: PowerName, r: Rules = RULES): number | null {
  const key = USES_RULE[power];
  return key ? (r[key] as number) : null;
}

export interface PowerCoin {
  king: KingName;
  power: PowerName;
  state: 'ready' | 'armed' | 'used' | 'always' | 'waiting' | 'no-target';
  total: number | null;
  spent: number;
  left: number | null;
  fromMove: number;
  usedOn: number | null;
}

/** Read the shown position and its history. No power means no coin. */
export function coinState(
  pos: Position, side: Color, rules: Rules,
  history: readonly { pos: Position; move: Move }[], armed: boolean,
  legal?: readonly Move[], activeSide: Color | null = pos.turn,
): PowerCoin | null {
  const choice = rules.kings[side];
  if (!choice) return null;
  const total = usesAllowed(choice.power, rules);
  const always = total === null || (total === 0 && (choice.power === 'March' || choice.power === 'Leap'));
  const spent = always ? 0 : pos.used?.[side] ?? 0;
  const left = total === null || total === 0 ? null : Math.max(0, total - spent);
  const fromMove = rules.fromMove[choice.power] ?? 1;
  const last = always ? undefined : history.filter(h => h.pos.ply < pos.ply && h.pos.turn === side && h.move.power === POWER_TAG[choice.power]).at(-1);
  return {
    ...choice, state: always ? 'always' : left === 0 ? 'used'
      : moveNumber(pos) < fromMove || pos.turn !== side || activeSide !== side || pos.free || pos.haste !== undefined ? 'waiting'
      : legal && !legal.some(m => m.power === POWER_TAG[choice.power]) ? 'no-target'
      : armed ? 'armed' : 'ready',
    total: always ? null : total, spent, left,
    fromMove, usedOn: last ? moveNumber(last.pos) : null,
  };
}

/** The coin has no visible name. Its read line names the power. */
export function coinWords(coin: PowerCoin, pos: Position): string {
  const state = coin.state === 'always' ? 'Always on'
    : coin.state === 'used' ? (coin.usedOn === null ? 'Used' : `Used on move ${coin.usedOn}`)
    : moveNumber(pos) < coin.fromMove ? `From move ${coin.fromMove}`
    : coin.left === null ? 'Unlimited' : `${coin.left} left`;
  return `${POWER_NAME[coin.power]} · ${state}`;
}

/** Uses left for side `c` in `pos`, or null when its power is always on (or unlimited). */
export function usesLeft(pos: Position, c: Color): number | null {
  const power = RULES.kings[c]?.power;
  if (!power) return null;
  const n = usesAllowed(power);
  if (n === null || n === 0) return null;
  return Math.max(0, n - (pos.used?.[c] ?? 0));
}

/** "Freeze (2 per game)" / "Holy Light (always on)". */
export function powerTitle(power: PowerName, r: Rules = RULES): string {
  const n = usesAllowed(power, r);
  const count = n === null || n === 0 ? 'always on' : `${n} per game`;
  return `${POWER_NAME[power]} (${count})`;
}

/**
 * The rules a game with powers is played under: the official readings, which an older `?rules=`
 * preset overrides (as `newGame` in main.ts sets them). The picker and the Guide both read them.
 */
export const powersRules = (preset?: Partial<Rules>): Rules => ({ ...RULES, ...POWERS_BALANCED, ...preset });

/**
 * Each king's two powers for the New game picker, with their counts and one-line rules. They describe
 * the rules a game with powers is played under (`powersRules`), not the game in progress.
 */
export function powerOptions(preset?: Partial<Rules>): { king: KingName; group: string; options: { value: string; label: string; title: string }[] }[] {
  const r = powersRules(preset);
  return (Object.entries(KINGS) as [KingName, readonly PowerName[]][]).map(([king, powers]) => ({
    king,
    group: `${king} king`,
    options: powers.map(p => ({ value: `${king}:${p}`, label: powerTitle(p, r), title: powerText(p, r) })),
  }));
}

/** `?kings=` text for a game link: "frost:freeze,mud:march", "none" for a plain king. */
export function kingsParam(kings: readonly [KingChoice | null, KingChoice | null]): string | null {
  if (!kings[0] && !kings[1]) return null;
  const one = (k: KingChoice | null): string => (k ? `${k.king}:${k.power}`.toLowerCase() : 'none');
  return `${one(kings[0])},${one(kings[1])}`;
}
