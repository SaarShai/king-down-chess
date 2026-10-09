// Home for a returning player. Three homes on one set of data:
//   A. the table: the last board, with Continue under it (the game screen is the same board);
//   B. the six kings on their stage: a tap plays the king's power on a small part of the real board;
//   C. a Today card: today's eight figures, with Continue above it.
// The saved game is a real game: the kit's computer player played both sides (seed 3, Club against Casual).
import { createBoard, KD, figureArt } from '../../kit/board.js';
import { icon, pieceIcon, emblemArt, pieceArt } from '../../kit/icons.js';
import { $, $$, openSheet, closeSheet, toast, hideToast, wait, animate, prefersReducedMotion } from '../../kit/ui.js';

// ---- data ---------------------------------------------------------------------------------------

/** The saved game: army KRAAMONS. At ply 34 Black's archer has just shot White's rook; at ply 73 an Ogre shove mates. */
const SAVED_SEED = 3;
const SAVED = ['Of1>g2-h3', 'Ng8-h6', 'd2-d3', 'Nh6-g8', 'Me1<>f2', 'c7-c6', 'Ac1-d2', 'a7-a5', 'Ad2-c3', 'a5-a4', 'Ac3-c4', 'Me8<>d8', 'Ac4*c6', 'Md8<>e8', 'Ac4-b5', 'Me8<>d7', 'Ab5*d7', 'Of8>f7-f6', 'Ad1-d2', 'Of7-g6', 'Ad2-e3', 'Og6-h5', 'Ae3-f4', 'Oh5-g6', 'Af4*f6', 'a4-a3', 'b2xa3', 'Ad8-c7', 'Rb1-b4', 'Ka8-a7', 'Rb4-c4', 'Ac8-d8', 'Rc4xc7', 'Ad8*c7', 'Ab5-c5', 'Ka7-a6', 'Ac5-d5', 'Ad8-c7', 'Ad5-e6', 'b7-b5', 'Ae6*g6', 'Rb8-b6', 'Ae6-d5', 'Ka6-a7', 'Ad5*b5', 'e7-e6', 'Ad5*e6', 'h7-h5', 'Af4-g5', 'g7-g6', 'Ng1-f3', 'Ka7-b8', 'Og2>f3-e4', 'Kb8-c8', 'Sh1-g2', 'Ac7-b8', 'Sg2-g3', 'Rb6-a6', 'Ne4-c5', 'Ra6-a5', 'Ad5-e6', 'Kc8-c7', 'Ae6-e5', 'Kc7-c6', 'd3-d4', 'Kc6-d5', 'Ae5-e4', 'Kd5xd4', 'Nc5-b3', 'Kd4-c3', 'Ae4-e3', 'Kc3xc2', 'Of3>e2-d1'];
const START = KD.newGame({ army: 'random', seed: SAVED_SEED });
const upTo = n => SAVED.slice(0, n).reduce((s, lan) => KD.play(s, lan), START);
const IN_PLAY = upTo(34);
const FINISHED = upTo(SAVED.length);
const LEVEL = { id: 'casual', name: 'Casual' };

/** Today's army: the app seeds it with the local date (YYYYMMDD). The demo fixes the date: Thursday 8 October 2026. */
const TODAY_SEED = 20261008;
const TODAY_ARMY = KD.newGame({ army: 'random', seed: TODAY_SEED }).backRank;
const TODAY_LONG = 'Thursday 8 October';
const TODAY_SHORT = 'Thu 8 Oct';

const TYPE = { P: 'pawn', N: 'knight', B: 'bishop', R: 'rook', Q: 'queen', K: 'king', A: 'archer', L: 'paladin', G: 'guard', M: 'maester', S: 'beast', O: 'ogre' };
const NEW = new Set(['archer', 'paladin', 'guard', 'maester', 'beast', 'ogre']);
/** One line for each piece: the card lines of the fact sheet (12 words or fewer). */
const READ = {
  rook: 'Moves any distance in a straight line.',
  bishop: 'Moves any distance on a diagonal.',
  knight: 'Jumps in an L, over other pieces.',
  queen: 'Moves any distance, straight or on a diagonal.',
  king: 'Your king. Mate theirs to win.',
  archer: 'Shoots without moving, even over other pieces.',
  guard: 'Only a king can take it. It never takes.',
  maester: 'Swaps places with a friend next to it.',
  beast: 'After each bite, it can bite again.',
  ogre: 'Shoves a neighbour and steps into its place.',
  paladin: 'Jumps its own pieces. Taking more than a pawn costs it.',
};
const cap = s => s[0].toUpperCase() + s.slice(1);
/** "a Guard, a Beast and an Ogre" */
const listPieces = types => {
  const words = types.map(t => `${/^[aeiou]/.test(t) ? 'an' : 'a'} ${cap(t)}`);
  return words.length > 1 ? `${words.slice(0, -1).join(', ')} and ${words.at(-1)}` : words.join('');
};
const TODAY_NEW = [...new Set(TODAY_ARMY.split('').map(l => TYPE[l]).filter(t => NEW.has(t)))];
const TODAY_WITH = TODAY_NEW.length ? `with ${listPieces(TODAY_NEW)}` : '';

/**
 * The six kings, in stage order, each with its first power and a short scene on the real board.
 * The window shows files c to f and three ranks: ranks 3 to 5, or 2 to 4 when `top` is 'c4'.
 * Every scene is a legal position; every move is KD.legal.
 */
const KINGS = [
  { id: 'frost', name: 'Frost', power: 'Freeze', uses: 'Once a game', other: 'Ice Wall',
    line: 'Freeze an enemy piece (not the king), then make your move. That piece cannot move on its next turn.',
    fen: '7k/7p/8/2n5/8/3PK3/7P/8 w - - 0 1',
    steps: [
      { lan: '!F:c5', cap: 'Frost freezes the knight.', after: b => { b.mark('c5', 'glow', { colour: '96,160,255' }); b.figure('c5')?.classList.add('is-frozen'); } },
      { lan: 'd3-d4', cap: 'Then you move. The knight cannot move.' },
    ] },
  { id: 'flame', name: 'Flame', power: 'Strike', uses: 'Once a game', other: 'Haste',
    line: 'Move one piece like a queen, to an empty square. Not a pawn or the king.',
    fen: '7k/7p/8/8/8/2N1K3/7P/8 w - - 0 1',
    steps: [{ lan: 'Nc3-e5!', cap: 'The knight moves like a queen.' }] },
  { id: 'spirit', name: 'Spirit', power: 'Holy Light', uses: 'Always on', other: 'Mercy', top: 'c4',
    line: 'Enemy pawns cannot take your king. Nothing can take your pieces beside, in front of or behind it.',
    // Without the power, Rd4xd3 is legal; with Holy Light the engine does not allow it.
    fen: '7k/7p/8/8/3r4/3NK3/7P/8 b - - 0 1',
    steps: [
      { cap: 'Pieces on the four lit squares are safe.', fx: b => { b.mark(['d3', 'f3', 'e4', 'e2'], 'glow', { pop: true, from: 'e3', colour: '233,192,113' }); } },
      { cap: 'Their rook cannot take your knight.', fx: (b, me) => nudge(b, me, 'd4', 'd3'), motion: true, hold: 400 },
    ] },
  { id: 'shadow', name: 'Shadow', power: 'Death Touch', uses: 'Always on', other: 'Darkness',
    line: 'Your king takes without moving: an enemy next to it, or two squares away straight forward, back or sideways, over an empty square. It takes only this way.',
    fen: '7k/7p/8/4n3/8/4K3/7P/8 w - - 0 1',
    steps: [{ lan: 'Ke3*e5', cap: 'The king takes the knight from e3.' }] },
  { id: 'mud', name: 'Mud', power: 'March', uses: 'Always on', other: 'Leap',
    line: 'Any pawn can step two squares, from any rank.',
    fen: '7k/7p/8/8/8/3PK3/7P/8 w - - 0 1',
    steps: [{ lan: 'd3-d5', cap: 'A pawn on rank 3 steps two squares.' }] },
  { id: 'stratus', name: 'Stratus', power: 'Flight', uses: 'Once a game', other: 'Sacrifice',
    line: 'Move one piece to any empty square in your half. Not the king.',
    fen: '7k/7p/8/8/8/2A1K3/7P/8 w - - 0 1',
    steps: [{ lan: 'Ac3~f4', cap: 'The archer flies to f4.' }] },
];
// Stage places, in % of the stage: an arc, the two plain kings (Spirit and Shadow) in front.
// Each king's tap area is the middle half of its figure (home.css). These places keep each tap area off the
// painted parts of the other kings, so a tap opens the king that the player sees there.
const PLACE = [
  { x: 9.5, y: 33, s: 0.8, z: 1 }, { x: 25, y: 21, s: 0.9, z: 2 }, { x: 41, y: 11, s: 1, z: 3 },
  { x: 59, y: 11, s: 1, z: 3 }, { x: 75, y: 21, s: 0.9, z: 2 }, { x: 90.5, y: 33, s: 0.8, z: 1 },
];

// ---- words ----------------------------------------------------------------------------------------

/** A move in player words, present tense, eight words or fewer: "Their archer shoots your rook." */
function sayMove(story, before) {
  const me = story.side === 'w';
  const who = me ? 'Your' : 'Their', mine = me ? 'your' : 'their', foe = me ? 'their' : 'your';
  const p = story.piece, took = story.captured?.[0];
  let t;
  switch (story.kind) {
    case 'shoot': t = p === 'king' ? `${who} king takes ${foe} ${took} without moving` : `${who} archer shoots ${foe} ${took}`; break;
    case 'chain': t = `${who} beast bites ${story.captured.length === 2 ? 'twice' : `${story.captured.length} times`}`; break;
    case 'push': {
      const pushed = KD.board(before)[KD.sq.index(story.push.from)];
      t = `${who} ogre shoves ${pushed?.color === story.side ? mine : foe} ${story.push.piece}`;
      break;
    }
    case 'swap': t = `${who} maester swaps with ${mine} ${story.swap?.with ?? 'piece'}`; break;
    case 'promote': t = `${who} pawn becomes a ${story.promo === 'n' || story.promo === 'N' ? 'knight' : TYPE[String(story.promo).toUpperCase()] ?? story.promo}`; break;
    case 'power': t = story.text.replace(/\.$/, ''); break;
    default: t = took ? `${who} ${p} takes ${foe} ${took}` : `${who} ${p} moves to ${story.to}`;
  }
  return `${t}${story.mate ? '. Checkmate' : story.check ? '. Check' : ''}.`;
}

function lastStory(s) {
  if (!s?.history.length) return null;
  const before = KD.undo(s);
  return { story: KD.describe(before, s.history.at(-1).lan), before };
}

function result(s) {
  const st = KD.status(s), moves = Math.ceil(st.ply / 2);
  if (st.winner === 'w') return { line: 'You won by checkmate.', sub: `${moves} moves against ${LEVEL.name}.` };
  if (st.winner === 'b') return { line: 'The computer won this one.', sub: `${moves} moves against ${LEVEL.name}.` };
  return { line: 'A draw.', sub: `${moves} moves against ${LEVEL.name}.` };
}

// ---- the page ----------------------------------------------------------------------------------

const app = $('#app');
let game = IN_PLAY;          // the saved game (a KD state), or null: no game
let home = 'table';          // the home on show: table | kings | today
let mode = 'home';           // home | game (the table's board in play)
let run = 0;                 // a new state, play or reset stops the old one
let vrun = 0;                // the same, for the king scene
let picked = null;           // the king whose sheet is open

// Icons on the controls.
$('#t-menu').innerHTML = icon('menu');
$('#k-menu').innerHTML = icon('menu');
$('#c-menu').innerHTML = icon('menu');
$('#t-back').innerHTML = `${icon('back')}<span>Home</span>`;
$('#g-hint').innerHTML = `${icon('hint')}<span>Hint</span>`;
$('#g-undo').innerHTML = `${icon('undo')}<span>Undo</span>`;
$('#g-menu').innerHTML = `${icon('menu')}<span>Menu</span>`;
$('#g-prev').innerHTML = `${icon('back')}<span class="bar-word">Previous</span>`;
$('#g-next').innerHTML = `${icon('chevron')}<span class="bar-word">Next</span>`;
$('#vig-again').innerHTML = icon('play');
for (const b of $$('[data-close]')) b.innerHTML = icon('close');
$('#t-today').innerHTML = `<span><b>Today's army <span>· ${TODAY_SHORT}</span></b><span class="icons">${TODAY_ARMY.split('').map(l => pieceIcon(TYPE[l], 'w')).join('')}</span></span>${icon('chevron')}`;
$('#t-today').setAttribute('aria-label', `Today's army, ${TODAY_LONG}. The same army for everyone today.`);

// ---- A. the table's board: the home picture, and the game itself ----
const board = createBoard($('#t-board'), {
  play: { level: LEVEL.id, human: 'both', ms: 500, pause: 450 },
  label: 'King Down board against the computer. Arrow keys move, Enter or Space chooses, Escape cancels.',
  onMove(story) {
    if (mode !== 'game') return;
    game = board.state;
    writeLine(story, KD.undo(board.state), { fresh: true });
    $('#g-power').setAttribute('aria-pressed', 'false');
    renderGame(story);
  },
});
const boardEl = $('#t-board .kdb');
boardEl.tabIndex = -1;

// On the home, the board is a large Continue: a tap on it opens the game (and selects your piece).
$('#t-cover').addEventListener('click', e => {
  if (!game || KD.status(game).over) return;
  const i = board.squareAtPoint(e.clientX, e.clientY);
  const cell = i == null ? null : KD.board(game)[i];
  void enterGame({ select: cell?.color === 'w' ? KD.sq.name(i) : null });
});

function setLine(html, { fresh = false } = {}) {
  const el = $('#t-line');
  el.innerHTML = html;
  el.classList.remove('is-new');
  if (fresh && html) { void el.offsetWidth; el.classList.add('is-new'); }
}
function writeLine(story, before, opts) { setLine(`${pieceIcon(story.piece, story.side)}<span>${sayMove(story, before)}</span>`, opts); }
function setMain(el, label, sub) { el.innerHTML = sub ? `<span>${label}</span><small>${sub}</small>` : `<span>${label}</span>`; }

/** The table at home: the last board, its last move in words, one crimson action. */
function renderTable({ line = true } = {}) {
  const s = game, st = s && KD.status(s);
  const sub = $('#t-sub'), second = $('#t-second');
  $('#t-today').hidden = !s;
  second.hidden = true; sub.hidden = true;
  syncWarn();
  if (!s) {
    $('#t-title').textContent = "Today's army";
    $('#t-move').textContent = TODAY_SHORT;
    setLine(`${icon('sparkle')}<span>The same army for everyone today.</span>`);
    if (TODAY_WITH) { sub.hidden = false; sub.textContent = `${cap(TODAY_WITH)}.`; }
    setMain($('#t-main'), "Play today's army", `vs Computer · ${LEVEL.name}`);
    return;
  }
  $('#t-title').textContent = `vs Computer · ${LEVEL.name}`;
  if (st.over) {
    const r = result(s);
    $('#t-move').textContent = 'Finished';
    setLine(`${icon(st.winner === 'w' ? 'crown' : 'flag')}<span>${r.line}</span>`);
    sub.hidden = false; sub.textContent = r.sub;
    setMain($('#t-main'), 'Rematch', 'Same army, same level');
    second.hidden = false; second.innerHTML = `${icon('eye')}<span>Review last game</span>`;
    return;
  }
  $('#t-move').textContent = `Move ${st.moveNumber}`;
  const last = lastStory(s);
  if (line && last) writeLine(last.story, last.before); else setLine('');
  setMain($('#t-main'), 'Continue', board.isHuman(st.turn) || st.turn === 'w' ? 'Your move' : 'Their move');
}

/** Show the saved game (or today's army) on the table's board, as a still picture. */
function showTableBoard() {
  board.play.human = 'both';
  board.clearMarks('hint');
  if (!game) { board.setState(KD.newGame({ army: TODAY_ARMY })); board.clearMarks(); return; }
  board.setState(game);
  if (KD.status(game).over) {
    const loser = KD.board(game).find(c => c && c.type === 'king' && c.color !== KD.status(game).winner);
    if (loser && KD.status(game).winner) board.figure(loser.sq)?.classList.add('is-fallen');
  }
}

/** "Previously": the last move plays once when the table opens. A tap on Continue skips it. */
async function replayLast(me) {
  const last = lastStory(game);
  if (!last || KD.status(game).over) return;
  board.play.human = 'both';
  board.setState(last.before);
  setLine('');
  await wait(600, { instant: true });
  if (me !== run) return;
  await board.playMove(game.history.at(-1).lan);
  if (me !== run) return;
  writeLine(last.story, last.before, { fresh: true });
}

// ---- the game screen: the same board; the home part folds away, the bar comes in ----
async function swapParts(out, inn, instant) {
  if (!instant && !prefersReducedMotion()) {
    out.classList.add('is-leaving');
    await wait(120);
  }
  out.classList.remove('is-leaving'); out.hidden = true;
  inn.hidden = false; inn.classList.remove('is-coming');
  if (!instant) { void inn.offsetWidth; inn.classList.add('is-coming'); }
}

let returnTo = 'table';
let view = null;             // review: the ply on show (Previous and Next), or null: the live game
async function enterGame({ select = null, instant = false, keyboard = false, from = home } = {}) {
  if (mode === 'game' || !game || KD.status(game).over) return;
  run++;
  returnTo = from;
  view = null;
  mode = 'game';
  app.dataset.mode = 'game';
  if (home !== 'table') showView('table');
  if (board.state !== game) { board.play.human = 'both'; board.setState(game); }
  const last = lastStory(game);
  const k = game.kings?.[0]?.king;
  if (last) writeLine(last.story, last.before); else setLine(`${icon('sparkle')}<span>${k ? `A new game. Your king is ${k}.` : 'A new game. You play White.'}</span>`);
  $('#t-sub').hidden = true;
  $('.t-wordmark').hidden = true; $('#t-menu').hidden = true; $('#t-back').hidden = false;
  boardEl.tabIndex = 0;
  board.play.human = 'w';
  renderGame();
  const parts = swapParts($('#t-home'), $('#t-game'), instant);
  if (select) board.selectSquare(select);
  if (keyboard) boardEl.focus({ preventScroll: true });
  void board.maybeAi().then(() => renderGame());
  await parts;
}

async function leaveGame({ instant = false } = {}) {
  if (mode !== 'game') return;
  run++;
  if (view == null && board.state) game = board.state;   // in review the board shows a picture: the game is in `game`
  view = null;
  mode = 'home';
  app.dataset.mode = 'home';
  board.arm(null);
  showTableBoard();
  $('.t-wordmark').hidden = false; $('#t-menu').hidden = false; $('#t-back').hidden = true;
  boardEl.tabIndex = -1;
  renderTable();
  await swapParts($('#t-game'), $('#t-home'), instant);
  if (returnTo !== 'table') { showView(returnTo); renderHome(); }
  (returnTo === 'table' ? $('#t-main') : returnTo === 'kings' ? $('#k-main') : $('#c-main')).focus({ preventScroll: true });
}

const ARMED = new Set(['freeze', 'ward', 'strike', 'haste', 'flight', 'sacrifice']);
function myPower(s) {
  const k = s.kings?.[0];
  if (!k) return null;
  const tag = KD.POWER_TAG[k.power], left = KD.usesLeft(s, 'w');
  if (!ARMED.has(tag) || !left) return null;
  return { tag, name: KD.kings().find(x => x.king === k.king)?.powers.find(p => p.power === k.power)?.name ?? k.power, left };
}

function renderGame(story) {
  if (mode !== 'game' || !game) return;
  const s = game, st = KD.status(s), reviewing = view != null;
  const mine = !st.over && board.isHuman(st.turn);
  let text;
  if (reviewing) text = view ? `<span>Reviewing move ${Math.ceil(view / 2)}.</span>` : '<span>The start of the game.</span>';
  else if (st.over) text = `${icon(st.winner === 'w' ? 'crown' : 'flag')}<span>${result(s).line}</span>`;
  else if (!mine) text = '<span>The computer thinks.</span>';
  else if (story?.again) text = '<span>Now make your move.</span>';
  else text = `<span>${st.check ? 'Check. Your move.' : 'Your move.'}</span>`;
  $('#g-status').innerHTML = text;
  $('#t-move').textContent = st.over ? 'Finished' : `Move ${st.moveNumber}`;
  $('#g-hint').disabled = reviewing || !mine;
  $('#g-undo').disabled = reviewing || s.history.length < 2;
  // Previous waits for the computer's move; Next works only in review.
  $('#g-prev').disabled = reviewing ? view === 0 : !s.history.length || (!mine && !st.over);
  $('#g-next').disabled = !reviewing;
  $('#g-live').hidden = !reviewing;
  const pw = !reviewing && myPower(s), btn = $('#g-power');
  btn.hidden = !pw;
  if (pw) btn.innerHTML = `${icon('bolt')}<span>${pw.name} · ${pw.left}</span>`;
}

/** Review: show the board after ply n as a picture. At the last ply the live game comes back. */
function showPly(n) {
  board.arm(null);
  $('#g-power').setAttribute('aria-pressed', 'false');
  board.clearMarks('hint');
  let s = game;
  if (n >= game.history.length) {
    view = null;
    board.setState(game);
  } else {
    view = Math.max(0, n);
    while (s.history.length > view) s = KD.undo(s);
    board.setBoard(KD.board(s));
  }
  const last = lastStory(s);
  if (view != null && last) board.mark([last.story.from, last.story.to], 'last');
  if (last) writeLine(last.story, last.before); else setLine('');
  renderGame();
}
$('#g-prev').addEventListener('click', () => { if (game && !board.busy) showPly((view ?? game.history.length) - 1); });
$('#g-next').addEventListener('click', () => { if (view != null) showPly(view + 1); });
$('#g-live').addEventListener('click', () => { if (view != null) showPly(game.history.length); $('#g-prev').focus({ preventScroll: true }); });

$('#t-back').addEventListener('click', () => void leaveGame());
$('#g-undo').addEventListener('click', () => {
  const s = board.state;
  if (view != null || !s || s.history.length < 2 || board.busy) return;
  const plies = KD.status(s).turn === 'w' ? 2 : 1;
  board.undo(plies);
  game = board.state;
  const last = lastStory(game);
  if (last) writeLine(last.story, last.before); else setLine('');
  renderGame();
});
$('#g-hint').addEventListener('click', async () => {
  const s = board.state, st = s && KD.status(s);
  if (view != null || !s || st.over || !board.isHuman(st.turn) || board.busy) return;
  const me = run;
  $('#g-status').innerHTML = '<span>Looking for a good move.</span>';
  const m = await KD.think(s, { level: 'club', ms: 400 });
  if (me !== run || board.state !== s || !m) return;
  board.clearSelection(false);
  board.clearMarks('hint');
  board.mark([m.from, m.to], 'hint');
  const piece = KD.board(s)[KD.sq.index(m.from)]?.type ?? 'piece';
  $('#g-status').innerHTML = `${icon('hint')}<span>Hint: your ${piece} on ${m.from}.</span>`;
});
$('#g-power').addEventListener('click', () => {
  const pw = view == null && board.state && myPower(board.state), btn = $('#g-power');
  if (!pw) return;
  const on = btn.getAttribute('aria-pressed') !== 'true';
  btn.setAttribute('aria-pressed', String(on));
  board.arm(on ? pw.tag : null);
  $('#g-status').innerHTML = `<span>${on ? (pw.tag === 'freeze' ? 'Tap an enemy piece to freeze.' : 'Tap your piece, then a square.') : 'Your move.'}</span>`;
});

// The home actions of the table.
$('#t-main').addEventListener('click', e => {
  const s = game;
  if (!s) { startGame(KD.newGame({ army: TODAY_ARMY }), e); return; }
  if (KD.status(s).over) { startGame(KD.newGame({ army: s.backRank }), e); return; }
  void enterGame({ keyboard: e.detail === 0 });
});
$('#t-second').addEventListener('click', () => toast('Review opens the last game, move by move.'));
for (const id of ['#t-new', '#k-new', '#c-new']) $(id).addEventListener('click', () => toast('New game opens the setup sheet.'));
$('#t-today').addEventListener('click', () => { syncWarn(); openSheet('today-sheet'); });

function startGame(state, e) {
  run++;
  const from = home;           // Home goes back to the home that started the game
  game = state;
  if (home !== 'table') showView('table');
  showTableBoard();
  renderTable({ line: false });
  void enterGame({ keyboard: e?.detail === 0, from });
}

// ---- B. the six kings ----
const stageKings = $('#stage-kings');
stageKings.innerHTML = KINGS.map((k, i) => {
  const p = PLACE[i], back = i < 3, col = i % 3;   // phone: Frost, Flame, Spirit at the back; Shadow, Mud, Stratus in front
  return `<button type="button" class="king" data-king="${k.id}" aria-expanded="false" aria-haspopup="dialog"
    style="--x:${p.x};--y:${p.y};--s:${p.s};--z:${p.z};--px:${[18, 50, 82][col]};--py:${back ? 50 : 7};--ps:${back ? 0.82 : 1};--pz:${back ? 1 : 2}" aria-label="${k.name} king. See its power.">
    <img src="${pieceArt('king', 'w', k.id)}" alt=""><span class="king-name" aria-hidden="true">${k.name}</span></button>`;
}).join('');
stageKings.addEventListener('click', e => {
  const b = e.target.closest('.king');
  if (b) void openKing(b.dataset.king);
});

let kMini = null, cMini = null, vig = null;
const miniBoard = host => createBoard(host, { interactive: false, coords: false, sound: false });

function renderHome() {
  const s = game, st = s && KD.status(s);
  // B and C name the same game.
  const meta = !s ? `Today's army · ${TODAY_SHORT}` : st.over ? `${result(s).line.replace(/\.$/, '')} · ${result(s).sub.replace(/\.$/, '')}` : `vs Computer · ${LEVEL.name} · Move ${st.moveNumber}`;
  const mainLabel = !s ? ["Play today's army", ''] : st.over ? ['Rematch', 'Same army, same level'] : ['Continue', 'Your move'];
  if (home === 'kings') {
    kMini ??= miniBoard($('#k-mini'));
    setMain($('#k-main'), ...mainLabel);
    $('#k-meta').textContent = meta;
    paintMini(kMini);
  }
  if (home === 'today') {
    cMini ??= miniBoard($('#c-mini'));
    $('#c-continue').hidden = !s;
    if (s) {
      $('#c-opp').textContent = st.over ? result(s).line : `vs Computer · ${LEVEL.name}`;
      $('#c-move').textContent = st.over ? result(s).sub : `Move ${st.moveNumber} · Your move`;
      $('#c-main').textContent = st.over ? 'Rematch' : 'Continue';
      paintMini(cMini);
    }
  }
  if (home === 'table') renderTable();
  syncWarn();
}
function paintMini(b) {
  if (!game) { b.setState(KD.newGame({ army: TODAY_ARMY })); return; }
  b.setState(game);
}
for (const id of ['#k-main', '#c-main']) {
  $(id).addEventListener('click', e => {
    if (!game) return startGame(KD.newGame({ army: TODAY_ARMY }), e);
    if (KD.status(game).over) return startGame(KD.newGame({ army: game.backRank }), e);
    void enterGame({ keyboard: e.detail === 0 });
  });
}

// The king sheet: its power plays on a small part of the real board.
// The window is four files by three ranks. Above it is a dark edge (EDGE of a square high): the tall figures of
// the top rank stand up into it, and it covers the ranks above, so no cut row shows.
const EDGE = 0.4;
function fitVig() {
  if (!vig) return;
  const host = $('#vig-host'), top = picked?.top ?? 'c5';
  host.style.transform = '';
  const hr = host.getBoundingClientRect(), r = vig.squareRect(top);
  if (!r.width) return;
  host.style.transform = `translate(${(hr.left - r.left).toFixed(1)}px, ${(hr.top - r.top + r.height * EDGE).toFixed(1)}px)`;
  vigEdge.style.height = `${(8 - Number(top[1])) * 12.5}%`;
}
const vigEdge = Object.assign(document.createElement('div'), { className: 'vig-edge' });

async function openKing(id, { instant = false } = {}) {
  const k = KINGS.find(x => x.id === id);
  if (!k) return;
  picked = k;
  for (const b of $$('.king')) b.setAttribute('aria-expanded', String(b.dataset.king === id));
  $('#stage').classList.add('has-pick');
  $('#ks-emblem').src = emblemArt(k.id);
  $('#ks-title').textContent = k.name;
  $('#ks-power').textContent = k.power;
  $('#ks-uses').textContent = k.uses;
  $('#ks-line').textContent = k.line;
  $('#ks-play').textContent = `Play with ${k.name}`;
  syncWarn();
  $('#ks-other').textContent = `${k.name} has a second power: ${k.other}.`;
  $('#ks-cap').textContent = '';
  const dlg = $('#king-sheet');
  if (!dlg.open) openSheet(dlg);
  if (!vig) {
    vig = createBoard($('#vig-host'), { interactive: false, coords: false, sound: true });
    vig.layer.appendChild(vigEdge);
    new ResizeObserver(() => requestAnimationFrame(fitVig)).observe($('#vig'));
  }
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  fitVig();
  await playScene(k, { instant });
}

/** A piece tries for a square and stops short: Holy Light shelters the piece there. */
async function nudge(b, me, from, to) {
  const el = b.figure(from), a = b.squareRect(from), z = b.squareRect(to);
  if (!el) return;
  const dx = ((z.left - a.left) * 0.62).toFixed(1), dy = ((z.top - a.top) * 0.62).toFixed(1);
  const hit = wait(260, { instant: true }).then(() => (me === vrun ? b.burst(to, '233,192,113') : null));
  await Promise.all([
    animate(el, [{ transform: 'none' }, { transform: `translate(${dx}px, ${dy}px)`, offset: 0.45 }, { transform: 'none' }], { duration: 560, easing: 'ease-in-out', fill: 'none' }),
    hit,
  ]);
}

async function playScene(k, { instant = false } = {}) {
  const me = ++vrun, b = vig;
  b.setState(KD.fromFen(k.fen, { powers: [k.name, null] }));   // the king's first power
  b.clearMarks();
  for (const f of $$('#vig .is-frozen')) f.classList.remove('is-frozen');
  if (instant) {
    const s = k.steps.reduce((st, x) => (x.lan ? KD.play(st, x.lan) : st), b.state);
    b.setState(s);
    for (const x of k.steps) { x.after?.(b); if (x.fx && !x.motion) x.fx(b, me); }
    $('#ks-cap').textContent = k.steps.at(-1).cap;
    return;
  }
  await wait(450, { instant: true });
  for (const x of k.steps) {
    if (me !== vrun) return;
    if (x.lan) await b.playMove(x.lan);
    if (me !== vrun) return;
    if (x.fx) await x.fx(b, me);
    x.after?.(b);
    $('#ks-cap').textContent = x.cap;
    await wait(x.hold ?? 900, { instant: true });
  }
}
$('#vig-again').addEventListener('click', () => { if (picked) void playScene(picked); });
$('#king-sheet').addEventListener('close', () => {
  vrun++;
  picked = null;
  for (const b of $$('.king')) b.setAttribute('aria-expanded', 'false');
  $('#stage').classList.remove('has-pick');
});
$('#ks-play').addEventListener('click', async e => {
  const k = picked;
  if (!k) return;
  await closeSheet('king-sheet');
  startGame(KD.newGame({ army: 'random', powers: [k.name, null] }), e);
});

// ---- C. the Today card (also the sheet behind A's Today line) ----
function todayCard(host, headId) {
  const types = TODAY_ARMY.split('').map(l => TYPE[l]);
  host.innerHTML = `
    <div class="tc-head"><h2 id="${headId}">Today's army</h2><p class="tc-date">${TODAY_LONG}</p></div>
    <div class="rank" role="group" aria-label="Today's army, from left to right">
      ${types.map((t, i) => {
        const { src, box } = figureArt({ type: t, color: 'w' });
        const style = box ? `left:${box.left * 100}%;top:${box.top * 100}%;width:${box.width * 100}%;height:${box.height * 100}%` : '';
        return `<button type="button" class="rank-sq" style="--i:${i}" data-type="${t}" aria-pressed="false" aria-label="${cap(t)}"><img src="${src}" alt="" style="${style}"${box?.mirror ? ' class="mirror"' : ''}></button>`;
      }).join('')}
    </div>
    <p class="tc-read is-hint" aria-live="polite">Tap a figure to read it.</p>
    <div class="tc-foot">
      <p>The same army for everyone today${TODAY_WITH ? `, ${TODAY_WITH}` : ''}.</p>
      <div class="tc-play">
        <button type="button" class="btn btn-wide" data-play-today aria-describedby="${headId}-warn">Play today's army</button>
        <p class="warn-line" id="${headId}-warn" hidden></p>
      </div>
    </div>`;
  host.addEventListener('click', e => {
    const sq = e.target.closest('.rank-sq');
    if (sq) { readFigure(host, sq); return; }
    if (e.target.closest('[data-play-today]')) {
      const fromSheet = host.closest('dialog');
      (fromSheet ? closeSheet(fromSheet) : Promise.resolve()).then(() => startGame(KD.newGame({ army: TODAY_ARMY }), e));
    }
  });
}
function readFigure(host, sq) {
  const on = sq.getAttribute('aria-pressed') !== 'true';
  for (const b of host.querySelectorAll('.rank-sq')) b.setAttribute('aria-pressed', 'false');
  const read = host.querySelector('.tc-read');
  if (!on) { read.classList.add('is-hint'); read.textContent = 'Tap a figure to read it.'; return; }
  sq.setAttribute('aria-pressed', 'true');
  const t = sq.dataset.type;
  read.classList.remove('is-hint');
  read.innerHTML = `${pieceIcon(t, 'w')}<span><b>${cap(t)}</b> · ${READ[t]}</span>`;
}
todayCard($('#c-card'), 'c-today-title');
todayCard($('#ts-body').appendChild(Object.assign(document.createElement('section'), { className: 'card today-card' })), 'ts-today-title');
$('#ts-body .today-card').setAttribute('aria-labelledby', 'ts-title');

/** A start button that replaces a game in play says so, in one quiet line under it. */
function syncWarn() {
  const st = game && KD.status(game);
  const text = st && !st.over ? `This ends your game at move ${st.moveNumber}.` : '';
  for (const el of $$('.warn-line')) { el.textContent = text; el.hidden = !text; }
}

// ---- the menu: the folded places ----
const MENU = [['book', 'Learn the new pieces'], ['help', 'Guide'], ['sparkle', 'Workshop'], ['settings', 'Settings'], ['users', 'Account']];
$('#ms-body').innerHTML = `<div class="menu-rows">${MENU.map(([i, n]) => `<button type="button" class="row" data-item="${n}">${icon(i)}<span>${n}</span></button>`).join('')}</div>`;
$('#ms-body').addEventListener('click', async e => {
  const b = e.target.closest('[data-item]');
  if (!b) return;
  await closeSheet('menu-sheet');
  toast(`${b.dataset.item} is not part of this demo.`);
});
for (const id of ['#t-menu', '#k-menu', '#c-menu', '#g-menu']) $(id).addEventListener('click', () => openSheet('menu-sheet'));

// ---- views and the demo contract ----
function showView(name) {
  home = name;
  app.dataset.home = name;
  $('#v-table').hidden = name !== 'table';
  $('#v-kings').hidden = name !== 'kings';
  $('#v-today').hidden = name !== 'today';
}

async function closeAll() {
  hideToast();
  for (const d of $$('dialog[open]')) { d.classList.remove('is-closing'); d.close(); }
  for (const card of [$('#c-card'), $('#ts-body')]) {
    for (const b of card.querySelectorAll('.rank-sq')) b.setAttribute('aria-pressed', 'false');
    const read = card.querySelector('.tc-read');
    read.classList.add('is-hint'); read.textContent = 'Tap a figure to read it.';
  }
}

/** Put the page at a home, with no game screen, in one still frame. */
async function atHome(name, state) {
  run++; vrun++;
  await closeAll();
  game = state;
  mode = 'home';
  app.dataset.mode = 'home';
  $('#t-game').hidden = true; $('#t-home').hidden = false;
  $('#t-game').classList.remove('is-coming', 'is-leaving'); $('#t-home').classList.remove('is-coming', 'is-leaving');
  $('.t-wordmark').hidden = false; $('#t-menu').hidden = false; $('#t-back').hidden = true;
  boardEl.tabIndex = -1;
  showView(name);
  showTableBoard();
  renderTable();
  renderHome();
}

const frames = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

window.demo = {
  async state(name) {
    switch (name) {
      case 'table': await atHome('table', IN_PLAY); break;
      case 'continued': await atHome('table', IN_PLAY); await enterGame({ instant: true }); board.play.human = 'both'; break;
      case 'table-finished': await atHome('table', FINISHED); break;
      case 'table-empty': await atHome('table', null); break;
      case 'kings': await atHome('kings', IN_PLAY); break;
      case 'king-tap': await atHome('kings', IN_PLAY); await openKing('frost', { instant: true }); break;
      case 'today': {
        await atHome('today', IN_PLAY);
        readFigure($('#c-card'), $('#c-card .rank-sq[data-type="beast"]'));
        break;
      }
      default: throw new Error(`demo.state: no state "${name}"`);
    }
    await frames();
  },

  // The table remembers: the last move plays once, Continue opens the game on the same board,
  // you play, the computer answers, Home shows the table again. Then the kings' stage: Frost's power.
  async play() {
    await atHome('table', IN_PLAY);
    const me = run;
    await replayLast(me);
    if (me !== run) return;
    await wait(1400, { instant: true });
    if (me !== run) return;
    await press($('#t-main'));
    await enterGame();
    const me2 = run;
    board.play.human = 'both';
    await wait(800, { instant: true });
    if (me2 !== run) return;
    board.selectSquare('b5');   // the archer: its steps, and the crosshair of its shot over b7
    await wait(1000, { instant: true });
    if (me2 !== run) return;
    await board.playMove('Ab5-c5');   // the move the game played next
    if (me2 !== run) return;
    board.play.human = 'w';
    renderGame();
    await board.maybeAi();
    if (me2 !== run) return;
    renderGame();
    await wait(1300, { instant: true });
    if (me2 !== run) return;
    await press($('#t-back'));
    await leaveGame();
    const me3 = run;
    await wait(1600, { instant: true });
    if (me3 !== run) return;
    await atHome('kings', game);
    const me4 = run;
    await wait(900, { instant: true });
    if (me4 !== run) return;
    await openKing('frost');
    await wait(1200, { instant: true });
  },

  async reset() {
    await atHome('table', IN_PLAY);
    const me = run;
    void replayLast(me).then(() => { if (me === run) board.play.human = 'w'; });   // it shows the frame before the shot at once
  },
};

/** A short press on a control, so a viewer of the scripted run sees what is tapped. */
async function press(el) {
  el.focus({ preventScroll: true });
  if (prefersReducedMotion()) return;
  await animate(el, [{ transform: 'none' }, { transform: 'translateY(2px) scale(.98)' }, { transform: 'none' }], { duration: 260, easing: 'ease-out' });
}

// The first open: "Previously", the last move plays once.
void window.demo.reset();
