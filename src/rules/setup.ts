/** Start positions, FEN-style serialisation and move notation. */
import { BLACK, G, LETTERS, Move, P, PieceType, Position, SPENT, V, WHITE, colorOf, piece, rank, sq, sqName, typeOf } from './engine';
import { RULES } from './rules';

/** King Down Classic pool: 7 of these join the king on the back rank. */
/** Draw pool for a random back rank: 7 of these 15 plus the king. One guard per army (designer, 2026-09-13). */
export const POOL = 'QORRBBNNAAGMMSS';
export const CLASSIC_CHESS = 'RNBQKBNR';

export function shuffle<T>(a: T[], rng: () => number): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Random back rank: 7 pieces from POOL + king, shuffled; two bishops must sit on opposite colours (`Rules.bishopsOppositeColours`). */
export function randomBackRank(rng: () => number = Math.random): string {
  for (;;) {
    const picks = shuffle(POOL.split(''), rng).slice(0, 7);
    const row = shuffle([...picks, 'K'], rng);
    const bishops = row.flatMap((p, i) => (p === 'B' ? [i] : []));
    if (RULES.bishopsOppositeColours && bishops.length === 2 && (bishops[0] + bishops[1]) % 2 === 0) continue;
    return row.join('');
  }
}

/** Both sides mirror the same back rank (as in King Down Classic / Chess960); pawns on ranks 2 and 7. */
export function startPosition(backRank: string = randomBackRank()): Position {
  if (!/^[A-Z]{8}$/.test(backRank) || backRank.split('K').length !== 2) throw new Error(`bad back rank ${backRank}`);
  const board = new Uint8Array(64);
  for (let f = 0; f < 8; f++) {
    const t = LETTERS.indexOf(backRank[f]) as PieceType;
    if (t <= 0) throw new Error(`bad piece letter ${backRank[f]}`);
    board[sq(f, 0)] = piece(t, WHITE);
    board[sq(f, 7)] = piece(t, BLACK);
    board[sq(f, 1)] = piece(P, WHITE);
    board[sq(f, 6)] = piece(P, BLACK);
  }
  return { board, turn: WHITE, halfmove: 0, ply: 0 };
}

/**
 * FEN-shaped: `<board> <turn> - - <halfmove> <fullmove> [strike]` (castling/en-passant always "-").
 * Uppercase = white. `H`/`h` is a guard that has spent its one capture (`Rules.guardCaptureLimit`).
 * Field 7 is written only when a Strike (Flame A) has been used: `w`, `b` or `wb`.
 */
export function toFen(pos: Position): string {
  const rows: string[] = [];
  for (let r = 7; r >= 0; r--) {
    let row = '', empty = 0;
    for (let f = 0; f < 8; f++) {
      const p = pos.board[sq(f, r)];
      if (!p) { empty++; continue; }
      if (empty) { row += empty; empty = 0; }
      const l = p & SPENT ? 'H' : LETTERS[typeOf(p)];
      row += colorOf(p) === WHITE ? l : l.toLowerCase();
    }
    if (empty) row += empty;
    rows.push(row);
  }
  const flags = pos.strike;
  const extra = flags && (flags[0] || flags[1]) ? ` ${(flags[0] ? 'w' : '')}${flags[1] ? 'b' : ''}` : '';
  return `${rows.join('/')} ${pos.turn === WHITE ? 'w' : 'b'} - - ${pos.halfmove} ${Math.floor(pos.ply / 2) + 1}${extra}`;
}

export function fromFen(fen: string): Position {
  const [boardPart, turn = 'w', , , halfmove = '0', fullmove = '1', strikeField = ''] = fen.trim().split(/\s+/);
  const board = new Uint8Array(64);
  const rows = boardPart.split('/');
  if (rows.length !== 8) throw new Error(`bad FEN ${fen}`);
  rows.forEach((row, i) => {
    let f = 0;
    for (const ch of row) {
      if (/\d/.test(ch)) { f += +ch; continue; }
      const up = ch.toUpperCase();
      const spent = up === 'H' ? SPENT : 0;
      const t = spent ? G : (LETTERS.indexOf(up) as PieceType);
      if (t <= 0 || f > 7) throw new Error(`bad FEN ${fen}`);
      board[sq(f++, 7 - i)] = piece(t, ch === up ? WHITE : BLACK) | spent;
    }
  });
  const color = turn === 'w' ? WHITE : BLACK;
  const strike: [boolean, boolean] = [strikeField.includes('w'), strikeField.includes('b')];
  return {
    board, turn: color, halfmove: +halfmove, ply: (+fullmove - 1) * 2 + color,
    ...(strike[0] || strike[1] ? { strike } : {}),
  };
}

/**
 * Long algebraic: Nb1-c3, Bc4xf7, Ae4*d5 (shot or catapult lob), Ma1<>e1 (swap),
 * Sd4xe5xf6 (chain), Oe4>f5-f6 (the ogre on e4 shoves the piece on f5 to f6), e7-e8=Q.
 *
 * A shove prints where the *shoved* piece went and not where the ogre ended up, because the ogre's
 * square follows from `ogreMode` — the same way `selfRemove` follows from `paladinKamikaze`. A
 * reader of stored games has to set the run's rules before it parses, which it has to do anyway.
 */
export function toLan(pos: Position, m: Move): string {
  const t = typeOf(pos.board[m.from]);
  const letter = t === P ? '' : LETTERS[t];
  let s: string;
  if (m.shove) s = `${letter}${sqName(m.from)}>${sqName(m.shove.from)}-${sqName(m.shove.to)}`;
  else if (m.swap) s = `${letter}${sqName(m.from)}<>${sqName(m.to)}`;
  // Reaver: one capture, then a step to the landing square (`Vb1xc3-d3`, also when it steps back
  // onto its own square). Checked before the `to === from` shot shape, which a Reaver would
  // otherwise print as an archer rifle shot.
  else if (t === V && m.captures.length === 1 && m.to !== m.captures[0]) s = `${letter}${sqName(m.from)}x${sqName(m.captures[0])}-${sqName(m.to)}`;
  else if (m.to === m.from) s = `${letter}${sqName(m.from)}*${sqName(m.captures[0])}`;
  else if (m.captures.length > 1) s = `${letter}${sqName(m.from)}${m.captures.map(c => 'x' + sqName(c)).join('')}`;
  else s = `${letter}${sqName(m.from)}${m.captures.length ? 'x' : '-'}${sqName(m.to)}`;
  if (m.promo) s += '=' + LETTERS[m.promo];
  if (m.strike) s += '!'; // Strike (Flame A): a queen-like action by an ordinary piece
  return s;
}

export { rank };
