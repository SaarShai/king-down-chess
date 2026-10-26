import { afterEach, describe, expect, it, vi } from 'vitest';
import { Game } from '../game';
import { POWERS_BALANCED } from '../rules/engine';
import { toFen } from '../rules/setup';
import { renderTable, type TableSnapshot } from './table';

describe('review move headings', () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it.each([
    { side: 0, lans: ['e2-e3!H', 'e3-e4', 'e7-e5'], labels: ['1. e2-e3!H', '1. e3-e4', '1… e7-e5'] },
    { side: 1, lans: ['e2-e4', 'e7-e6!H', 'e6-e5'], labels: ['1. e2-e4', '1… e7-e6!H', '1… e6-e5'] },
    { side: 0, lans: ['e2-e4', 'e7-e5', 'd2-d4'], labels: ['1. e2-e4', '1… e7-e5', '2. d2-d4'] },
    { side: 1, blackStart: true, lans: ['e7-e5', 'e2-e4'], labels: ['1… e7-e5', '2. e2-e4'] },
  ])('uses recorded turns for $lans', ({ side, blackStart, lans, labels }) => {
    const game = new Game('RNBQKBNR', { ...POWERS_BALANCED, kings: side === 0
      ? [{ king: 'Flame', power: 'Haste' }, null] : [null, { king: 'Flame', power: 'Haste' }] });
    if (blackStart) game.load({ ...game.pos, turn: 1 });
    expect(game.playLan(lans)).toBe(lans.length);
    const nodes = new Map<string, ReturnType<typeof node>>();
    const node = () => ({ textContent: '', innerHTML: '', setAttribute: vi.fn(), removeAttribute: vi.fn(),
      querySelector: () => ({ textContent: '', scrollIntoView: vi.fn() }) });
    vi.stubGlobal('document', { getElementById: (id: string) => {
      if (!nodes.has(id)) nodes.set(id, node());
      return nodes.get(id);
    } });
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    const snapshot: TableSnapshot = {
      selected: null, selectedType: 0, pending: [], canFinish: false, busy: false, thinking: false, notice: '',
      viewing: 0, reviewNote: '', lesson: null, lessonDone: false, nextLesson: null, turnLine: '',
      activeSide: game.pos.turn, staged: 0, check: false, ended: false, finished: false, myTurn: true,
      result: '', backRank: game.backRank, fen: toFen(game.pos),
      history: game.history.map(h => ({ lan: h.lan, turn: h.pos.turn })), marked: [], taken: [[], []],
      sides: ['human', 'human'], linkSide: null, undoOn: true, resigner: null,
    };
    renderTable(snapshot);
    expect(nodes.get('turn')!.textContent).toBe('Reviewing the start');
    labels.forEach((label, i) => {
      renderTable({ ...snapshot, viewing: i + 1 });
      expect(nodes.get('turn')!.textContent).toBe(`Reviewing after ${label}`);
    });
  });
});
