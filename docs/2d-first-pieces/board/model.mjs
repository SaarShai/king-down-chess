import { P, A, piece, genPiece, parseSq } from './rules.mjs';
export const layouts = {
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
  // This two-piece art trial stops before promotion; it doesn't invent a new rule.
  return moves.filter(move=>!move.promo);
}
export const destination = move => move.captures[0] ?? move.to;
