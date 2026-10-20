import type { Seat, View } from '../../match/protocol';
import { defaultChoice, validateChoice, type Choice, type Draw, type Options } from '../../match/setup';
import type { KingChoice } from '../../rules/rules';
import { cleanKing } from './setup-model';

export const seatIndex = (seat: Seat, square: number): number | null => Number.isInteger(square) && square >= seat * 56 && square < seat * 56 + 8 ? square - seat * 56 : null;
export const seatSquare = (seat: Seat, index: number): number => seat * 56 + index;
export function swapOrder(order: string, from: number, to: number): string {
  const row = [...order]; [row[from], row[to]] = [row[to], row[from]]; return row.join('');
}
export function legalSwaps(options: Options, draw: Draw, choice: Choice, seat: Seat, square: number): number[] {
  const from = seatIndex(seat, square);
  return from === null ? [] : [...choice.order].flatMap((_, to) => to !== from && !validateChoice(options, draw, { ...choice, order: swapOrder(choice.order, from, to) }) ? [seatSquare(seat, to)] : []);
}
export function seatChoice(view: View, remembered: KingChoice | null): Choice | null {
  const o = view.options, own = view.choices?.[view.seat];
  if (view.status !== 'setup' || !o || !view.draw || !own) return null;
  const choice = { order: o.arrangement ? own.order : view.draw, king: o.kingPowers ? own.king : null };
  if (view.kind !== 'solo' && !view.ready?.[view.seat] && o.kingPowers) {
    const king = cleanKing(o, remembered, view.seat === 1 ? 'black' : 'white');
    if (king && !validateChoice(o, { army: view.draw, hand: view.deal ?? [] }, { ...choice, king })) choice.king = king;
  }
  return choice;
}
export const seatFen = (order: string, seat: Seat): string => seat === 0 ? `8/8/8/8/8/8/PPPPPPPP/${order} w - - 0 1` : `${order.toLowerCase()}/pppppppp/8/8/8/8/8/8 w - - 0 1`;
export const shuffleOrder = (view: View, rng = Math.random): string => defaultChoice(view.options!, { army: view.draw!, hand: view.deal ?? [] }, view.seat, rng, true).order;
export const chooseArguments = (view: View, choice: Choice, command_id: string) => ({ game_id: view.game_id, command_id, expected_revision: view.revision, king: view.options!.kingPowers ? choice.king : null, order: view.options!.arrangement ? choice.order : view.draw!, ready: true });
export async function submitReady(view: View, choice: Choice, io: { send: (args: ReturnType<typeof chooseArguments>) => Promise<View | undefined>; read: () => Promise<View | undefined>; pending: () => boolean; id: () => string }): Promise<View | undefined> {
  const next = await io.send(chooseArguments(view, choice, io.id()));
  if (next || io.pending()) return next;
  const fresh = await io.read();
  if (fresh?.game_id === view.game_id && fresh.status === 'setup' && !fresh.ready?.[fresh.seat] && fresh.revision !== view.revision) return io.send(chooseArguments(fresh, choice, io.id()));
  return fresh;
}
