// Play with friends: link games today, live games later. The board, the rules and the stand-in
// friend (the computer player) are the kit's. The words that a player reads are ASD-STE100.
import { createBoard, KD } from '../../kit/board.js';
import { icon, pieceIcon } from '../../kit/icons.js';
import { $, $$, toast, hideToast, openSheet, closeSheet, wait, haptic, sfx } from '../../kit/ui.js';

// ---- the game: the shared position P1 of the idea bank (Frost and Freeze against Flame and Strike) ----
const POWERS = ['Frost:Freeze', 'Flame:Strike'];
const P1 = 'r1b2mk1/2p3pp/1a2p3/pp1o4/2g1S3/A1OP4/PP1G1PPP/R1B2MK1 w - - 0 12';
const P2 = 'r1b3rk/2p4p/4p3/pp2A3/2g5/2OP4/PP1G1PPP/R1B2MK1 w - - 0 24';
const ARMY = 'RABOGMKS';                 // the back rank of the invite (both sides)
const SENT = 'Aa3*a5';                   // your last move: it went to Sam in your link
const STRIKE = 'Ab6-e3!';                // Sam's answer: the archer moves like a queen with Strike; its shot gives check
const ANSWER = 'f2xe3';                  // your answer: the pawn takes the archer
const MATE = 'Ae5-f6';                   // P2: the archer steps to f6 and its shot reaches h8
const beforeStrike = () => KD.play(KD.fromFen(P1, { powers: POWERS }), SENT);
const afterStrike = () => KD.play(beforeStrike(), STRIKE);
const afterAnswer = () => KD.play(afterStrike(), ANSWER);
const afterMate = () => KD.play(KD.fromFen(P2, { powers: POWERS }), MATE);
const newGame = () => KD.newGame({ army: ARMY, powers: POWERS });

// ---- two line icons that the kit does not have, in the kit's stroke style ----
const MY_ICONS = {
  link: 'M10.5 13.5a4 4 0 0 0 5.7 0l3.3-3.3a4 4 0 0 0-5.7-5.7l-1.3 1.3M13.5 10.5a4 4 0 0 0-5.7 0l-3.3 3.3a4 4 0 0 0 5.7 5.7l1.3-1.3',
  'words-off': 'M5 4.5h14A1.5 1.5 0 0 1 20.5 6v9a1.5 1.5 0 0 1-1.5 1.5h-8L6.5 20v-3.5H5A1.5 1.5 0 0 1 3.5 15V6A1.5 1.5 0 0 1 5 4.5zM3 3l18 18',
};
const ico = name => (MY_ICONS[name] ? `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${MY_ICONS[name]}"/></svg>` : icon(name));

// ---- the line for a move: who, the piece, the spec verb (eight words or fewer) ----
const PROMO = { Q: 'queen', R: 'rook', B: 'bishop', N: 'knight', q: 'queen', r: 'rook', b: 'bishop', n: 'knight' };
function lineFor(st, { check = true } = {}) {
  const sam = st.side === 'b';
  const who = sam ? "Sam's" : 'Your', foe = sam ? 'your' : "Sam's", p = st.piece;
  const takes = p === 'beast' ? 'bites' : st.leaves ? 'trades for' : 'takes';
  let t;
  switch (st.kind) {
    case 'shoot': t = `${who} ${p} shoots ${foe} ${st.captured[0]}.`; break;
    case 'chain': t = `${who} beast bites ${st.captured.length} times.`; break;
    case 'push': t = `${who} ogre shoves the ${st.push?.piece ?? 'piece'}.`; break;
    case 'swap': t = `${who} maester swaps with the ${st.swap?.with ?? 'piece'}.`; break;
    case 'promote': t = `${who} pawn becomes a ${PROMO[st.promo] ?? 'queen'}.`; break;
    case 'power':
      if (st.powerTag === 'strike') t = `${who} ${p} goes to ${st.to} with Strike.`;
      else if (st.powerTag === 'freeze') t = sam ? `Sam freezes your ${p}.` : `You freeze Sam's ${p}.`;
      else t = `${who} ${p} uses ${st.power}.`;
      break;
    default: t = st.captured?.length ? `${who} ${p} ${takes} ${foe} ${st.captured[0]}.` : `${who} ${p} goes to ${st.to}.`;
  }
  if (!check) return t;
  return t + (st.mate ? ' Checkmate.' : st.check ? ' Check.' : '');
}

/** True when the archer that just moved gives the check with its shot. The engine says so, not the demo. */
function shotGivesCheck(st) {
  if (!st?.check || st.piece !== 'archer' || !st.next) return false;
  try {
    const fen = KD.toFen(st.next).replace(/ ([wb]) /, (_, c) => ` ${c === 'w' ? 'b' : 'w'} `);
    const turned = KD.fromFen(fen, { powers: st.next.kings });
    return KD.legal(turned, st.to).some(m => m.kind === 'shoot' && m.captures.includes(st.checkSq));
  } catch { return false; }
}
/** The cause of a check, in a few words. */
const causeFor = st => (st.mate ? 'Checkmate.' : shotGivesCheck(st) ? 'Its shot gives check.' : st.check ? 'Check.' : '');
const softFor = st => `${causeFor(st)} Your move.`.trim();

// ---- the parts ----
const app = $('#app');
const label = (el, name, text) => { el.innerHTML = `${ico(name)}<span>${text}</span>`; };
label($('#undo'), 'undo', 'Undo');
label($('#moves'), 'moves', 'Moves');
label($('#menu'), 'menu', 'Menu');
$('#saved-icon').outerHTML = icon('check');
for (const b of $$('.sheet [data-close].btn-icon')) b.innerHTML = icon('close');
// The invite names the new pieces of the army; the rook and the bishop are in the line under it.
const NEW_PIECES = { A: 'archer', O: 'ogre', G: 'guard', M: 'maester', S: 'beast', L: 'paladin' };
$('#army').innerHTML = [...ARMY].filter(l => NEW_PIECES[l]).map(l => {
  const t = NEW_PIECES[l];
  return `<figure><img src="../../assets/pieces/${t}-w.webp" alt=""><figcaption>${t[0].toUpperCase()}${t.slice(1)}</figcaption></figure>`;
}).join('');

const board = createBoard($('#board'), {
  play: { level: 'casual', human: 'both' },
  label: 'King Down board, game with Sam. Arrow keys move, Enter or Space chooses, Escape cancels, I shows a piece.',
  onTap() {
    // A link game: you play White, and only on your turn, until you send.
    if (!ui.canMove || KD.status(board.state).turn !== 'w') { if (ui.phase === 'sent') toast('Sam moves next.'); return false; }
  },
  onMove(story) { if (story.side === 'w' && ui.canMove) yourMoveReady(story); },
});

// ---- the view model ----
// phase: 'first' | 'prev' | 'still' (your move) · 'ready' (moved, not sent) · 'sending' · 'sent' · 'live'
const ui = { mode: 'link', phase: 'prev', turn: 'prev', canMove: false, mutedSam: false, wordBusy: false, action: null };
let run = 0;            // a new state, play or reset stops the old run
const bubbleTimer = {};
let wordTimer = 0;

function show(state) { board.play.human = 'both'; board.setState(state); }

/** The last move as a story, or the one before it (back = 1). */
function storyAt(s = board.state, back = 0) {
  let at = s;
  for (let i = 0; i < back; i++) { if (!at?.history.length) return null; at = KD.undo(at); }
  if (!at?.history.length) return null;
  return KD.describe(KD.undo(at), at.history.at(-1).lan);
}
const lastStory = () => storyAt(board.state, 0);
function storiesBack(n) {
  const out = [];
  for (let i = 0; i < n; i++) { const st = storyAt(board.state, i); if (!st) break; out.unshift(st); }
  return out;
}

function setMode(mode) {
  ui.mode = mode;
  app.dataset.mode = mode;
  $('#send').hidden = mode !== 'link';
  $('#undo').hidden = mode !== 'link';      // a live move goes at once: nothing to take back
  $('#moves').hidden = mode === 'link';
  setPresence('them', mode === 'link' ? 'link' : 'online');
  setPresence('you', null);
}

const PRESENCE = {
  link: () => `${ico('link')}By link`,
  online: () => '<span class="dot" aria-hidden="true"></span>Online',
  away: () => `${ico('clock')}Away`,
  recon: () => '<span class="spin" aria-hidden="true"></span>Reconnecting',
};
function setPresence(who, kind) {
  $(`#${who}-presence`).innerHTML = kind ? PRESENCE[kind]() : '';
  $(`#${who}`).classList.toggle('is-away', kind === 'away');
}

function setSubs({ strikeUsed }) {
  $('#them-sub').innerHTML = `Flame · Strike${strikeUsed ? ' <span class="used">· used</span>' : ''}`;
  $('#you-sub').textContent = 'Frost · Freeze';
}

/** A word in a bubble in the place of the line under a name. Without persist it goes after 1.6 s. */
function say(who, word, { persist = false } = {}) {
  if (who === 'them' && ui.mutedSam) return;
  const b = $(`#${who}-bubble`), sub = $(`#${who}-sub`);
  clearTimeout(bubbleTimer[who]);
  b.textContent = `“${word}”`;
  b.setAttribute('aria-label', `${who === 'them' ? 'Sam' : 'You'}: ${word}`);
  b.hidden = false; sub.hidden = true;
  b.classList.remove('is-new'); void b.offsetWidth; b.classList.add('is-new');
  if (who === 'them') $('#mute').hidden = false;
  if (!persist) bubbleTimer[who] = setTimeout(() => unsay(who), 1600);
}
function unsay(who) {
  clearTimeout(bubbleTimer[who]);
  $(`#${who}-bubble`).hidden = true;
  $(`#${who}-sub`).hidden = false;
}

/** The context area: a small label, one quiet action, the move before, and one line. */
function ctx(eyebrow, line, { action = null, eyebrowIcon = null, piece = null, soft = '', fresh = true, before = null } = {}) {
  openWords(false);
  $('#ctx-before').innerHTML = before ? pieceIcon(before.piece, before.side) + lineFor(before) : '';
  $('#ctx-eyebrow').innerHTML = (eyebrowIcon ? ico(eyebrowIcon) : '') + eyebrow;
  $('#ctx-line').innerHTML = line ? (piece ? pieceIcon(piece[0], piece[1]) : '') + line + (soft ? `<span class="soft">${soft}</span>` : '') : '';
  setAction(action);
  const msg = $('#ctx-msg');
  msg.classList.remove('is-new');
  if (fresh && line) { void msg.offsetWidth; msg.classList.add('is-new'); }
}
function setAction(a) {
  const b = $('#ctx-action');
  ui.action = a?.run ?? null;
  b.hidden = !a;
  b.innerHTML = a ? `${ico(a.icon)}<span>${a.label}</span>` : '';
}
function clearCtx() {
  for (const id of ['#ctx-eyebrow', '#ctx-line', '#ctx-before']) $(id).innerHTML = '';
  setAction(null);
}

function openWords(open) {
  $('#words').hidden = !open;
  $('#context').classList.toggle('is-saying', open);
  $('#words').classList.toggle('is-open', open);
  $('#say').setAttribute('aria-expanded', String(open));
}

function setSend(state) {          // 'wait' (before your move), 'ready', 'sent'
  const b = $('#send');
  b.disabled = state !== 'ready';
  b.classList.remove('is-ready');
  if (state === 'sent') label(b, 'clock', "Sam's turn");
  else label(b, 'share', 'Send your turn');
  if (state === 'ready') { void b.offsetWidth; b.classList.add('is-ready'); }
  $('#undo').disabled = state !== 'ready';
}

function showStage(kind) {
  const stage = $('#stage');
  stage.hidden = !kind;
  app.inert = !!kind;
  if (!kind) return;
  $('#invite').hidden = kind !== 'invite';
  $('#waiting').hidden = kind !== 'waiting';
  // Before Sam joins, his seat is the shape of Black's plain king: Sam picks his king when he joins.
  $('#fk-them').classList.toggle('is-empty', kind === 'waiting');
  $('#fk-them img').src = `../../assets/kings/${kind === 'waiting' ? 'shadow' : 'flame'}-b.webp`;
  if (kind === 'invite') {
    $('#stage-tag').innerHTML = `${ico('link')}A game by link`;
    $('#stage-title').textContent = 'Sam asks you to play';
  } else {
    $('#stage-tag').innerHTML = `${ico('globe')}Live game`;
    $('#stage-title').textContent = 'Waiting for Sam';
  }
}

function showResult(on) {
  const r = $('#result');
  r.hidden = !on;
  r.classList.remove('is-down');
  app.classList.toggle('has-result', on);
  if (on) { void r.offsetWidth; r.classList.add('is-down'); }   // the one strong moment: Sam's king lies down
}

/** The board's end frame of a mate, with no motion of its own: the check ring, the shot, the fallen king. */
function endFrame() {
  const st = lastStory();
  if (!st?.mate) return;
  board.mark(st.checkSq, 'check');
  if (shotGivesCheck(st)) board.mark(st.checkSq, 'shot');
  const fig = board.figure(st.checkSq), img = fig?.querySelector('img');
  if (!img) return;
  img.style.transition = 'none';
  fig.classList.add('is-fallen');
  void img.offsetWidth;
  img.style.transition = '';
}

/** Clear what an earlier view opened. */
function clean() {
  hideToast();
  showStage(null);
  showResult(false);
  unsay('them'); unsay('you');
  openWords(false);
  clearCtx();
  closeSheet('menu-sheet'); closeSheet('story-sheet');
  $('#mute').hidden = true;
  clearTimeout(wordTimer); ui.wordBusy = false;
  $$('#words .chip').forEach(c => { c.disabled = false; });
  ui.canMove = false;
}

// ---- the link game: the catch-up, your move, Send ----
/**
 * Your move in a link game. kind: 'first' (no move yet), 'prev' (Previously: Sam's move played once,
 * with your move before it and See again), 'still' (one line, no replay).
 */
function turnView(kind, { fresh = true } = {}) {
  const story = lastStory();
  if (!story || story.side !== 'b') kind = 'first';
  ui.turn = kind; ui.phase = kind;
  if (story && KD.status(board.state).over) {
    ui.phase = 'over'; ui.canMove = false;
    ctx('Game over', lineFor(story), { piece: [story.piece, story.side], fresh });
    setSend('wait');
    return;
  }
  if (kind === 'first') {
    ctx('Your turn', 'You move first.', { soft: 'Then send your turn to Sam.', fresh });
  } else {
    ctx(kind === 'prev' ? 'Previously' : "Sam's move", lineFor(story, { check: false }), {
      action: kind === 'prev' ? { label: 'See again', icon: 'play', run: seeAgain } : null,
      piece: [story.piece, story.side], soft: softFor(story), fresh,
      before: kind === 'prev' ? storyAt(board.state, 1) : null,
    });
    // The cause on the board: the archer's shot reaches your king.
    if (shotGivesCheck(story)) board.mark(story.checkSq, 'shot');
  }
  setSend('wait');
  ui.canMove = true;
}

/** The link opens on the board before Sam's move; the move plays once, with one line. */
async function openLink(me, { pause = 650 } = {}) {
  clean(); setMode('link'); setSubs({ strikeUsed: false });
  show(beforeStrike());
  setSend('wait');
  ctx('Sam sent a move', '', { eyebrowIcon: 'link', before: lastStory() });
  await wait(pause, { instant: true });
  if (me !== run) return null;
  const story = await board.playMove(STRIKE);
  if (me !== run) return null;
  haptic([8, 40, 8]);
  setSubs({ strikeUsed: true });
  turnView('prev');
  return story;
}

function yourMoveReady(story) {
  ui.phase = 'ready'; ui.canMove = false;
  ctx('Your move', lineFor(story), { piece: [story.piece, story.side], soft: 'Now send your turn to Sam.' });
  setSend('ready');
}

/** The game link goes by the phone's share sheet, or by a copy. The words say only what happened. */
async function shareLink() {
  const url = `${location.href.split('?')[0]}?game=demo`;
  if (navigator.share && matchMedia('(pointer: coarse)').matches) {
    try { await navigator.share({ title: 'King Down', text: 'Your move in our game.', url }); return 'shared'; }
    catch (e) { if (e?.name === 'AbortError') return 'cancelled'; }
  }
  try { await navigator.clipboard.writeText(url); return 'copied'; } catch { return 'none'; }
}
const SENT_WORDS = {
  shared: ['check', 'Link shared', 'Sam moves next.'],
  copied: ['check', 'Link copied', 'Paste it to Sam.'],
  none: ['link', 'Link not copied', 'Copy the page address for Sam.'],
};
function sentView(how) {
  ui.phase = 'sent'; ui.canMove = false;
  setSend('sent');
  const [eyebrowIcon, eyebrow, line] = SENT_WORDS[how];
  ctx(eyebrow, line, { eyebrowIcon, before: lastStory() });
}

async function sendTurn() {
  if (ui.phase !== 'ready') return;
  const me = run;
  ui.phase = 'sending';
  const how = await shareLink();
  if (me !== run) return;
  if (how === 'cancelled') { ui.phase = 'ready'; return; }
  sentView(how);
  await wait(2800);
  if (me !== run || ui.phase !== 'sent') return;
  friendMoves(me);
}

/** The stand-in friend: the computer player answers, and its move opens as "Previously". */
async function friendMoves(me) {
  const s = board.state;
  if (KD.status(s).over) return;
  ctx('Sam sent a move', '', { eyebrowIcon: 'link', before: lastStory() });
  setSend('wait');
  const move = await KD.think(s, { level: 'casual', ms: 400 });
  if (me !== run) return;
  await wait(500, { instant: true });
  if (me !== run) return;
  await board.playMove(move);
  if (me !== run) return;
  turnView('prev');
}

async function seeAgain() {
  const s = board.state;
  if (!s?.history.length || ui.phase !== 'prev') return;
  const me = ++run;
  const last = s.history.at(-1).lan;
  ui.canMove = false;
  show(KD.undo(s));
  await wait(260, { instant: true });
  if (me !== run) return;
  await board.playMove(last);
  if (me !== run) return;
  turnView('prev', { fresh: false });
}

/** Away, in a live game: the game becomes today's link game, and you send your turn. */
function finishByLink() {
  setMode('link');
  ui.turn = 'prev';
  ui.phase = 'ready';
  ctx('By link now', 'Send your turn to Sam.', { eyebrowIcon: 'link', soft: 'Sam plays when he opens it.', before: lastStory() });
  setSend('ready');
  $('#send').focus({ preventScroll: true });
}

/** The move story in a sheet: option C opens the game on it; Moves opens it in a live game. */
async function openStory(title, stories) {
  if ($('#story-sheet').open) await closeSheet('story-sheet');
  $('#story-title').textContent = title;
  $('#story-list').innerHTML = stories.map(st => {
    const cause = causeFor(st);
    return `<li>${pieceIcon(st.piece, st.side)}<span>${lineFor(st, { check: false })}${cause ? `<small>${cause}</small>` : ''}</span></li>`;
  }).join('');
  openSheet('story-sheet');
}

// ---- the controls ----
$('#ctx-action').addEventListener('click', () => ui.action?.());
$('#send').addEventListener('click', sendTurn);
$('#undo').addEventListener('click', () => {
  if (ui.phase !== 'ready') return;
  show(KD.undo(board.state));
  turnView(ui.turn, { fresh: false });
  board.el.focus({ preventScroll: true });   // Undo is now off: the focus goes back to the board
});
$('#say').addEventListener('click', () => {
  const open = $('#say').getAttribute('aria-expanded') !== 'true';
  openWords(open);
  if (open) $('#words .chip:not(:disabled)')?.focus();
});
$('#words').addEventListener('keydown', e => { if (e.key === 'Escape') { openWords(false); $('#say').focus(); } });
async function chooseWord(word, { focus = true } = {}) {
  if (ui.wordBusy) return;
  say('you', word);
  sfx.tap();
  openWords(false);
  if (focus) $('#say').focus();
  // One word every 4 s.
  ui.wordBusy = true; $$('#words .chip').forEach(c => { c.disabled = true; });
  wordTimer = setTimeout(() => { ui.wordBusy = false; $$('#words .chip').forEach(c => { c.disabled = false; }); }, 4000);
  if (ui.mode === 'live' && word === 'Hello') { const me = run; await wait(1400); if (me === run) say('them', 'Hello'); }
}
for (const chip of $$('#words .chip')) chip.addEventListener('click', () => chooseWord(chip.textContent));

// The mute hides Sam's words on this device. Its icon is a speech bubble with a line through it, not the
// sound; the pressed look shows that it is on.
function setMuted(on) {
  ui.mutedSam = on;
  const m = $('#mute');
  m.setAttribute('aria-pressed', String(on));
  m.setAttribute('aria-label', "Mute Sam's words");
  m.innerHTML = ico('words-off');
  $('#words-on').checked = !on;
  if (on) unsay('them');
}
setMuted(false);
$('#mute').addEventListener('click', () => { setMuted(!ui.mutedSam); toast(ui.mutedSam ? "Sam's words are hidden. Sam does not know." : "Sam's words show again."); });
$('#words-on').addEventListener('change', e => setMuted(!e.target.checked));
$('#menu').addEventListener('click', () => openSheet('menu-sheet'));
$('#moves').addEventListener('click', () => openStory('Moves', storiesBack(6)));
$('#story-go').addEventListener('click', async () => { await closeSheet('story-sheet'); board.el.focus({ preventScroll: true }); });
for (const b of $$('[data-todo]')) b.addEventListener('click', () => toast('This demo does not do this.'));
$('#accept').addEventListener('click', startGame);
$('#decline').addEventListener('click', () => toast('The link stays. Open it later.'));
$('#cancel').addEventListener('click', () => { window.demo.reset(); toast('Invite cancelled.'); board.el.focus({ preventScroll: true }); });
$('#rematch').addEventListener('click', () => toast('Sam gets your rematch invite.'));
$('#review').addEventListener('click', () => toast('Review opens the move story.'));

/** Play on the invite: the start position of the invite's army. You move first, then send. */
function startGame() {
  run++;
  clean(); setMode('link'); setSubs({ strikeUsed: false });
  show(newGame());
  turnView('first');
  board.el.focus({ preventScroll: true });
}

// ---- the live game (later): the same board, a live connection ----
function liveView(state, { strikeUsed = true } = {}) {
  clean(); setMode('live'); setSubs({ strikeUsed });
  show(state);
  ui.phase = 'live';
  const st = KD.status(board.state);
  ctx(st.over ? 'Game over' : st.turn === 'w' ? 'Your move' : "Sam's turn", '', { before: lastStory(), fresh: false });
}

// ---- the demo contract ----
window.demo = {
  async state(name) {
    const me = ++run;
    switch (name) {
      case 'invite':
        clean(); setMode('link'); setSubs({ strikeUsed: false }); show(newGame());
        showStage('invite');
        break;
      case 'previously':            // option A: Sam's move played once, with one line
        clean(); setMode('link'); setSubs({ strikeUsed: true });
        show(afterStrike());
        turnView('prev', { fresh: false });
        break;
      case 'still':                 // option B: one line, no replay
        clean(); setMode('link'); setSubs({ strikeUsed: true });
        show(afterStrike());
        turnView('still', { fresh: false });
        break;
      case 'story':                 // option C: the game opens on the move story
        clean(); setMode('link'); setSubs({ strikeUsed: true });
        show(afterStrike());
        turnView('still', { fresh: false });
        await openStory('Since your last turn', storiesBack(2));
        break;
      case 'waiting':
        clean(); setMode('live'); setSubs({ strikeUsed: false }); show(newGame());
        showStage('waiting');
        break;
      case 'words':
        liveView(afterAnswer());
        say('them', 'Oops', { persist: true });
        openWords(true);
        break;
      case 'away':
        liveView(afterAnswer());
        setPresence('them', 'away');
        ctx('Waiting for Sam', 'Sam is away. The game waits.', {
          eyebrowIcon: 'clock', before: lastStory(), fresh: false,
          action: { label: 'Finish by link', icon: 'link', run: finishByLink },
        });
        break;
      case 'reconnecting':
        liveView(afterAnswer());
        setPresence('you', 'recon');
        setPresence('them', null);          // no line: this device cannot know Sam's state
        ctx("Sam's turn", 'Your move is safe on this device.', { soft: 'Sam gets it when you are back.', before: lastStory(), fresh: false });
        break;
      case 'result':
        liveView(afterMate());
        endFrame();
        showResult(true);
        break;
      default: throw new Error(`demo.state: no state "${name}"`);
    }
    if (me !== run) return;
  },

  // The best moment: a link opens and Sam's Strike plays once with one line; you say Wow, take the archer and send.
  async play() {
    const me = ++run;
    const story = await openLink(me, { pause: 900 });
    if (!story || me !== run) return;
    ui.canMove = false;
    await wait(2200, { instant: true });
    if (me !== run) return;
    openWords(true);
    await wait(900, { instant: true });
    if (me !== run) return;
    chooseWord('Wow', { focus: false });
    await wait(1200, { instant: true });
    if (me !== run) return;
    board.selectSquare('f2');
    await wait(1000, { instant: true });
    if (me !== run) return;
    ui.canMove = true;
    await board.playMove(ANSWER);           // onMove shows "Now send your turn to Sam."
    if (me !== run) return;
    await wait(1800, { instant: true });
    if (me !== run) return;
    sentView('copied');                     // the copy path, as a script: this recording makes no real link
    await wait(2400, { instant: true });
  },

  async reset() {
    const me = ++run;
    await openLink(me, { pause: 500 });
  },
};

// The first view: a link from Sam opens, and Sam's move plays once.
window.demo.reset();
