import './style.css';
import { Engine, Game, Side } from './game';
import { BoardRenderer } from './render/renderer';
import { STYLES } from './render/styles';
import { loadModels, setUseSculpts } from './render/voxels';
import { Color, LETTERS, Move, NAMES, PieceType, RULES as GAME_RULES, RULES_2017, RULES_2021, SPENT, colorOf, findKing, kingLabel, KingChoice, PowerName, parseKings, setRules, sqName, typeOf, type Rules } from './rules/engine';
import { CLASSIC_CHESS, fromFen, randomBackRank, toFen } from './rules/setup';

const params = new URLSearchParams(location.search);
/** `?rules=2017|2021` plays an older rule set. No parameter = the measured 2026 rules. */
const preset = { 2017: RULES_2017, 2021: RULES_2021 }[params.get('rules') ?? ''];
/**
 * `?kings=spirit:mercy,mud:march` — White first; one value gives both sides the same king
 * (docs/RULES.md §4, docs/KINGS-POWERS-PLAN.md §3.2). The default is **no powers** (decision 21):
 * nothing ships un-measured, and there is no picker until a run has priced them.
 */
const kings = params.get('kings');
// Before the first Game: its constructor builds a position and asks for its status.
if (preset || kings) setRules({ ...preset, ...(kings ? { kings: parseKings(kings) } : {}) });
/** One line per power, for the info card. The six built powers only; tier 2–3 cannot be selected. */
const POWER_TEXT: Partial<Record<PowerName, string>> = {
  HolyLight: 'enemy pawns cannot take this king, and it cannot take pawns',
  Mercy: 'the king steps 1–2, jumps friends and takes only a guard',
  DeathTouch: 'the king takes an adjacent enemy without moving',
  Darkness: 'pawns step diagonally and take straight ahead, with no double step',
  March: 'pawns step two squares from any rank',
  Leap: 'rooks, bishops and the queen pass over their own pawns',
};
const powerLabel = (k: KingChoice | null): string => (k
  ? `${k.king}:${k.power} — ${POWER_TEXT[k.power] ?? 'a lab power'}`
  : 'plain king');

/** One line for the info card, so a `?kings=` game says on screen which powers are live. */
const kingsInfo = (): string => {
  const [w, b] = GAME_RULES.kings;
  if (!w && !b) return '';
  const same = w && b && w.king === b.king && w.power === b.power;
  return same
    ? `<div>Kings — both ${powerLabel(w)}</div>`
    : `<div>Kings — White ${powerLabel(w)} · Black ${powerLabel(b)}</div>`;
};

const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;

const game = new Game();
const engine = new Engine();
const view = new BoardRenderer($('board'));
(window as unknown as Record<string, unknown>).view = view; // tools/styleboard2.mjs aims its crops with view.screenOf()
const sides: [Side, Side] = ['human', 'ai'];
let selected: number | null = null;
let pending: number[] = []; // beast chain squares clicked so far
let hovered: number | null = null;
let resigned: Color | null = null;
let busy = false;
/** The in-flight token. reset() bumps it; every await in commit/maybeAi/choose drops out if it changed. */
let gen = 0;
/** Closes an open promotion picker (resolving it with null). Set only while one is on screen. */
let closePromo: (() => void) | null = null;

/** The game is over: mate, a draw, or somebody resigned. Blocks input and the AI. */
const finished = (): boolean => resigned != null || game.status !== 'playing';

/** Condensed from docs/RULES.md §3, indexed by piece type (same order as NAMES). */
const RULES: readonly (readonly [string, string])[] = [
  ['', ''],
  ['Moves 1 square forward, 2 from its start rank.', 'Takes 1 square diagonally forward. Promotes on the last rank.'],
  ['Moves in an L (2 + 1) over any piece.', 'Takes by moving onto the enemy.'],
  ['Moves any distance diagonally.', 'Takes by moving onto the enemy.'],
  ['Moves any distance orthogonally.', 'Takes by moving onto the enemy.'],
  ['Moves any distance in a straight line.', 'Takes by moving onto the enemy.'],
  ['Moves 1 square in any direction.', 'Takes by moving onto the enemy. Only a king can take a guard.'],
  ['Moves 1 square in any direction.', 'Shoots without moving: an enemy diagonally adjacent, or 2 squares away orthogonally, through blockers.'],
  ['Moves like a queen and jumps over own pieces.', 'Takes by moving on, but never a king. Removes itself after capturing anything but a pawn.'],
  ['Moves 1 square in any direction, empty squares only.', 'Cannot capture. Cannot be captured, except by a king.'],
  ['Moves 1 square in any direction; onto an own piece it swaps places.', 'Takes an adjacent enemy. With its own king on rank 1 it swaps with the king at any distance.'],
  ['Moves 1 square in any direction, empty squares only.', 'Takes on any adjacent square but straight ahead, and may keep taking from each new square.'],
  // Lab pieces: they reach the browser only through a `?fen=` that names one (docs/research/sim-new-pieces-2026-09-14.md).
  ['Moves 1 square in any direction. Instead it may shove an adjacent piece 1 square away — shift-click a neighbour.', 'Takes by moving onto the enemy, a guard excepted. A shove is not a capture and never moves a king.'],
  ['Moves like a rook and never takes by moving.', 'Lobs along a rank or file over one enemy screen and takes the first piece beyond it.'],
];

function showInfo(sq: number | null): void {
  const code = sq == null ? 0 : game.pos.board[sq];
  const t = code ? typeOf(code) : 0;
  $('info').innerHTML = (code
    ? `<b>${colorOf(code) ? 'Black' : 'White'} ${NAMES[t]}</b><br>${RULES[t][0]} ${RULES[t][1]}`
      // Lab only (docs/RULES.md §6.9): the shipped guard never captures, so it can never be spent.
      + (code & SPENT ? ' <b>This guard has used its capture.</b>' : '')
    : '') + kingsInfo();
}

/** Squares the user clicks to identify a move: a shove target, chain victims, shot target, or the destination. */
const clickPath = (m: Move): number[] => (m.shove
  ? [m.shove.from] // click the neighbour to shove, under both `repel` (to === from) and `push`
  : m.to === m.from ? [m.captures[0]] : m.captures.length > 1 ? m.captures : [m.to]);
const candidates = (): Move[] =>
  selected == null ? [] : game.legal.filter(m => m.from === selected && pending.every((sq, i) => clickPath(m)[i] === sq));

function refresh(): void {
  const cands = candidates();
  const next = cands.map(m => clickPath(m)[pending.length]).filter((s): s is number => s != null);
  const swaps = cands.filter(m => m.swap).map(m => m.to);
  const shoves = cands.filter(m => m.shove).map(m => m.shove!.from);
  const last = game.history.at(-1)?.move;
  view.highlight({
    selected,
    moves: next.filter(sq => !game.pos.board[sq]),
    captures: next.filter(sq => game.pos.board[sq] !== 0 && !swaps.includes(sq) && !shoves.includes(sq)),
    swaps,
    shoves,
    last: last ? [last.from, ...(last.shove ? [last.shove.from, last.shove.to] : last.to === last.from ? last.captures : [last.to])] : [],
    check: game.inCheck ? findKing(game.pos.board, game.pos.turn) : null,
  });
  $('stop-chain').hidden = !(pending.length && candidates().some(m => clickPath(m).length === pending.length));
  const turn = game.pos.turn ? 'Black' : 'White';
  $('turn').textContent = finished() ? '' : `${turn} to move${game.inCheck ? ' — CHECK' : ''}`;
  $('status').textContent = resigned != null ? result() : {
    playing: busy && sides[game.pos.turn] === 'ai' ? 'thinking…' : '',
    checkmate: `Checkmate — ${game.pos.turn ? 'White' : 'Black'} wins`,
    stalemate: 'Stalemate — draw',
    draw50: 'Draw — 50-move rule',
    drawRepetition: 'Draw — threefold repetition',
    drawMaterial: 'Draw — insufficient material',
  }[game.status];
  $('setup').textContent = game.backRank || 'custom';
  $('setup').title = toFen(game.pos);
  const moves = $('moves');
  moves.innerHTML = game.history.map((h, i) => (i % 2 === 0 ? `<li>${i / 2 + 1}. <b>${h.lan}</b>` : ` ${h.lan}</li>`)).join('');
  moves.scrollTop = moves.scrollHeight;
  // Captured pieces: a piece the mover removed counts for the mover; a paladin that removes itself is its own side's loss.
  const taken: [number[], number[]] = [[], []];
  for (const h of game.history) {
    const mover = colorOf(h.pos.board[h.move.from]);
    for (const c of h.move.captures) taken[mover].push(h.pos.board[c]);
    if (h.move.selfRemove) taken[1 - mover].push(h.pos.board[h.move.from]);
  }
  const letters = (codes: number[]): string => codes
    .map(p => `<span title="${colorOf(p) ? 'black' : 'white'} ${NAMES[typeOf(p)]}">${colorOf(p) ? LETTERS[typeOf(p)].toLowerCase() : LETTERS[typeOf(p)]}</span>`)
    .join('');
  $('took-w').innerHTML = letters(taken[0]);
  $('took-b').innerHTML = letters(taken[1]);
  showInfo(selected ?? hovered);
  $<HTMLButtonElement>('undo').disabled = game.history.length === 0;
  $<HTMLButtonElement>('resign').disabled = finished();
  $<HTMLButtonElement>('copy').disabled = game.history.length === 0;
}

async function commit(m: Move): Promise<void> {
  const g = gen;
  busy = true;
  const pre = game.pos;
  game.play(m);
  selected = null; pending = [];
  refresh();
  await view.animateMove(pre, m);
  // New game / Undo / Resign landed inside the animation: that game is gone. Returning here is what
  // keeps a second maybeAi() loop from starting and replaying this move onto the new position.
  if (g !== gen) return;
  view.sync(game.pos);
  busy = false;
  refresh();
  save();
  if (finished()) showOver(); else void maybeAi();
}

async function maybeAi(): Promise<void> {
  if (busy || finished() || sides[game.pos.turn] !== 'ai') return;
  busy = true;
  refresh();
  const g = gen;
  const res = await engine.think(game.pos, { timeMs: +$<HTMLInputElement>('think').value });
  if (g !== gen) return;
  busy = false;
  if (res.move) await commit(res.move);
}

/** Resolves with the chosen move, or null when reset() closed the picker. */
function pickPromotion(options: Move[]): Promise<Move | null> {
  const box = $('promo');
  box.innerHTML = '';
  box.hidden = false;
  return new Promise(resolve => {
    const done = (m: Move | null): void => { box.hidden = true; closePromo = null; resolve(m); };
    closePromo = () => done(null);
    for (const m of options) {
      const b = document.createElement('button');
      b.textContent = `${LETTERS[m.promo!]} ${NAMES[m.promo as PieceType]}`;
      b.onclick = () => done(m);
      box.appendChild(b);
    }
  });
}

async function choose(moves: Move[]): Promise<void> {
  if (moves.length === 1 || !moves.every(m => m.promo)) return commit(moves[0]);
  busy = true; // the picker is modal: without this the board stays live and a second move slips in
  const m = await pickPromotion(moves);
  if (!m) return; // reset() closed it; reset() also cleared busy
  busy = false;
  return commit(m);
}

view.onSquareClick = (sq, shift = false) => {
  if (busy || finished() || sides[game.pos.turn] !== 'human') return;
  const own = game.pos.board[sq] !== 0 && colorOf(game.pos.board[sq]) === game.pos.turn;
  const next = candidates().filter(m => clickPath(m)[pending.length] === sq);
  if (selected == null || next.length === 0) {
    selected = own && sq !== selected ? sq : null;
    pending = [];
    return refresh();
  }
  const complete = next.filter(m => clickPath(m).length === pending.length + 1);
  if (complete.length && complete.length === next.length) {
    // An occupied neighbour can be both a capture and a shove target. Plain click takes it;
    // shift-click shoves it. (A friend can only be shoved, so shift is optional there.)
    if (complete.length > 1) {
      const wanted = complete.filter(m => !!m.shove === shift);
      if (wanted.length) { void choose(wanted); return; }
    }
    void choose(complete);
    return;
  }
  pending.push(sq); // beast chain continues; "Stop here" commits the shorter capture
  refresh();
};
view.onSquareHover = sq => {
  hovered = sq;
  $('hover').textContent = sq == null ? '' : sqName(sq);
  showInfo(selected ?? hovered);
};

$('stop-chain').onclick = () => { const m = candidates().find(m => clickPath(m).length === pending.length); if (m) void commit(m); };

/** Stop any AI search in flight and drop the per-game UI state. */
function reset(): void {
  gen++;
  engine.cancel();
  closePromo?.(); // drop an open promotion picker instead of leaving its promise hanging
  busy = false;
  selected = null; pending = [];
}

/** Look from Black's side whenever the human plays Black. */
const orient = (): void => view.flip(sides[0] === 'ai' && sides[1] === 'human');

function newGame(backRank?: string, fen?: string | null): void {
  reset();
  resigned = null;
  sides[0] = $<HTMLSelectElement>('white').value as Side;
  sides[1] = $<HTMLSelectElement>('black').value as Side;
  if (fen) game.load(fromFen(fen)); else game.newGame(backRank);
  view.sync(game.pos);
  orient();
  refresh();
  save();
  void maybeAi();
}

/** Take back one ply, or two against the computer so it is the human's turn again. */
function undo(): void {
  if (!game.history.length) return;
  reset();
  resigned = null;
  game.undo();
  if (sides[game.pos.turn] === 'ai' && sides.includes('human')) game.undo();
  view.sync(game.pos);
  refresh();
  save();
  void maybeAi(); // no-op on a human's turn; restarts the computer if we ran out of plies to take back
}

function result(): string {
  if (resigned != null) return `${resigned ? 'Black' : 'White'} resigns — ${resigned ? 'White' : 'Black'} wins`;
  return {
    playing: '',
    checkmate: `${game.pos.turn ? 'White' : 'Black'} wins by checkmate`,
    stalemate: 'Draw by stalemate',
    draw50: 'Draw by the 50-move rule',
    drawRepetition: 'Draw by repetition',
    drawMaterial: 'Draw by insufficient material',
  }[game.status];
}

function showOver(): void {
  const n = Math.ceil(game.history.length / 2);
  const dlg = $<HTMLDialogElement>('over');
  $('over-title').textContent = result();
  $('over-detail').textContent = `${n} move${n === 1 ? '' : 's'} · setup ${game.backRank || 'custom'}`;
  dlg.returnValue = ''; // Esc leaves the last button's value behind, which would re-fire it
  dlg.showModal();
}

$<HTMLDialogElement>('over').onclose = () => {
  const v = $<HTMLDialogElement>('over').returnValue;
  if (v === 'new') newGame(randomBackRank());
  else if (v === 'rematch') {
    const [w, b] = [$<HTMLSelectElement>('white'), $<HTMLSelectElement>('black')];
    [w.value, b.value] = [b.value, w.value];
    newGame(game.backRank || undefined, game.backRank ? null : toFen(game.history[0]?.pos ?? game.pos));
  }
};

$('undo').onclick = undo;
$('resign').onclick = () => {
  if (finished()) return;
  if (!confirm(`Resign as ${game.pos.turn ? 'Black' : 'White'}?`)) return;
  reset();
  resigned = game.pos.turn;
  refresh();
  save();
  showOver();
};
$('copy').onclick = () => {
  const text = game.history.map((h, i) => (i % 2 === 0 ? `${i / 2 + 1}. ${h.lan}` : h.lan)).join(' ');
  navigator.clipboard?.writeText(text).catch(() => copyFallback(text)) ?? copyFallback(text);
};

/** No clipboard API (or permission denied): a throwaway textarea + execCommand still works everywhere. */
function copyFallback(text: string): void {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;opacity:0';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); } catch { /* nothing else to try */ }
  ta.remove();
}

/* ---- autosave ---- */
interface Save { back: string; fen: string; moves: string[]; white: Side; black: Side; think: number; style: string; coords: boolean; resigned: Color | null; rules?: Rules }
const SAVE_KEY = 'kingdown.save';

function save(): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      back: game.backRank,
      fen: toFen(game.history[0]?.pos ?? game.pos), // the position the game started from
      moves: game.history.map(h => h.lan),
      white: sides[0], black: sides[1],
      think: +$<HTMLInputElement>('think').value,
      style: styleSel.value,
      coords: coords.checked,
      resigned,
      // The rules the game is playing, so opening the save without its URL replays the same game
      // (`?rules=2017`, `?kings=…`; docs/TAKEOVER-PLAN.md §2).
      rules: { ...GAME_RULES },
    } satisfies Save));
  } catch { /* private mode or a full quota: play on without a save */ }
}

function readSave(): Save | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    const s = raw ? (JSON.parse(raw) as Save) : null;
    return s && Array.isArray(s.moves) ? s : null;
  } catch { return null; }
}

$('rules-btn').onclick = () => $<HTMLDialogElement>('rules').showModal();
$('new-random').onclick = () => newGame(randomBackRank());
$('new-classic').onclick = () => newGame(CLASSIC_CHESS);
$('new-setup').onclick = () => {
  const v = prompt('Back rank (8 letters, one K; from QLRRBBNNAAGGMMSS):', game.backRank)?.toUpperCase().trim();
  if (!v) return;
  try { newGame(v); } catch (e) { alert((e as Error).message); }
};
$('white').onchange = $('black').onchange = () => { sides[0] = $<HTMLSelectElement>('white').value as Side; sides[1] = $<HTMLSelectElement>('black').value as Side; orient(); save(); void maybeAi(); };
$('think').onchange = save;
$<HTMLInputElement>('pixel').oninput = e => view.setPixelSize(+(e.target as HTMLInputElement).value);
const palette = () => view.setPalette($<HTMLInputElement>('palette').checked, +$<HTMLInputElement>('dither').value);
$('palette').onchange = $<HTMLInputElement>('dither').oninput = palette;
$<HTMLInputElement>('edges').oninput = e => { const v = +(e.target as HTMLInputElement).value; view.setEdges(v * 0.3, v); };
$('sculpts').onchange = e => { setUseSculpts((e.target as HTMLInputElement).checked); view.rebuild(game.pos); };

const styleSel = $<HTMLSelectElement>('style');
styleSel.innerHTML = Object.entries(STYLES).map(([k, s]) => `<option value="${k}">${s.label}</option>`).join('');
const DEFAULT_STYLE = Object.keys(STYLES)[0];
styleSel.value = params.get('style') || DEFAULT_STYLE;
if (!styleSel.value) styleSel.value = DEFAULT_STYLE;
const labels = $<HTMLInputElement>('labels');
labels.checked = params.get('labels') === '1';
labels.onchange = () => view.setLabels(labels.checked);
view.setLabels(labels.checked);
const coords = $<HTMLInputElement>('coords');
coords.onchange = () => { view.setCoords(coords.checked); save(); };
/** `?px=1..6` pins the pixel size, overriding whatever the style preset asks for. */
const pxOverride = Math.min(6, Math.max(0, Math.round(Number(params.get('px')) || 0)));
/** Apply a preset and move the manual sliders to match; dragging them afterwards still overrides. */
function applyStyle(): void {
  const s = STYLES[styleSel.value];
  view.applyStyle(s);
  const px = pxOverride || s.pixelSize;
  view.setPixelSize(px);
  $<HTMLInputElement>('pixel').value = String(px);
  $<HTMLInputElement>('edges').value = String(s.depthEdge);
  $<HTMLInputElement>('palette').checked = s.palette;
  $<HTMLInputElement>('dither').value = String(s.dither);
  view.setCoords(coords.checked); // the user's choice outlives the preset's own coords flag
}
styleSel.onchange = () => { applyStyle(); save(); };
$('reset-view').onclick = () => view.resetView();
addEventListener('keydown', e => {
  if (e.key === 'Escape') { selected = null; pending = []; refresh(); return; }
  if ((e.target as HTMLElement).closest('input,select,textarea')) return;
  if (e.key === 'r') view.resetView();
  if (e.key === 'z') undo();
});

/** `?fen=` wins over the autosave; settings go in before applyStyle(), the game after the models load. */
const saved = params.has('fen') ? null : readSave();
if (saved) {
  if (saved.style && STYLES[saved.style]) styleSel.value = saved.style;
  if (saved.white) $<HTMLSelectElement>('white').value = saved.white;
  if (saved.black) $<HTMLSelectElement>('black').value = saved.black;
  if (saved.think) $<HTMLInputElement>('think').value = String(saved.think);
  if (typeof saved.coords === 'boolean') coords.checked = saved.coords;
  sides[0] = $<HTMLSelectElement>('white').value as Side;
  sides[1] = $<HTMLSelectElement>('black').value as Side;
}

await loadModels();
applyStyle();
const fen = params.get('fen');
if (fen) { try { game.load(fromFen(fen)); } catch (e) { alert(`Bad fen: ${(e as Error).message}`); } }
else if (saved) {
  const savedRules = saved.rules;
  const urlRules = preset || kings;
  const rulesDiffer = !!urlRules && !!savedRules && JSON.stringify(savedRules) !== JSON.stringify({ ...GAME_RULES });
  if (rulesDiffer) {
    // The URL names a rule set and the autosave played a different one. Replaying the moves would
    // reinterpret them, so keep the URL's fresh game and let the next save overwrite the old one.
    console.warn('kingdown: the autosave played different rules than the URL asks for; starting fresh');
  } else try {
    if (savedRules) setRules(savedRules); // before playLan: the moves must replay under their own rules
    if (saved.back) game.newGame(saved.back); else game.load(fromFen(saved.fen));
    game.playLan(saved.moves);
    resigned = saved.resigned ?? null;
  } catch { game.newGame(); } // a save from an older format: start fresh
}
orient();
view.sync(game.pos);
refresh();
if (!fen) save(); // pin the random back rank so a reload keeps this game
if (finished()) showOver(); else void maybeAi();
