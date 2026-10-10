import { describe, expect, it } from 'vitest';
import { parseKings } from '../rules/engine';
import { gameUrl } from './links';

const page = { origin: 'https://kingdown.dev', pathname: '/' };

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
