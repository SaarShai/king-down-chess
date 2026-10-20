import { describe, expect, it, vi } from 'vitest';
import { seatIndex, seatSquare, legalSwaps, swapOrder, shuffleOrder, seatChoice, seatFen, chooseArguments, submitReady } from './seat-model';
import { DEFAULT_OPTIONS, setupAdmission, validateChoice } from '../../match/setup';
import type { View } from '../../match/protocol';
import { fromFen } from '../../rules/setup';

const view = (seat: 0 | 1 = 0): View => ({ game_id: 'game', revision: 1, created_at: '2026-10-11T00:00:00Z', abort_open: true, seat, kind: 'friend', speed: 'daily', days_per_move: 3, status: 'setup', turn: 0, action: 'ready', fen: '', in_check: false, legal: [], last_commands: [], opponent: null, draw_offer: null, deadline_at: null, server_now: '2026-10-11T00:00:00Z', options: { ...DEFAULT_OPTIONS, kingPowers: true, cards: true }, draw: 'RBBNGKNR', deal: ['Flight','March','Leap','Salvation'], ready: [false,false], choices: seat === 0 ? [{ king: { king: 'Spirit', power: 'Mercy' }, order: 'RBBNGKNR' }, null] : [null, { king: { king: 'Shadow', power: 'Darkness' }, order: 'RBBNGKNR' }] });

describe('seat arrangement', () => {
  it('maps the back rank by file for both seats', () => {
    expect(seatIndex(0, 0)).toBe(0);
    expect(seatIndex(0, 7)).toBe(7);
    expect(seatIndex(1, 56)).toBe(0);
    expect(seatIndex(1, 63)).toBe(7);
    expect(seatIndex(0, 8)).toBeNull();
    expect(seatIndex(1, 55)).toBeNull();
    expect(seatSquare(1, 0)).toBe(56);
    expect(seatSquare(0, 7)).toBe(7);
  });
  it('marks only legal swaps but lets the player repair an invalid draft', () => {
    const draw = { army: 'RBBNGKNR', hand: [] }, choice = { king: null, order: draw.army };
    expect(legalSwaps(DEFAULT_OPTIONS, draw, choice, 0, 3)).toEqual([0, 1, 5, 6, 7]);
    expect(legalSwaps(DEFAULT_OPTIONS, draw, choice, 1, 59)).toEqual([56, 57, 61, 62, 63]);
    expect(validateChoice(DEFAULT_OPTIONS, draw, { ...choice, order: swapOrder(choice.order, 2, 3) })).toBe('Bishops must stand on opposite colours.');
    const away = swapOrder(choice.order, 4, 0);
    expect(validateChoice(DEFAULT_OPTIONS, draw, { ...choice, order: away })).toBe('The guard must stand next to the king.');
    expect(legalSwaps(DEFAULT_OPTIONS, draw, { ...choice, order: away }, 0, 0)).toContain(4);
    expect(legalSwaps(DEFAULT_OPTIONS, draw, choice, 0, 8)).toEqual([]);
  });
  it('cleans the remembered king and sends only this seat with the enabled choices', () => {
    const v = view(), pick = { king: 'Mud', power: 'Leap' } as const;
    const choice = seatChoice(v, pick)!;
    expect(choice).toEqual({ king: { king: 'Mud', power: 'March' }, order: 'RBBNGKNR' });
    expect(seatChoice({ ...v, kind: 'solo' }, pick)).toEqual(v.choices![0]);
    expect(seatChoice(view(1), null)!.king).toEqual({ king: 'Shadow', power: 'Darkness' });
    expect(seatChoice(v, { king: 'Mud', power: 'Freeze' })).toEqual(v.choices![0]);
    expect(seatChoice({ ...v, options: undefined }, pick)).toBeNull();
    expect(chooseArguments(v, choice, 'command')).toEqual({ game_id: 'game', command_id: 'command', expected_revision: 1, ...choice, ready: true });
    expect(chooseArguments({ ...v, options: { ...v.options!, kingPowers: false, arrangement: false } }, { ...choice, order: 'RNKGNBBR' }, 'off')).toMatchObject({ king: null, order: v.draw });
    expect(fromFen(seatFen(choice.order, 0)).board.slice(32).every(p => p === 0)).toBe(true);
    expect(fromFen(seatFen(choice.order, 1)).board.slice(0,32).every(p => p === 0)).toBe(true);
    for (let i = 0; i < 150; i++) {
      const order = shuffleOrder(v);
      expect(validateChoice(v.options!, { army: v.draw!, hand: v.deal! }, { ...choice, order })).toBeNull();
    }
  });
  it('uses the stored admission for remembered kings, swaps and shuffle', () => {
    const v = view(), own = v.choices![0]!;
    v.setup_admission = { ...setupAdmission(v.options!), kings: [{ king: 'Mud', power: 'March' }], bishopsOpposite: false, guardAdjacent: false };
    expect(seatChoice(v, { king: 'Spirit', power: 'Mercy' })).toEqual(own);
    expect(seatChoice(v, { king: 'Mud', power: 'Leap' })!.king).toEqual({ king: 'Mud', power: 'March' });
    expect(seatChoice(v, { king: 'Mud', power: 'Freeze' })).toEqual(own);
    const choice = { order: v.draw!, king: v.setup_admission.kings[0] };
    expect(legalSwaps(v.options!, { army: v.draw!, hand: [] }, choice, 0, 2, v.setup_admission)).toContain(3);
    const order = shuffleOrder(v, () => 0);
    expect(validateChoice(v.options!, { army: v.draw!, hand: [] }, { ...choice, order }, v.setup_admission)).toBeNull();
  });
  it('keeps the draft after a stale revision and leaves a lost reply to the same-ID pending retry', async () => {
    const v = view(), choice = { ...seatChoice(v, null)!, order: 'RNKGNBBR' }, fresh = { ...v, revision: 2 };
    const send = vi.fn().mockResolvedValueOnce(undefined).mockResolvedValueOnce({ ...fresh, action: 'waiting' });
    const read = vi.fn().mockResolvedValue(fresh), id = vi.fn().mockReturnValueOnce('first').mockReturnValueOnce('second');
    expect(await submitReady(v, choice, { send, read, pending: () => false, id })).toMatchObject({ action: 'waiting' });
    expect(send.mock.calls.map(([args]) => [args.command_id, args.expected_revision, args.order])).toEqual([['first',1,'RNKGNBBR'], ['second',2,'RNKGNBBR']]);
    send.mockReset().mockResolvedValue(undefined); read.mockClear();
    await submitReady(v, choice, { send, read, pending: () => true, id: () => 'lost' });
    expect(send).toHaveBeenCalledTimes(1); expect(read).not.toHaveBeenCalled();
    read.mockResolvedValue({ ...fresh, game_id: 'another' });
    await submitReady(v, choice, { send, read, pending: () => false, id });
    expect(send).toHaveBeenCalledTimes(2);
  });
});
