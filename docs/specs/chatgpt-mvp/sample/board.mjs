// The sample's board: real game state through the game's own code. The engine (src/rules) plays the fixture's moves;
// marks-model.ts, move-text.ts and powers-ui.ts give the marks as src/screen/play.ts refresh() does; PaintedView draws
// them (marks.ts, legend.ts, scene.mjs) with the web game's options; table.ts's piece text and context-line.ts give
// the words. render.mjs serves the .ts files as plain JS. The imports have no extension, as the game's own do, so each
// module loads once (one RULES).
import { setRules, RULES } from '/src/rules/rules';
import { legalMoves, makeMove, inCheck, findKing, parseSq, colorOf, typeOf, nameOf, status } from '/src/rules/engine';
import { fromFen, toLan } from '/src/rules/setup';
import { threatsIn, checkersOf, checkCause, describeMove } from '/src/move-text';
import { marksModel, railsOf } from '/src/marks-model';
import { offered } from '/src/powers-ui';
import { readText } from '/src/read';
import { contextLine } from '/src/context-line';
import { pieceIcon } from '/src/piece-icons';
import { PaintedView } from '/src/render/PaintedView';

const ICON = { 1: 'pawn', 2: 'knight', 3: 'bishop', 4: 'rook', 5: 'queen', 6: 'king', 7: 'archer', 8: 'paladin', 9: 'guard', 10: 'maester', 11: 'beast', 12: 'ogre' };

/** The game state of a fixture: the FEN, then the moves (long algebraic, toLan) the engine plays from it. */
export function gameOf(f) {
  setRules(f.rules ?? {});
  let pos = { ...fromFen(f.fen), ...(f.used ? { used: f.used } : {}) }, prev = null, last = null;
  for (const lan of f.play ?? []) {
    const m = legalMoves(pos).find(m => toLan(pos, m) === lan);
    if (!m) throw new Error(`not a legal move here: ${lan}`);
    prev = pos; last = m; pos = makeMove(pos, m);
  }
  return { pos, prev, last };
}

/** The table's piece text (src/ui/table.ts readPiece): "White knight." and the note from read.ts. */
function pieceText(pos, sq) {
  const code = pos.board[sq], [line = '', states = ''] = readText(pos, sq).split('\n');
  return { read: `${colorOf(code) ? 'Black' : 'White'} ${nameOf(typeOf(code))}.${states ? ` ${states}.` : ''}`, readNote: line.split(' · ')[1] ?? '' };
}

/**
 * The legal swaps of an arrangement (the seat screen): the back-rank squares the piece on `from` may trade with, under
 * the rules' own arrangement conditions (`bishopsOppositeColours`, `guardNextToKing`, as setup.ts randomBackRank()).
 */
function seatSwaps(row, from) {
  return [...row].flatMap((_, to) => {
    if (to === from) return [];
    const r = [...row]; [r[from], r[to]] = [r[to], r[from]];
    const k = r.indexOf('K'), g = r.indexOf('G'), b = r.flatMap((p, i) => (p === 'B' ? [i] : []));
    const ok = !(RULES.guardNextToKing && g >= 0 && Math.abs(g - k) !== 1) && !(RULES.bishopsOppositeColours && b.length === 2 && (b[0] + b[1]) % 2 === 0);
    return ok ? [to] : [];
  });
}

/**
 * Draws a fixture into `host` (an element with a size) and resolves with the table's words for it.
 * f: fen, play (moves), rules (setRules), used (spent cards, a bit for each hand index), sel (the selected square),
 * threats (Settings → Show threats), seat (the arrangement: the White back rank, as letters), symbols, veil.
 * Returns { context: { line, note }, story (the moves line, as the table writes it), status }.
 */
export async function drawGame(host, f) {
  const { pos, prev, last } = gameOf(f);
  const view = new PaintedView(host, { floor: null, webInk: true });
  const sel = f.sel ? parseSq(f.sel) : null;
  let h;
  if (f.seat) h = { selected: sel, swaps: sel == null ? [] : seatSwaps(f.seat, sel) };
  else {
    // As play.ts refresh(): the selected piece's offered moves, the power squares, the last move, check, the rails, the threats.
    const cands = sel == null ? [] : legalMoves(pos).filter(m => m.from === sel && offered(m, null));
    const verb = marksModel(cands, []);
    h = {
      selected: sel, ...verb,
      powers: [...new Set(cands.filter(m => m.power && !m.pass).map(m => m.to))],
      last: !last ? [] : last.shove ? [last.shove.from, last.shove.to] : last.to === last.from ? [...last.captures] : [last.to],
      check: inCheck(pos) ? findKing(pos.board, pos.turn) : null,
      checkers: checkersOf(pos),
      rails: sel == null ? [] : railsOf(pos.board, sel, [...verb.moves, ...verb.captures], verb.captures),
      threats: f.threats ? threatsIn(pos) : [],
    };
  }
  view.sync(pos);
  view.highlight(h);
  const result = status(pos);
  if (result === 'checkmate') view.setFallen(findKing(pos.board, pos.turn), false);
  // Symbols only (a plugin setting; the web game has none): the scene stands no figures, the game's piece icons
  // (src/piece-icons.ts) stand on the squares instead; the marks still read the real position.
  if (f.symbols) view.scene.setPosition({ ...pos, board: new Uint8Array(64) });
  await view.ready();
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  const scene = view.scene, canvas = host.querySelector('canvas'), width = parseFloat(canvas.style.width), k = width / 960, head = 64;
  const layer = document.createElement('div');
  layer.className = 'board-layer';
  layer.style.cssText = `width:${width}px;height:${canvas.style.height}`;
  if (f.symbols) pos.board.forEach((v, s) => {
    if (!v) return;
    const c = scene.cell(s);
    layer.insertAdjacentHTML('beforeend', `<svg class="pi pi-${colorOf(v) ? 'b' : 'w'}" style="left:${(scene.PAD + c.col * scene.TILE + 14) * k}px;top:${(head + scene.PAD + c.row * scene.TILE + 14) * k}px;width:${(scene.TILE - 28) * k}px;height:${(scene.TILE - 28) * k}px"><use href="/ui/icons/${ICON[typeOf(v)]}.svg#icon"/></svg>`);
  });
  if (f.veil) layer.insertAdjacentHTML('beforeend', `<div class="veil" style="left:${scene.PAD * k}px;top:${(head + scene.PAD) * k}px;width:${8 * scene.TILE * k}px;height:${4 * scene.TILE * k}px"><span>${f.veil}</span></div>`);
  host.append(layer);
  const start = scene.frames;
  scene.redraw();
  await new Promise(r => { const tick = () => scene.frames > start ? r() : requestAnimationFrame(tick); tick(); });

  // The words, as src/ui/table.ts refreshTable() makes them (a game with a person: mode 'link', you play White).
  const piece = sel != null && !f.seat ? pieceText(pos, sel) : { read: '', readNote: '' };
  const check = inCheck(pos);
  const context = contextLine({ voice: 'you', selected: piece.read, readNote: piece.readNote, check, checkCause: check ? checkCause(pos, last, 'link', 0) : '' });
  const story = last ? `${pieceIcon(typeOf(prev.board[last.from]), colorOf(prev.board[last.from]))}<span>${describeMove(prev, last, true)}</span>` : '<span>No moves yet.</span>';
  return { context, story, status: result, pos };
}
