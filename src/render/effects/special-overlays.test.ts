import { describe, expect, it } from 'vitest';
import { GameRules } from '../../game-rules';
import { POWERS_BALANCED, parseKings } from '../../rules/rules';
import { specialOverlay } from './special-overlays';

const game = (kings: string) => new GameRules({ ...POWERS_BALANCED, kings: parseKings(kings) });
const overlay = (context: GameRules, fen: string, lan: string) => {
  const pos = context.fromFen(fen), move = context.legalMoves(pos).find(m => context.toLan(pos, m) === lan);
  if (!move) throw Error(`illegal test move ${lan}`);
  return specialOverlay(context, pos, move);
};

describe('always-on king powers', () => {
  const dark = game('Shadow:Darkness,none'), mercy = game('Spirit:Mercy,none'), light = game('Spirit:HolyLight,none');

  it.each([
    ['7k/8/8/8/8/3P4/8/K7 w - - 0 1', 'd3-e4'],
    ['7k/8/8/3p4/3P4/8/8/K7 w - - 0 1', 'd4xd5'],
    ['7k/8/8/8/8/8/8/3K4 w - - 0 1', 'Kd1-d3'],
  ])('Darkness marks a move that needs the power: %s %s', (fen, lan) => expect(overlay(dark, fen, lan)).not.toBeNull());

  it.each([
    ['7k/8/8/8/8/3P4/8/K7 w - - 0 1', 'd3-d4'],
    ['7k/8/8/8/8/8/8/3K4 w - - 0 1', 'Kd1-d2'],
  ])('Darkness shows nothing on an ordinary move: %s %s', (fen, lan) => expect(overlay(dark, fen, lan)).toBeNull());

  it('Mercy marks the two-square move and hop, not the ordinary step', () => {
    expect(overlay(mercy, 'k7/8/8/3P4/3K4/8/8/R7 w - - 0 1', 'Kd4-d6')).not.toBeNull();
    expect(overlay(mercy, 'k7/8/8/8/3K4/8/8/R7 w - - 0 1', 'Kd4-d6')).not.toBeNull();
    expect(overlay(mercy, 'k7/8/8/8/3K4/8/8/R7 w - - 0 1', 'Kd4-d5')).toBeNull();
  });

  it('a power of the other army or a plain king shows nothing', () => {
    expect(overlay(game('none,Shadow:Darkness'), '7k/8/8/8/8/3P4/8/K7 w - - 0 1', 'd3-d4')).toBeNull();
    expect(overlay(new GameRules({}), '7k/8/8/8/8/3P4/8/K7 w - - 0 1', 'd3-d4')).toBeNull();
  });

  it('Holy Light adds no overlay: its themed capture shows the power', () => {
    expect(overlay(light, '7k/8/5p2/4p3/3K4/8/8/R7 w - - 0 1', 'Kd4xe5')).toBeNull();
  });
});

describe('classic chess moves', () => {
  const classic = new GameRules({ classicChess: true });
  it('castling draws an overlay; a plain rook move does not', () => {
    expect(overlay(classic, '4k3/8/8/8/8/8/P7/R3K2R w KQ - 0 1', 'O-O')).not.toBeNull();
    expect(overlay(classic, '4k3/8/8/8/8/8/P7/R3K2R w KQ - 0 1', 'Rh1-h2')).toBeNull();
  });
  it('en passant draws an overlay; a capture on the target square does not', () => {
    expect(overlay(classic, '4k3/8/8/3Pp3/8/8/8/4K3 w - e6 0 1', 'd5xe6')).not.toBeNull();
    expect(overlay(classic, '4k3/8/4p3/3P4/8/8/8/4K3 w - - 0 1', 'd5xe6')).toBeNull();
  });
});
