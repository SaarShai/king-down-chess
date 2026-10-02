/**
 * The kings' powers in the HUD (docs/RULES.md §4): names and one-line rules, uses left, and which
 * power moves the player must arm first. The engine decides what is legal; this module only says
 * how a person reaches it.
 */
import { Color, KINGS, KingChoice, KingName, Move, PowerName, PowerTag, Position, RULES, USES_RULE, parseKing } from './rules/engine';

export const POWER_NAME: Record<PowerName, string> = {
  Freeze: 'Freeze', IceWall: 'Ice Wall', Strike: 'Strike', Haste: 'Haste', Flight: 'Flight', Sacrifice: 'Sacrifice',
  March: 'March', Leap: 'Leap', HolyLight: 'Holy Light', Mercy: 'Mercy', DeathTouch: 'Death Touch', Darkness: 'Darkness',
};

/**
 * One line per power, as a player reads it, under the rules in force (the balance-lab readings of
 * docs/research/kings-powers-balance-2026-10-02.md change several). Use counts come from the rules.
 */
export function powerText(power: PowerName): string {
  const r = RULES;
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
    case 'Haste': return `move one piece twice in one turn (the second move is optional)${!r.hasteCaptures ? '; neither move captures' : r.hasteSecond === 'quiet' ? '; the second move cannot capture' : ''}`;
    case 'Flight': return 'move any piece except the king to any empty square in your half of the board';
    case 'Sacrifice': return `turn one of your pawns into one of your pieces that was captured earlier${r.sacrificeBehind ? ', while you have fewer pieces than your opponent' : ''}`;
    case 'March': return r.marchUses === 0 ? 'any pawn may step two squares from any rank' : 'a pawn steps two squares from any rank';
    case 'Leap': return 'a rook, bishop or queen passes over your own pawns';
    case 'HolyLight': return `enemy pawns${r.holyLightKnights ? ' and knights' : ''} cannot take your king${r.holyLightAura ? ' or the pieces next to it' : ''}${r.holyLightTakesPawns ? '' : ', and it cannot take pawns'}${r.holyLightShelter ? `; your pieces ${r.holyLightShelterOrtho ? 'beside, in front of or behind it' : 'next to it'} cannot be taken` : ''}`;
    case 'Mercy': return `your king steps 1\u20132 squares and jumps your pieces${r.mercyCaptures ? ' (it takes only next to itself)' : ', but takes only a guard'}${r.mercyAura ? `; your pieces ${r.mercyAuraOrtho ? 'beside, in front of or behind it' : 'next to it'} cannot be taken${r.mercyAuraPawns ? ' by pawns' : ''}` : ''}`;
    case 'DeathTouch': {
      const reach = r.deathTouchReach ? 'an enemy next to it, or two squares away in a straight line over an empty square,' : 'an adjacent enemy';
      return r.deathTouchMoves
        ? `your king takes ${reach} without moving, or by moving onto it`
        : `your king takes ${reach} without moving \u2014 it can only take this way`;
    }
    case 'Darkness': return r.darknessTakeAhead ? 'your pawns may also take straight ahead'
      : r.darknessStepDiag ? 'your pawns may also step diagonally forward'
      : r.darknessKeep
      ? 'your pawns may also step diagonally and take straight ahead'
      : r.darknessMoves ? 'your pawns may also step diagonally, and take only straight ahead'
      : 'your pawns step diagonally and take straight ahead, with no double step';
  }
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

/** Uses allowed by the rules (0 = unlimited), or null for an always-on power. */
export function usesAllowed(power: PowerName): number | null {
  const key = USES_RULE[power];
  return key ? (RULES[key] as number) : null;
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
export function powerTitle(power: PowerName): string {
  const n = usesAllowed(power);
  const count = n === null || n === 0 ? 'always on' : `${n} per game`;
  return `${POWER_NAME[power]} (${count})`;
}

/** Options for a power picker: "no power" then each king's two powers. */
export function powerOptions(): { group: string; options: { value: string; label: string; title: string }[] }[] {
  return (Object.entries(KINGS) as [KingName, readonly PowerName[]][]).map(([king, powers]) => ({
    group: `${king} king`,
    options: powers.map(p => ({ value: `${king}:${p}`, label: powerTitle(p), title: powerText(p) })),
  }));
}

/** Fill a `<select>` with "No power" and the twelve powers, keeping `value` selected. */
export function fillPowerSelect(select: HTMLSelectElement, value: KingChoice | null): void {
  select.innerHTML = '<option value="none">No power</option>';
  for (const { group, options } of powerOptions()) {
    const g = document.createElement('optgroup');
    g.label = group;
    for (const o of options) {
      const opt = document.createElement('option');
      opt.value = o.value;
      opt.textContent = o.label;
      opt.title = o.title;
      g.appendChild(opt);
    }
    select.appendChild(g);
  }
  select.value = value ? `${value.king}:${value.power}` : 'none';
}

export const readPowerSelect = (select: HTMLSelectElement): KingChoice | null => parseKing(select.value);

/** `?kings=` text for a game link: "frost:freeze,mud:march", "none" for a plain king. */
export function kingsParam(kings: readonly [KingChoice | null, KingChoice | null]): string | null {
  if (!kings[0] && !kings[1]) return null;
  const one = (k: KingChoice | null): string => (k ? `${k.king}:${k.power}`.toLowerCase() : 'none');
  return `${one(kings[0])},${one(kings[1])}`;
}
