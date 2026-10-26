import { afterEach, describe, expect, it, vi } from 'vitest';
import { Game } from '../game';
import { copyText } from '../clipboard';
import { LESSONS } from '../lessons';
import { parseKings, POWERS_BALANCED } from '../rules/engine';
import { toFen } from '../rules/setup';
import { connectLinks, gameUrl } from './links';

vi.mock('../clipboard', () => ({ copyText: vi.fn(async () => true) }));

const page = { origin: 'https://kingdown.dev', pathname: '/' };

describe('Copy moves', () => {
  afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.clearAllMocks(); });

  async function copy(game: Game, expected: string) {
    vi.useFakeTimers();
    const button = { onclick: () => {}, textContent: 'Copy moves', dataset: {}, querySelector: () => null };
    vi.stubGlobal('document', { getElementById: (id: string) => id === 'copy' ? button : {} });
    vi.stubGlobal('location', page);
    const share = connectLinks({ game: () => game, turnStart: () => game.history.length, rules: null, blocked: () => false });
    button.onclick();
    await Promise.resolve();
    expect(copyText).toHaveBeenCalledWith(expected);
    expect(expected.split(/\s+/).filter(s => !/^\d+[.…]$/.test(s))).toEqual(game.history.map(h => h.lan));
    const params = new URL(share.gameLink()).searchParams, replay = new Game('RNBQKBNR', game.rules);
    if (params.has('fen')) replay.load(replay.context.fromFen(params.get('fen')!));
    const lans = params.get('moves')!.split('_').filter(Boolean);
    expect(replay.playLan(lans)).toBe(game.history.length);
    expect(toFen(replay.pos)).toBe(toFen(game.pos));
  }

  it.each([
    { side: 0, lans: ['e2-e3!H', 'e3-e4', 'e7-e5', 'd2-d4'], text: '1. e2-e3!H e3-e4 e7-e5 2. d2-d4' },
    { side: 1, lans: ['e2-e4', 'e7-e6!H', 'e6-e5', 'd2-d4'], text: '1. e2-e4 e7-e6!H e6-e5 2. d2-d4' },
    { side: 0, lans: ['e2-e4', 'e7-e5', 'd2-d4'], text: '1. e2-e4 e7-e5 2. d2-d4' },
    { side: 1, blackStart: true, lans: ['e7-e5', 'e2-e4'], text: '1… e7-e5 2. e2-e4' },
  ])('keeps the turn numbers and LAN tokens for $lans', async ({ side, blackStart, lans, text }) => {
    const game = new Game('RNBQKBNR', { ...POWERS_BALANCED, kings: side === 0
      ? [{ king: 'Flame', power: 'Haste' }, null] : [null, { king: 'Flame', power: 'Haste' }] });
    if (blackStart) game.load({ ...game.pos, turn: 1 });
    expect(game.playLan(lans)).toBe(lans.length);
    await copy(game, text);
  });

  it.each(LESSONS)('keeps $name lesson moves valid for link replay', async lesson => {
    const game = new Game('RNBQKBNR');
    game.load(game.context.fromFen(lesson.fen));
    game.play(game.legal.find(m => lesson.goal(game.pos, m))!);
    await copy(game, `1. ${game.history[0].lan}`);
  });
});

describe('gameLink', () => {
  it('holds the army and the moves, joined by _', () => {
    expect(gameUrl(page, null, [null, null], { army: 'RNBQKBNR' }, ['e2-e4', 'e7-e5']))
      .toBe('https://kingdown.dev/?army=RNBQKBNR&moves=e2-e4_e7-e5');
  });

  it('names the rules preset and the kings before the start; no moves is an empty list', () => {
    const url = new URL(gameUrl(page, '2017', parseKings('mud:march,none'), { army: 'RNBQKBNR' }, []));
    expect([...url.searchParams]).toEqual([['rules', '2017'], ['kings', 'mud:march,none'], ['army', 'RNBQKBNR'], ['moves', '']]);
  });

  it('a custom start sends its position; the page keeps its path and drops its own query', () => {
    const fen = '7k/8/6o1/8/2OP4/8/8/K7 w - - 0 1';
    const url = new URL(gameUrl({ origin: 'http://127.0.0.1:4173', pathname: '/king-down-chess/' }, null, [null, null], { fen }, ['d4-d5']));
    expect(url.origin + url.pathname).toBe('http://127.0.0.1:4173/king-down-chess/');
    expect([...url.searchParams]).toEqual([['fen', fen], ['moves', 'd4-d5']]);
  });
});

describe('gameLink with a design (ticket 17)', () => {
  it('holds the design\'s share code before the army', () => {
    const url = new URL(gameUrl(page, null, [null, null], { army: 'RNBTKBNR' }, ['e2-e4'], 'abc'));
    expect([...url.searchParams]).toEqual([['design', 'abc'], ['army', 'RNBTKBNR'], ['moves', 'e2-e4']]);
  });
});
