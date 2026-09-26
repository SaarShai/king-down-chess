import { P, N, B, R, G, A, O, piece, genPiece, parseSq } from './rules.mjs';
export const layouts = {
  bishop: [['c4',B,0],['b3',P,0],['a6',R,0],['c2',P,0],['f7',P,1],['e2',P,1],['f5',B,1],['e6',G,1]],
  rook: [['c4',R,0],['c2',G,0],['b5',P,0],['f2',P,0],['c7',P,1],['g4',P,1],['f5',R,1],['f7',G,1]],
  guard: [['c4',G,0],['b3',P,0],['e5',O,0],['f3',A,0],['d4',P,1],['c5',O,1],['f5',G,1],['g6',P,1]],
  cast: [['c4',B,0],['d3',N,0],['b3',P,0],['b2',R,0],['d2',G,0],['a3',A,0],['e2',O,0],['f5',B,1],['e6',N,1],['g6',P,1],['g7',R,1],['e7',G,1],['h6',A,1],['d7',O,1]],
  knight: [['c4',N,0],['b4',P,0],['c5',P,0],['d4',P,0],['c3',P,0],['b2',P,0],['a5',A,0],['e5',P,1],['d6',O,1],['f5',N,1],['f4',P,1],['g5',P,1],['f6',P,1],['h6',A,1]],
  ogre: [['c4',O,0],['d4',P,1],['c5',P,0],['d3',P,1],['e2',P,1],['a3',A,0],['f5',O,1],['e5',P,0],['f6',P,1],['g6',A,1]],
  crossfire: [['c4',A,0],['b2',P,0],['d2',P,0],['d5',P,0],['f2',P,0],['f5',A,1],['e4',P,1],['c3',P,1],['e7',P,1],['g7',P,1]],
  ranks: [['b3',A,0],['f3',A,0],...['a2','b2','c2','d2','e2','f2','g2','h2'].map(s=>[s,P,0]),['c6',A,1],['g6',A,1],...['a7','b7','c7','d7','e7','f7','g7','h7'].map(s=>[s,P,1])],
  angles: [['d4',A,0],['d6',P,1],['b4',P,1],['f4',P,1],['e5',P,1],['c3',P,1],['f6',A,1],['d2',P,0]]
};
export function createPosition(layout='crossfire') {
  const board=new Uint8Array(64);
  for(const [square,type,side] of layouts[layout]) board[parseSq(square)]=piece(type,side);
  return {board,turn:0,halfmove:0,ply:0};
}
export function actionsFor(position,square) {
  if(square===null || !position.board[square]) return [];
  const moves=[]; genPiece(position.board,square,'all',moves);
  // This art trial stops before promotion; it doesn't invent a new rule.
  return moves.filter(move=>!move.promo);
}
export const destination = move => move.shove?.from ?? move.captures[0] ?? move.to;
