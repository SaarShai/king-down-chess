// Move story: the transcript folded under the board, told as short events with piece icons and verb marks.
// At rest: A one line (recommended), B five chips, C a count. Open: story rows; a tap replays a move as a
// ghost on the live board. Review: a scrubber with a tick for each move and a gold mark on a key moment.
import { createBoard, KD, figureArt } from '../../kit/board.js';
import { icon, pieceIcon, pieceArt } from '../../kit/icons.js';
import { $, $$, animate, wait, openSheet, closeSheet, hideToast, prefersReducedMotion } from '../../kit/ui.js';
import { GAME } from './game.js';

const YOU = 'w';
const NOW = 28; // the demo's "now": Black's Archer has just shot White's Beast; White to move
const CHAIN_PLY = 14; // White's Beast bites three pawns
const NEW = new Set(['archer', 'paladin', 'guard', 'maester', 'beast', 'ogre']);
const cap = t => t[0].toUpperCase() + t.slice(1);
const pname = t => (NEW.has(t) ? cap(t) : t);
const other = side => (side === 'w' ? 'b' : 'w');
const Own = side => (side === YOU ? 'Your' : 'Their');
const own = side => (side === YOU ? 'your' : 'their');
const NUMBER = ['no', 'one', 'two', 'three', 'four', 'five', 'six'];
const moveNo = ply => Math.floor(ply / 2) + 1;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const plain = html => html.replace(/<span[^>]*aria-hidden="true"[^>]*>[^<]*<\/span>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').replace(/ ([.,:])/g, '$1').trim();

// ---- the recorded game -------------------------------------------------------------------------
const REC = [KD.newGame({ army: GAME.army })];
for (const lan of GAME.lans) REC.push(KD.play(REC.at(-1), lan));
const KEY = new Map(GAME.moments.map(m => [m.ply, m]));

// ---- verb marks: one small glyph per verb, in the kit's stroke style ----------------------------
const GLYPH = {
  shot: 'M12 3.5v4.5M12 16v4.5M3.5 12H8M16 12h4.5M12 8.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7z',
  take: 'M6.5 6.5l11 11M17.5 6.5l-11 11',
  shove: 'M4.5 6l6 6-6 6M12 6l6 6-6 6',
  swap: 'M4 8.5h14l-3.5-3.5M20 15.5H6l3.5 3.5',
  mate: 'M4 18h16M4 18 3 8l5 4 4-6 4 6 5-4-1 10',
  power: 'M13 2.5 5 13.5h6l-1 8 8-11h-6z',
};
const glyph = (name, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${GLYPH[name]}"/></svg>`;
const pi = (type, side) => pieceIcon(type, side);

// ---- the story of a move: words, a verb mark, a small picture ----------------------------------
// Each line has eight words or fewer. New pieces have capital names (Archer, Beast); chess pieces do not.
function tell(st, pre) {
  const P = Own(st.side), q = own(other(st.side)), actor = pname(st.piece);
  const victims = st.captured.map(pname);
  let main = '', sub = '', verb = null, special = false, sq = st.to;
  if (st.kind === 'shoot') {
    main = `${P} ${actor} shoots ${q} ${victims[0]}.`;
    sub = `<span class="mini" data-mini="shot">${pi(st.piece, st.side)}<span class="ray"></span><span class="hit">${pi(st.captured[0], other(st.side))}</span></span><span>The ${actor} stays on ${st.from}.</span>`;
    verb = 'shot'; special = true; sq = st.capturedOn[0];
  } else if (st.kind === 'chain') {
    const n = st.captured.length, same = st.captured.every(t => t === st.captured[0]);
    main = `${P} ${actor} bites <span class="times" aria-hidden="true">×${n}</span><span class="sr-only">${NUMBER[n] ?? n} times.</span>`;
    const where = same ? `${cap(pname(st.captured[0]))}s on ${st.capturedOn.join(', ')}.`
      : `${st.captured.map((t, k) => `${pname(t)} ${st.capturedOn[k]}`).join(', ')}.`;
    sub = `<span class="mini" data-mini="chain">${pi(st.piece, st.side)}<span class="bites">${st.captured.map(t => pi(t, other(st.side))).join('')}</span></span><span>${cap(where)}</span>`;
    verb = 'bite'; special = true; sq = st.to;
  } else if (st.kind === 'push') {
    const cell = KD.board(pre)[KD.sq.index(st.push.from)];
    const whose = cell ? own(cell.color) : q;
    main = `${P} ${actor} shoves ${whose} ${pname(st.push.piece)}.`;
    const steps = st.to !== st.from ? ` The ${actor} follows.` : '';
    sub = `<span class="mini" data-mini="shove">${pi(st.piece, st.side)}${glyph('shove', 'arrow shove')}<span class="pushed">${pi(st.push.piece, cell?.color ?? other(st.side))}</span></span><span>It goes to ${st.push.to}.${steps}</span>`;
    verb = 'shove'; special = true; sq = '';
  } else if (st.kind === 'swap') {
    main = `${P} ${actor} swaps with ${own(st.side)} ${pname(st.swap.with)}.`;
    sub = `<span class="mini" data-mini="swap"><span class="a">${pi(st.piece, st.side)}</span>${glyph('swap', 'arrow swap')}<span class="b">${pi(st.swap.with, st.side)}</span></span><span>They change places: ${st.from} and ${st.to}.</span>`;
    verb = 'swap'; special = true; sq = '';
  } else if (st.leaves) {
    main = `${P} Paladin takes ${q} ${victims[0]}.`;
    sub = '<span>The Paladin leaves the board.</span>';
    verb = 'take'; special = true;
  } else if (st.promo) {
    main = `${P} pawn becomes a ${st.promo}.`;
    verb = 'mate'; special = true;
  } else if (st.kind === 'capture') {
    main = `${P} ${actor} takes ${q} ${victims[0]}.`;
    verb = 'take';
  } else if (st.kind === 'power') {
    main = `${P} king uses ${st.power}.`;
    verb = 'power'; special = true;
  } else {
    main = `${P} ${actor} moves to ${st.to}.`;
    sq = '';
  }
  if (st.mate) {
    sub = `<span class="key">${glyph('mate', 'arrow')}Checkmate. ${st.side === YOU ? 'You win.' : 'They win.'}</span>`;
    special = true; verb = verb ?? 'mate';
  } else if (st.check) main += ' <span class="check">Check</span>';
  const badgeHtml = verb ? `<span class="badge v-${verb}">${glyph(verb === 'bite' ? 'take' : verb)}</span>` : ''; // a bite is a take
  return { main, sub, verb, special, sq, badgeHtml, take: st.kind === 'capture' };
}

// ---- stories of a game, kept as the game grows ---------------------------------------------------
let cache = { states: [REC[0]], stories: [] };
function storiesOf(state) {
  const lans = state.history.map(h => h.lan);
  const same = cache.stories.length <= lans.length && cache.stories.every((st, i) => st.lan === lans[i]);
  if (!same) cache = { states: [REC[0]], stories: [] };
  if (cache.states[0].backRank !== state.backRank && state.history.length) {
    // a game not from this army: rebuild its states from the start
    const chain = [state];
    while (chain[0].history.length) chain.unshift(KD.undo(chain[0]));
    cache = { states: [chain[0]], stories: [] };
  }
  for (let i = cache.stories.length; i < lans.length; i++) {
    const st = KD.describe(cache.states[i], lans[i]);
    cache.stories.push(st);
    cache.states.push(st.next);
  }
  return cache;
}

// ---- the page ---------------------------------------------------------------------------------
const view = { rest: 'line', open: false, review: null, beside: 'square' }; // beside: none, square, letters
let live = REC[NOW];       // the game outside review
let playCfg = { level: 'casual', human: YOU, ms: 500, pause: 450 };
let focusPly = null;       // the row that shows its ghost

const board = createBoard($('#board'), {
  play: { ...playCfg },
  label: 'King Down board. You play White. Arrow keys move, Enter or Space chooses, Escape cancels.',
  onTap() { clearGhost(); if (view.review != null) return false; },
  onMove(st) { live = board.state; render({ fresh: true }); },
});

$('#por-w').src = pieceArt('king', 'w');
$('#por-b').src = pieceArt('king', 'b');
const label = (el, name, text) => { el.innerHTML = `${icon(name)}<span>${text}</span>`; };
label($('#hint'), 'hint', 'Hint');
label($('#undo'), 'undo', 'Undo');
label($('#menu'), 'menu', 'Menu');
label($('#to-review'), 'eye', 'Review');
$('#close-story').innerHTML = icon('chevron-down');
$('#rv-prev').innerHTML = icon('back');
$('#rv-next').innerHTML = icon('chevron');
$('#menu-sheet [data-close]').innerHTML = icon('close');

function shown() { return view.review != null ? cache.states[view.review] : live; }

// ---- plates ----
function renderPlates() {
  const s = shown(), { stories } = storiesOf(live);
  const upto = view.review != null ? view.review : stories.length;
  for (const side of ['w', 'b']) {
    const took = {};
    for (const st of stories.slice(0, upto)) if (st.side === side) for (const t of st.captured) took[t] = (took[t] ?? 0) + 1;
    const html = Object.entries(took).map(([t, n]) => `${pi(t, other(side))}${n > 1 ? `<span>×${n}</span>` : ''}`).join('');
    const words = Object.entries(took).map(([t, n]) => `${n} ${t}${n > 1 ? 's' : ''}`).join(', ');
    const el = $(`#took-${side}`);
    el.innerHTML = html;
    el.setAttribute('aria-label', words ? `Took: ${words}` : 'Took nothing yet');
    el.setAttribute('role', 'img');
  }
  const st = KD.status(s), turn = $('#turn');
  turn.classList.toggle('is-over', st.over || view.review != null);
  turn.textContent = view.review != null ? 'Review' : st.over ? (st.winner === YOU ? 'You win' : st.winner ? 'They win' : 'Draw')
    : st.turn === YOU ? `Your move${st.check ? ': check' : ''}` : 'Their move';
}

// ---- A, B, C at rest ----
function renderRest({ fresh = false } = {}) {
  const { stories, states } = storiesOf(live);
  const last = stories.at(-1), ply = stories.length - 1;
  const box = $('#rest');
  if (!last) { box.innerHTML = '<p class="muted">Tap a piece to see its moves.</p>'; return; }
  const t = tell(last, states[ply]);
  const count = moveNo(ply);
  if (view.rest === 'line') {
    box.innerHTML = `<button type="button" class="line" aria-expanded="false" aria-controls="panel" aria-label="Last move: ${esc(plain(t.main))} Open the story.">
      <span class="pic">${pi(last.piece, last.side)}${t.badgeHtml}</span>
      <span class="say">${t.main}</span><span class="num">Move ${count}</span>${icon('chevron-down', { className: 'chev' })}</button>`;
    $('.line', box).addEventListener('click', () => openStory());
    if (fresh) {
      animate($('.say', box), [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 160, easing: 'cubic-bezier(.2,.8,.2,1)' });
      animate($('.pic', box), [{ transform: 'scale(.7)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 200, easing: 'cubic-bezier(.34,1.4,.64,1)' });
    }
  } else if (view.rest === 'chips') {
    const from = Math.max(0, stories.length - 5);
    const chips = stories.slice(from).map((st, k) => {
      const i = from + k, tt = tell(st, states[i]);
      return `<li><button type="button" class="mchip${st.side === YOU ? '' : ' theirs'}${i === ply ? ' is-last' : ''}" data-ply="${i}"
        aria-label="Move ${moveNo(i)}: ${esc(plain(tt.main))} Show it on the board.">${pi(st.piece, st.side)}${tt.badgeHtml}</button></li>`;
    }).join('');
    box.innerHTML = `<div class="chips"><ol aria-label="Last five moves">${chips}</ol>
      <button type="button" class="btn btn-quiet open-story" aria-expanded="false" aria-controls="panel">Story ${icon('chevron-down')}</button></div>
      <p class="chip-say" id="chip-say" aria-live="polite"></p>`;
    $('.open-story', box).addEventListener('click', () => openStory());
    $$('.mchip', box).forEach(b => b.addEventListener('click', () => {
      const i = +b.dataset.ply;
      $$('.mchip', box).forEach(x => x.classList.toggle('is-on', x === b));
      $('#chip-say').textContent = plain(tell(stories[i], states[i]).main);
      void ghost(i);
    }));
    if (fresh) {
      const all = $$('.mchip', box);
      animate(all.at(-1), [{ opacity: 0, transform: 'translateX(14px) scale(.85)' }, { opacity: 1, transform: 'none' }], { duration: 200, easing: 'cubic-bezier(.2,.8,.2,1)' });
      all.slice(0, -1).forEach(el => animate(el, [{ transform: 'translateX(52px)' }, { transform: 'none' }], { duration: 200, easing: 'cubic-bezier(.2,.8,.2,1)' }));
    }
  } else {
    box.innerHTML = `<div class="pillrow"><button type="button" class="count" aria-expanded="false" aria-controls="panel" aria-label="${count} moves. Open the story.">
      ${icon('moves')}<span>${count} moves</span>${icon('chevron-down')}</button></div>`;
    $('.count', box).addEventListener('click', () => openStory());
  }
}

// ---- the open story ----
function rowHtml(st, i, pre, { over = false } = {}) {
  const t = tell(st, pre);
  const key = over && KEY.get(i);
  const lan = view.beside === 'letters' ? st.lan : view.beside === 'square' ? t.sq : '';
  const keyLine = key ? `<span class="sub"><span class="key"><span class="diamond"></span>Key moment.</span><span>Better: ${betterText(i)}.</span></span>` : '';
  const cls = ['mv', t.special ? 'is-special' : '', key ? 'is-key' : ''].filter(Boolean).join(' ');
  const n = st.side === 'w' || i === 0 ? moveNo(i) : '';
  return `<li><button type="button" class="${cls}" data-ply="${i}" aria-label="Move ${moveNo(i)}, ${st.side === 'w' ? 'White' : 'Black'}: ${esc(plain(t.main + ' ' + t.sub + ' ' + keyLine))}">
    <span class="n">${n}</span><span class="pic">${pi(st.piece, st.side)}${t.badgeHtml}</span>
    <span class="t"><span class="main">${t.main}</span>${t.sub ? `<span class="sub">${t.sub}</span>` : ''}${keyLine}<span class="onboard sub">${icon('eye')}Replay on the board</span></span>
    <span class="sq${view.beside === 'letters' ? ' lan' : ''}">${esc(lan)}</span></button></li>`;
}
function betterText(i) {
  const km = KEY.get(i);
  if (!km?.better) return '';
  const s = KD.describe(cache.states[i], km.better);
  return s.kind === 'move' ? `${s.piece} ${s.from} to ${s.to}` : plain(tell(s, cache.states[i]).main).replace(/\.$/, '');
}

function renderList({ fresh = false, enter = false } = {}) {
  const { stories, states } = storiesOf(live);
  const over = KD.status(live).over && isRecorded();
  const list = $('#list');
  list.innerHTML = stories.map((st, i) => rowHtml(st, i, states[i], { over })).join('');
  $('#story-count').textContent = stories.length ? `${moveNo(stories.length - 1)} moves` : '';
  $$('.mv', list).forEach(b => b.addEventListener('click', () => {
    const i = +b.dataset.ply;
    if (view.review != null) { enterReview(i + 1); return; }
    $$('.mv', list).forEach(x => x.classList.toggle('is-on', x === b));
    focusPly = i;
    void ghost(i);
  }));
  const lastRow = $$('.mv', list).at(-1);
  if (view.review == null) lastRow?.classList.add('is-last');
  if (view.review != null) markReviewRow();
  else list.scrollTop = list.scrollHeight;
  if (enter) {
    // Rows enter one at a time, newest first, so the move that matters arrives first.
    const rows = visibleRows().reverse();
    rows.forEach((li, k) => animate(li, [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }],
      { duration: 160, delay: k * 60, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' }));
    rows.forEach((li, k) => { const b = $('.mv', li); if (b.classList.contains('is-special')) setTimeout(() => playMini(b), 160 + k * 60); });
  } else if (fresh && lastRow) {
    animate(lastRow.parentElement, [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 160, easing: 'cubic-bezier(.2,.8,.2,1)' });
    if (lastRow.classList.contains('is-special')) playMini(lastRow);
  }
}
function visibleRows() {
  const list = $('#list'), r = list.getBoundingClientRect();
  return $$('li', list).filter(li => { const b = li.getBoundingClientRect(); return b.bottom > r.top && b.top < r.bottom; });
}
const isRecorded = () => live.backRank === GAME.army && live.history.every((h, i) => h.lan === GAME.lans[i]);

/** The small picture of a special row plays once: the shot reaches, the bites add up, the shove pushes. */
function playMini(row) {
  const mini = $('.mini', row);
  if (!mini || prefersReducedMotion()) return;
  const kind = mini.dataset.mini, ease = 'cubic-bezier(.2,.8,.2,1)';
  if (kind === 'shot') {
    animate($('.ray', mini), [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: 200, easing: 'ease-in' });
    animate($('.hit', mini), [{ opacity: 0.35, transform: 'scale(1.25)' }, { opacity: 1, transform: 'none' }], { duration: 200, delay: 180, easing: ease, fill: 'backwards' });
  } else if (kind === 'chain') {
    const bites = $$('.bites .pi', mini), times = $('.times', row), n = bites.length;
    bites.forEach((b, k) => animate(b, [{ opacity: 0, transform: 'scale(.4)' }, { opacity: 1, transform: 'none' }], { duration: 160, delay: k * 140, easing: 'cubic-bezier(.34,1.4,.64,1)', fill: 'backwards' }));
    if (times) for (let k = 1; k <= n; k++) setTimeout(() => { times.textContent = `×${k}`; }, (k - 1) * 140);
  } else if (kind === 'shove') {
    animate($('.pushed', mini), [{ transform: 'translateX(-7px)' }, { transform: 'none' }], { duration: 220, easing: ease });
  } else if (kind === 'swap') {
    animate($('.a', mini), [{ transform: 'translateX(38px)' }, { transform: 'none' }], { duration: 240, easing: ease });
    animate($('.b', mini), [{ transform: 'translateX(-38px)' }, { transform: 'none' }], { duration: 240, easing: ease });
  }
}

function setExpanded(on) { $$('#rest [aria-expanded]').forEach(b => b.setAttribute('aria-expanded', String(on))); }
function openStory({ enter = true, focus = true } = {}) {
  view.open = true;
  $('#panel').hidden = false;
  $('#story').classList.add('is-open');
  setExpanded(true);
  renderList({ enter });
  if (enter) animate($('#panel'), [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 200, easing: 'cubic-bezier(.2,.8,.2,1)' });
  if (focus) $('#close-story').focus({ preventScroll: true });
}
function closeStory({ focus = true } = {}) {
  view.open = false;
  clearGhost();
  $('#panel').hidden = true;
  $('#story').classList.remove('is-open');
  renderRest();
  setExpanded(false);
  if (focus) $('#rest button')?.focus({ preventScroll: true });
}
$('#close-story').addEventListener('click', () => closeStory());
$('#to-review').addEventListener('click', () => enterReview(storiesOf(live).stories.length));

// ---- the ghost: a move plays again, see-through, over the live board ----
let ghostEl = null, ghostGen = 0, ghostTimer = 0;
function clearGhost() {
  ghostGen++;
  clearTimeout(ghostTimer);
  ghostEl?.remove(); ghostEl = null;
  $$('.kdb-fig.is-dim').forEach(f => f.classList.remove('is-dim'));
  $$('.mv.is-on, .mchip.is-on').forEach(b => b.classList.remove('is-on'));
}
/** A see-through figure. cls: 'moves' (a dashed ring: it moves in the replay), 'victim' or 'then' (it stood near). */
function ghostFig(cell, sq, cls = 'moves') {
  const { src, box } = figureArt(cell), { col, row } = board.colRow(sq);
  const el = document.createElement('div');
  el.className = `gh-fig ${cls}`;
  Object.assign(el.style, { left: `${col * 12.5}%`, top: `${row * 12.5}%`, zIndex: String(10 + row * 3) });
  const ring = cls === 'moves' ? '<span class="gh-ring"></span>' : '';
  if (box) el.innerHTML = `${ring}<img alt="" src="${src}" class="${box.mirror ? 'mirror' : ''}" style="left:${box.left * 100}%;top:${box.top * 100}%;width:${box.width * 100}%;height:${box.height * 100}%">`;
  return el;
}
const sameCell = (a, b) => !!a && !!b && a.type === b.type && a.color === b.color;
const centre = sq => { const { col, row } = board.colRow(sq); return [col * 100 + 50, row * 100 + 58]; };
function segment(svg, a, b, { colour = 'rgba(43,38,33,.9)', dash = '3 11', width = 4.5 } = {}) {
  const [x1, y1] = centre(a), [x2, y2] = centre(b);
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.innerHTML = `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="rgba(251,247,238,.85)" stroke-width="${width + 4}" stroke-linecap="round" stroke-dasharray="${dash}"/>
    <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${colour}" stroke-width="${width}" stroke-linecap="round" stroke-dasharray="${dash}"/>`;
  svg.appendChild(g);
  return g;
}
function num(layer, sq, html) {
  const { col, row } = board.colRow(sq);
  const el = document.createElement('span');
  el.className = 'gh-num';
  Object.assign(el.style, { left: `${(col * 100 + 82) / 8}%`, top: `${(row * 100 + 84) / 8}%`, zIndex: '90' });
  el.innerHTML = html;
  layer.appendChild(el);
  return el;
}

/** Replay ply i as a ghost. hold: keep the end frame (a still state); else it fades after 1.6 s. */
async function ghost(i, { hold = false } = {}) {
  clearGhost();
  const gen = ghostGen;
  const { stories, states } = storiesOf(live);
  const st = stories[i], pre = states[i];
  if (!st) return;
  const cells = KD.board(pre), at = sq => cells[KD.sq.index(sq)];
  const g = document.createElement('div');
  g.className = 'gh';
  g.innerHTML = '<svg viewBox="0 0 800 800" preserveAspectRatio="none" aria-hidden="true"></svg>';
  board.layer.appendChild(g);
  ghostEl = g;
  const svg = $('svg', g);
  const involved = new Set([st.from, st.to, ...st.capturedOn, ...(st.push ? [st.push.from, st.push.to] : [])]);
  // The replay is "then", not "now". Dim each live figure that did not stand on its square before this move,
  // and show the pieces that then stood next to the path as faint figures. The live board does not move.
  const now = KD.board(live);
  for (let k = 0; k < 64; k++) {
    const sq = KD.sq.name(k);
    if (now[k] && (involved.has(sq) || !sameCell(now[k], cells[k]))) board.figure(sq)?.classList.add('is-dim');
  }
  const near = new Set();
  for (const p of [st.from, st.to, ...st.capturedOn, ...(st.push ? [st.push.to] : [])]) {
    const k = KD.sq.index(p), f = k & 7, r = k >> 3;
    for (let df = -1; df <= 1; df++) for (let dr = -1; dr <= 1; dr++) {
      if (f + df >= 0 && f + df < 8 && r + dr >= 0 && r + dr < 8) near.add((r + dr) * 8 + f + df);
    }
  }
  for (const k of near) {
    const sq = KD.sq.name(k);
    if (cells[k] && !involved.has(sq) && !sameCell(now[k], cells[k])) g.appendChild(ghostFig(cells[k], sq, 'then'));
  }
  $$(`.mv[data-ply="${i}"], .mchip[data-ply="${i}"]`).forEach(b => b.classList.add('is-on'));
  $('#say').textContent = `On the board: ${plain(tell(st, pre).main)}`;

  const mover = ghostFig(at(st.from), st.from);
  const victims = st.capturedOn.map(sq => ghostFig(at(sq), sq, 'victim'));
  const pushed = st.push ? ghostFig(at(st.push.from), st.push.from) : null;
  const partner = st.kind === 'swap' ? ghostFig(at(st.to), st.to) : null;
  [...victims, pushed, partner, mover].forEach(el => el && g.appendChild(el));
  if (st.kind !== 'shoot') {
    // where the move began: a small ring, so the eye finds the start after the ghost has moved on
    const [x, y] = centre(st.from), ring = document.createElement('span');
    ring.className = 'gh-start';
    Object.assign(ring.style, { left: `${x / 8}%`, top: `${y / 8}%`, zIndex: '5' });
    g.appendChild(ring);
  }
  const instant = prefersReducedMotion();
  const ease = 'cubic-bezier(.45,.05,.3,1)';
  const slide = (el, a, b, ms = 320) => {
    const p = board.colRow(a), q = board.colRow(b);
    const to = `translate(${(q.col - p.col) * 100}%, ${(q.row - p.row) * 100}%)`;
    if (instant) { el.style.transform = to; return Promise.resolve(); }
    return el.animate([{ transform: el.style.transform || 'none' }, { transform: to }], { duration: ms, easing: ease, fill: 'forwards' }).finished.then(() => { el.style.transform = to; }).catch(() => {});
  };
  const fadeIn = el => animate(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 160, easing: 'ease-out' });
  const fall = el => animate(el, [{ opacity: 1, transform: 'none' }, { opacity: 0.45, transform: 'translateY(3%) scale(.94)' }], { duration: 200, easing: 'ease-in', fill: 'forwards' });
  const pop = el => animate(el, [{ transform: 'scale(0)' }, { transform: 'none' }], { duration: 200, easing: 'cubic-bezier(.34,1.56,.64,1)' });
  const still = () => gen !== ghostGen;

  await fadeIn(g);
  if (still()) return;
  if (st.kind === 'shoot') {
    const seg = segment(svg, st.from, st.capturedOn[0], { colour: '#b3261e', dash: '10 7', width: 4 });
    await animate(seg, [{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: 'ease-in' });
    if (still()) return;
    await Promise.all([fall(victims[0]), pop(num(g, st.capturedOn[0], glyph('shot')))]);
  } else if (st.kind === 'chain') {
    let from = st.from;
    for (let n = 0; n < st.capturedOn.length; n++) {
      const sq = st.capturedOn[n], seg = segment(svg, from, sq);
      void animate(seg, [{ opacity: 0 }, { opacity: 1 }], { duration: 240 });
      await slide(mover, st.from, sq, 300);
      if (still()) return;
      void fall(victims[n]);
      await pop(num(g, sq, String(n + 1)));
      if (still()) return;
      from = sq;
    }
    if (from !== st.to) { segment(svg, from, st.to); await slide(mover, st.from, st.to); }
  } else if (st.kind === 'push') {
    segment(svg, st.push.from, st.push.to, { colour: '#1d6f66', dash: '10 7' });
    await Promise.all([slide(pushed, st.push.from, st.push.to, 300), wait(70).then(() => (st.to !== st.from ? slide(mover, st.from, st.to, 300) : null))]);
  } else if (st.kind === 'swap') {
    segment(svg, st.from, st.to, { colour: '#6a4c9c', dash: '10 7' });
    await Promise.all([slide(mover, st.from, st.to), slide(partner, st.to, st.from)]);
  } else {
    segment(svg, st.from, st.to);
    await Promise.all([slide(mover, st.from, st.to), victims[0] ? wait(instant ? 0 : 200).then(() => fall(victims[0])) : null]);
  }
  if (still() || hold) return;
  ghostTimer = setTimeout(async () => {
    if (still()) return;
    await animate(g, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'forwards' });
    if (!still()) clearGhost();
  }, 1600);
}

// ---- review: the scrubber ----
let betterEl = null;
function clearBetter() { betterEl?.remove(); betterEl = null; }
/** The better move at a key moment: its own arrow and a "Better" tag, on the position after the mistake.
 *  It is not the Hint mark, because it is the move that the other side did not play. */
function drawBetter(move) {
  clearBetter();
  const c = sq => { const { col, row } = board.colRow(sq); return [col * 100 + 50, row * 100 + 50]; };
  const [x1, y1] = c(move.from), [x2, y2] = c(move.to);
  const len = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / len, uy = (y2 - y1) / len;
  const [ax, ay] = [x1 + ux * 36, y1 + uy * 36], [bx, by] = [x2 - ux * 30, y2 - uy * 30]; // starts clear of the piece
  const head = `${x2 - ux * 8},${y2 - uy * 8} ${bx - uy * 17},${by + ux * 17} ${bx + uy * 17},${by - ux * 17}`;
  const el = document.createElement('div');
  el.className = 'better';
  el.innerHTML = `<svg viewBox="0 0 800 800" preserveAspectRatio="none" aria-hidden="true">
    <line x1="${ax}" y1="${ay}" x2="${bx}" y2="${by}" class="b-halo"/><polygon points="${head}" class="b-halo"/>
    <line x1="${ax}" y1="${ay}" x2="${bx}" y2="${by}" class="b-line"/><polygon points="${head}" class="b-head"/></svg>
    <span class="better-tag" aria-hidden="true">Better</span>`;
  const { col, row } = board.colRow(move.to);
  Object.assign($('.better-tag', el).style, { left: `${(col + 0.5) * 12.5}%`, top: `${(row + 0.92) * 12.5}%` });
  board.layer.appendChild(el);
  betterEl = el;
}
function enterReview(k) {
  clearGhost();
  clearBetter();
  const { stories } = storiesOf(live);
  k = Math.max(0, Math.min(stories.length, k));
  const first = view.review == null;
  view.review = k;
  if (first) { playCfg = { ...board.play }; }
  board.play = null; // no moves in review
  board.setState(cache.states[k]);
  const km = k > 0 && KD.status(live).over && isRecorded() ? KEY.get(k - 1) : null;
  if (km?.better) {
    const b = KD.legal(cache.states[k - 1]).find(m => m.lan === km.better);
    if (b) drawBetter(b);
  }
  $('#story').classList.add('is-review');
  $('#review').hidden = false;
  $('#panel').hidden = false; // desktop shows the list beside the scrubber
  renderReview();
  renderList();
  render();
}
function exitReview() {
  if (view.review == null) return;
  clearBetter();
  view.review = null;
  board.play = { ...playCfg };
  board.setState(live);
  $('#story').classList.remove('is-review');
  $('#review').hidden = true;
  if (!view.open) $('#panel').hidden = true;
  render();
  (view.open ? $('#to-review') : $('#rest button'))?.focus({ preventScroll: true });
}
function renderReview() {
  const { stories, states } = storiesOf(live), k = view.review, n = stories.length;
  const over = KD.status(live).over && isRecorded();
  const range = $('#scrub');
  range.max = String(n); range.value = String(k);
  range.setAttribute('aria-valuetext', k ? `Move ${moveNo(k - 1)}` : 'Start');
  const ticks = $('#ticks');
  ticks.innerHTML = `<span class="fill" style="width:${n ? (k / n) * 100 : 0}%"></span>` + stories.map((st, i) => {
    // Plain ticks; a special move is a taller ink tick; only a key moment has a mark (the gold diamond).
    const kind = st.mate ? 'end' : over && KEY.has(i) ? 'key' : ['shoot', 'chain', 'push', 'swap'].includes(st.kind) ? 'sp' : '';
    return `<span class="tk ${kind}" style="left:${((i + 1) / n) * 100}%"></span>`;
  }).join('');
  const line = $('#rv-line');
  if (!k) line.innerHTML = '<b>The start of the game.</b><span class="sub">Same army for both sides.</span>';
  else {
    const st = stories[k - 1], t = tell(st, states[k - 1]), km = over && KEY.get(k - 1);
    const sub = km ? `<span class="key"><span class="diamond"></span>Key moment.</span><span>Better: ${betterText(k - 1)}.</span>`
      : t.sub || '';
    line.innerHTML = `<b>${t.main}</b>${sub ? `<span class="sub">${sub}</span>` : ''}`;
  }
  $('#rv-pos').textContent = k ? `Move ${moveNo(k - 1)} of ${moveNo(n - 1)}` : `Start · ${moveNo(n - 1)} moves`;
  $('#rv-prev').disabled = k <= 0;
  $('#rv-next').disabled = k >= n;
}
function markReviewRow() {
  const list = $('#list'), k = view.review;
  $$('.mv', list).forEach(b => b.classList.toggle('is-on', +b.dataset.ply === k - 1));
  const on = $('.mv.is-on', list);
  if (on) list.scrollTop = Math.max(0, on.parentElement.offsetTop - list.clientHeight / 2 + on.offsetHeight / 2);
}
$('#scrub').addEventListener('input', e => enterReview(+e.target.value));
$('#rv-prev').addEventListener('click', () => enterReview(view.review - 1));
$('#rv-next').addEventListener('click', () => enterReview(view.review + 1));
$('#rv-back').addEventListener('click', () => exitReview());

// ---- the bar ----
$('#hint').addEventListener('click', async () => {
  if (view.review != null) return;
  const s = live, st = KD.status(s);
  if (st.over || !board.isHuman(st.turn)) return;
  const m = await KD.think(s, { level: 'club', ms: 400 });
  if (!m || board.state !== s) return;
  board.clearMarks('hint');
  board.mark([m.from, ...m.path], 'hint');
  $('#say').textContent = `Hint: ${plain(tell(KD.describe(s, m), s).main)}`;
});
$('#undo').addEventListener('click', () => {
  if (view.review != null || !live.history.length) return;
  const st = KD.status(live);
  const plies = board.isHuman(st.turn) && board.play.human !== 'both' ? 2 : 1;
  let back = live;
  for (let i = 0; i < plies && back.history.length; i++) back = KD.undo(back);
  show(back, { human: board.play.human });
});
$('#menu').addEventListener('click', () => openSheet('menu-sheet'));
$$('#rest-pick [data-rest]').forEach(b => b.addEventListener('click', () => {
  view.rest = b.dataset.rest;
  $$('#rest-pick [data-rest]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  if (!view.open) renderRest({ fresh: true });
}));
$$('#beside-pick [data-beside]').forEach(b => b.addEventListener('click', () => {
  view.beside = b.dataset.beside;
  $$('#beside-pick [data-beside]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  renderList();
}));

function render({ fresh = false } = {}) {
  renderPlates();
  const st = KD.status(live);
  $('#hint').disabled = view.review != null || st.over || !board.isHuman(st.turn);
  if (view.review != null) { $('#undo').disabled = true; return; }
  if (view.open) renderList({ fresh }); else renderRest({ fresh });
  $('#undo').disabled = !live.history.length;
}

/** Show a game: stop the old one, close what is open. */
function show(state, { human = YOU } = {}) {
  clearGhost();
  clearBetter();
  if (view.review != null) { view.review = null; $('#story').classList.remove('is-review'); $('#review').hidden = true; }
  board.play = { ...playCfg, human };
  playCfg = { ...board.play };
  live = state;
  board.setState(state);
  board.clearMarks('hint');
  render();
}
/** A clean view of the recorded game at ply. human: YOU (the Casual computer answers), or 'both' for a script. */
function base(ply, rest = 'line', human = YOU) {
  hideToast();
  if ($('#menu-sheet').open) { $('#menu-sheet').classList.remove('is-closing'); $('#menu-sheet').close(); }
  view.rest = rest;
  $$('#rest-pick [data-rest]').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.rest === rest)));
  view.open = false;
  $('#panel').hidden = true;
  $('#story').classList.remove('is-open');
  show(REC[ply], { human });
}

show(REC[NOW]);

// ---- the demo contract ----
let run = 0;
const settle = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
window.demo = {
  async state(name) {
    run++;
    switch (name) {
      case 'line': base(NOW, 'line'); break;
      case 'chips': base(NOW, 'chips'); break;
      case 'pill': base(NOW, 'pill'); break;
      case 'story': base(NOW, 'line'); openStory({ focus: false }); break;
      case 'ghost': {
        base(NOW, 'line');
        openStory({ enter: false, focus: false });
        await settle();
        const row = $(`.mv[data-ply="${CHAIN_PLY}"]`), list = $('#list');
        row.classList.add('is-on'); // its "On the board" line shows before the scroll is measured
        list.style.scrollBehavior = 'auto';
        list.scrollTop = Math.max(0, row.parentElement.offsetTop - list.clientHeight + row.offsetHeight + 8);
        list.style.scrollBehavior = '';
        await ghost(CHAIN_PLY, { hold: true });
        break;
      }
      case 'scrub': {
        base(REC.length - 1, 'line');
        openStory({ enter: false, focus: false });
        enterReview(GAME.moments[0].ply + 1);
        break;
      }
      default: throw new Error(`demo.state: no state "${name}"`);
    }
    await settle();
  },
  // The best moment: their Archer shoots, the line tells it; the story opens; the Beast's old chain plays again as a ghost.
  async play() {
    const me = ++run;
    const alive = () => me === run;
    base(NOW - 2, 'line', 'both'); // a script: no computer reply while it plays the recorded moves
    await wait(700, { instant: true });
    for (const lan of GAME.lans.slice(NOW - 2, NOW)) { // ends on REC[NOW]: their Archer's shot
      if (!alive()) return;
      await board.playMove(lan);
      await wait(700, { instant: true });
    }
    if (!alive()) return;
    await wait(800, { instant: true }); // the line holds the shot for about 1.5 s
    if (!alive()) return;
    $('#rest .line')?.focus({ preventScroll: true });
    await wait(500, { instant: true });
    if (!alive()) return;
    openStory();
    await wait(1100, { instant: true });
    if (!alive()) return;
    const row = $(`.mv[data-ply="${CHAIN_PLY}"]`), list = $('#list');
    row.classList.add('is-on');
    list.scrollTo({ top: Math.max(0, row.parentElement.offsetTop - list.clientHeight + row.offsetHeight + 8), behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    await wait(700, { instant: true });
    if (!alive()) return;
    row.focus({ preventScroll: true });
    await ghost(CHAIN_PLY, { hold: true });
    await wait(2000, { instant: true });
    if (!alive()) return;
    show(board.state, { human: YOU }); // White to move: the person plays on against the Casual computer
    closeStory();
    await wait(600, { instant: true });
  },
  async reset() {
    run++;
    base(NOW, view.rest);
  },
};
