/** Start positions, FEN-style serialisation and move notation. */
import { BLACK, Color, G, LETTERS, Mark, Move, P, PieceType, Position, SPENT, V, WHITE, colorOf, parseSq, piece, rank, sq, sqName, typeOf } from './engine';
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
 * FEN-shaped: `<board> <turn> - - <halfmove> <fullmove> [powers]` (castling/en-passant always "-").
 * Uppercase = white. `H`/`h` is a guard that has spent its one capture (`Rules.guardCaptureLimit`).
 *
 * Field 7 is the kings' power state, written only when there is some (docs/RULES.md §4):
 * `/`-separated tokens — `u1.0` uses spent [white.black], `me5w` a Freeze/Ice Wall mark and the
 * side that set it (`me5w2`: it covers two more turns), `f` a free mark's ordinary move still to
 * come, `hd4` a pending Haste second move, `lRn` the Sacrifice reserve (pieces each side lost,
 * uppercase white; an empty `l` still says the reserve is kept). The pre-2026-10-02 field `w` / `b` / `wb` (a spent
 * Strike) still reads, as one use spent.
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
  const powers = powerField(pos);
  return `${rows.join('/')} ${pos.turn === WHITE ? 'w' : 'b'} - - ${pos.halfmove} ${Math.floor(pos.ply / 2) + 1}${powers ? ' ' + powers : ''}`;
}

/** FEN field 7, or '' when the position carries no power state. */
function powerField(pos: Position): string {
  const parts: string[] = [];
  if (pos.used && (pos.used[0] || pos.used[1])) parts.push(`u${pos.used[0]}.${pos.used[1]}`);
  // One token per marking side: square, side, `i` for a card-mode Ice Wall, turns left above 1.
  pos.marks?.forEach((k, by) => { if (k) parts.push(`m${sqName(k.sq)}${by === BLACK ? 'b' : 'w'}${k.ward ? 'i' : ''}${(k.left ?? 1) > 1 ? k.left : ''}`); });
  if (pos.free) parts.push('f');
  if (pos.haste !== undefined) parts.push(`h${sqName(pos.haste)}`);
  if (pos.lost) {
    let l = '';
    for (let c = 0; c < 2; c++) for (let t = 1; t < 16; t++) {
      const letter = c === WHITE ? LETTERS[t] : LETTERS[t].toLowerCase();
      l += letter.repeat(Math.max(0, pos.lost[c * 16 + t] ?? 0));
    }
    parts.push(`l${l}`);
  }
  return parts.join('/');
}

/** Read FEN field 7 into `pos` (see `toFen`). */
function readPowerField(field: string, pos: Position): void {
  if (!field) return;
  if (/^(w|b|wb)$/.test(field)) { // before 2026-10-02: the side(s) whose one Strike was spent
    pos.used = [field.includes('w') ? 1 : 0, field.includes('b') ? 1 : 0];
    return;
  }
  for (const token of field.split('/')) {
    const kind = token[0], rest = token.slice(1);
    if (kind === 'u') { const [w = '0', b = '0'] = rest.split('.'); pos.used = [+w, +b]; }
    else if (kind === 'm') {
      const by = rest[2] === 'b' ? BLACK : WHITE, ward = rest[3] === 'i', left = rest.slice(ward ? 4 : 3);
      const marks: [Mark | undefined, Mark | undefined] = [pos.marks?.[0], pos.marks?.[1]];
      marks[by] = { sq: parseSq(rest.slice(0, 2)), ...(left ? { left: +left } : {}), ...(ward ? { ward: true } : {}) };
      pos.marks = marks;
    } else if (kind === 'f') pos.free = true;
    else if (kind === 'h') pos.haste = parseSq(rest);
    else if (kind === 'l') {
      const lost = new Array<number>(32).fill(0);
      for (const ch of rest) {
        const up = ch.toUpperCase(), t = LETTERS.indexOf(up);
        if (t <= 0) throw new Error(`bad reserve letter ${ch} in ${field}`);
        lost[(ch === up ? WHITE : BLACK) * 16 + t]++;
      }
      pos.lost = lost;
    } else throw new Error(`bad power field ${field}`);
  }
}

export function fromFen(fen: string): Position {
  const [boardPart, turn = 'w', , , halfmove = '0', fullmove = '1', powers = ''] = fen.trim().split(/\s+/);
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
  const color: Color = turn === 'w' ? WHITE : BLACK;
  const pos: Position = { board, turn: color, halfmove: +halfmove, ply: (+fullmove - 1) * 2 + color };
  readPowerField(powers, pos);
  return pos;
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
  // King powers that do not read as a piece's move (docs/RULES.md §4): a Haste pass, Freeze (`F`),
  // Ice Wall (`W`), Sacrifice (`S`, the pawn's square and the returned piece) and Flight (`~`); and
  // the Curse card (`C`, an enemy piece's step) and SkyLift (`K`, before the maester swap it looks like).
  if (m.pass) return '--';
  if (m.power === 'freeze') return `!F:${sqName(m.to)}`;
  if (m.power === 'ward') return `!W:${sqName(m.to)}`;
  if (m.power === 'sacrifice') return `!S:${sqName(m.from)}=${LETTERS[m.promo ?? 0]}`;
  if (m.power === 'flight') return `${letter}${sqName(m.from)}~${sqName(m.to)}`;
  if (m.power === 'curse') return `!C:${sqName(m.from)}-${sqName(m.to)}`;
  if (m.power === 'skylift') return `!K:${sqName(m.from)}<>${sqName(m.to)}`;
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
  // The other powers ride on an ordinary move's notation: Strike `!` (a queen-like action by an
  // ordinary piece), Haste `!H` (the turn holds), counted March `!M` and Leap `!L`, and the Mimic
  // `!X` and Vault `!V` cards.
  if (m.power === 'strike') s += '!';
  else if (m.power === 'haste') s += '!H';
  else if (m.power === 'march') s += '!M';
  else if (m.power === 'leap') s += '!L';
  else if (m.power === 'mimic') s += '!X';
  else if (m.power === 'vault') s += '!V';
  return s;
}

export { rank };
