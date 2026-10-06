/** Start positions, FEN-style serialisation and move notation. */
import { BLACK, CardName, Color, G, LETTERS, Mark, Move, P, PieceType, Position, SPENT, V, WHITE, colorOf, moveNumber, parseSq, piece, rank, sq, sqName, typeOf } from './engine';
import { ALL_CARDS, RULES } from './rules';

/** King Down Classic pool: 7 of these join the king on the back rank. */
/** Draw pool for a random back rank: 7 of these 15 plus the king. One guard per army (designer, 2026-09-13). */
export const POOL = 'QORRBBNNAAGMMS'; // one beast at most (owner, 2026-10-04)
/** The pool before 2026-10-04 (two beasts): recorded tournaments without a `pool` drew from it. */
export const POOL_2BEASTS = 'QORRBBNNAAGMMSS';
export const CLASSIC_CHESS = 'RNBQKBNR';

export function shuffle<T>(a: T[], rng: () => number): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Random back rank: 7 pieces from `pool` (default POOL) + king, shuffled; two bishops must sit on opposite colours (`Rules.bishopsOppositeColours`). */
export function randomBackRank(rng: () => number = Math.random, pool: string = POOL): string {
  for (;;) {
    const picks = shuffle(pool.split(''), rng).slice(0, 7);
    const row = shuffle([...picks, 'K'], rng);
    const bishops = row.flatMap((p, i) => (p === 'B' ? [i] : []));
    if (RULES.bishopsOppositeColours && bishops.length === 2 && (bishops[0] + bishops[1]) % 2 === 0) continue;
    return row.join('');
  }
}

/**
 * A start position under `guardReserve` (lab): each side's guards leave its first rank and wait
 * beside the board (`Position.waiting`); their squares stay empty. The identity when the rule is off.
 */
export function waitGuards(pos: Position): Position {
  if (RULES.guardReserve === 'off') return pos;
  const board = new Uint8Array(pos.board), waiting: [number, number] = [pos.waiting?.[0] ?? 0, pos.waiting?.[1] ?? 0];
  for (let f = 0; f < 8; f++) for (const c of [WHITE, BLACK] as const) {
    const s = sq(f, c === WHITE ? 0 : 7);
    if (board[s] && typeOf(board[s]) === G && colorOf(board[s]) === c) { board[s] = 0; waiting[c]++; }
  }
  return waiting[0] || waiting[1] ? { ...pos, board, waiting } : pos;
}

/**
 * Both sides mirror the same back rank (as in King Down Classic / Chess960); pawns on ranks 2 and 7.
 * Under `guardReserve` the guards wait beside the board (`waitGuards`).
 */
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
  return waitGuards({ board, turn: WHITE, halfmove: 0, ply: 0, move: 1 });
}

/**
 * FEN-shaped: `<board> <turn> - - <halfmove> <fullmove> [powers]` (castling/en-passant always "-").
 * Uppercase = white. `H`/`h` is a guard that has spent its one capture (`Rules.guardCaptureLimit`).
 *
 * Field 7 is the kings' power state, written only when there is some (docs/RULES.md §4):
 * `/`-separated tokens — `u1.0` uses spent [white.black], `me5w` a Freeze/Ice Wall mark and the
 * side that set it (`me5w2`: it covers two more turns), `f` a free mark's ordinary move still to
 * come, `hd4` a pending Haste second move, `lRn` the Sacrifice reserve (pieces each side lost,
 * uppercase white; an empty `l` still says the reserve is kept), `g1.0` guards waiting beside the
 * board [white.black] (`Rules.guardReserve`). Card mode: a mark's `i` is an Ice Wall, `a` a Firewall
 * (every piece), and turns left `0` a mark just ended that a Rescue may renew (`me5wi0`); `hd4r` /
 * `hd4t` / `hd4o` a Rage's / a RageB's / a Rally's pending second move; `yHaste.Freeze` the card each side played last
 * (Mirror; empty for none); `d1.0` cards drawn (Growth). The pre-2026-10-02 field `w` / `b` / `wb`
 * (a spent Strike) still reads, as one use spent.
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
  return `${rows.join('/')} ${pos.turn === WHITE ? 'w' : 'b'} - - ${pos.halfmove} ${moveNumber(pos)}${powers ? ' ' + powers : ''}`;
}

/** FEN field 7, or '' when the position carries no power state. */
function powerField(pos: Position): string {
  const parts: string[] = [];
  if (pos.used && (pos.used[0] || pos.used[1])) parts.push(`u${pos.used[0]}.${pos.used[1]}`);
  // One token per marking side: square, side, `i` for a card-mode Ice Wall, turns left above 1.
  pos.marks?.forEach((k, by) => { if (k) parts.push(`m${sqName(k.sq)}${by === BLACK ? 'b' : 'w'}${k.all ? 'a' : k.ward ? 'i' : ''}${(k.left ?? 1) !== 1 ? k.left : ''}`); });
  if (pos.free) parts.push('f');
  if (pos.haste !== undefined) parts.push(`h${sqName(pos.haste)}${pos.rage ? ' rto'[pos.rage] : ''}`);
  if (pos.lost) {
    let l = '';
    for (let c = 0; c < 2; c++) for (let t = 1; t < 16; t++) {
      const letter = c === WHITE ? LETTERS[t] : LETTERS[t].toLowerCase();
      l += letter.repeat(Math.max(0, pos.lost[c * 16 + t] ?? 0));
    }
    parts.push(`l${l}`);
  }
  if (pos.waiting && (pos.waiting[0] || pos.waiting[1])) parts.push(`g${pos.waiting[0]}.${pos.waiting[1]}`);
  if (pos.last && (pos.last[0] || pos.last[1])) parts.push(`y${pos.last[0] ?? ''}.${pos.last[1] ?? ''}`);
  if (pos.drawn && (pos.drawn[0] || pos.drawn[1])) parts.push(`d${pos.drawn[0]}.${pos.drawn[1]}`);
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
      const by = rest[2] === 'b' ? BLACK : WHITE, all = rest[3] === 'a', ward = all || rest[3] === 'i', left = rest.slice(ward ? 4 : 3);
      const marks: [Mark | undefined, Mark | undefined] = [pos.marks?.[0], pos.marks?.[1]];
      marks[by] = { sq: parseSq(rest.slice(0, 2)), ...(left ? { left: +left } : {}), ...(ward ? { ward: true } : {}), ...(all ? { all: true } : {}) };
      pos.marks = marks;
    } else if (kind === 'f') pos.free = true;
    else if (kind === 'h') { pos.haste = parseSq(rest); const k = 'rto'.indexOf(rest[2]); if (rest[2] && k >= 0) pos.rage = (k + 1) as 1 | 2 | 3; }
    else if (kind === 'y') {
      const card = (n: string): CardName | undefined => { if (!n) return undefined; if (!ALL_CARDS.includes(n as CardName)) throw new Error(`bad card ${n} in ${field}`); return n as CardName; };
      const [w = '', b = ''] = rest.split('.');
      pos.last = [card(w), card(b)];
    } else if (kind === 'd') { const [w = '0', b = '0'] = rest.split('.'); pos.drawn = [+w, +b]; }
    else if (kind === 'l') {
      const lost = new Array<number>(32).fill(0);
      for (const ch of rest) {
        const up = ch.toUpperCase(), t = LETTERS.indexOf(up);
        if (t <= 0) throw new Error(`bad reserve letter ${ch} in ${field}`);
        lost[(ch === up ? WHITE : BLACK) * 16 + t]++;
      }
      pos.lost = lost;
    } else if (kind === 'g') { const [w = '0', b = '0'] = rest.split('.'); pos.waiting = [+w, +b]; }
    else throw new Error(`bad power field ${field}`);
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
  const pos: Position = { board, turn: color, halfmove: +halfmove, ply: (+fullmove - 1) * 2 + color, move: +fullmove };
  readPowerField(powers, pos);
  return pos;
}

/**
 * Long algebraic: Nb1-c3, Bc4xf7, Ae4*d5 (shot or catapult lob), Ma1<>e1 (swap),
 * Sd4xe5xf6 (chain), Oe4>f5-f6 (the ogre on e4 shoves the piece on f5 to f6), e7-e8=Q, G@b1 (a
 * waiting guard enters on b1), N@b1!R (a Salvation card returns a knight to b1). The 2014 cards:
 * Ra1-a4!A and Ra1-a4!B (Rage, RageB; the second move is plain), Ra1-a4!J (Rally; so is the other piece's move), !P (Firewall), !E:d4<>e5
 * (FirewallB), !Q:d4 and !U:d4 (Earth Quake on d4, EarthQuakeB), Rd1xd4!N (Burn), Qd1xd8!T (Fire
 * Starter), Nb1-b4!O (Control), !D:e5 (Rescue of the mark on e5), !G and !G+ (Growth, GrowthB),
 * !I:d1=Q and !I+:d1=R (Morph and MorphB: the piece on d1 becomes a queen, a rook), and the
 * Spawn cards in the drop's shape: P@c2!S (Spawn), P@d2!SK (SpawnK), P@c2,f2!S2 (Spawn2) and
 * P@d2,e2!SK2 (SpawnK2) — every capital letter already names a card, so these take the Spawn's
 * name (`S` is otherwise Sacrifice's prefix `!S:`, never a suffix); the softer Morph cards in
 * the Morph's family: !IP:e2=N (MorphP: the pawn on e2 becomes a knight) and !IS:b1<>f1 (MorphS:
 * the pieces on b1 and f1 swap places);
 * a Mirror card writes the copied card's move then !Y (Mirror) or !Z (MirrorB): !F:d5!Y.
 *
 * A shove prints where the *shoved* piece went and not where the ogre ended up, because the ogre's
 * square follows from `ogreMode` — the same way `selfRemove` follows from `paladinKamikaze`. A
 * reader of stored games has to set the run's rules before it parses, which it has to do anyway.
 */
export function toLan(pos: Position, m: Move): string {
  const s = lanOf(pos, m);
  return m.via === 'mirror' ? s + '!Y' : m.via === 'mirrorb' ? s + '!Z' : s;
}

/** The card a drop spends, by its notation: Salvation and the Spawn cards (a waiting guard spends none). */
const DROP_TAG: Readonly<Record<string, string>> = { salvation: '!R', spawn: '!S', spawnk: '!SK', spawn2: '!S2', spawnk2: '!SK2' };

function lanOf(pos: Position, m: Move): string {
  const t = typeOf(pos.board[m.from]);
  const letter = t === P ? '' : LETTERS[t];
  // King powers that do not read as a piece's move (docs/RULES.md §4): a Haste pass, Freeze (`F`),
  // Ice Wall (`W`), Sacrifice (`S`, the pawn's square and the returned piece) and Flight (`~`); and
  // the Curse card (`C`, an enemy piece's step) and SkyLift (`K`, before the maester swap it looks like).
  if (m.pass) return '--';
  if (m.drop) return `${LETTERS[m.drop]}@${sqName(m.to)}${m.drop2 !== undefined ? ',' + sqName(m.drop2) : ''}${DROP_TAG[m.power ?? ''] ?? ''}`;
  if (m.power === 'freeze') return `!F:${sqName(m.to)}`;
  if (m.power === 'ward') return `!W:${sqName(m.to)}`;
  if (m.power === 'sacrifice') return `!S:${sqName(m.from)}=${LETTERS[m.promo ?? 0]}`;
  if (m.power === 'morph' || m.power === 'morphb') return `!I${m.power === 'morphb' ? '+' : ''}:${sqName(m.from)}=${LETTERS[m.promo ?? 0]}`;
  if (m.power === 'morphp') return `!IP:${sqName(m.from)}=${LETTERS[m.promo ?? 0]}`;
  if (m.power === 'morphs') return `!IS:${sqName(m.from)}<>${sqName(m.to)}`;
  if (m.power === 'flight') return `${letter}${sqName(m.from)}~${sqName(m.to)}`;
  if (m.power === 'curse') return `!C:${sqName(m.from)}-${sqName(m.to)}`;
  if (m.power === 'skylift') return `!K:${sqName(m.from)}<>${sqName(m.to)}`;
  if (m.power === 'firewall') return '!P';
  if (m.power === 'firewallb') return `!E:${sqName(m.from)}<>${sqName(m.to)}`;
  if (m.power === 'quake' || m.power === 'quakeb') return `${m.power === 'quake' ? '!Q' : '!U'}:${sqName(m.from)}`;
  if (m.power === 'rescue') return `!D:${sqName(m.from)}`;
  if (m.power === 'growth') return '!G';
  if (m.power === 'growthb') return '!G+';
  let s: string;
  if (m.shove) s = `${letter}${sqName(m.from)}>${sqName(m.shove.from)}-${sqName(m.shove.to)}`;
  else if (m.swap) s = `${letter}${sqName(m.from)}<>${sqName(m.to)}`;
  // Reaver: one capture, then a step to the landing square (`Vb1xc3-d3`, also when it steps back
  // onto its own square). Checked before the `to === from` shot shape, which a Reaver would
  // otherwise print as an archer rifle shot. A Control card lends that shape to other pieces too.
  else if ((t === V || m.power === 'control') && m.captures.length === 1 && m.to !== m.captures[0] && (t === V || m.to !== m.from)) s = `${letter}${sqName(m.from)}x${sqName(m.captures[0])}-${sqName(m.to)}`;
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
  else if (m.power === 'rage') s += '!A';
  else if (m.power === 'rageb') s += '!B';
  else if (m.power === 'rally') s += '!J';
  else if (m.power === 'burn') s += '!N';
  else if (m.power === 'firestarter') s += '!T';
  else if (m.power === 'control') s += '!O';
  return s;
}

export { rank };
