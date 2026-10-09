// The recommended app: one playable prototype of the whole journey.
// Title → first shot → New game → muster → game (real rules, real computer) → result → Rematch.
// Look: Quiet Table on parchment. Joy: Warm. The kit gives the board, the rules and the parts.
import { createBoard, KD, figureArt } from '../../kit/board.js';
import { icon, pieceIcon, pieceArt, emblemArt, workshopArt } from '../../kit/icons.js';
import { $, $$, openSheet, closeSheet, toast, hideToast, sfx, animate, wait, prefersReducedMotion } from '../../kit/ui.js';

// ============================================================================================
// Facts and words (docs/RULES.md, research/king-down-facts.md). Lines in play: eight words or fewer.
// ============================================================================================

const NAME = { pawn: 'Pawn', knight: 'Knight', bishop: 'Bishop', rook: 'Rook', queen: 'Queen', king: 'King', archer: 'Archer', paladin: 'Paladin', guard: 'Guard', maester: 'Maester', beast: 'Beast', ogre: 'Ogre' };
const RULE = {
  pawn: 'Steps forward. Takes on a forward diagonal.',
  knight: 'Jumps in an L shape.',
  bishop: 'Slides along the diagonals.',
  rook: 'Slides in straight lines.',
  queen: 'Slides in any straight line or diagonal.',
  king: 'Steps one square. Keep it safe.',
  archer: 'Shoots without moving, even over other pieces.',
  guard: 'Never takes. Only a king can take it.',
  maester: 'Swaps places with a friend next to it.',
  beast: 'After each bite, it can bite again.',
  ogre: 'Shoves a neighbour and steps into its place.',
  paladin: 'Jumps friends. Taking a non-pawn costs it.',
};
const MORE = {
  pawn: 'No en passant. It promotes to a queen, rook, bishop or knight.',
  king: 'No castling. A Maester can swap with it.',
  archer: 'Steps one square. Never takes by moving.',
  guard: 'Steps one square onto an empty square.',
  maester: 'Steps one square, and takes an enemy next to it.',
  beast: 'Steps one square, and takes an enemy next to it.',
  ogre: 'Steps and takes one square in any direction.',
  paladin: 'Moves like a queen. It never takes a king.',
};
const NEW_TYPES = ['archer', 'guard', 'maester', 'beast', 'ogre', 'paladin'];
const VALUE = { pawn: 1, guard: 1, knight: 3, bishop: 3, maester: 3, ogre: 3, beast: 4, paladin: 4, archer: 5, rook: 5, queen: 9, king: 0 };
const LEVELS = [['beginner', 'Beginner'], ['casual', 'Casual'], ['club', 'Club'], ['strong', 'Strong']];
const LEVEL_NAME = Object.fromEntries(LEVELS);
const THINK_MS = { beginner: 500, casual: 600, club: 800, strong: 1500 };
const KINGS = ['Frost', 'Flame', 'Stratus', 'Mud', 'Spirit', 'Shadow'];
const KING_POWERS = { Frost: ['Freeze', 'IceWall'], Flame: ['Strike', 'Haste'], Stratus: ['Flight', 'Sacrifice'], Mud: ['March', 'Leap'], Spirit: ['HolyLight', 'Mercy'], Shadow: ['DeathTouch', 'Darkness'] };
const POWER = {
  Freeze: { name: 'Freeze', tag: 'freeze', uses: '1 use', line: 'Freeze an enemy piece (not the king). It cannot move next turn. Then you move.', armed: 'Freeze: tap an enemy piece.' },
  IceWall: { name: 'Ice Wall', tag: 'ward', uses: '2 uses', line: 'Wall one of your pieces (not the king): nothing can take it next turn. Then you move.', armed: 'Ice Wall: tap one of your pieces.' },
  Strike: { name: 'Strike', tag: 'strike', uses: '1 use', line: 'Move one piece like a queen, to an empty square. Not a pawn or the king.', armed: 'Strike: tap a piece, then a square.' },
  Haste: { name: 'Haste', tag: 'haste', uses: '1 use', line: 'Move one piece twice in one turn. The second move is optional. Neither move takes.', armed: 'Haste: tap a piece, then a square.' },
  Flight: { name: 'Flight', tag: 'flight', uses: '1 use', line: 'Move any piece but the king to an empty square in your half.', armed: 'Flight: tap a piece, then a square.' },
  Sacrifice: { name: 'Sacrifice', tag: 'sacrifice', uses: '1 use', line: 'Turn one of your pawns into a piece you lost (not a pawn or a guard).', armed: 'Sacrifice: tap one of your pawns.' },
  March: { name: 'March', uses: 'Always on', line: 'Any pawn may step two squares, from any rank.' },
  Leap: { name: 'Leap', uses: '3 uses', line: 'Your rooks, bishops and queens pass over your own pawns.' },
  HolyLight: { name: 'Holy Light', uses: 'Always on', line: 'Enemy pawns cannot take your king. Your pieces beside, in front of or behind it are safe.' },
  Mercy: { name: 'Mercy', uses: 'Always on', line: 'Your king steps up to two and jumps your pieces; it takes only pawns and guards. Only pawns take pieces next to it.' },
  DeathTouch: { name: 'Death Touch', uses: 'Always on', line: 'Your king takes without moving: next to it, or two away straight forward, back or sideways, over an empty square. It takes only this way.' },
  Darkness: { name: 'Darkness', uses: 'Always on', line: 'Your pawns may also step diagonally forward; they take only straight ahead. Your king may step two in a straight line, over an empty square, to an empty square.' },
};

// The shared positions (idea bank 6.1). P1 is one Black move earlier, so the last move is "e7 to e6".
const P1_PRE = 'r1b2mk1/2p1p1pp/1a6/pp1o4/2g1S3/A1OP4/PP1G1PPP/R1B2MK1 b - - 0 11';
// A line from P1 (the real computer at Club played the moves after the swap): a shot, Strike with check, a swap, takes, Freeze.
const STORY_LINE = ['e7-e6', 'Aa3*a5', 'Ab6-e3!', 'Mf1<>g1', 'Od5xe4', 'f2xe3', 'Ra8xa3', 'b2xa3', 'Oe4-d5', '!F:d5', 'e3-e4', 'b5-b4'];
// A whole game against Beginner on the first deal (army AQBKSNMR): White mates on move 40.
const WIN_GAME = ['Mg1<>d1', 'Mg8<>d8', 'a2-a3', 'b7-b5', 'Aa1-a2', 'a7-a6', 'Aa2-b3', 'a6-a5', 'Ab3*b5', 'Md8<>e8', 'Md1<>e2', 'd7-d6', 'Ab3-c3', 'g7-g5', 'Ac3*a5', 'f7-f5', 'Ac3-b4', 'c7-c6', 'd2-d3', 'c6-c5', 'Ab4*c5', 'g5-g4', 'Ab4*d6', 'Qb8-b5', 'c2-c4', 'Qb5-d7', 'Ab4-b5', 'Qd7-a7', 'Bc1-e3', 'Qa7-b8', 'Ab5-b6', 'Qb8-b7', 'Ab6*d8', 'Me8<>g8', 'Ab6-b5', 'Qb7-b8', 'b2-b3', 'h7-h6', 'Qb1-c1', 'h6-h5', 'Be3-f4', 'Qb8-b6', 'Nf1-e3', 'Qb6-f6', 'Ne3-d5', 'Mg8<>f8', 'Nd5xf6', 'Ng8xf6', 'Qc1-e3', 'g4-g3', 'Qe3-f3', 'Bc8-b7', 'Ab5*b7', 'g3xh2', 'Rh1xh2', 'Aa8-a7', 'Qf3-a8', 'Mf8<>e8', 'Qa8xa7', 'Me8<>f8', 'Ab5-c6', 'Ke8-f7', 'Ac6-d6', 'Kf7-g6', 'Ad6-e6', 'Kg6-g7', 'Ae6-e5', 'Kg7-f7', 'Ae5*e7', 'Nf6-d7', 'Qa7xd7', 'Mf8<>f7', 'Qd7-c8', 'Mf7-e8', 'Qc8xf5', 'Me8-f7', 'Ae5-e6', 'Rh8-g8', 'Qf5xf7'];
const FIRST_SEED = 34; // the first deal holds an Archer and a Beast (idea bank 3.2, owner check)
// The first shot: the Archer on d3 shoots the knight on d5 over a row of pawns.
const LESSON_FEN = '7k/8/8/3n4/2PPP3/3A4/8/K7 w - - 0 1';

const todaySeed = () => { const d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); };
const todayArmy = () => KD.newGame({ army: 'random', seed: todaySeed() }).backRank;
const LETTER = { P: 'pawn', N: 'knight', B: 'bishop', R: 'rook', Q: 'queen', K: 'king', A: 'archer', L: 'paladin', G: 'guard', M: 'maester', S: 'beast', O: 'ogre' };

// ============================================================================================
// State
// ============================================================================================

const STORE = 'kd-proto-v1';
const saved = (() => { try { return JSON.parse(localStorage.getItem(STORE) || '{}'); } catch { return {}; } })();
const S = {
  view: null,
  setup: { mode: 'computer', level: 'beginner', side: 'w', army: 'random', king: 'Frost', power: 'Freeze', ...(saved.setup || {}) },
  games: saved.games || 0,
  game: null,       // the game on the table
  review: null,     // the ply shown in review (-1 = the start), or null
  reading: null,    // { sq, by: 'tap' | 'hold' | 'hover' }
  msg: null,        // a short message that stays until the next tap or move
  hintToken: 0,
  musterAnims: [],
  dots: [],         // first-sight dots: { sq, type, color }
};
function persist() {
  const g = S.game;
  const data = { setup: S.setup, games: S.games };
  if (g && !g.demo) data.saved = { game: KD.serialize(g.states.at(-1)), setup: g.setup, human: g.human, base: g.base, over: g.over, resigned: g.resigned || null };
  try { localStorage.setItem(STORE, JSON.stringify(data)); } catch { /* private mode */ }
}

// ============================================================================================
// Small helpers
// ============================================================================================

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const idx = sq => KD.sq.index(sq);
const cellAt = (s, sq) => KD.board(s)[idx(sq)];
const other = c => (c === 'w' ? 'b' : 'w');
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const reduced = () => prefersReducedMotion();
const kingsSpec = s => s.kings.map(k => (k ? `${k.king}:${k.power}` : null));
const twice = n => (n === 2 ? 'twice' : `${n} times`);

/** The same position with the other side to move: to read a piece whose side does not move now. */
function flipped(s, side) {
  const f = KD.toFen(s).split(' ');
  f[1] = side;
  try { return KD.fromFen(f.join(' '), { powers: kingsSpec(s) }); } catch { return null; }
}
/** Every move a piece could make, whoever is to move (a hold reads, it never plays). */
function reachOf(s, sq) {
  const c = cellAt(s, sq);
  if (!c) return [];
  if (KD.status(s).turn === c.color) return KD.legal(s, sq);
  const t = flipped(s, c.color);
  return t ? KD.legal(t, sq) : [];
}
/** The pieces of `side` that attack a square (the cause of a check). */
function attackersOf(s, sq, side) {
  const t = flipped(s, side);
  if (!t) return [];
  return [...new Set(KD.legal(t).filter(m => m.captures.includes(sq)).map(m => m.from))];
}

/** Who a move belongs to, in words. */
function owner(side, g = S.game) {
  if (!g || g.mode === 'two') return side === 'w' ? 'White' : 'Black';
  return side === g.human ? 'Your' : 'Their';
}
/** A move as one short sentence with a true verb (the story voice). */
function sentence(st, g = S.game, pre = null) {
  const W = owner(st.side, g), p = st.piece, c0 = st.captured[0], on = st.capturedOn[0];
  let t;
  switch (st.kind) {
    case 'shoot': t = `${W} archer shoots the ${c0} on ${on}`; break;
    case 'chain': t = `${W} beast bites ${twice(st.captured.length)}: ${st.captured.join(', then ')}`; break;
    case 'push': t = `${W} ogre shoves the ${st.push.piece} to ${st.push.to}`; break;
    case 'swap': t = `${W} ${p} swaps with the ${st.swap.with}`; break;
    case 'promote': t = `${W} pawn becomes a ${st.promo} on ${st.to}`; break;
    case 'capture': t = `${W} ${p} takes the ${c0} on ${on}${st.leaves ? ' and leaves' : ''}`; break;
    case 'pass': t = `${W} turn ends`; break;
    case 'power': {
      const tag = st.powerTag, target = pre ? cellAt(pre, st.to) : null;
      if (tag === 'freeze') t = `${W} king freezes the ${target?.type ?? 'piece'} on ${st.to}`;
      else if (tag === 'ward') t = `${W} king walls the ${target?.type ?? 'piece'} on ${st.to}`;
      else if (tag === 'sacrifice') t = `${W} pawn returns as a ${st.promo ?? 'piece'}`;
      else t = `${W} ${p} ${{ strike: 'strikes', haste: 'hastes', flight: 'flies' }[tag] ?? 'goes'} to ${st.to}`;
      break;
    }
    default: {
      const verb = p === 'knight' ? 'jumps' : ['bishop', 'rook', 'queen', 'paladin'].includes(p) ? 'goes' : 'steps';
      t = `${W} ${p} ${verb} to ${st.to}`;
    }
  }
  if (W === 'White' || W === 'Black') t = t.replace(/^(White|Black) /, '$1 ');
  return t;
}
const tail = st => (st.mate ? ' · Checkmate' : st.check ? ' · Check' : '');

const VERB_SVG = {
  shoot: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="6"/><path d="M12 2v5M12 17v5M2 12h5M17 12h5"/></svg>',
  push: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 6l6 6-6 6M12 6l6 6-6 6"/></svg>',
  swap: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h14l-4-4M20 15H6l4 4"/></svg>',
  power: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2.5 5 13.5h6l-1 8 8-11h-6z"/></svg>',
  capture: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5 5 19"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 18h16M4 18 3 8l5 4 4-6 4 6 5-4-1 10"/></svg>',
};
function verbChip(st) {
  if (st.mate) return `<span class="verb verb-mate" title="Checkmate">${VERB_SVG.check}</span>`;
  if (st.check) return `<span class="verb verb-check" title="Check">${VERB_SVG.check}</span>`;
  if (st.kind === 'shoot') return `<span class="verb verb-shoot" title="Shot">${VERB_SVG.shoot}</span>`;
  if (st.kind === 'chain') return `<span class="verb verb-shoot" title="Bites">×${st.captured.length}</span>`;
  if (st.kind === 'push') return `<span class="verb verb-push" title="Shove">${VERB_SVG.push}</span>`;
  if (st.kind === 'swap') return `<span class="verb verb-swap" title="Swap">${VERB_SVG.swap}</span>`;
  if (st.kind === 'power') return `<span class="verb verb-power" title="${esc(st.power)}">${VERB_SVG.power}</span>`;
  if (st.captured.length) return `<span class="verb" title="Take">${VERB_SVG.capture}</span>`;
  return '';
}
const isEvent = st => ['shoot', 'chain', 'push', 'swap', 'power'].includes(st.kind) || st.check || st.mate;

/** Up to three moves to look at again: the mate and the biggest takes (the app finds them with its engine). */
function keyMoments(g) {
  const out = [];
  g.stories.forEach((st, i) => {
    if (i < g.base) return;
    const v = st.captured.reduce((a, t) => a + (VALUE[t] ?? 0), 0);
    if (st.mate) out.push({ i, v: 100 });
    else if (v >= 3) out.push({ i, v });
  });
  return out.sort((a, b) => b.v - a.v || a.i - b.i).slice(0, 3).sort((a, b) => a.i - b.i).map(k => k.i);
}

// ============================================================================================
// Views and routing
// ============================================================================================

const VIEWS = ['title', 'lesson', 'home', 'game'];
function go(view) {
  S.view = view;
  for (const v of VIEWS) $(`#v-${v}`).hidden = v !== view;
  try { history.replaceState(null, '', `#${view}`); } catch { /* sandboxed */ }
  if (view === 'game') board.layout();
  if (view === 'lesson') lessonBoard.layout();
  if (view === 'home') homeBoard.layout();
  if (view === 'title') { const t = $('#v-title'); t.classList.remove('is-entering'); void t.offsetWidth; t.classList.add('is-entering'); }
}
function closeAllSheets() {
  for (const d of $$('dialog[open]')) { d.classList.remove('is-closing'); d.close(); }
}
async function swapSheet(from, to) {
  const f = $(`#${from}`);
  if (f?.open) { f.classList.remove('is-closing'); f.close(); }
  openSheet(to);
}

// ============================================================================================
// Title and the first shot
// ============================================================================================

const LINEUP = [['pawn', 'b', 0.74], ['knight', 'w', 0.79], ['bishop', 'b', 0.87], ['rook', 'w', 0.96], ['queen', 'b', 0.79], ['king', 'w', 0.81], ['archer', 'b', 0.72], ['paladin', 'w', 0.86], ['guard', 'b', 0.78], ['maester', 'w', 0.66], ['beast', 'b', 0.87], ['ogre', 'w', 1]];
$('#lineup').innerHTML = LINEUP.map(([t, c, h], i) => `<li style="--h:${h};--i:${i}"><img src="${pieceArt(t, c)}" alt="" decoding="async"><span>${pieceIcon(t)}${NAME[t]}</span></li>`).join('');
$('#t-shot').innerHTML = `${icon('target')}<span>Take your first shot</span>`;
$('#t-play').innerHTML = `${icon('play')}<span>Play</span>`;
$('#t-shot').addEventListener('click', () => startLesson());
$('#t-play').addEventListener('click', () => openNewGame());
$('#t-workshop').addEventListener('click', () => { renderExtra('workshop'); openSheet('sheet-extra'); });

let lessonDone = false;
const lessonBoard = createBoard($('#lesson-board'), {
  play: { level: 'beginner', human: 'both' },
  label: 'Lesson board. Your archer is on d3. Arrow keys move, Enter chooses.',
  onTap(sq, cell) {
    if (lessonDone) return false;
    if (cell?.type === 'archer' && cell.color === 'w') return; // the kit selects her
    if (lessonBoard.selected != null && sq === 'd5') return;    // the shot
    lessonLine(lessonBoard.selected == null ? 'Tap your archer first.' : 'Now tap the knight behind the pawns.', 'target');
    return false;
  },
  onSelect(sq) { if (sq && !lessonDone) lessonLine('Now tap the knight behind the pawns.', 'target'); },
  onMove(story) { lessonDone = true; lessonShot(story); },
});
$('#lesson-back').innerHTML = icon('back');
$('#lesson-back').addEventListener('click', () => go(S.game && !S.game.demo ? 'home' : 'title'));
$('#lesson-play').addEventListener('click', () => startGame({ mode: 'computer', level: 'beginner', side: 'w', army: 'random' }, { seed: FIRST_SEED }));
$('#lesson-again').addEventListener('click', () => startLesson());
function lessonLine(text, ic = 'target', strong = '') {
  const el = $('#lesson-line');
  el.innerHTML = `<span class="ctx-icon">${icon(ic)}</span><span class="ctx-text">${strong ? `<b>${esc(strong)}</b> ` : ''}${esc(text)}</span>`;
}
function startLesson() {
  lessonDone = false;
  go('lesson');
  lessonBoard.setState(KD.fromFen(LESSON_FEN));
  clearLines(lessonBoard);
  lessonBoard.mark('d5', 'glow', { colour: '214,52,40' });
  $('#lesson-actions').hidden = true;
  lessonLine('Tap your archer, then the knight.', 'target');
}
function lessonShot(story) {
  lessonBoard.clearMarks('glow');
  causeLine(lessonBoard, story.from, story.capturedOn[0], 'shot');
  lessonLine('It stays on its square.', 'check', 'A clean shot.');
  $('#lesson-actions').hidden = false;
  $('#lesson-play').focus({ preventScroll: true });
}

// ============================================================================================
// Home
// ============================================================================================

const homeBoard = createBoard($('#home-board'), { interactive: false, coords: false });
$('#home-menu').innerHTML = icon('menu');
$('#home-menu').addEventListener('click', () => openMenu());
$('#home-new').innerHTML = `${icon('plus')}<span>New game</span>`;
$('#home-new').addEventListener('click', () => openNewGame());
$('#today-play').addEventListener('click', () => openNewGame({ army: 'today' }));
$('#home-continue').addEventListener('click', () => {
  const g = S.game;
  if (!g) return;
  if (g.over) return rematch();
  showGame();
});
function renderHome() {
  const g = S.game;
  if (g) {
    const live = g.states.at(-1), st = KD.status(live);
    homeBoard.flip(g.human === 'b');
    homeBoard.setState(live);
    $('#home-continue').innerHTML = `${icon(g.over ? 'swords' : 'play')}<span>${g.over ? 'Rematch' : 'Continue'}</span>`;
    const whose = g.over ? resultWords(g).title : g.mode === 'two' ? `${st.turn === 'w' ? 'White' : 'Black'} to move` : st.turn === g.human ? 'Your move' : 'Their move';
    $('#home-sub').textContent = `${whose} · ${g.mode === 'two' ? 'Two players' : g.mode === 'powers' ? `Kings' powers · ${LEVEL_NAME[g.setup.level]}` : LEVEL_NAME[g.setup.level]}`;
  }
  $('.home-table').hidden = !g;
  const army = todayArmy();
  $('#today-date').textContent = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  $('#today-row').innerHTML = [...army].map(l => `<li><img src="${pieceArt(LETTER[l], 'w')}" alt="${NAME[LETTER[l]]}"></li>`).join('');
}
function showHome() { renderHome(); go('home'); }

// ============================================================================================
// New game
// ============================================================================================

let draft = null;
function openNewGame(over = {}) {
  draft = { ...S.setup, ...over };
  if (S.games === 0) draft.level = 'beginner';
  renderNewGame();
  $('#more').hidden = draft.army === 'random' && draft.side === 'w';
  $('#more-toggle').setAttribute('aria-expanded', String(!$('#more').hidden));
  $('#new-note').hidden = !(S.game && !S.game.over && !S.game.demo);
  closeAllSheets();
  openSheet('sheet-new');
}
const chip = (group, value, label, on) => `<button type="button" class="chip" role="radio" aria-checked="${on}" aria-pressed="${on}" data-group="${group}" data-value="${value}">${label}</button>`;
function renderNewGame() {
  for (const r of $$('input[name="mode"]')) r.checked = r.value === draft.mode;
  $('#f-level').hidden = draft.mode === 'two';
  $('#f-king').hidden = draft.mode !== 'powers';
  $('#level-pick').innerHTML = LEVELS.map(([v, l]) => chip('level', v, l, draft.level === v)).join('');
  $('#side-pick').innerHTML = draft.mode === 'two' ? '<p class="muted small">White moves first. Pass the device after each move.</p>' : [['w', 'White'], ['b', 'Black']].map(([v, l]) => chip('side', v, l, draft.side === v)).join('');
  $('#army-pick').innerHTML = [['random', 'Random army'], ['today', "Today's army"], ['chess', 'Chess army']].map(([v, l]) => chip('army', v, l, draft.army === v)).join('');
  $('#king-pick').innerHTML = KINGS.map(k => `<button type="button" class="kingbtn" role="radio" aria-checked="${draft.king === k}" data-king="${k}"><img src="${emblemArt(k.toLowerCase())}" alt=""><span>${k}</span></button>`).join('');
  if (!KING_POWERS[draft.king].includes(draft.power)) draft.power = KING_POWERS[draft.king][0];
  $('#power-pick').innerHTML = KING_POWERS[draft.king].map(p => `<button type="button" class="powerbtn" role="radio" aria-checked="${draft.power === p}" data-power="${p}"><b>${POWER[p].name}</b><span class="uses">${POWER[p].uses}</span><small>${esc(POWER[p].line)}</small></button>`).join('');
  const side = draft.mode === 'two' ? 'Two players' : draft.side === 'w' ? 'You play White' : 'You play Black';
  const army = { random: 'Random army', today: "Today's army", chess: 'Chess army' }[draft.army];
  $('#more-sum').textContent = `${side} · ${army}`;
}
$('#sheet-new').addEventListener('change', e => { if (e.target.name === 'mode') { draft.mode = e.target.value; renderNewGame(); } });
$('#sheet-new').addEventListener('click', e => {
  const b = e.target.closest('[data-group], [data-king], [data-power]');
  if (!b) return;
  if (b.dataset.group) draft[b.dataset.group] = b.dataset.value;
  if (b.dataset.king) { draft.king = b.dataset.king; draft.power = KING_POWERS[draft.king][0]; }
  if (b.dataset.power) draft.power = b.dataset.power;
  const focusSel = b.dataset.group ? `[data-group="${b.dataset.group}"][data-value="${b.dataset.value}"]` : b.dataset.king ? `[data-king="${b.dataset.king}"]` : `[data-power="${b.dataset.power}"]`;
  renderNewGame();
  $(focusSel, $('#sheet-new'))?.focus({ preventScroll: true });
});
$('#more-toggle').addEventListener('click', () => {
  const open = $('#more').hidden;
  $('#more').hidden = !open;
  $('#more-toggle').setAttribute('aria-expanded', String(open));
});
$('#new-start').addEventListener('click', async () => {
  S.setup = { ...draft };
  await closeSheet('sheet-new');
  startGame(S.setup);
});

// ============================================================================================
// The game board
// ============================================================================================

const board = createBoard($('#board'), {
  play: { level: 'beginner', human: 'w', ms: 500, pause: 420 },
  label: 'King Down board. Arrow keys move the cursor. Enter or Space chooses. Escape cancels. I reads a piece.',
  onTap: (sq, cell) => onBoardTap(sq, cell),
  onInspect: (sq, cell) => onHold(sq, cell),
  onMove: story => onMoved(story),
  onSelect: sq => onSelected(sq),
});
// My overlay on the squares: cause lines, bite numbers, first-sight tags, the hint's ghost.
function overlayOf(b) {
  if (b._ov) return b._ov;
  const ov = document.createElement('div');
  ov.className = 'ov';
  ov.innerHTML = '<svg viewBox="0 0 800 800" preserveAspectRatio="none" aria-hidden="true"><g class="lines"></g></svg><div class="bits"></div><div class="tags"></div>';
  b.layer.appendChild(ov);
  b._ov = ov;
  return ov;
}
overlayOf(board); overlayOf(lessonBoard);
const centre = (b, sq, dy = 0.5) => { const { col, row } = b.colRow(sq); return [(col + 0.5) * 100, (row + dy) * 100]; };
/** A thin ink line from the cause to the effect: a shot, a later bite, a check. */
function causeLine(b, from, to, kind = 'shot') {
  const g = overlayOf(b).querySelector('.lines');
  const [x1, y1] = centre(b, from, 0.42), [x2, y2] = centre(b, to, 0.5);
  const len = Math.hypot(x2 - x1, y2 - y1);
  const ink = kind === 'check' ? '#9b2418' : kind === 'hint' ? '#7a5712' : '#4a2f1c';
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  el.innerHTML = `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="rgba(255,248,232,.85)" stroke-width="6" stroke-linecap="round"/>
    <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${ink}" stroke-width="2.4" stroke-linecap="round" ${kind === 'hint' ? 'stroke-dasharray="7 7"' : ''}/>
    <circle cx="${x2}" cy="${y2}" r="6" fill="${ink}" stroke="rgba(255,248,232,.9)" stroke-width="2.5"/>`;
  g.appendChild(el);
  if (!reduced()) for (const l of el.querySelectorAll('line')) l.animate([{ strokeDasharray: `0 ${len}` }, { strokeDasharray: `${len} 0` }], { duration: 220, easing: 'ease-out' });
}
function clearLines(b = board) { overlayOf(b).querySelector('.lines').replaceChildren(); }
function clearBits(b = board) { overlayOf(b).querySelector('.bits').replaceChildren(); }
function bit(b, sq, html, cls, dy = 0.5) {
  const { col, row } = b.colRow(sq);
  const el = document.createElement('div');
  el.className = cls;
  el.style.left = `${(col + 0.5) * 12.5}%`;
  el.style.top = `${(row + dy) * 12.5}%`;
  el.innerHTML = html;
  overlayOf(b).querySelector('.bits').appendChild(el);
  return el;
}

// ---- the game itself ----

function makeGame(setup, start, lans = [], extra = {}) {
  const mode = setup.mode;
  const human = mode === 'two' ? 'both' : setup.side;
  const g = { setup, mode, human, start, states: [start], stories: [], base: 0, over: false, demo: false, ...extra };
  for (const lan of lans) pushMove(g, KD.describe(g.states.at(-1), lan));
  return g;
}
function pushMove(g, story) {
  const pre = g.states.at(-1);
  story.short = sentence(story, g, pre);
  if (['freeze', 'ward'].includes(story.powerTag)) story.piece = 'king'; // the king casts it
  story.n = KD.status(pre).moveNumber;
  g.states.push(story.next);
  g.stories.push(story);
}
const live = () => S.game?.states.at(-1);
const myTurn = () => { const s = live(); if (!s || !S.game || S.game.over || S.review != null) return false; return board.isHuman(KD.status(s).turn); };
const humanSide = () => { const g = S.game; if (!g) return 'w'; if (g.mode !== 'two') return g.human; return KD.status(live()).turn; };

function powersFor(setup) {
  if (setup.mode !== 'powers') return null;
  const theirs = KINGS.filter(k => k !== setup.king);
  const them = setup.king === 'Frost' ? 'Flame' : theirs[Math.floor(Math.random() * theirs.length)];
  const mine = `${setup.king}:${setup.power}`, their = `${them}:${KING_POWERS[them][0]}`;
  return setup.side === 'w' ? [mine, their] : [their, mine];
}

/** Start a game: the muster, then play. */
async function startGame(setup, { seed, backRank, powers } = {}) {
  S.games++;
  const army = backRank ?? (setup.army === 'today' ? todayArmy() : setup.army === 'chess' ? 'chess' : 'random');
  const start = KD.newGame({ army, seed: army === 'random' ? seed : undefined, powers: powers ?? powersFor(setup) });
  S.game = makeGame({ ...setup }, start);
  persist();
  closeAllSheets();
  await showGame({ muster: true });
}
function rematch() {
  const g = S.game;
  startGame(g.setup, { backRank: g.start.backRank || undefined, powers: g.mode === 'powers' ? kingsSpec(g.start) : null });
}

/** Put the game on the table. muster: the armies land first. */
async function showGame({ muster = false } = {}) {
  const g = S.game;
  go('game');
  resetTable();
  board.play.level = g.setup.level;
  board.play.ms = THINK_MS[g.setup.level] ?? 500;
  board.play.human = 'both';
  board.flip(g.human === 'b');
  board.setState(live());
  renderAll();
  if (g.over) { toppleLoser(); showResult({ instant: true }); return; }
  if (muster) {
    S.mustering = true;
    S.msg = { icon: 'swords', html: 'Same army for both sides.', sticky: true };
    renderContext();
    const me = g;
    await runMuster();
    if (S.game !== me) return;
    S.mustering = false;
    if (S.games <= 3) showTags();
  }
  if (S.game !== g) return;
  board.play.human = g.human;
  renderAll();
  board.maybeAi();
  watchThinking();
}

function resetTable() {
  S.review = null; S.reading = null; S.msg = null; S.mustering = false; S.dots = [];
  for (const a of S.musterAnims) a.finish?.();
  S.musterAnims = [];
  hideHold();
  clearLines(); clearBits(); overlayOf(board).querySelector('.tags').replaceChildren();
  board.clearMarks('hint'); board.clearMarks('cover'); board.clearMarks('threat');
  board.arm(null);
  $('#result').hidden = true;
  $('#v-game').classList.remove('is-over');
  setReviewBar(false);
  closeStory();
}

async function runMuster() {
  if (reduced()) return;
  const h = board.squareRect('a1').height;
  const anims = [];
  for (let f = 0; f < 8; f++) {
    for (const r of [1, 8]) {
      const el = board.figure('abcdefgh'[f] + r);
      if (!el) continue;
      anims.push(el.animate([{ opacity: 0, transform: `translateY(${-0.55 * h}px) scale(1.04)` }, { opacity: 1, transform: 'none' }],
        { duration: 300, delay: f * 62, easing: 'cubic-bezier(.34,1.3,.64,1)', fill: 'backwards' }));
    }
  }
  S.musterAnims = anims;
  await Promise.all(anims.map(a => a.finished.catch(() => {})));
  S.musterAnims = [];
}

// ---- first sight: a tag on each new piece type in your army, for the first three games ----
function showTags() {
  const s = live(), side = humanSide();
  const holder = overlayOf(board).querySelector('.tags');
  holder.replaceChildren();
  const seen = new Set(), list = [];
  for (const c of KD.board(s)) {
    if (!c || c.color !== side || !NEW_TYPES.includes(c.type) || seen.has(c.type)) continue;
    seen.add(c.type);
    list.push(c);
  }
  const placed = [];
  for (const c of list.sort((a, b) => board.colRow(a.sq).col - board.colRow(b.sq).col)) {
    const { col, row } = board.colRow(c.sq);
    let lift = 0;
    while (placed.some(p => p.row === row && p.lift === lift && Math.abs(p.col - col) < 2)) lift++;
    placed.push({ col, row, lift });
    const el = document.createElement('div');
    el.className = `tag${reduced() ? '' : ' is-in'}`;
    el.style.left = `${(col + 0.5) * 12.5}%`;
    el.style.top = `${(row - 0.12 - lift * 0.85) * 12.5}%`;
    el.style.animationDelay = `${placed.length * 90}ms`;
    el.innerHTML = `${NAME[c.type]}<small>tap to read</small>`;
    holder.appendChild(el);
  }
  S.dots = list.map(c => ({ sq: c.sq, type: c.type, color: c.color }));
  S.tagsOpen = list.length > 0;
}
function foldTags() {
  const holder = overlayOf(board).querySelector('.tags');
  if (!S.tagsOpen && !S.dots.length) return;
  S.tagsOpen = false;
  const s = live();
  S.dots = S.dots.filter(d => { const c = cellAt(s, d.sq); return c && c.type === d.type && c.color === d.color; });
  holder.innerHTML = '';
  for (const d of S.dots) {
    const { col, row } = board.colRow(d.sq);
    const el = document.createElement('div');
    el.className = 'tagdot';
    el.title = `${NAME[d.type]}: tap to read`;
    el.style.left = `${(col + 0.82) * 12.5}%`;
    el.style.top = `${(row + 0.12) * 12.5}%`;
    holder.appendChild(el);
  }
}

// ---- taps, reading, refusals ----

function onBoardTap(sq, cell) {
  const g = S.game;
  hideHold();
  if (!g || S.review != null) return false;
  if (S.musterAnims.length) { for (const a of S.musterAnims) a.finish(); return false; }
  const s = live(), st = KD.status(s);
  const hadMsg = S.msg && !S.msg.sticky;
  if (hadMsg) S.msg = null;
  if (S.msg?.sticky && !S.mustering) S.msg = null;
  board.clearMarks('hint'); removeGhost();
  if (st.over || !myTurn() || board.busy) {
    if (cell) readPiece(sq, 'tap'); else clearReading();
    renderContext();
    return false;
  }
  if (board.armed) { clearReading(); queueSync(); return; }
  const pending = board.pending.length;
  const cands = board.selected != null ? board.candidates() : [];
  const target = cands.some(m => m.path[pending] === sq) || (pending && sq === board.pending.at(-1));
  if (target) { clearReading(); return; }
  if (cell && cell.color !== st.turn) {
    if (pending) { clearReading(); queueSync(); return; }
    const mover = board.selected != null ? KD.board(s)[board.selected] : null;
    if (mover && cell.type === 'guard' && mover.type !== 'king') { refuse(sq, mover); return false; }
    readPiece(sq, 'tap');
    return false;
  }
  clearReading();
  queueSync();
}

function refuse(sq, mover) {
  sfx.tap();
  const el = bit(board, sq, icon('shield'), `shield-glint${reduced() ? '' : ' is-in'}`, 0.5);
  setTimeout(() => el.remove(), 2400);
  S.msg = { icon: 'shield', tone: 'warn', html: `<b>Only a king can take a guard.</b>` };
  void mover;
  renderContext();
}

/** Read any piece: its name and rule in the context line, its reach on the board. Never a move. */
function readPiece(sq, by) {
  const s = S.review != null ? null : live();
  if (!s) return;
  const c = cellAt(s, sq);
  if (!c) return;
  clearReading();
  board.clearSelection(false);
  board.select(sq);
  markReach(s, sq);
  S.reading = { sq, by };
  renderContext();
}
function markReach(s, sq) {
  const moves = reachOf(s, sq);
  const cover = new Set(), threat = new Set(), shot = new Set();
  for (const m of moves) {
    if (m.power && m.needsArming) continue;
    if (m.shot) shot.add(m.captures[0]);
    else if (m.captures.length) m.captures.forEach(x => threat.add(x));
    else if (m.push) cover.add(m.push.from);
    else cover.add(m.to);
  }
  if (cover.size) board.mark([...cover], 'cover', { pop: true, from: sq });
  if (threat.size) board.mark([...threat], 'threat', { pop: true, from: sq });
  if (shot.size) { board.mark([...shot], 'threat'); board.mark([...shot], 'shot', { pop: true, from: sq }); }
}
function clearReading() {
  if (!S.reading) return;
  board.clearMarks('cover'); board.clearMarks('threat'); board.clearMarks('shot');
  if (board.selected != null && KD.sq.name(board.selected) === S.reading.sq) board.clearSelection(false);
  S.reading = null;
}

// The hold: the figure lifts, a small card rises. Also mouse rest (650 ms) and the I key.
let pressing = false;
$('#board').addEventListener('pointerdown', () => { pressing = true; }, true);
for (const t of ['pointerup', 'pointercancel']) window.addEventListener(t, () => { pressing = false; }, true);
function onHold(sq, cell) {
  const g = S.game;
  if (!g || S.review != null || S.view !== 'game') return;
  const pending = board.selected != null && KD.sq.name(board.selected) !== S.reading?.sq;
  const hover = !pressing && document.activeElement?.closest?.('.kdb') == null;
  if (!pending && !hover) readPiece(sq, 'hold');
  showHold(sq, cell);
}
function showHold(sq, cell) {
  const card = $('#hold-card');
  const s = live();
  const W = owner(cell.color);
  let extra = MORE[cell.type] ?? '';
  if (cell.type === 'king' && s.kings[cell.color === 'w' ? 0 : 1]) {
    const k = s.kings[cell.color === 'w' ? 0 : 1];
    extra = `${POWER[k.power].name}: ${POWER[k.power].line}`;
  }
  const art = pieceArt(cell.type, cell.color, cell.design);
  const who = S.game.mode === 'two' ? (cell.color === 'w' ? 'White' : 'Black') : W === 'Your' ? 'Yours' : 'Theirs';
  card.innerHTML = `<img src="${art}" alt=""><div><h3>${NAME[cell.type]} <span class="who">· ${who} · ${sq}</span></h3><p>${esc(RULE[cell.type])}</p>${extra ? `<small>${esc(extra)}</small>` : ''}</div>`;
  card.hidden = false;
  card.classList.remove('is-in'); void card.offsetWidth; if (!reduced()) card.classList.add('is-in');
  S.holdSq = sq;
}
function hideHold() {
  const card = $('#hold-card');
  if (!card.hidden) card.hidden = true;
  if (S.reading?.by === 'hover') clearReading();
  S.holdSq = null;
}
document.addEventListener('pointerdown', e => { if (!e.target.closest?.('#board')) hideHold(); }, true);
$('#board').addEventListener('keydown', e => { if (e.key !== 'i' && e.key !== 'I') hideHold(); });
$('#board').addEventListener('pointermove', e => {
  if (e.pointerType !== 'mouse' || !S.holdSq) return;
  const i = board.squareAtPoint(e.clientX, e.clientY);
  if (i == null || KD.sq.name(i) !== S.holdSq) { hideHold(); if (S.reading?.by === 'hold') { clearReading(); renderContext(); } }
});

function onSelected(sq) {
  if (sq) { S.reading = null; board.clearMarks('cover'); board.clearMarks('threat'); }
  queueSync();
}

let syncQueued = false;
function queueSync() { if (syncQueued) return; syncQueued = true; setTimeout(() => { syncQueued = false; syncBoardUI(); }, 0); }
for (const t of ['pointerup', 'keyup']) $('#board').addEventListener(t, () => queueSync());

/** Bite numbers on a Beast's chain squares; the context line; the power tile. */
function syncBoardUI() {
  clearBits();
  if (S.view !== 'game' || !S.game) return;
  if (board.selected != null && S.reading == null && myTurn()) {
    const s = live(), c = KD.board(s)[board.selected];
    if (c?.type === 'beast') {
      const cands = board.candidates(), p = board.pending.length;
      if (cands.some(m => m.path.length > 1)) {
        const num = new Map();
        for (const m of cands) for (let j = p; j < m.path.length; j++) if (m.captures.includes(m.path[j])) num.set(m.path[j], Math.min(num.get(m.path[j]) ?? 9, j + 1));
        for (const [sq, n] of num) bit(board, sq, String(n), `bite${n > p + 1 ? ' is-next' : ''}`, 0.18);
      }
    }
  }
  renderContext();
  renderStrips();
}

// ---- after each move ----

function onMoved(story) {
  const g = S.game;
  if (!g) return;
  const pre = g.states.at(-1);
  pushMove(g, story);
  S.reading = null; S.msg = null; S.mustering = false;
  clearLines(); clearBits(); removeGhost(); hideHold();
  board.clearMarks('hint'); board.clearMarks('cover'); board.clearMarks('threat');
  const mine = g.mode === 'two' || story.side === g.human;
  if (mine) foldTags(); else if (!S.tagsOpen) foldTags();
  // The cause line: takes without contact, and check.
  if (story.kind === 'shoot') causeLine(board, story.from, story.capturedOn[0], 'shot');
  if (story.kind === 'chain') story.capturedOn.slice(1).forEach((sq, i) => causeLine(board, story.capturedOn[i], sq, 'shot'));
  const reveal = story.powerTag && !mine && !['march', 'leap'].includes(story.powerTag);
  let shake = false;
  if (story.check || story.mate) {
    const checkers = attackersOf(story.next, story.checkSq ?? kingSq(story.next, other(story.side)), story.side);
    for (const c of checkers) causeLine(board, c, story.checkSq ?? kingSq(story.next, other(story.side)), 'check');
    if (!story.mate) {
      const from = checkers[0], piece = from ? cellAt(story.next, from)?.type : null;
      const who = g.mode === 'two' ? '' : mine ? 'your ' : 'their ';
      const lead = story.powerTag && !mine ? `${story.power}: check` : 'Check';
      S.msg = { icon: 'crown', tone: 'warn', html: `<b>${lead}</b> from ${who}${piece ?? 'piece'} on ${from ?? story.to}.` };
      if (!mine || g.mode === 'two') shake = true;
    }
  } else if (story.again && mine) {
    if (story.powerTag === 'haste') { S.msg = { icon: 'bolt', tone: 'gold', html: '<b>Move it again,</b> or end the turn.', action: { label: 'End turn', fn: () => board.pass() } }; board.arm('haste'); }
    else S.msg = { icon: 'bolt', tone: 'gold', html: `<b>${story.power}.</b> Now make your move.` };
  } else if (story.powerTag && !mine) {
    S.msg = { icon: 'bolt', tone: 'gold', html: `<b>Their king used ${story.power}.</b>` };
  }
  void pre;
  persist();
  renderAll({ fresh: true });
  if (reveal) revealPower(story);
  if (shake) flinch();
  if (story.over) endGame();
  else watchThinking();
}
function kingSq(s, side) { return KD.board(s).find(c => c && c.type === 'king' && c.color === side)?.sq; }

function revealPower(story) {
  const wrap = $('#strip-them .strip-wrap');
  if (!wrap) return;
  const g = S.game, k = g.states.at(-1).kings[story.side === 'w' ? 0 : 1];
  if (!k) return;
  sfx.power();
  const r = document.createElement('div');
  r.className = 'reveal';
  r.innerHTML = `<img src="${emblemArt(k.king.toLowerCase())}" alt="">`;
  const w = document.createElement('span');
  w.className = 'reveal-word';
  w.textContent = story.power;
  wrap.querySelector('.portrait').appendChild(r);
  wrap.appendChild(w);
  setTimeout(() => { r.remove(); w.remove(); }, reduced() ? 1600 : 1800);
}
function flinch() {
  const p = $('#strip-me .portrait');
  if (!p || reduced()) return;
  p.classList.remove('flinch'); void p.offsetWidth; p.classList.add('flinch');
}

/** While the computer thinks: its portrait breathes once. No spinner. */
function watchThinking() {
  const g = S.game;
  if (!g || g.mode === 'two' || g.over) return;
  if (KD.status(live()).turn === g.human) return;
  renderAll();
  setTimeout(() => {
    const p = $('#strip-them .portrait');
    if (!p || reduced() || KD.status(live()).turn === g.human) return;
    p.classList.remove('breathe'); void p.offsetWidth; p.classList.add('breathe');
  }, 400);
}

// ---- hint, undo ----

let ghostEl = null;
function removeGhost() { ghostEl?.remove(); ghostEl = null; }
async function hint() {
  if (!myTurn() || board.busy) return;
  const s = live(), token = ++S.hintToken;
  board.clearSelection(false); clearReading(); board.arm(null); clearBits();
  S.msg = { icon: 'hint', html: 'Looking for a good move.' };
  renderContext();
  const m = await KD.think(s, { level: 'club', ms: 450 });
  if (token !== S.hintToken || live() !== s || !m || S.review != null) return;
  const st = KD.describe(s, m);
  const target = m.shot ? m.captures[0] : m.path.at(-1) ?? m.to;
  board.clearMarks('hint');
  board.mark([m.from, target], 'hint');
  S.msg = { icon: 'hint', tone: 'gold', html: `<b>Hint:</b> ${m.needsArming ? `use ${esc(m.powerName)}. ` : ''}${esc(sentence(st, S.game, s))}.` };
  renderContext();
  if (m.shot || m.from === m.to) { causeLine(board, m.from, target, 'hint'); return; }
  const cell = cellAt(s, m.from), art = figureArt(cell);
  removeGhost();
  const el = document.createElement('div');
  el.className = 'ghost';
  const b = art.box;
  el.innerHTML = `<img src="${art.src}" alt="" class="${b?.mirror ? 'mirror' : ''}" style="left:${b.left * 100}%;top:${b.top * 100}%;width:${b.width * 100}%;height:${b.height * 100}%">`;
  const a = board.colRow(m.from), z = board.colRow(target);
  el.style.left = `${z.col * 12.5}%`; el.style.top = `${z.row * 12.5}%`;
  overlayOf(board).querySelector('.bits').appendChild(el);
  ghostEl = el;
  if (!reduced()) {
    const w = board.squareRect(m.from).width;
    await animate(el, [{ transform: `translate(${(a.col - z.col) * w}px, ${(a.row - z.row) * w}px)`, opacity: 0 }, { opacity: 0.6, offset: 0.2 }, { transform: 'none', opacity: 0.55 }], { duration: 640, easing: 'cubic-bezier(.45,.05,.3,1)' });
  }
}

/** How many records Undo takes back. It takes back whole turns, because a power such as Freeze
 *  keeps the turn: one turn in a game for two, else the computer's reply and your last turn.
 *  It is 0 when only the computer's first move is there. */
function undoCount(g) {
  const sideAt = i => KD.status(g.states[i]).turn;
  let n = g.stories.length, mine = false;
  while (n > g.base && !mine) {
    const side = sideAt(n - 1);
    while (n > g.base && sideAt(n - 1) === side) n--;
    mine = g.mode === 'two' || side === g.human;
  }
  return mine ? g.stories.length - n : 0;
}
async function undo() {
  const g = S.game;
  if (!g || g.over || S.review != null) return;
  const plies = undoCount(g);
  if (!plies) return;
  hideHold(); clearReading(); clearLines(); clearBits(); removeGhost(); board.arm(null);
  board.clearMarks('hint');
  board.play.human = 'both';
  board.setState(live()); // stops a computer that thinks
  for (let k = 0; k < plies; k++) {
    const story = g.stories.at(-1);
    const prev = g.states.at(-2);
    await rewind(story, prev);
    g.stories.pop(); g.states.pop();
  }
  board.play.human = g.human;
  board.setState(live());
  S.msg = { icon: 'undo', html: g.mode === 'two' ? 'One move back.' : '<b>Undone:</b> your move and the reply.' };
  persist();
  renderAll();
}
/** Undo plays the move backward, so the player sees what comes back. */
async function rewind(story, prev) {
  if (!reduced()) {
    const jobs = [];
    if (story.kind === 'swap') jobs.push(board.slide(board.figure(story.to), story.to, story.from, { dur: 200 }), board.slide(board.figure(story.from), story.from, story.to, { dur: 200 }));
    else if (story.from !== story.to && story.kind !== 'pass' && story.kind !== 'drop') jobs.push(board.slide(board.figure(story.to), story.to, story.from, { dur: 220 }));
    if (story.push) jobs.push(board.slide(board.figure(story.push.to), story.push.to, story.push.from, { lift: 0, dur: 220 }));
    await Promise.all(jobs);
  }
  board.setState(prev);
  if (!reduced()) for (const sq of story.capturedOn) { const f = board.figure(sq); if (f) animate(f, [{ opacity: 0, transform: 'translateY(-8%)' }, { opacity: 1, transform: 'none' }], { duration: 200, easing: 'ease-out' }); }
  if (!reduced()) await wait(90);
}

// ---- powers ----

function powerOf(side, s = live()) {
  const k = s?.kings[side === 'w' ? 0 : 1];
  if (!k) return null;
  const P = POWER[k.power], left = KD.usesLeft(s, side);
  return { key: k.power, king: k.king, ...P, left, always: left == null };
}
function onPowerTile() {
  const g = S.game, me = humanSide(), p = powerOf(me);
  if (!p) return;
  const usable = p.tag && p.left > 0 && myTurn() && !board.busy;
  if (!usable) {
    S.msg = { icon: 'bolt', html: `<b>${p.name}</b> · ${p.left === 0 ? 'used. ' : ''}${esc(p.line)}` };
    renderContext();
    return;
  }
  clearReading(); hideHold(); board.clearMarks('hint'); removeGhost(); S.msg = null;
  board.arm(board.armed === p.tag ? null : p.tag);
  void g;
  renderAll();
}

// ============================================================================================
// Rendering: strips, context line, moves line, story, result
// ============================================================================================

function renderAll(opts = {}) {
  if (!S.game) return;
  renderStrips();
  renderContext(opts);
  renderMovesLine(opts);
  renderStory();
  renderBar();
}

function portraitHtml(design, color) {
  return `<span class="portrait"><img src="${pieceArt('king', color, design)}" alt=""${color === 'b' ? ' class="mirror"' : ''}></span>`;
}
function renderStrips() {
  const g = S.game, s = live();
  if (!g || !s) return;
  const st = KD.status(s);
  const meSide = g.mode === 'two' ? 'w' : g.human, themSide = other(meSide);
  const design = side => (s.kings[side === 'w' ? 0 : 1]?.king ?? (side === 'w' ? 'Spirit' : 'Shadow')).toLowerCase();
  const strip = (side, isMe) => {
    const p = powerOf(side, s);
    let name, sub;
    if (g.mode === 'two') { name = side === 'w' ? 'White' : 'Black'; sub = st.turn === side && !st.over ? 'To move' : ''; }
    else if (isMe) { name = 'You'; sub = p ? `${p.king} king` : side === 'w' ? 'White' : 'Black'; }
    else { name = p ? `${p.king} · Computer` : 'Computer'; sub = LEVEL_NAME[g.setup.level]; }
    let power = '';
    if (p) {
      const state = p.always ? 'always on' : p.left > 0 ? `${p.left} left` : 'used';
      const label = `${p.name} · ${state}`;
      if (isMe) power = `<button type="button" class="power${p.left === 0 ? ' is-spent' : ''}" id="power-tile" aria-pressed="${!!board.armed && board.armed === p.tag}" aria-label="${esc(label)}${p.tag && p.left > 0 ? '. Tap to arm.' : ''}"><img src="${emblemArt(p.king.toLowerCase())}" alt=""><span>${esc(p.name)} <small>· ${state}</small></span></button>`;
      else power = `<button type="button" class="power is-theirs${p.left === 0 ? ' is-spent' : ''}" id="power-theirs" aria-label="Their power: ${esc(label)}"><img src="${emblemArt(p.king.toLowerCase())}" alt=""><span>${esc(p.name)} <small>· ${state}</small></span></button>`;
    }
    return `<div class="strip-wrap">${portraitHtml(design(side), side)}</div><div class="strip-name"><b>${esc(name)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</div>${power}`;
  };
  const them = $('#strip-them'), me = $('#strip-me');
  // Keep the portrait element (and its running flinch or reveal) when nothing about it changed.
  const put = (el, html) => { if (el.dataset.html !== html) { el.innerHTML = html; el.dataset.html = html; } };
  put(them, strip(themSide, false));
  put(me, strip(meSide, true));
  them.classList.toggle('is-turn', !st.over && st.turn === themSide);
  me.classList.toggle('is-turn', !st.over && st.turn === meSide);
  me.classList.toggle('is-check', st.check && st.turn === meSide);
  them.classList.toggle('is-check', st.check && st.turn === themSide);
}
$('#strip-me').addEventListener('click', e => { if (e.target.closest('#power-tile')) onPowerTile(); });
$('#strip-them').addEventListener('click', e => {
  if (!e.target.closest('#power-theirs') || !S.game) return;
  const g = S.game, p = powerOf(other(g.mode === 'two' ? 'w' : g.human));
  if (!p) return;
  S.msg = { icon: 'bolt', html: `<b>Their ${p.name}</b> · ${esc(p.line)}` };
  renderContext();
});

let lastCtx = '';
function renderContext({ fresh = false } = {}) {
  const g = S.game, el = $('#context');
  if (!g) return;
  const s = live(), st = KD.status(s);
  let c;
  const pieceLine = sq => {
    const cell = cellAt(s, sq);
    const who = g.mode === 'two' ? (cell.color === 'w' ? 'White ' : 'Black ') : cell.color === humanSide() ? '' : 'Their ';
    return { pi: pieceIcon(cell.type, cell.color), html: `<b>${who}${who ? cell.type : NAME[cell.type]}</b> <span class="soft">·</span> ${esc(RULE[cell.type])}` };
  };
  if (S.review != null) {
    const st2 = g.stories[S.review];
    c = S.review < 0 ? { icon: 'eye', html: '<b>The start.</b> Step forward with Next.' } : { pi: pieceIcon(st2.piece, st2.side), html: `<b>Move ${st2.n}</b> <span class="soft">·</span> ${esc(st2.short)}${tail(st2)}` };
  } else if (st.over) {
    c = { icon: 'crown', html: `<b>${esc(resultWords(g).title)}.</b> ${esc(resultWords(g).line)}` };
  } else if (S.msg && (S.msg.sticky || !S.reading)) {
    c = S.msg;
  } else if (board.armed) {
    const p = powerOf(humanSide());
    c = { icon: 'bolt', tone: 'gold', html: `<b>${esc(p?.armed?.split(':')[0] ?? 'Power')}:</b> ${esc(p?.armed?.split(': ')[1] ?? '')}`, action: { label: 'Cancel', fn: () => { board.arm(null); renderAll(); } } };
  } else if (board.pending.length) {
    c = { icon: 'target', html: '<b>Bite again,</b> or stop here.', action: { label: 'Stop here', fn: () => board.handleTap(idx(board.pending.at(-1))) } };
  } else if (S.reading) {
    c = pieceLine(S.reading.sq);
  } else if (board.selected != null) {
    c = pieceLine(KD.sq.name(board.selected));
  } else if (g.mode !== 'two' && st.turn !== g.human) {
    c = { icon: 'clock', html: 'The computer thinks.' };
  } else if (st.check) {
    c = { icon: 'crown', tone: 'warn', html: `<b>${g.mode === 'two' ? (st.turn === 'w' ? 'White is' : 'Black is') : 'You are'} in check.</b> Keep the king safe.` };
  } else {
    c = { icon: 'play', html: g.mode === 'two' ? `<b>${st.turn === 'w' ? 'White' : 'Black'} to move.</b>` : '<b>Your move.</b>' };
  }
  const html = `<span class="ctx-icon">${c.pi ?? icon(c.icon ?? 'info')}</span><span class="ctx-text">${c.html}</span>${c.action ? `<button type="button" class="btn btn-quiet" id="ctx-action">${esc(c.action.label)}</button>` : ''}`;
  if (html !== lastCtx || fresh) {
    el.innerHTML = html;
    el.className = `context${c.tone ? ` tone-${c.tone}` : ''}${!reduced() && html !== lastCtx ? ' is-fresh' : ''}`;
    lastCtx = html;
    if (c.action) $('#ctx-action').addEventListener('click', () => { S.msg = null; c.action.fn(); queueSync(); });
  }
}

function renderMovesLine() {
  const g = S.game, el = $('#movesline');
  const last = g.stories.at(-1);
  el.innerHTML = last
    ? `${pieceIcon(last.piece, last.side)}<span class="ml-text"><b>${esc(last.short)}</b>${esc(tail(last))}</span><span class="ml-label">Moves${icon('chevron-down')}</span>`
    : `<span class="ml-text">No moves yet.</span><span class="ml-label">Moves${icon('chevron-down')}</span>`;
  el.setAttribute('aria-label', last ? `Moves. Last move: ${last.short}${tail(last)}. Open the story of the game.` : 'Moves. No moves yet.');
}

function storyHtml(g) {
  if (!g.stories.length) return '<p class="story-empty">No moves yet. Each move shows here as a short line.</p>';
  const keys = new Set(keyMoments(g));
  const rows = g.stories.map((st, i) => {
    const mine = g.mode === 'two' ? st.side === 'w' : st.side === g.human;
    const num = st.side === 'w' ? `${st.n}.` : `${st.n}…`;
    return `<li><button type="button" class="srow${isEvent(st) ? ' is-event' : ''}${mine ? '' : ' is-theirs'}" data-ply="${i}" aria-current="${S.review === i}">
      <span class="num">${num}</span>${pieceIcon(st.piece, st.side)}<span class="txt">${keys.has(i) ? '<span class="key" aria-label="Key moment"></span>' : ''}${esc(st.short)}${esc(tail(st))}</span>${verbChip(st)}</button></li>`;
  });
  return `<ol class="story">${rows.join('')}</ol>`;
}
const wide = () => matchMedia('(min-width: 900px)').matches;
function renderStory() {
  const g = S.game;
  if (!g) return;
  const html = storyHtml(g);
  if ($('#sheet-moves').open) $('#story-sheet').innerHTML = html;
  if (!$('#story-inline').hidden) { $('#story-inline').innerHTML = html; scrollStory($('#story-inline')); }
}
// Keep the current row (in review) or the newest row in view, inside the list only.
function scrollStory(box) {
  const cur = box.querySelector('[aria-current="true"]');
  if (!cur) { box.scrollTop = box.scrollHeight; return; }
  const b = box.getBoundingClientRect(), r = cur.getBoundingClientRect();
  if (r.top < b.top) box.scrollTop -= b.top - r.top + 8;
  else if (r.bottom > b.bottom) box.scrollTop += r.bottom - b.bottom + 8;
}
function openStory() {
  const g = S.game;
  if (!g) return;
  if (wide()) {
    const inl = $('#story-inline');
    inl.hidden = false;
    inl.innerHTML = storyHtml(g);
    $('#movesline').setAttribute('aria-expanded', 'true');
    scrollStory(inl);
  } else {
    $('#story-sheet').innerHTML = storyHtml(g);
    $('#movesline').setAttribute('aria-expanded', 'true');
    openSheet('sheet-moves');
    scrollStory($('#sheet-moves'));
  }
}
function closeStory() {
  $('#story-inline').hidden = true;
  $('#movesline').setAttribute('aria-expanded', 'false');
  const d = $('#sheet-moves');
  if (d.open) { d.classList.remove('is-closing'); d.close(); }
}
$('#movesline').addEventListener('click', () => {
  if ($('#movesline').getAttribute('aria-expanded') === 'true') { closeStory(); return; }
  openStory();
});
$('#sheet-moves').addEventListener('close', () => $('#movesline').setAttribute('aria-expanded', 'false'));
for (const host of ['#story-inline', '#story-sheet']) {
  $(host).addEventListener('click', async e => {
    const b = e.target.closest('[data-ply]');
    if (!b) return;
    if (host === '#story-sheet') await closeSheet('sheet-moves');
    showReview(+b.dataset.ply);
  });
}

// ---- review: see any position, then Back to game ----

function setReviewBar(on) {
  $('#bar').hidden = on;
  $('#bar-review').hidden = !on;
}
function showReview(i) {
  const g = S.game;
  if (!g) return;
  i = Math.max(-1, Math.min(g.stories.length - 1, i));
  hideHold(); clearReading(); clearLines(); clearBits(); removeGhost(); board.arm(null);
  S.review = i;
  const s = g.states[i + 1];
  board.setBoard(KD.board(s));
  const st = g.stories[i];
  if (st) {
    const sqs = st.push ? [st.push.from, st.push.to] : st.kind === 'shoot' ? st.capturedOn : [st.to];
    board.mark(sqs, 'last');
    if (st.kind === 'shoot') causeLine(board, st.from, st.capturedOn[0], 'shot');
    if (st.checkSq) { board.mark(st.checkSq, 'check'); for (const c of attackersOf(st.next, st.checkSq, st.side)) causeLine(board, c, st.checkSq, 'check'); }
  }
  $('#result').hidden = true;
  $('#v-game').classList.remove('is-over');
  setReviewBar(true);
  $('#r-prev').disabled = i < 0;
  $('#r-next').disabled = i >= g.stories.length - 1;
  renderContext();
  renderStory();
  renderStrips();
}
function backToGame() {
  const g = S.game;
  if (!g || S.review == null) return;
  S.review = null;
  setReviewBar(false);
  clearLines();
  board.play.human = g.over ? 'both' : g.human;
  board.setState(live());
  renderAll();
  if (g.over) { toppleLoser(); showResult({ instant: true }); }
  else watchThinking();
  $('#movesline').focus({ preventScroll: true });
}
$('#r-prev').innerHTML = `${icon('back')}<span>Back</span>`;
$('#r-next').innerHTML = `${icon('chevron')}<span>Next</span>`;
$('#r-back').innerHTML = `${icon('play')}<span>Back to game</span>`;
$('#r-prev').addEventListener('click', () => showReview(S.review - 1));
$('#r-next').addEventListener('click', () => showReview(S.review + 1));
$('#r-back').addEventListener('click', backToGame);
document.addEventListener('keydown', e => {
  if (S.review == null || $$('dialog[open]').length || e.target.closest?.('.kdb')) return;
  if (e.key === 'ArrowLeft') { e.preventDefault(); showReview(S.review - 1); }
  if (e.key === 'ArrowRight') { e.preventDefault(); showReview(S.review + 1); }
  if (e.key === 'Escape') { e.preventDefault(); backToGame(); }
});

// ---- the bar ----

$('#b-hint').innerHTML = `${icon('hint')}<span>Hint</span>`;
$('#b-undo').innerHTML = `${icon('undo')}<span>Undo</span>`;
$('#b-menu').innerHTML = `${icon('menu')}<span>Menu</span>`;
$('#b-hint').addEventListener('click', hint);
$('#b-undo').addEventListener('click', undo);
$('#b-menu').addEventListener('click', () => openMenu());
function renderBar() {
  const g = S.game;
  const canUndo = g && !g.over && undoCount(g) > 0;
  $('#b-undo').disabled = !canUndo;
  $('#b-undo').setAttribute('aria-label', g?.mode === 'two' ? 'Undo the last move' : 'Undo your move and the reply');
  $('#b-undo').title = g?.mode === 'two' ? 'Undo the last move' : 'Undo your move and the reply';
  $('#b-hint').disabled = !myTurn();
}

// ---- the end ----

function resultWords(g) {
  const s = live(), st = KD.status(s);
  const last = g.stories.at(-1);
  if (g.resigned) {
    const loser = g.resigned;
    if (g.mode === 'two') return { title: `${loser === 'w' ? 'Black' : 'White'} wins`, line: `${loser === 'w' ? 'White' : 'Black'} laid the king down.` };
    return { title: 'The computer wins', line: 'You laid your king down.' };
  }
  if (st.reason === 'checkmate') {
    const n = last?.n ?? st.moveNumber;
    if (g.mode === 'two') return { title: `${st.winner === 'w' ? 'White' : 'Black'} wins`, line: `Checkmate on move ${n}.` };
    return st.winner === g.human ? { title: 'You win', line: `Checkmate on move ${n}.` } : { title: 'The computer wins', line: `Checkmate on move ${n}.` };
  }
  const why = { stalemate: 'Stalemate: no legal move, and the king is not in check.', draw50: 'Fifty moves with no take or pawn move.', drawRepetition: 'The same position three times.', drawMaterial: 'Too few pieces left to mate.' }[st.reason] ?? '';
  return { title: 'Draw', line: why };
}
function toppleLoser() {
  const g = S.game, st = KD.status(live());
  const loser = g.resigned ?? (st.reason === 'checkmate' ? st.turn : null);
  if (!loser) return;
  const k = kingSq(live(), loser);
  if (k) board.figure(k)?.classList.add('is-fallen');
}
async function endGame() {
  const g = S.game;
  g.over = true;
  persist();
  board.play.human = 'both';
  const done = (async () => {
    await wait(reduced() ? 0 : 780);
    if (S.game !== g || S.review != null) return;
    showResult();
  })();
  S.endDone = done;
  await done;
}
function showResult({ instant = false } = {}) {
  const g = S.game, el = $('#result');
  const w = resultWords(g);
  const keys = keyMoments(g);
  if (KD.status(live()).winner === g.human || (g.mode === 'two' && KD.status(live()).winner)) sfx.win();
  el.innerHTML = `<p class="result-kicker">King down</p><div class="result-head"><h2 id="result-title">${esc(w.title)}</h2><p class="result-line">${esc(w.line)}</p></div>
    <button type="button" class="btn btn-primary btn-wide" id="res-rematch">${icon('swords')}<span>Rematch</span></button>
    <div class="result-pair"><button type="button" class="btn btn-quiet" id="res-review">${icon('eye')}<span>Review</span></button><button type="button" class="btn btn-quiet" id="res-new">${icon('plus')}<span>New game</span></button></div>
    ${keys.length ? `<h3>Moves to look at again</h3><ol class="story">${keys.map(i => {
      const st = g.stories[i];
      return `<li><button type="button" class="srow is-event${(g.mode !== 'two' && st.side !== g.human) ? ' is-theirs' : ''}" data-ply="${i}"><span class="num">${st.n}${st.side === 'w' ? '.' : '…'}</span>${pieceIcon(st.piece, st.side)}<span class="txt">${esc(st.short)}<span class="sr-only">${esc(tail(st))}</span></span>${verbChip(st)}</button></li>`;
    }).join('')}</ol>` : ''}`;
  el.hidden = false;
  $('#v-game').classList.add('is-over');
  el.classList.toggle('is-in', !instant && !reduced());
  $('#story-inline').hidden = true;
  $('#movesline').setAttribute('aria-expanded', 'false');
  $('#res-rematch').addEventListener('click', rematch);
  $('#res-review').addEventListener('click', () => showReview(g.stories.length - 1));
  $('#res-new').addEventListener('click', () => openNewGame());
  for (const b of el.querySelectorAll('[data-ply]')) b.addEventListener('click', () => showReview(+b.dataset.ply));
  renderAll();
  if (!instant) $('#res-rematch').focus({ preventScroll: true });
}

// ============================================================================================
// Menu, Extra, Guide, Sound and motion
// ============================================================================================

const mrow = (ic, title, sub = '') => `${icon(ic)}<span class="mrow-text">${title}${sub ? `<small>${sub}</small>` : ''}</span>${icon('chevron')}`;
$('#m-new').innerHTML = mrow('plus', 'New game');
$('#m-guide').innerHTML = mrow('book', 'Guide', 'The six new pieces');
$('#m-sound').innerHTML = mrow('sound-on', 'Sound and motion');
$('#m-extra').innerHTML = mrow('sparkle', 'Extra', 'Workshop, today’s game, tricks and more');
$('#m-home').innerHTML = mrow('crown', 'Home');
$('#m-resign').innerHTML = `${icon('flag')}<span class="mrow-text">Resign<small>Lay your king down</small></span>`;
for (const d of $$('dialog.sheet')) for (const b of d.querySelectorAll('[data-close]')) b.innerHTML = icon('close');
for (const b of $$('[data-back], #extra-back')) b.innerHTML = icon('back');
function openMenu() {
  const inGame = S.view === 'game' && S.game && !S.game.over;
  $('#menu-main').hidden = false;
  $('#menu-resign').hidden = true;
  $('#menu-apart').hidden = !inGame;
  $('#m-home').parentElement.hidden = S.view === 'home';
  closeAllSheets();
  openSheet('sheet-menu');
}
$('#m-new').addEventListener('click', () => openNewGame());
$('#m-guide').addEventListener('click', () => swapSheet('sheet-menu', 'sheet-guide'));
$('#m-sound').addEventListener('click', () => { syncToggles(); swapSheet('sheet-menu', 'sheet-sound'); });
$('#m-extra').addEventListener('click', () => { renderExtra(); swapSheet('sheet-menu', 'sheet-extra'); });
$('#m-home').addEventListener('click', async () => { await closeSheet('sheet-menu'); if (S.game && !S.game.demo) showHome(); else go('title'); });
$('#m-resign').addEventListener('click', () => {
  const g = S.game;
  const side = humanSide(), s = live();
  $('#resign-king').src = pieceArt('king', side, (s.kings[side === 'w' ? 0 : 1]?.king ?? (side === 'w' ? 'Spirit' : 'Shadow')).toLowerCase());
  $('#resign-q').textContent = g.mode === 'two' ? `${side === 'w' ? 'White' : 'Black'}: lay your king down?` : 'Lay your king down?';
  $('#menu-resign p').textContent = g.mode === 'two' ? `The game ends. ${side === 'w' ? 'Black' : 'White'} wins.` : 'The game ends. The computer wins.';
  $('#menu-main').hidden = true;
  $('#menu-resign').hidden = false;
  $('#resign-q').focus({ preventScroll: true });
});
$('#resign-no').addEventListener('click', () => closeSheet('sheet-menu'));
$('#resign-yes').addEventListener('click', async () => {
  const g = S.game;
  await closeSheet('sheet-menu');
  if (!g || g.over) return;
  g.resigned = humanSide();
  board.play.human = 'both';
  board.setState(live()); // stops a computer that thinks
  clearReading(); hideHold(); clearBits();
  const k = kingSq(live(), g.resigned);
  if (k) board.figure(k)?.classList.add('is-fallen');
  sfx.capture();
  g.over = true;
  persist();
  await wait(reduced() ? 0 : 760);
  showResult();
});
for (const b of $$('[data-back]')) b.addEventListener('click', () => swapSheet(b.closest('dialog').id, 'sheet-menu'));
$('#extra-back').addEventListener('click', () => { $('#menu-main').hidden = false; $('#menu-resign').hidden = true; swapSheet('sheet-extra', 'sheet-menu'); });

const EXTRA = [
  { id: 'workshop', art: workshopArt('fire-spirit', 'w'), title: 'Workshop', sub: 'Make your own piece', note: 'In the full app: draw its moves, test it on a board, and share it by link.' },
  { id: 'today', ic: 'clock', title: "Today's game", sub: 'The same army for every player today', run: () => openNewGame({ army: 'today' }) },
  { id: 'tricks', ic: 'sparkle', title: 'Tricks', sub: 'The tricks you found, and riddles for the rest', note: 'In the full app: a seal for each trick you find, such as a Beast chain or an Ogre that shoves a Guard.' },
  { id: 'help', ic: 'eye', title: 'Board help', sub: 'Threats, coordinates, piece letters', note: 'In the full app: one switch for each help, with a small picture of what it does.' },
  { id: 'copy', ic: 'share', title: 'Copy moves', sub: 'The moves of this game as text', run: copyMoves },
  { id: 'account', ic: 'users', title: 'Account', sub: 'Keep your settings and game on every device', note: 'In the full app: sign in with Google or GitHub. The game plays the same without an account.' },
];
function renderExtra(open = null) {
  $('#extra-list').innerHTML = EXTRA.map(x => `<li><button type="button" class="mrow" data-x="${x.id}"${x.note ? ` aria-expanded="${open === x.id}" aria-controls="xn-${x.id}"` : ''}>
      <span class="xrow-art">${x.art ? `<img src="${x.art}" alt="">` : icon(x.ic)}</span><span class="mrow-text">${x.title}<small>${x.sub}</small></span>${icon(x.note ? 'chevron-down' : 'chevron')}</button>
      ${x.note ? `<p class="note" id="xn-${x.id}"${open === x.id ? '' : ' hidden'}>${x.note}</p>` : ''}</li>`).join('');
}
$('#extra-list').addEventListener('click', async e => {
  const b = e.target.closest('[data-x]');
  if (!b) return;
  const x = EXTRA.find(y => y.id === b.dataset.x);
  if (x.note) {
    const n = $(`#xn-${x.id}`), open = n.hidden;
    n.hidden = !open;
    b.setAttribute('aria-expanded', String(open));
    return;
  }
  if (x.id === 'copy') return x.run();
  await closeSheet('sheet-extra');
  x.run();
});
async function copyMoves() {
  const g = S.game;
  if (!g || !g.stories.length) { toast('No moves to copy yet'); return; }
  const text = g.stories.map((st, i) => `${st.side === 'w' || i === 0 ? `${st.n}${st.side === 'w' ? '.' : '...'} ` : ''}${st.lan}`).join(' ');
  try { await navigator.clipboard.writeText(text); toast('Moves copied'); } catch { toast('Could not copy. Your browser blocked it.'); }
}

$('#guide-list').innerHTML = NEW_TYPES.map(t => `<li><img src="${pieceArt(t, 'w')}" alt=""><div><b>${NAME[t]}</b><p>${esc(RULE[t])} ${esc(MORE[t] ?? '')}</p></div></li>`).join('');

function syncToggles() {
  $('#t-sound').checked = !sfx.muted;
  $('#t-motion').checked = reduced();
}
$('#t-sound').addEventListener('change', e => { sfx.setMuted(!e.target.checked); if (e.target.checked) sfx.tap(); });
$('#t-motion').addEventListener('change', e => { if (e.target.checked) document.documentElement.dataset.motion = 'reduce'; else document.documentElement.dataset.motion = 'full'; });

// ============================================================================================
// Start
// ============================================================================================

function restore() {
  const sv = saved.saved;
  if (!sv) return null;
  try {
    const start = KD.fromFen(sv.game.start, { powers: sv.game.kings });
    start.backRank = sv.game.backRank;
    const g = makeGame(sv.setup, start, sv.game.lans, { base: sv.base || 0 });
    g.human = sv.human; g.over = !!sv.over; g.resigned = sv.resigned || undefined;
    if (!g.over && KD.status(g.states.at(-1)).over) g.over = true;
    return g;
  } catch { return null; }
}
S.game = restore();
if (S.game) showHome(); else go('title');

// ============================================================================================
// The demo contract: state(name), play(), reset()
// ============================================================================================

let run = 0;
function scenarioP1({ powers = true, lans = ['e7-e6'] } = {}) {
  const setup = powers ? { mode: 'powers', level: 'club', side: 'w', army: 'random', king: 'Frost', power: 'Freeze' } : { mode: 'computer', level: 'beginner', side: 'w', army: 'random' };
  const start = KD.fromFen(P1_PRE, powers ? { powers: ['Frost:Freeze', 'Flame:Strike'] } : {});
  const g = makeGame(setup, start, lans, { base: 1, demo: true });
  return g;
}
async function prep() {
  run++;
  closeAllSheets(); hideToast();
  S.msg = null; S.reading = null;
  for (const a of S.musterAnims) a.finish?.();
  board.play.human = 'both';
  lessonBoard.play.human = 'both';
}
async function table(g) {
  S.game = g;
  S.games = Math.max(S.games, 4); // past the first three games: no tags
  board.play.human = 'both';
  go('game');
  resetTable();
  board.play.level = g.setup.level;
  board.flip(g.human === 'b');
  board.setState(live());
  renderAll();
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
}
const tapRing = target => {
  const r = target instanceof DOMRect ? target : target.getBoundingClientRect();
  const el = document.createElement('div');
  el.className = 'tapring';
  el.style.left = `${r.left + r.width / 2}px`; el.style.top = `${r.top + r.height / 2}px`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 600);
};

window.demo = {
  async state(name) {
    await prep();
    switch (name) {
      case 'title': S.game = null; go('title'); break;
      case 'lesson-shot': {
        startLesson();
        lessonBoard.selectSquare('d3');
        await lessonBoard.playMove('Ad3*d5');
        break;
      }
      case 'home': S.game = scenarioP1({ powers: false }); showHome(); break;
      case 'new-game': case 'new-game-powers': {
        S.game = scenarioP1({ powers: false }); showHome();
        S.games = 0;
        openNewGame(name === 'new-game-powers' ? { mode: 'powers', king: 'Frost', power: 'Freeze', level: 'club' } : { mode: 'computer', level: 'beginner', side: 'w', army: 'random' });
        $('#new-note').hidden = true;
        break;
      }
      case 'muster': {
        S.games = 0;
        await startGame({ mode: 'computer', level: 'beginner', side: 'w', army: 'random' }, { seed: FIRST_SEED });
        board.play.human = 'both';
        S.game.demo = true;
        break;
      }
      case 'game-rest': await table(scenarioP1()); break;
      case 'game-read': {
        await table(scenarioP1());
        readPiece('c4', 'hold');
        showHold('c4', cellAt(live(), 'c4'));
        break;
      }
      case 'game-select': {
        await table(scenarioP1());
        board.selectSquare('e4');
        syncBoardUI();
        break;
      }
      case 'game-powers-armed': {
        await table(scenarioP1());
        board.arm('freeze');
        renderAll();
        break;
      }
      case 'moves-open': {
        await table(scenarioP1({ lans: STORY_LINE }));
        openStory();
        break;
      }
      case 'menu': await table(scenarioP1()); openMenu(); break;
      case 'extra': await table(scenarioP1()); renderExtra('workshop'); openSheet('sheet-extra'); break;
      case 'check': {
        await table(scenarioP1({ lans: ['e7-e6', 'Aa3*a5'] }));
        await board.playMove('Ab6-e3!');
        board.play.human = 'both';
        await wait(300);
        break;
      }
      case 'result': {
        const setup = { mode: 'computer', level: 'beginner', side: 'w', army: 'random' };
        const start = KD.newGame({ army: 'random', seed: FIRST_SEED });
        await table(makeGame(setup, start, WIN_GAME.slice(0, -1), { demo: true }));
        await board.playMove(WIN_GAME.at(-1));
        await S.endDone;
        break;
      }
      default: throw new Error(`demo.state: no state "${name}"`);
    }
  },

  /** The journey in about 25 s: the title, Play, Start, the muster, a few moves, the story, the Menu. */
  async play() {
    await prep();
    const me = run;
    const alive = () => me === run;
    S.game = null; S.games = 0;
    go('title');
    await wait(1800, { instant: true }); if (!alive()) return;
    tapRing($('#t-play')); await wait(250);
    openNewGame({ mode: 'computer', level: 'beginner', side: 'w', army: 'random' });
    $('#new-note').hidden = true;
    await wait(1500, { instant: true }); if (!alive()) return;
    tapRing($('#new-start')); await wait(250);
    await closeSheet('sheet-new');
    S.setup = { mode: 'computer', level: 'beginner', side: 'w', army: 'random' };
    const started = startGame(S.setup, { seed: FIRST_SEED });
    await wait(80);
    board.play.human = 'both';
    await started;
    board.play.human = 'both';
    S.game.demo = true;
    await wait(1600, { instant: true }); if (!alive()) return;
    const line = WIN_GAME.slice(0, 9);
    for (let k = 0; k < line.length; k++) {
      if (!alive()) return;
      const lan = line[k], m = KD.legal(live()).find(x => x.lan === lan);
      if (k % 2 === 0) {
        tapRing(board.squareRect(m.from)); board.selectSquare(m.from); syncBoardUI();
        await wait(1100, { instant: true }); if (!alive()) return;
        tapRing(board.squareRect(m.shot ? m.captures[0] : m.to));
      } else {
        await wait(500, { instant: true }); if (!alive()) return;
      }
      await board.playMove(lan);
      await wait(k % 2 === 0 ? 450 : 700, { instant: true });
    }
    if (!alive()) return;
    await wait(900, { instant: true }); if (!alive()) return;
    tapRing($('#movesline')); await wait(200);
    openStory();
    await wait(2600, { instant: true }); if (!alive()) return;
    closeStory();
    await wait(500, { instant: true }); if (!alive()) return;
    tapRing($('#b-menu')); await wait(200);
    openMenu();
    await wait(2200, { instant: true });
  },

  async reset() {
    await prep();
    S.game = restore();
    if (S.game) showHome(); else go('title');
  },
};
