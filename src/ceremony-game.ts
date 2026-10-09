import type { Side } from './game';
import type { Color, Status } from './rules/engine';

/** D8: your win, or either person's win on one device. */
export function shouldPlayCeremony(status: Status, turn: Color, sides: readonly [Side, Side], linkSide: Color | null, resigned: Color | null): boolean {
  if (status !== 'checkmate' || resigned != null) return false;
  const winner = (1 - turn) as Color;
  return linkSide != null ? winner === linkSide : sides[winner] === 'human';
}
