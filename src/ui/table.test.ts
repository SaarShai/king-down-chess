import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Game } from '../game';
import { LESSONS } from '../lessons';
import { POWERS_BALANCED, parseKings } from '../rules/engine';
import { turnOf } from '../turn';
import { refreshTable, type TableState } from './table';

const node = () => ({
  textContent: '', hidden: false, disabled: false, dataset: {} as Record<string, string>,
  classList: { toggle: vi.fn() }, setAttribute: vi.fn(), replaceChildren: vi.fn(),
  querySelector: () => ({}), querySelectorAll: () => [],
});
const nodes = new Map<string, ReturnType<typeof node>>();
const element = (id: string) => { if (!nodes.has(id)) nodes.set(id, node()); return nodes.get(id)!; };
beforeEach(() => {
  vi.useFakeTimers();
  nodes.clear();
  vi.stubGlobal('localStorage', { getItem: () => null });
  vi.stubGlobal('document', { body: node(), getElementById: element, createElement: node });
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('the local save notice', () => {
  it.each([
    { viewing: null, armed: true, result: '', instruction: 'Select an enemy piece.', note: 'Freeze lasts one turn.' },
    { viewing: 0, armed: false, result: '', instruction: 'Review. The start.' },
    { viewing: null, armed: false, result: 'White wins.', instruction: 'White wins.' },
    { viewing: null, armed: false, result: '', lesson: 4, instruction: 'The rook gives check.', note: 'Block it with your guard.' },
  ])('stays visible with $instruction and keeps its controls', ({ viewing, armed, result, instruction, note = '', lesson = null }) => {
    const game = new Game('RNBQKBNR', { ...POWERS_BALANCED, kings: parseKings('frost:freeze,none') });
    if (lesson != null) game.load(game.context.fromFen(LESSONS[lesson].fen));
    const state: TableState = {
      game, sides: ['human', 'human'], skill: 'club', rules: game.rules, flipped: false, thinking: false,
      viewing, lesson, lessonDone: false, notice: '', armed, selected: null, pending: [],
      linkSide: null, reviewNote: '', turn: turnOf(game, 0), mode: 'device',
      saveNotice: 'Changes not saved. Keep this tab open.',
    };
    element('status').textContent = result;
    element('turn').textContent = lesson == null ? '' : LESSONS[lesson].name;
    element('moment').textContent = lesson == null ? '' : LESSONS[lesson].task;
    const rows = () => element('context-text').replaceChildren.mock.lastCall!.map((row: { textContent: string }) => row.textContent);
    refreshTable(state);
    expect(rows()).toEqual([state.saveNotice, [instruction, note].filter(Boolean).join(' ')]);
    expect(element('context-text').dataset.rank).toBe('refusal');
    expect(element('power-cancel').hidden).toBe(!armed);
    expect(element('back-to-game').hidden).toBe(viewing == null);
    refreshTable({ ...state, saveNotice: '' });
    expect(rows()).toEqual([instruction, note].filter(Boolean));
    expect(rows()).not.toContain(state.saveNotice);
  });
});
