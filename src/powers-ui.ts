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

/** One line per power, as a player reads it. Use counts come from the rules, not from here. */
export const POWER_TEXT: Record<PowerName, string> = {
  Freeze: 'as your move, freeze an enemy piece (not the king): it cannot move on its next turn',
  IceWall: 'as your move, wall one of your pieces (not the king): it cannot be captured on the next turn',
  Strike: 'move any piece except the king as if it were a queen',
  Haste: 'move one piece twice in one turn (the second move is optional)',
  Flight: 'move any piece except the king to any empty square in your half of the board',
  Sacrifice: 'turn one of your pawns into one of your pieces that was captured earlier',
  March: 'a pawn steps two squares from any rank',
  Leap: 'a rook, bishop or queen passes over your own pawns',
  HolyLight: 'enemy pawns cannot take your king, and it cannot take pawns',
  Mercy: 'your king steps 1–2 squares and jumps your pieces, but takes only a guard',
  DeathTouch: 'your king takes an adjacent enemy without moving — it can only take this way',
  Darkness: 'your pawns step diagonally and take straight ahead, with no double step',
};

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
    options: powers.map(p => ({ value: `${king}:${p}`, label: powerTitle(p), title: POWER_TEXT[p] })),
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
