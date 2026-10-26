import { GameRules } from '/src/game-rules';
import { parseSq, typeOf, Q, N, P } from '/src/rules/engine';

const rules = new GameRules({});
const before = rules.fromFen('r1b2rk1/pp1P1ppp/2n1pn2/2p5/2P1P3/2N2N2/PP3PPP/R1B1R1K1 w - - 0 24');
const from = parseSq('d7'), to = parseSq('d8');
export const samples = [ ['queen', 'Queen', Q], ['knight', 'Knight', N] ].map(([id, title, type]) => {
  const moves = rules.legalMoves(before).filter(move => move.from === from && move.to === to && move.promo === type && !move.power);
  if (moves.length !== 1) throw new Error(`Missing legal quiet promotion to ${title}.`);
  const move = moves[0], after = rules.makeMove(before, move);
  if (move.captures.length || before.board[to] || typeOf(before.board[from]) !== P || after.board[from] || typeOf(after.board[to]) !== type) throw new Error(`Invalid ${title} promotion result.`);
  for (let sq = 0; sq < 64; sq++) if (sq !== from && sq !== to && before.board[sq] !== after.board[sq]) throw new Error('Promotion changes a neighbor.');
  // Only the moving actor is drawn by the decoration; every neighbor remains in the scene.
  const board = new Uint8Array(before.board); board[from] = 0;
  return { id, title, before, after, move, display: { ...before, board }, action: rules.toLan(before, move) };
});
