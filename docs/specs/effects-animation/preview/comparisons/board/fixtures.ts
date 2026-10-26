import { GameRules } from '../../../../../../src/game-rules';
import { parseSq, sqName, type Move } from '../../../../../../src/rules/engine';
import { boardStates } from '../../../../../../src/render/effects/states';

export function makeSample(id: 'rook' | 'archer') {
  const rules = new GameRules({ hands: [['IceWall'], ['Freeze']], markFree: true });
  const fen = `r1bqkbnr/pp2p1pp/2np4/2p2p2/3${id === 'rook' ? 'R' : 'A'}PB2/2N2N2/PPP2PPP/R2QKB1R b - - 0 1`;
  let pos = rules.fromFen(fen);
  const inputs: string[] = [], steps: { input: string; legal: boolean; from: string; to: string; power?: string }[] = [];
  let last: Move | undefined;
  for (const input of ['!F:c3', 'a7-a6', '!W:e4']) {
    const move = rules.legalMoves(pos).find(m => rules.toLan(pos, m) === input);
    if (!move) throw new Error(`Fixture ${id}: ${input} is not legal`);
    steps.push({ input, legal: true, from: sqName(move.from), to: sqName(move.to), power: move.power });
    if (!move.power) last = move;
    pos = rules.makeMove(pos, move); inputs.push(input);
  }
  const selected = parseSq('d4');
  const legal = rules.legalMoves(pos);
  const frozen = parseSq('c3');
  if (legal.some(m => m.from === frozen)) throw new Error('Frozen knight can move');
  const states = boardStates(rules, pos);
  if (!states.some(s => s.kind === 'freeze' && s.sq === frozen) || !states.some(s => s.kind === 'ward' && s.sq === parseSq('e4'))) throw new Error('Fixture lacks real freeze or protection');
  const target = parseSq('e4');
  const enemy = { ...pos, turn: 1 as const, free: undefined };
  const markedTakes = rules.legalMoves(enemy).filter(m => m.captures.includes(target));
  const unmarkedTakes = rules.legalMoves({ ...enemy, marks: [undefined, pos.marks?.[1]] }).filter(m => m.captures.includes(target));
  const unfrozenMoves = rules.legalMoves({ ...pos, marks: [pos.marks?.[0], undefined] }).filter(m => m.from === frozen);
  if (markedTakes.length || !unmarkedTakes.length || !unfrozenMoves.length) throw new Error('State controls do not separate');
  const protection = { blocked: markedTakes.length === 0, withoutWard: unmarkedTakes.map(m => rules.toLan(enemy,m)) };
  const freezeControl = { withoutFreeze: unfrozenMoves.map(m => rules.toLan(pos,m)) };
  return { protection, freezeControl, id, title: id === 'rook' ? 'Rook in traffic' : 'Archer at close range', rules, fen, inputs, steps, pos, selected, last: last!, states };
}
export const samples = [makeSample('rook'), makeSample('archer')];
