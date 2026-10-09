// Card mode: the hand. Where six cards live without covering the board.
// A: a folded hand under your strip (the pick). B: card tops at the edge that fan up on your turn. C: coins by the king.
// The rules are the engine's card mode (lab). The hand is a proposal: the deal of six is an open owner question.
import { createBoard, KD } from '../../kit/board.js';
import { icon, emblemArt, pieceArt } from '../../kit/icons.js';
import { $, $$, animate, wait, sfx, haptic, openSheet, closeSheet, hideToast } from '../../kit/ui.js';

// The shared middle-game position P1 (idea bank 6.1), here in card mode with no king powers.
const P1 = 'r1b2mk1/2p3pp/1a2p3/pp1o4/2g1S3/A1OP4/PP1G1PPP/R1B2MK1 w - - 0 12';
// Proposed hand. Both sides get the same six cards, as in the lab's deal runs (deal-d1).
const DEAL = ['Freeze', 'Strike', 'Haste', 'Flight', 'Rally', 'Rage'];

const FREE = { short: 'Then move', long: 'Then make your move.', theirs: 'Then they make a move.', icon: 'plus' };
const TURN = { short: 'Uses turn', long: 'This uses your turn.', theirs: 'This uses their turn.', icon: 'play' };
const CARDS = {
  Freeze: { tag: 'freeze', art: 'frost', kind: 'Frost card', timing: FREE, aim: 'tap an enemy piece.', line: 'Freeze an enemy piece, not the king. It cannot move next turn.' },
  Strike: { tag: 'strike', art: 'flame', kind: 'Flame card', timing: TURN, aim: 'tap a piece, then a square.', line: 'Not a pawn or the king. Move like a queen to an empty square.' },
  Haste: { tag: 'haste', art: 'flame', kind: 'Flame card', timing: TURN, aim: 'tap a piece, then a square.', line: 'Move one piece two times. Neither move takes.' },
  Flight: { tag: 'flight', art: 'stratus', kind: 'Stratus card', timing: TURN, aim: 'tap a piece, then a square.', line: 'Not the king. Move a piece to an empty square in your half.' },
  Rally: { tag: 'rally', icon: 'flag', kind: null, timing: TURN, aim: 'tap a piece, then a square.', line: 'Move one piece, then a different piece. Neither move takes.' },
  Rage: { tag: 'rage', icon: 'swords', kind: 'Rare card', rare: true, timing: TURN, aim: 'tap a piece, then a square.', line: 'Move one piece two times. It can take on each move.' },
};
const CARD_OF_TAG = Object.fromEntries(Object.entries(CARDS).map(([name, c]) => [c.tag, name]));

// The short line of each piece (king-down-facts.md section 2; the chess pieces in plain words).
const PIECE_LINE = {
  archer: 'Shoots without moving, even over other pieces.',
  guard: 'Only a king can take it. It never takes.',
  maester: 'Swaps places with a friend next to it.',
  beast: 'After each bite, it can bite again.',
  ogre: 'Shoves a neighbour and steps into its place.',
  paladin: 'Jumps its own pieces. Taking more than a pawn costs it.',
  pawn: 'Steps forward. Takes one square forward on a diagonal.',
  knight: 'Jumps in an L, over any piece.',
  bishop: 'Slides any distance on a diagonal.',
  rook: 'Slides any distance in a straight line.',
  queen: 'Slides any distance, straight or on a diagonal.',
  king: 'Steps one square. Keep it out of check.',
};
const cap = t => t[0].toUpperCase() + t.slice(1);
// Piece names take a capital letter, as on the reading card ("their Ogre on d5").
const capPieces = t => t.replace(/\b(pawn|knight|bishop|rook|queen|king|archer|guard|maester|beast|ogre|paladin)\b/g, cap);
// The app's move sentence in "your" and "their" words (king-down-facts.md section 12).
const ours = t => capPieces(t.replace(/^White /, 'Your ').replace(/^Black /, 'Their ').replace(/ the black /g, ' their ').replace(/ the white /g, ' your '));
// A card's kicker: "Your card · Frost card", or only "Your card" for a card with no king.
const kicker = (who, name) => (CARDS[name].kind ? `${who} · ${CARDS[name].kind}` : who);

const app = $('#app');
const fresh = () => KD.fromFen(P1, { cards: [DEAL, DEAL] });
const playLans = (s, lans) => lans.reduce((st, lan) => KD.play(st, lan), s);

// ---- the view's own state ----
const ui = {
  opt: 'a',        // a: folded hand, b: at the edge, c: coins
  open: false,     // option A: the hand is open
  sel: null,       // the card the player reads
  piece: null,     // the piece the player reads: { sq, cell }
  armed: null,     // the card that marks its targets
  flash: null,     // their last card, face up in the context area: { side: 'b', name }
  faceUp: null,    // their count shows this card's face (the reveal)
  thinking: false,
  vs: false,       // true: the person plays White against the computer
  choice: null,    // a move choice in the context area: { moves, resolve }
  hint: '',
};
let run = 0;
let skipReveal = null; // set while their card turns face up: a tap or a key ends the reveal at once

// ---- art and small parts ----
function art(name, cls = '') {
  const c = CARDS[name];
  if (c.art) return `<img src="${emblemArt(c.art)}" alt="" class="${cls}">`;
  return `<span class="medal${c.rare ? ' is-rare' : ''} ${cls}">${icon(c.icon)}</span>`;
}
const star = name => (CARDS[name].rare ? icon('sparkle', { className: 'star' }) : '');

function handOf(side) { return board.state ? KD.hand(board.state, side) : []; }
function unplayed(side) { return handOf(side).filter(h => !h.played).map(h => h.card); }
function playedCards(side) { return handOf(side).filter(h => h.played).map(h => h.card); }

/** Can the person play this card now? If not, a reason in words (never colour alone). */
function cardState(name) {
  const s = board.state;
  if (!s) return { ok: false, why: 'No game', icon: 'lock' };
  const st = KD.status(s);
  if (st.over) return { ok: false, why: 'Game over', icon: 'lock' };
  if (st.turn !== 'w') return { ok: false, why: 'Their turn', icon: 'clock' };
  if (KD.legal(s).some(m => m.power === CARDS[name].tag)) return { ok: true };
  if (s.pos.free || s.pos.haste != null) return { ok: false, why: 'Next turn', long: 'One card a turn. Play it next turn.', icon: 'lock' };
  return { ok: false, why: 'No target', long: 'No piece can use it now.', icon: 'lock' };
}

// ---- the board ----
const board = createBoard($('#board'), {
  play: { level: 'casual', human: 'both' },
  label: 'King Down board in card mode. Arrow keys move, Enter or Space chooses, Escape cancels, I reads a piece.',
  choose: moves => chooseMove(moves),
  onTap(sq) {
    const s = board.state;
    if (ui.vs && s && KD.status(s).turn !== 'w') return false; // the computer's turn
    if (ui.piece) { ui.piece = null; board.clearMarks('glow'); }
    if (ui.armed === 'Freeze' && s && !KD.legal(s).some(m => m.power === 'freeze' && m.to === sq)) ui.armed = null;
    ui.hint = ''; board.clearMarks('hint');
    queueMicrotask(render);
  },
  onInspect(sq, cell) { showPiece(sq, cell); },
  onSelect() { if (ui.sel && !ui.armed) { ui.sel = null; render(); } },
  onMove(story) { afterMove(story); },
});

// Escape on the board also cancels an armed card. During their reveal, any tap or key skips to its end.
document.addEventListener('keydown', e => {
  if (skipReveal && !['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) skipReveal();
  if (e.key === 'Escape' && ui.armed) cancelArm();
}, true);
document.addEventListener('pointerdown', () => skipReveal?.(), true);

/** One tap, two moves: a card's move and a plain move share a square (Rally), or an Ogre's take or shove, or a promotion. */
function chooseMove(moves) {
  const armed = board.armed;
  let list = armed ? moves.filter(m => m.power === armed) : moves.filter(m => !m.power);
  if (!list.length) list = moves;
  if (list.length === 1) return Promise.resolve(list[0]);
  return new Promise(resolve => { ui.choice = { moves: list, resolve }; render(); });
}

// ---- rendering ----
function render() { app.dataset.open = String(ui.opt === 'a' && ui.open); renderStrips(); renderHand(); renderCtx(); }
const shownRc = () => $('#ctx .rc');

/**
 * Writes a row of card buttons. When the same cards are there, it changes each button in place
 * (aria-pressed, class, the small text): the focus stays on the button, and a screen reader hears the change.
 */
function patch(el, html) {
  const t = document.createElement('template');
  t.innerHTML = html;
  const next = [...t.content.children], prev = [...el.children];
  if (next.length !== prev.length || next.some((n, i) => n.dataset.card !== prev[i].dataset.card)) { el.replaceChildren(t.content); return; }
  next.forEach((n, i) => {
    const p = prev[i];
    for (const { name } of [...p.attributes]) if (!n.hasAttribute(name)) p.removeAttribute(name);
    for (const { name, value } of n.attributes) if (p.getAttribute(name) !== value) p.setAttribute(name, value);
    if (p.innerHTML !== n.innerHTML) p.innerHTML = n.innerHTML;
  });
}

function theirCard(name) {
  const c = CARDS[name];
  return `<div class="is-theirs">${cardCard(name, { kicker: kicker('Their card', name), foot: `<span class="rc-timing">${icon(c.timing.icon)}${c.timing.theirs}</span>`, sheen: true })}</div>`;
}

function renderStrips() {
  const s = board.state, st = s && KD.status(s);
  $('#them').classList.toggle('is-turn', !!st && !st.over && st.turn === 'b');
  $('#you').classList.toggle('is-turn', !!st && !st.over && st.turn === 'w');
  const chip = name => `<span class="pchip" title="${name}: played">${art(name)}<span>${name}</span><span class="sr-only">, played</span></span>`;
  $('#them-played').innerHTML = playedCards('b').filter(n => n !== ui.faceUp).map(chip).join('');
  $('#you-played').innerHTML = ui.opt === 'c' ? '' : playedCards('w').map(chip).join('');
  const count = $('#them-count'), n = unplayed('b').length;
  count.classList.toggle('is-face', !!ui.faceUp);
  count.innerHTML = ui.faceUp
    ? `${art(ui.faceUp)}<span>${ui.faceUp}</span>`
    : `<span class="cback" aria-hidden="true"></span><span>${n}</span><span class="sr-only"> cards in their hand</span>`;
  count.setAttribute('aria-label', ui.faceUp ? `They play ${ui.faceUp}` : `${n} cards in their hand`);
  // Option C: each card a coin by your king.
  const coins = $('#coins');
  coins.hidden = ui.opt !== 'c';
  if (ui.opt === 'c') {
    patch(coins, unplayed('w').map(name => `<button type="button" class="coin${CARDS[name].rare ? ' is-rare' : ''}" data-card="${name}" aria-pressed="${ui.sel === name}" aria-label="${name}${CARDS[name].rare ? ', rare' : ''}">${art(name)}</button>`).join(''));
  }
}

function renderHand() {
  const cards = unplayed('w');
  const toggle = $('#hand-toggle'), grid = $('#hand-grid'), fan = $('#fan');
  $('#hand').hidden = ui.opt === 'c';
  toggle.hidden = ui.opt !== 'a';
  grid.hidden = ui.opt !== 'a' || !ui.open;
  fan.hidden = ui.opt !== 'b';
  if (ui.opt === 'a') {
    toggle.setAttribute('aria-expanded', String(ui.open));
    toggle.innerHTML = `${icon('cards')}<span class="lbl"><span>Cards · <span class="num">${cards.length}</span></span></span><span class="pill">Proposed hand</span>${icon('chevron-down', { className: 'chev' })}`;
    toggle.setAttribute('aria-label', `Cards, ${cards.length} in your hand. Proposed hand.`);
    if (ui.open) {
      patch(grid, cards.map(name => {
        const c = CARDS[name], can = cardState(name);
        const sub = can.ok ? `${icon(c.timing.icon)}${c.timing.short}` : `${icon(can.icon)}${can.why}`;
        return `<button type="button" class="htab${c.rare ? ' is-rare' : ''}${can.ok ? '' : ' is-locked'}" data-card="${name}" aria-pressed="${ui.sel === name}">
          <span class="art">${art(name)}</span><span class="txt"><b>${name}${star(name)}</b><small>${sub}</small></span></button>`;
      }).join(''));
    }
  }
  if (ui.opt === 'b') {
    const n = cards.length, st = board.state && KD.status(board.state);
    fan.classList.toggle('is-resting', !st || st.over || st.turn !== 'w');
    patch(fan, cards.map((name, i) => {
      const c = CARDS[name], t = n > 1 ? i / (n - 1) - 0.5 : 0;
      const r = (t * 16).toFixed(1), y = (Math.abs(t) ** 2 * 26).toFixed(1);
      return `<button type="button" class="fcard${c.rare ? ' is-rare' : ''}" data-card="${name}" aria-pressed="${ui.sel === name}" style="--r:${r}deg;--y:${y}px">
        ${art(name)}<b>${name}</b><small>${icon(c.timing.icon)}<span class="sr-only">${c.timing.short}</span></small></button>`;
    }).join(''));
  }
}

function cardCard(name, { kicker, foot, sheen = false } = {}) {
  const c = CARDS[name];
  return `<article class="rc${c.rare ? ' is-rare' : ''}" data-kind="card" aria-label="${name} card">
    <div class="rc-art">${art(name)}</div>
    <p class="rc-kicker">${kicker}${star(name)}</p>
    <h3 class="rc-name">${name}</h3>
    <p class="rc-line">${c.line}</p>
    <div class="rc-foot">${foot}</div>
    ${sheen ? '<span class="rc-sheen" aria-hidden="true"><i></i></span>' : ''}
  </article>`;
}

function statusHtml() {
  const s = board.state;
  if (!s) return '';
  const st = KD.status(s), last = s.history.at(-1);
  if (st.over) return `<div class="status"><p class="turn">${st.text}</p></div>`;
  if (st.turn === 'b') return `<div class="status"><p class="turn">Their move</p><p class="sub">${ui.faceUp ? `They play ${ui.faceUp}.` : ui.thinking ? 'The computer thinks.' : 'Wait for their move.'}</p></div>`;
  if (st.check) {
    const by = last ? KD.describe(KD.undo(s), last.lan) : null;
    const who = by ? `their ${cap(by.piece)} on ${by.to}` : 'an enemy piece';
    return `<div class="status is-check"><p class="turn">Check</p><p class="sub">From ${who}. Keep your King safe.</p></div>${secondBeat(s)}`;
  }
  const handOpen = (ui.opt !== 'a' || ui.open) && !ui.sel && unplayed('w').length;
  const sub = ui.hint || (handOpen ? 'Tap a card to read it.' : last ? lastLine(s) : 'Hold a piece to read it.');
  return `<div class="status"><p class="turn">Your move</p><p class="sub">${sub}</p></div>${secondBeat(s)}`;
}

/** A two-step turn shows its second step: after Freeze, two dots and "Now make your move." */
function secondBeat(s) {
  const pips = '<span class="pips" aria-hidden="true"><i class="on"></i><i></i></span>';
  if (s.pos.free) return `<p class="after">${pips}Now make your move.</p>`;
  if (s.pos.haste != null) return `<div class="after">${pips}<span>Move again, or end the turn.</span><button type="button" class="btn btn-quiet" id="end-turn">End turn</button></div>`;
  return '';
}

/** The last move in "your" and "their" words (king-down-facts.md section 12). */
function lastLine(s) {
  const st = KD.describe(KD.undo(s), s.history.at(-1).lan), name = st.powerTag && CARD_OF_TAG[st.powerTag];
  const mine = st.side === 'w';
  if (name === 'Freeze') return `${mine ? 'You froze their' : 'They froze your'} ${cap(KD.board(s)[KD.sq.index(st.to)]?.type ?? 'piece')} on ${st.to}.`;
  if (name) return `${mine ? 'You played' : 'They played'} ${name}: ${mine ? 'your' : 'their'} ${cap(st.piece)} to ${st.to}.`;
  return ours(st.text);
}

function renderCtx() {
  const ctx = $('#ctx'), s = board.state;
  if (ui.choice) {
    ctx.innerHTML = `<div class="status"><p class="turn">Choose a move</p></div>
      <div class="cluster" style="margin-top:8px">${ui.choice.moves.map((m, i) => `<button type="button" class="btn" data-choice="${i}">${moveName(m)}</button>`).join('')}
      <button type="button" class="btn btn-quiet" data-choice="-1">Cancel</button></div>`;
    return;
  }
  if (ui.armed) {
    const c = CARDS[ui.armed];
    ctx.innerHTML = `<div class="armed"><span class="art">${art(ui.armed)}</span><p><b>${ui.armed}</b>: ${c.aim}</p><button type="button" class="btn btn-quiet" id="cancel-arm">Cancel</button></div>
      <p class="note">${c.timing.long}</p>`;
    return;
  }
  if (ui.piece) {
    const { sq, cell } = ui.piece, mine = cell.color === 'w';
    const src = pieceArt(cell.type, cell.color, cell.type === 'king' ? (cell.color === 'w' ? 'spirit' : 'shadow') : undefined);
    const frozen = (s?.pos.marks ?? []).some(m => m && !m.ward && m.left !== 0 && KD.sq.name(m.sq) === sq);
    // A frozen piece misses its own side's next turn: "this turn" only while it is that side's turn.
    const when = s && KD.status(s).turn === cell.color ? 'this turn' : 'next turn';
    ctx.innerHTML = `<article class="rc" data-kind="piece" aria-label="${cap(cell.type)}">
      <div class="rc-art"><img src="${src}" alt=""></div>
      <p class="rc-kicker"><span>${mine ? 'Your piece' : 'Their piece'} · <span class="sq">${sq}</span></span></p>
      <h3 class="rc-name">${cap(cell.type)}</h3>
      <p class="rc-line">${frozen ? `Frozen. It cannot move ${when}.` : PIECE_LINE[cell.type] ?? ''}</p></article>`;
    return;
  }
  if (ui.sel) {
    const c = CARDS[ui.sel], can = cardState(ui.sel);
    const foot = `<span class="rc-timing">${icon(c.timing.icon)}${c.timing.long}</span>` +
      (can.ok ? `<button type="button" class="btn btn-primary" id="use-card">Use ${ui.sel}</button>`
              : `<span class="rc-why">${icon(can.icon)}${can.long ?? can.why}</span>`);
    ctx.innerHTML = cardCard(ui.sel, { kicker: kicker('Your card', ui.sel), foot });
    return;
  }
  // Their card stays face up over the turn line until you act. Your own card leaves only a chip in your strip.
  ctx.innerHTML = (ui.flash ? theirCard(ui.flash.name) : '') + statusHtml();
}

function moveName(m) {
  if (m.shove || m.push) return `Shove to ${m.push?.to ?? m.to}`;
  if (m.promo) return `Promote to ${({ Q: 'queen', R: 'rook', B: 'bishop', N: 'knight' })[m.promo] ?? m.promo}`;
  if (m.captures?.length) return `Take on ${m.to}`;
  return `Move to ${m.to}`;
}

// ---- actions ----
function pickCard(name) {
  ui.piece = null; ui.flash = null; board.clearMarks('glow');
  ui.sel = ui.sel === name ? null : name;
  sfx.tap();
  render();
  if (ui.sel) animate(shownRc(), [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 200, easing: 'cubic-bezier(.2,.8,.2,1)' });
}

function setOpen(open) {
  ui.open = open;
  if (!open) ui.sel = null;
  render();
  if (open) animate($('#hand-grid'), [{ opacity: 0, transform: 'translateY(-6px)' }, { opacity: 1, transform: 'none' }], { duration: 220, easing: 'cubic-bezier(.2,.8,.2,1)' });
}

/** Use: the hand folds, and the board marks the card's targets (the power pattern). Returns the first target. */
function armCard(name) {
  const c = CARDS[name];
  if (!cardState(name).ok) return null;
  ui.armed = name; ui.sel = null; ui.open = false; ui.flash = null;
  board.clearSelection?.();
  board.arm(c.tag);
  const uses = KD.legal(board.state).filter(m => m.power === c.tag);
  if (c.tag !== 'freeze') {
    // A move card: light the pieces that can use it. Tap one, then a blue target.
    board.mark([...new Set(uses.map(m => m.from))], 'hint');
  }
  sfx.toggle?.();
  render();
  return c.tag === 'freeze' ? uses[0]?.to : uses[0]?.from;
}

function cancelArm() {
  const name = ui.armed;
  ui.armed = null;
  board.arm(null);
  board.clearMarks('hint');
  board.clearSelection?.();
  render();
  return name;
}

/** The keyboard goes on to the board, with the cursor on a square (the first target). */
function focusBoard(sq) {
  if (sq) { board.cursor = KD.sq.index(sq); board.moveCursorMark?.(); }
  board.el.focus({ preventScroll: true });
}

/** The one reveal: their card turns face up before its effect. A tap or a key goes to the end frame. */
async function sheen(rc) {
  const i = rc?.querySelector('.rc-sheen i');
  if (!i) return;
  await animate(i, [{ transform: 'translateX(-20%)', opacity: 0 }, { transform: 'translateX(120%)', opacity: 1, offset: 0.5 }, { transform: 'translateX(300%)', opacity: 0 }], { duration: 640, easing: 'ease-in-out', fill: 'none' });
}

async function revealTheirs(name, me) {
  ui.sel = null; ui.piece = null; ui.armed = null; ui.thinking = false;
  let skipped = false;
  const skip = new Promise(r => { skipReveal = () => { skipped = true; r(); }; });
  const step = p => Promise.race([p, skip]);
  const count = $('#them-count');
  try {
    await step(animate(count, [{ transform: 'perspective(300px) rotateY(0deg)' }, { transform: 'perspective(300px) rotateY(90deg)' }], { duration: 110, easing: 'ease-in', fill: 'none' }));
    if (me !== run) return;
    ui.faceUp = name; ui.flash = { side: 'b', name };
    render();
    sfx.power(); haptic(10);
    if (skipped) return;
    const rc = shownRc();
    animate(count, [{ transform: 'perspective(300px) rotateY(-90deg)' }, { transform: 'perspective(300px) rotateY(0deg)' }], { duration: 150, easing: 'ease-out', fill: 'none' });
    await step(Promise.all([
      animate(rc, [{ opacity: 0, transform: 'perspective(800px) rotateX(-70deg) translateY(-6px)' }, { opacity: 1, transform: 'none' }], { duration: 400, easing: 'cubic-bezier(.2,.8,.2,1)' }),
      wait(180, { instant: true }).then(() => (skipped ? null : sheen(rc))),
    ]));
    await step(wait(800, { instant: true }));
  } finally {
    skipReveal = null;
    // The end frame: the card stays face up in the context area, with no motion left.
    if (skipped) for (const el of [count, shownRc()]) el?.getAnimations({ subtree: true }).forEach(a => a.finish());
  }
}

// The frozen piece keeps a crystal ring until its turn has passed.
function drawIce() {
  const layer = board.layer;
  layer.querySelectorAll('.ice, .ice-badge').forEach(el => el.remove());
  const s = board.state;
  for (const m of s?.pos.marks ?? []) {
    if (!m || m.ward || m.left === 0) continue;
    const col = m.sq % 8, row = 7 - Math.floor(m.sq / 8);
    const el = document.createElement('div');
    el.className = 'ice';
    Object.assign(el.style, { left: `${(board.flipped ? 7 - col : col) * 12.5}%`, top: `${(board.flipped ? 7 - row : row) * 12.5}%` });
    const spokes = [0, 60, 120, 180, 240, 300].map(a => `<path d="M50 6v10M46 9l4 4 4-4" transform="rotate(${a} 50 50)"/>`).join('');
    el.innerHTML = `<svg viewBox="0 0 100 100" aria-hidden="true"><g fill="none" stroke="#e8f4ff" stroke-width="7" stroke-linecap="round" opacity=".9"><circle cx="50" cy="50" r="38" stroke-dasharray="10 7"/>${spokes}</g><g fill="none" stroke="#3f7fd0" stroke-width="3.2" stroke-linecap="round"><circle cx="50" cy="50" r="38" stroke-dasharray="10 7"/>${spokes}</g></svg>`;
    layer.appendChild(el);
    // A small crystal on the square's corner: the frozen piece reads at a glance, not by colour alone.
    const badge = document.createElement('div');
    badge.className = 'ice-badge';
    Object.assign(badge.style, { left: el.style.left, top: el.style.top });
    badge.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#e8f4ff" stroke="#3f7fd0" stroke-width="1.5"/><path d="M12 4.5v15M5.5 8.2l13 7.6M5.5 15.8l13-7.6M10 5.8l2 2 2-2M10 18.2l2-2 2 2" fill="none" stroke="#1f4f96" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    layer.appendChild(badge);
  }
}

async function afterMove(story) {
  drawIce();
  ui.hint = ''; ui.piece = null; board.clearMarks('hint'); board.clearMarks('glow');
  if (story.side === 'b') { ui.faceUp = null; render(); return; }
  ui.armed = null; ui.flash = null;
  render();
  // Your card: no second reading card. Its chip lands in your strip; the turn line shows the second step.
  const s = board.state, was = KD.hand(KD.undo(s), 'w').filter(h => h.played).length;
  if (playedCards('w').length > was) {
    const chip = [...$$('#you-played .pchip')].at(-1);
    if (chip) await animate(chip, [{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'none' }], { duration: 240, easing: 'cubic-bezier(.34,1.4,.64,1)' });
  }
  if (ui.vs && !story.again && !KD.status(board.state).over) computerTurn(run);
}

/** The computer's turn: think; if it plays a card, the card turns face up first, then the effect plays. */
async function computerTurn(me) {
  for (;;) {
    const s = board.state;
    if (!s || me !== run) return;
    const st = KD.status(s);
    if (st.over || st.turn !== 'b') break;
    ui.thinking = true; render();
    board.busy = true; // no taps or drags while it thinks
    const m = await KD.think(s, { level: 'casual', ms: 450 });
    if (me !== run || !m) return;
    const name = m.power && CARD_OF_TAG[m.power];
    if (name && unplayed('b').includes(name)) await revealTheirs(name, me);
    if (me !== run) return;
    ui.thinking = false;
    board.busy = false;
    await board.playMove(m);
  }
  ui.thinking = false;
  render();
}

// ---- wiring ----
document.addEventListener('click', e => {
  const t = e.target.closest('button');
  if (!t) return;
  if (t.id === 'hand-toggle') return setOpen(!ui.open);
  if (t.dataset.card) return pickCard(t.dataset.card);
  if (t.id === 'use-card') return focusBoard(armCard(ui.sel));
  if (t.id === 'cancel-arm') {
    const name = cancelArm();
    const back = ui.opt === 'a' ? $('#hand-toggle') : $(`#hand [data-card="${name}"], #coins [data-card="${name}"]`);
    return back ? back.focus() : focusBoard();
  }
  if (t.id === 'end-turn') { focusBoard(); return void board.pass(); }
  if (t.dataset.choice != null && ui.choice) {
    const { moves, resolve } = ui.choice, i = Number(t.dataset.choice);
    ui.choice = null; render();
    focusBoard();
    return resolve(i < 0 ? null : moves[i]);
  }
  if (t.dataset.opt && t.closest('#menu-sheet')) {
    ui.opt = t.dataset.opt; app.dataset.opt = ui.opt; ui.sel = null; ui.open = false;
    $$('#menu-sheet [data-opt]').forEach(b => b.setAttribute('aria-pressed', String(b === t)));
    render();
  }
});

$('#hint').innerHTML = `${icon('hint')}<span>Hint</span>`;
$('#undo').innerHTML = `${icon('undo')}<span>Undo</span>`;
$('#menu').innerHTML = `${icon('menu')}<span>Menu</span>`;
$('#menu-sheet [data-close]').innerHTML = icon('close');
$('#menu').addEventListener('click', () => openSheet('menu-sheet'));
$('#new-game').addEventListener('click', async () => {
  await closeSheet('menu-sheet');
  setup({ opt: ui.opt, state: KD.newGame({ army: 'random', cards: [DEAL, DEAL] }), vs: true });
});
$('#hint').addEventListener('click', async () => {
  const s = board.state;
  if (!s || board.busy || KD.status(s).over || KD.status(s).turn !== 'w') return;
  const me = run, m = await KD.think(s, { level: 'club', ms: 500 });
  if (me !== run || !m || board.state !== s) return;
  const name = m.power && CARD_OF_TAG[m.power];
  ui.hint = name ? `Hint: play ${name}. ${ours(KD.describe(s, m).text)}` : `Hint: ${ours(KD.describe(s, m).text)}`;
  board.clearMarks('hint'); board.mark([m.from, m.to], 'hint');
  ui.sel = null; ui.flash = null; ui.piece = null;
  render();
});
$('#undo').addEventListener('click', () => {
  let s = board.state;
  if (!s?.history.length) return;
  const clean = x => KD.status(x).turn === 'w' && !x.pos.free && x.pos.haste == null;
  do s = KD.undo(s); while (s.history.length && !clean(s));
  setup({ opt: ui.opt, state: s, vs: ui.vs, keepOpen: true });
});

function showPiece(sq, cell) {
  ui.piece = { sq, cell }; ui.sel = null;
  board.clearMarks('glow');
  board.mark(sq, 'glow', { colour: '255,214,128' });
  render();
  animate(shownRc(), [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 200, easing: 'cubic-bezier(.2,.8,.2,1)' });
}

/** Builds a whole view: a game, an option and a clean view state. */
function setup({ opt = 'a', state = fresh(), vs = false, keepOpen = false } = {}) {
  run++;
  hideToast();
  const sheet = $('#menu-sheet');
  if (sheet.open) sheet.close();
  if (ui.choice) { ui.choice.resolve(null); ui.choice = null; }
  Object.assign(ui, { opt, open: keepOpen ? ui.open : false, sel: null, piece: null, armed: null, flash: null, faceUp: null, thinking: false, vs, hint: '' });
  app.dataset.opt = opt;
  $$('#menu-sheet [data-opt]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.opt === opt)));
  board.play.human = 'both';
  board.arm(null);
  board.clearMarks();
  board.setState(state);
  drawIce();
  render();
}

setup({ vs: true });

// ---- the demo contract ----
window.demo = {
  async state(name) {
    switch (name) {
      case 'folded': setup(); break;
      case 'hand': setup(); ui.open = true; ui.sel = 'Freeze'; render(); break;
      case 'read': setup(); showPiece('b6', KD.board(board.state)[KD.sq.index('b6')]); break;
      case 'armed': setup(); armCard('Freeze'); break;
      case 'played': setup(); await board.playMove('!F:d5'); break;
      // One card a turn: after Freeze, the open hand shows five cards that wait, each with the reason in words.
      case 'locked': setup(); await board.playMove('!F:d5'); ui.open = true; ui.sel = 'Strike'; render(); break;
      case 'their-card': {
        setup({ state: playLans(fresh(), ['!F:d5', 'Aa3*a5']) });
        const me = run;
        await revealTheirs('Strike', me);
        if (me !== run) return;
        await board.playMove('Ab6-e3!');
        break;
      }
      // Option B on their turn: only the card tops show at the lower edge.
      case 'edge-rest': setup({ opt: 'b', state: playLans(fresh(), ['Aa3*a5']) }); break;
      case 'edge': setup({ opt: 'b' }); ui.sel = 'Freeze'; render(); break;
      case 'coins': setup({ opt: 'c' }); ui.sel = 'Freeze'; render(); break;
      default: throw new Error(`demo.state: no state "${name}"`);
    }
  },
  // Open the hand, read Freeze, use it on their Ogre, shoot; then their card turns face up: Strike, and check.
  async play() {
    setup();
    const me = run, live = () => me === run;
    await wait(800, { instant: true }); if (!live()) return;
    setOpen(true);
    await wait(800, { instant: true }); if (!live()) return;
    pickCard('Freeze');
    await wait(1500, { instant: true }); if (!live()) return;
    armCard('Freeze');
    await wait(1300, { instant: true }); if (!live()) return;
    await board.playMove('!F:d5'); if (!live()) return;
    await wait(1500, { instant: true }); if (!live()) return;
    board.selectSquare('a3');
    await wait(800, { instant: true }); if (!live()) return;
    await board.playMove('Aa3*a5'); if (!live()) return;
    ui.thinking = true; render();
    await wait(900, { instant: true }); if (!live()) return;
    await revealTheirs('Strike', me); if (!live()) return;
    await board.playMove('Ab6-e3!'); if (!live()) return;
    await wait(1600, { instant: true });
  },
  async reset() { setup({ vs: true }); },
};
