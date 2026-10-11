// Ticket 02 sample, second round: each state is one screen of the MVP, built from the web game's own parts
// (src/style.css, src/ui/table.css, src/ceremony.css, the painted scene). ?s=<state>. data.js holds the real rule texts.
import { drawGame } from './board.mjs';

const UI = '/ui/';
const q = new URLSearchParams(location.search);
const wide = innerWidth >= 900;
document.documentElement.classList.toggle('wide', wide);

const ic = n => `<svg class="icon" aria-hidden="true"><use href="#i-${n}"/></svg>`;
const PI = { P: 'pawn', N: 'knight', B: 'bishop', R: 'rook', Q: 'queen', K: 'king', A: 'archer', L: 'paladin', G: 'guard', M: 'maester', S: 'beast', O: 'ogre' };
const pi = (name, army = 'w') => `<svg class="pi pi-${army}" aria-hidden="true"><use href="${UI}icons/${name}.svg#icon"/></svg>`;
const NAME = { IceWall: 'Ice Wall', MirrorB: 'Mirror B', EarthQuake: 'Earth Quake', FireStarter: 'Fire Starter', MorphP: 'Morph P', SkyLift: 'Sky Lift', HolyLight: 'Holy Light', DeathTouch: 'Death Touch' };
const nm = c => NAME[c] ?? c;
const ART = new Set(['Freeze', 'IceWall', 'Leap', 'March', 'Mimic', 'Sacrifice', 'Salvation', 'SkyLift', 'Vault']);
const cardArt = c => ART.has(c) ? `${UI}cards/${c.toLowerCase()}.webp` : '';
const ALWAYS_ON = new Set(['HolyLight', 'Mercy', 'DeathTouch', 'Darkness', 'March']);
const KINGS = Object.keys(KD.kings);
const king = (k, b = false) => `${UI}kings/${k.toLowerCase()}${b ? '-b' : ''}.webp`;
const emblem = k => `${UI}emblems/${k.toLowerCase()}.webp`;
// The 17 preset pictures (Q13): six kings, eleven pieces. The game's round portrait shows each one.
const PRESETS = [...KINGS.map(k => king(k)), ...['pawn', 'knight', 'bishop', 'rook', 'queen', 'archer', 'paladin', 'guard', 'maester', 'beast', 'ogre'].map(p => `${UI}pieces/${p}-w.webp`)];
const portrait = (src, cls = '') => `<span class="portrait ${cls}"><img src="${src}" alt=""></span>`;
const FEAT = { fairy: 'Fairy pieces', arrange: 'Arrangement', classic: 'Classic', cards: 'Cards', powers: 'King powers' };
const feats = list => `<span class="feats" aria-label="${list.map(f => FEAT[f]).join(', ')}">${list.map(ic).join('')}</span>`;
const BADGES = [
  ['first-win', 'First Win', 'Win a game.', 1], ['friend-match', 'Friend Match', 'Finish a game with a friend.', 1],
  ['stranger-match', 'Stranger Match', 'Finish a game with a random player.', 1], ['purist', 'Purist', 'Win a Classic game.', 0],
  ['fairy-tale', 'Fairy Tale', 'Win with fairy pieces.', 1], ['architect', 'Architect', 'Win with your own arrangement.', 1],
  ['card-sharp', 'Card Sharp', 'Win a game with cards.', 0], ['crowned', 'Crowned', 'Win with a king power.', 1],
  ['royal-collection', 'Royal Collection', 'Win with all six kings.', 0], ['giant-slayer', 'Giant Slayer', 'Beat the Strong computer.', 0],
];
const PIECES = [['archer', 'Archer', 'Shoots without moving.'], ['paladin', 'Paladin', 'Jumps over its own pieces.'], ['guard', 'Guard', 'Only a king takes it.'],
  ['maester', 'Maester', 'Swaps with a friend.'], ['beast', 'Beast', 'Bites in a chain.'], ['ogre', 'Ogre', 'Shoves a neighbour.'],
  ['rook', 'Rook', 'Moves in straight lines.'], ['bishop', 'Bishop', 'Moves on diagonals.'], ['knight', 'Knight', 'Jumps in an L.'], ['queen', 'Queen', 'Moves in any line.']];

// ---- the host stand-in: ChatGPT's own header and composer (system font; not part of the app) ----
const head = (title, back = true) => `<header class="host-head">${back ? `<span class="x" aria-label="Back"><svg class="i"><use href="#i-back"/></svg></span>` : ''}<span class="app">${title}</span><span class="sp"></span><span class="x" aria-label="Close"><svg class="i"><use href="#i-close"/></svg></span></header>`;
const composer = `<div class="composer"><div class="pill"><svg class="i"><use href="#i-plus"/></svg><span>Ask anything</span><svg class="i"><use href="#i-mic"/></svg></div></div>`;
const full = (title, body, back = true) => head(title, back) + `<main class="frame">${body}</main>` + composer;

// ---- the game's sheet (index.html #new-game and #menu-sheet), here the whole fullscreen page ----
const page = (title, body, foot = '', id = 'new-game') => `<dialog open id="${id}" class="page-sheet" aria-labelledby="t-${id}">
  <header class="new-game-head"><h2 id="t-${id}">${title}</h2></header>
  <div class="new-game-body">${body}</div>${foot ? `<footer class="new-game-foot">${foot}</footer>` : ''}</dialog>`;
// A second sheet over the first, as the game's Menu sheet opens over the table.
const over = (title, body, foot = '') => `<div class="scrim"></div><dialog open id="menu-sheet" class="over-sheet" aria-labelledby="menu-title">
  <header class="sheet-head"><h2 id="menu-title">${title}</h2><button id="menu-close" aria-label="Close">×</button></header>
  <div class="sheet-body">${body}</div>${foot ? `<footer class="new-game-foot">${foot}</footer>` : ''}</dialog>`;
const row = (title, line = '', { lead = '', end = '<i>›</i>', cls = '' } = {}) => `<button class="menu-row ${lead ? 'has-lead' : ''} ${cls}">${lead}<b class="row-title">${title}</b>${line ? `<span class="line">${line}</span>` : ''}${end}</button>`;

// ---- setup: the New game sheet with the MVP toggles ----
// A toggle is the game's check row (label.check, as "Play with kings' powers"); "All" opens its sheet.
const check = (on, key, title, line, { all = '', sub = false, off = false } = {}) => `<label class="check toggle ${sub ? 'sub' : ''} ${off ? 'is-off' : ''}">
  <input type="checkbox" ${on ? 'checked' : ''}><span class="t-ico">${ic(key)}</span><span class="grow">${title} <small>${line}</small></span>${all ? `<span class="all">${all} ›</span>` : ''}</label>`;
const seg = (legend, opts, on, line = '') => `<fieldset class="seg"><legend>${legend}</legend><div class="seg-row">${opts.map(o => `<label><input type="radio" ${o === on ? 'checked' : ''}><span>${o}</span></label>`).join('')}</div></fieldset>${line ? `<p class="seg-line">${line}</p>` : ''}`;
const modes = on => `<fieldset class="modes"><legend class="sr-only">Who you play</legend>
  <label class="mode"><input type="radio" ${on === 'computer' ? 'checked' : ''}><span class="mode-art"><img src="${king('Spirit')}" alt=""></span><span class="mode-text"><b>Computer</b></span></label>
  <label class="mode"><input type="radio" ${on === 'friend' ? 'checked' : ''}><span class="mode-art"><img src="${king('Spirit')}" alt=""><img class="face-left" src="${king('Shadow', true)}" alt=""></span><span class="mode-text"><b>A friend</b></span></label>
  <label class="mode"><input type="radio" ${on === 'random' ? 'checked' : ''}><span class="mode-art emblem-fan"><img src="${emblem('Frost')}" alt=""><img src="${emblem('Flame')}" alt=""><img src="${emblem('Stratus')}" alt=""></span><span class="mode-text"><b>A random player</b></span></label></fieldset>`;
const coinBtn = (k, { size = '', state = 'always', notches = 0, spent = 0 } = {}) => `<button class="coin ${size}" data-state="${state}" aria-label="${k} King"><img src="${emblem(k)}" alt="">${notches ? `<span class="notches">${Array.from({ length: notches }, (_, i) => `<span class="notch ${i < spent ? 'is-spent' : ''}"></span>`).join('')}</span>` : ''}</button>`;

function setupBody({ fairy = true, arrange = true, classic = false, cards = true, powers = true } = {}) {
  return `${modes('computer')}
    ${seg('Computer level', ['Beginner', 'Casual', 'Club', 'Strong'], 'Club', 'Club plays a solid game.')}
    ${seg('You play', ['White', 'Black', 'Random'], 'White')}
    <h3 class="group-head">The game</h3>
    ${check(fairy, 'fairy', 'Fairy pieces', fairy ? 'Draw 7 pieces from the King Down pool.' : 'Only the chess pieces.', { all: fairy ? '10 kinds' : '' })}
    ${fairy ? check(arrange, 'arrange', 'Arrangement', 'Each player orders their own back rank.', { sub: true })
      : check(classic, 'classic', 'Classic chess', classic ? 'The normal start, castling, en passant.' : 'The chess pieces in a random order.', { sub: true })}
    ${check(cards, 'cards', 'Cards', 'Both players get the same 4 cards.', { all: cards ? '16 cards' : '' })}
    ${check(powers, 'powers', 'King powers', 'Each king brings one power.')}
    ${powers ? `<div class="king-pick your-king"><div class="coin-row">${coinBtn('Mud')}</div><div class="grow"><h3>Your king</h3><b>Mud</b> · March<p class="power-text">${KD.powers.March}</p></div><span class="chev">›</span></div>`
      : `<div class="kings-off"><img src="${king('Spirit')}" alt=""><img class="face-left" src="${king('Shadow', true)}" alt=""><p>King powers are off. White plays the Spirit King, Black the Shadow King.</p></div>`}`;
}
const startFoot = '<button class="primary">Start game</button>';

// ---- the table: the game's #game-table with its strips, context line, moves line and bar ----
const HAND = ['Vault', 'Leap', 'Salvation', 'Curse'];
// The fixtures: a FEN and the moves the engine plays from it (board.mjs). The game: Mud (March) against Shadow
// (Darkness), cards on (the hand above for each side). used: the spent cards, one bit for each hand index.
const MVP = { kings: [{ king: 'Mud', power: 'March' }, { king: 'Shadow', power: 'Darkness' }], hands: [HAND, HAND], marchUses: 0 };
const bits = list => list.reduce((n, c) => n | 1 << HAND.indexOf(c), 0);
const ME_SPENT = ['Vault', 'Leap'], THEM_SPENT = ['Vault'];
const game = (fen, play, o = {}) => ({ fen, play, rules: MVP, used: [bits(ME_SPENT), bits(THEM_SPENT)], ...o });
// Move 13: Black's pawn e6 to d5 (Darkness lets Black's pawns step on the diagonal).
const MID = 'r2gk1a1/pp1m1ppp/2p1ps2/4P3/2L5/2N2O2/PP3PPP/R2GK1A1 b - - 0 13';
const START = 'rnbgkmal/pppppppp/8/8/8/8/PPPPPPPP/RNBGKMAL w - - 0 1';
// Card mode C (web-redesign §1.1, "Coins by the king"): the power coin first, by the portrait, then one coin for each card.
const cardCoin = (c, spent) => `<button class="coin card-coin" data-state="${spent ? 'used' : 'always'}" aria-label="${nm(c)}${spent ? ', spent' : ''}">${cardArt(c) ? `<img src="${cardArt(c)}" alt="">` : `<img src="${UI}cards/back.webp" alt=""><span class="cc-word">${nm(c).slice(0, 2)}</span>`}</button>`;
const strip = (id, { pic, name, sub, power, cards, spent = [], turn }) => `<div id="${id}" class="player-strip ${turn ? 'is-turn' : ''}"><div class="coin-row">${portrait(pic)}${power ? coinBtn(power) : ''}${cards ? HAND.map(c => cardCoin(c, spent.includes(c))).join('') : ''}</div><span class="player-name"><b>${name}</b><small>${sub}</small></span></div>`;
const BAR = { draw: ['hand', 'Offer draw'], resign: ['resign', 'Resign'], menu: ['settings', 'Menu'], shuffle: ['shuffle', 'Shuffle'], ready: ['check', 'Ready'] };

// context and moves: null takes the game's own words for the board's state (board.mjs); a string is a plugin line.
function table({ id = 'b', them, me, context = null, actions = '', moves = null, bar = ['draw', 'resign', 'menu'], primary = '', disabled = [], extra = '' }) {
  return `<div id="game-table" class="mvp-table">
    <div id="board" data-board="${id}"></div>
    <div class="table-side">
      ${strip('strip-them', them)}<div class="table-space"></div>${strip('strip-me', me)}
      <div id="context-line"><div id="context-text" ${context == null ? 'data-auto' : ''}>${context ?? ''}</div><div id="context-actions">${actions}</div></div>
      <button id="moves-line"><span id="last-move" ${moves == null ? 'data-auto' : ''}><span>${moves ?? ''}</span></span><span class="moves-label">Moves <span aria-hidden="true">⌄</span></span></button>
      <nav id="table-bar">${bar.map(b => `<button class="${b === primary ? 'primary' : ''}" ${disabled.includes(b) ? 'aria-disabled="true"' : ''}>${ic(BAR[b][0])}<span class="label">${BAR[b][1]}</span></button>`).join('')}</nav>
    </div>${extra}</div>`;
}
// As the game's strips (src/ui/table.ts): each side shows its own king, Black's in black.
const ME = { pic: king('Mud'), name: 'stone_saar', sub: '1500? · White', power: 'Mud', cards: true, spent: ME_SPENT, turn: true };
const THEM = { pic: king('Shadow', true), name: 'mira_k', sub: '1540 · Black', power: 'Shadow', cards: true, spent: THEM_SPENT };
const BOARDS = {};
const board = (id, fixture) => { BOARDS[id] = fixture; return id; };

const S = {
  // The inline card in the chat (Q25): the title's kings on the stone board, the wordmark, two actions.
  home: () => `<main class="chat"><div class="thread">
      <div class="bubble">Let's play King Down</div>
      <p class="said">Here is King Down. Tap Play to start a game.</p>
      <div class="inline-card">
        <div class="title-stage" aria-hidden="true"><img class="title-floor" src="${UI}stone-board.webp" alt="">
          <div class="title-kings"><img class="tk-outer" src="${king('Mud')}" alt=""><img class="tk-inner" src="${king('Flame')}" alt=""><img class="tk-centre" src="${king('Spirit')}" alt=""><img class="tk-centre tk-right" src="${king('Shadow')}" alt=""><img class="tk-inner tk-right" src="${king('Frost')}" alt=""><img class="tk-outer tk-right" src="${king('Stratus')}" alt=""></div></div>
        <div class="title-copy"><h1 class="wordmark"><svg class="wordmark-crown" aria-hidden="true"><use href="#i-crown"/></svg><span class="wm-king">King</span> <span class="wm-down">Down</span></h1>
          <p class="inline-line">Your move in 2 games.</p>
          <div class="title-actions"><button class="primary">${ic('play')}<span class="label">Play</span></button><button>${ic('guide')}<span class="label">Your games</span></button></div></div>
      </div></div></main>` + composer,

  // Play: the New game sheet's three modes as the menu's index rows, the code field, Your games.
  play: () => full('King Down', page('Play', `
      ${row('Computer', 'Four levels, from Beginner to Strong.', { lead: `<img class="row-art" src="${king('Spirit')}" alt="">` })}
      ${row('A friend', 'Send a 6-letter code.', { lead: `<span class="row-art pair"><img src="${king('Spirit')}" alt=""><img class="face-left" src="${king('Shadow', true)}" alt=""></span>` })}
      ${row('A random player', 'Join an open game, or open your own.', { lead: `<span class="row-art fan"><img src="${emblem('Frost')}" alt=""><img src="${emblem('Flame')}" alt=""><img src="${emblem('Stratus')}" alt=""></span>` })}
      <h3 class="group-head">Join with a code</h3>
      <div class="code-row"><input class="field" value="" placeholder="K7QX2M" aria-label="Game code"><button class="join">Join</button></div>
      <h3 class="group-head">Your games</h3>
      ${row('mira_k', `Your turn · move 14 ${feats(['fairy', 'cards', 'powers'])}`, { lead: portrait(PRESETS[10]), end: '<b class="turn-mark">Your turn</b>' })}
      ${row('Waiting for an opponent', `Open for 23 hours ${feats(['fairy', 'arrange'])}`, { lead: `<span class="row-ico">${ic('clock')}</span>` })}
      ${row('Profile', 'Your scroll, rating and badges.')}
      ${row('Settings', 'Symbols only, Show threats.')}`, '', 'play-sheet'), false),

  setup: () => full('New game', page('New game', setupBody(), startFoot)),
  'setup-classic': () => full('New game', page('New game', setupBody({ fairy: false, classic: true, cards: false, powers: false }), startFoot)),

  'setup-pieces': () => full('New game', page('New game', setupBody(), startFoot) + over('Fairy pieces', `
      <p class="sheet-lead">The draw takes 7 pieces from the checked kinds. The king and the pawns are always in.</p>
      <p class="lock-note">${ic('lock')}<span>7 kinds are checked, the least the pool keeps. Check another kind to free a lock.</span></p>
      <div class="pick-list">${PIECES.map(([f, n, l], i) => {
        const on = ![2, 4, 9].includes(i);
        return `<label class="check pick ${on ? 'locked' : ''}"><span class="pick-art"><img src="${UI}pieces/${f}-w.webp" alt=""></span><span class="grow">${pi(f)} ${n} <small>${l}</small></span>${on ? `<span class="lock">${ic('lock')}</span>` : ''}<input type="checkbox" ${on ? 'checked disabled' : ''} aria-label="${n}"></label>`;
      }).join('')}</div>`, '<p class="foot-count">7 of 10 kinds</p><button class="primary">Done</button>')),

  'setup-cards': () => full('New game', page('New game', setupBody(), startFoot) + over('Cards', `
      <p class="sheet-lead">The deal takes 4 cards from the checked cards. Both players get the same 4.</p>
      <div class="card-grid">${Object.entries(KD.cards).map(([c, line], i) => {
        const on = ![9, 12, 13, 16, 18].includes(i), art = cardArt(c);
        return `<label class="card-face ${on ? '' : 'out'}"><span class="cf-art">${art ? `<img src="${art}" alt="">` : `<img class="back" src="${UI}cards/back.webp" alt="">`}</span><span class="cf-text"><b>${nm(c)}</b><small>${line}</small></span><input type="checkbox" ${on ? 'checked' : ''} aria-label="${nm(c)}"></label>`;
      }).join('')}</div>`, '<p class="foot-count">16 of 21 · at least 4</p><button class="primary">Done</button>')),

  // The king coin sheet: the game's own king picker (six emblems, then the king's powers).
  'setup-king': () => full('New game', page('New game', setupBody(), startFoot) + over('Your king', `
      <p class="lock-note">${ic('cards')}<span>Cards are on, so only the powers that are always on can play.</span></p>
      <div id="king-picker"><div class="king-pick"><h3>King · <span class="who">Mud</span></h3>
        <div class="emblems">${KINGS.map(k => {
          const ok = KD.kings[k].some(p => ALWAYS_ON.has(p));
          return `<button class="emblem ${ok ? '' : 'is-out'}" aria-pressed="${k === 'Mud'}" ${ok ? '' : 'aria-disabled="true"'}><img src="${emblem(k)}" alt=""><span class="em-name">${k}</span></button>`;
        }).join('')}</div>
        <div class="power-choice two">${KD.kings.Mud.map(p => `<button aria-pressed="${p === 'March'}" ${ALWAYS_ON.has(p) ? '' : 'aria-disabled="true"'}>${nm(p)}</button>`).join('')}</div>
        <p class="power-text"><b>March:</b> ${KD.powers.March} Always on.</p>
        <p class="power-text off"><b>Leap</b> has uses, so it cannot play with cards.</p></div></div>`, '<p class="foot-count">Mud · March</p><button class="primary">Done</button>')),

  'friend-code': () => full('Invite a friend', page('Your game code', `
      <p>Send this code to your friend.</p>
      <div class="game-code" aria-label="K 7 Q X 2 M">${[...'K7QX2M'].map(c => `<span>${c}</span>`).join('')}</div>
      <button class="primary wide-btn">${ic('copy')}<span class="label">Copy the code</span></button>
      <p class="quiet-line">Your friend says “Join King Down game K7QX2M” in ChatGPT, or types the code in Play. They need the King Down connection.</p>
      <h3 class="group-head">This game</h3>
      ${row('Waiting for your friend', 'The code works for 24 hours.', { lead: `<span class="row-ico">${ic('clock')}</span>`, end: '' })}
      ${row('Features', `${feats(['fairy', 'arrange', 'cards', 'powers'])} You play White.`, { lead: `<span class="row-ico">${ic('fairy')}</span>`, end: '' })}
      <button class="quiet wide-btn">Cancel the game</button>`)),

  seat: () => full('Set up your side', seat(false)),
  'seat-waiting': () => full('Set up your side', seat(true)),

  // White's knight selected: its moves and its take, from the engine; the context line is the game's piece text.
  board: () => full('King Down', table({ id: board('b', game(MID, ['e6-d5'], { sel: 'c3' })), them: THEM, me: ME, actions: '<button>All rules</button>' })),
  // A slider selected: the rails join each line's marks, with an arrow at the board edge, a bar before a piece, a cross on a take.
  'board-rails': () => full('King Down', table({ id: board('b', game(MID.replace('2N2O2', '2NQ1O2'), ['e6-d5'], { sel: 'd3' })), them: THEM, me: ME, actions: '<button>All rules</button>' })),
  // Check with Show threats on: the check mark and its cause line on the king, and the threat arrows (owner, 2026-10-11).
  'board-check': () => full('King Down', table({ id: board('b', game('r2gk1a1/pp1m1ppp/2p2s2/3pP3/2L2n2/2N2O2/PP3PPP/R2GK1A1 b - - 0 14', ['Nf4-d3'], { threats: true })), them: THEM, me: ME })),
  'board-abort': () => full('King Down', table({ id: board('b', { fen: START, rules: MVP }), them: { ...THEM, spent: [] }, me: { ...ME, spent: [] },
    context: '<span>Your move.</span><span>Abort ends the game with no result, until each side moves once.</span>', actions: '<button>Abort</button>' })),
  'board-claim': () => full('King Down', table({ id: board('b', game(MID, ['e6-d5', 'Nc3xd5'])), them: { ...THEM, turn: true }, me: { ...ME, turn: false },
    context: '<span>mira_k has not moved for 3 days.</span><span>You may claim the win.</span>', actions: '<button class="primary">Claim the win</button>' })),
  'board-symbols': () => full('King Down', table({ id: board('b', game('r2gk1a1/pp1m1ppp/2p2s2/3pP2n/2L5/2N2O2/PP3PPP/R2GK1A1 b - - 0 14', ['Nh5-f4'], { symbols: true, threats: true })), them: THEM, me: ME })),

  // The end: the Ceremony (web-redesign §1.1): the king lies down, "King Down" settles in, three tiles.
  // Checkmate from the engine (Black's Curse is spent, so no card saves the king); the beaten king lies down.
  end: () => full('King Down', table({ id: board('b', game('6k1/5ppp/8/8/3O4/8/5PPP/R5K1 w - - 0 31', ['Ra1-a8'], { used: [bits(ME_SPENT), bits(['Vault', 'Curse'])] })),
    them: { ...THEM, spent: ['Vault', 'Curse'], turn: false }, me: { ...ME, turn: false }, bar: [], context: '',
    extra: `<div class="scrim"></div><dialog open id="over" class="end-card" aria-labelledby="over-title">
      <div class="over-art" aria-hidden="true"><img class="over-king over-w" src="${king('Mud')}" alt=""><img class="over-king over-b" src="${king('Shadow', true)}" alt=""></div>
      <p class="over-words">King Down</p>
      <h2 id="over-title">You win</h2><p>Your rook took the Shadow King on move 31.</p>
      <div class="end-facts"><span>Rating <b>1561</b><span class="q">?</span> <small>+61</small></span><span class="new-badge"><img src="art/badge-fairy-tale.webp" alt=""><span><b>New badge</b><small>Fairy Tale</small></span></span></div>
      <p class="tiles-head">Moves to look at again</p>
      <div class="ceremony-tiles">${[['Move 18', 'Ogre shoves the guard'], ['Move 24', 'Beast bites twice'], ['Move 31 · final blow', 'Rook takes the king']].map(([b, t], i) => `<button class="ceremony-tile ${i === 1 ? 'theirs' : ''}"><b>${b}</b><span>${t}</span></button>`).join('')}</div>
      <form method="dialog"><button class="primary">Rematch</button><button>Your games</button></form>
      <p class="quiet-line">A rematch keeps the features and swaps the colours.</p></dialog>` })),

  lobby: () => full('A random player', page('Open games', `
      <p class="online">14 players online</p>
      <button class="primary wide-btn">${ic('globe')}<span class="label">Find an opponent</span></button>
      <p class="quiet-line">It takes the oldest open game, or opens yours with your features.</p>
      ${[['olek', 2, ['fairy', 'arrange', 'cards'], '2 min'], ['sun_tzu_fan', 5, ['classic'], '6 min'], ['brasska', 12, ['fairy', 'powers'], '11 min'], ['quiet.rook', 7, ['fairy', 'arrange'], '19 min']].map(([h, a, f, t]) =>
        row(h, `${feats(f)} · open ${t}`, { lead: portrait(PRESETS[a]), end: '<span class="accept">Accept</span>', cls: 'game-row' })).join('')}
      <p class="quiet-line key">${Object.entries(FEAT).map(([k, v]) => `${ic(k)} ${v}`).join(' · ')}</p>`)),

  'lobby-wait': () => full('A random player', page('Looking for an opponent', `
      <div class="wait-stage" aria-hidden="true"><img class="title-floor" src="${UI}stone-board.webp" alt=""><div class="wait-kings"><img src="${king('Spirit')}" alt=""><span class="wait-dots"><i></i><i></i><i></i></span><img class="face-left" src="${king('Shadow', true)}" alt=""></div></div>
      <p>Your game is open with these features: ${feats(['fairy', 'arrange', 'cards'])}</p>
      <p class="quiet-line">It stays open for 24 hours, also when you close ChatGPT. It shows in Your games.</p>
      <button class="primary wide-btn">${ic('play')}<span class="label">Play the computer while you wait</span></button>
      <button class="quiet wide-btn">Cancel my open game</button>`)),

  'opponent-found': () => full('King Down', table({ id: board('b', { fen: START, play: ['e2-e4'] }),
    them: { pic: king('Shadow', true), name: 'Computer', sub: 'Club · Black' }, me: { ...ME, pic: king('Spirit'), power: null, cards: false }, context: '<span>The computer is thinking.</span>' })
    + `<div class="scrim"></div><dialog open id="over" class="found" aria-labelledby="found-title">
      <div class="over-art">${portrait(PRESETS[7], 'big')}</div>
      <h2 id="found-title">Opponent found</h2><p><b>olek</b> joined your open game. Switch now? The computer game then ends with no result.</p>
      <form method="dialog"><button class="primary">Switch now</button><button>Not now</button></form></dialog>`),

  profile: () => full('Profile', profile()),
  'profile-badges': () => full('Profile', profile()),

  // Collection: the Guide's painted piece cards (src/ui/guide.ts), every one marked unlocked.
  collection: () => full('Collection', page('Collection', `
      <p>Every piece, king, power and card. All unlocked.</p>
      ${seg('Show', ['Pieces', 'Kings', 'Powers', 'Cards'], 'Pieces')}
      <div class="piece-cards">${[['pawn', 'Pawn', 'Steps forward. Takes on the diagonal.'], ...PIECES].map(([f, n, l]) => `<article class="piece-card"><div class="pc-art"><img src="${UI}pieces/${f}-w.webp" alt=""></div><div><h3>${pi(f)} ${n}</h3><dl><dt>Moves</dt><dd>${l}</dd><dt>Status</dt><dd class="unlocked">${ic('check')} Unlocked</dd></dl></div></article>`).join('')}</div>`)),

  // Settings: the Menu's Board help page (index.html), with Symbols only added beside Show threats.
  settings: () => full('Settings', page('Settings', `
      <section class="fields">
        <h3 class="group-head">Board</h3>
        <label>Symbols only <input type="checkbox"></label>
        <p class="set-line">Each piece shows as its flat symbol, not the painted figure. <span class="sym-demo"><img src="${UI}pieces/knight-w.webp" alt="Painted knight"> › ${pi('knight')}</span></p>
        <label>Show threats <input type="checkbox" checked></label>
        <p class="set-line">A red arrow points from each enemy piece to your piece it can take.</p>
      </section>
      <h3 class="group-head">You</h3>
      ${row('stone_saar', 'Name and picture', { lead: portrait(PRESETS[5]) })}
      <p class="quiet-line">Your settings and your record go with you to any device and any chat.</p>`, '', 'settings-sheet')),

  handle: () => full('Name and picture', page('Pick a name and a picture', `
      <p>Your opponents see these. Not your real name or photo.</p>
      <h3 class="group-head">Name</h3>
      <div class="code-row"><input class="field name" value="stone_saar" aria-label="Name"><span class="free">${ic('check')} Free</span></div>
      <p class="quiet-line">Each name is unique. You pick it once, at your first game against a person.</p>
      <h3 class="group-head">Picture</h3>
      <div class="presets">${PRESETS.map((p, i) => `<button class="preset" aria-pressed="${i === 5}">${portrait(p)}</button>`).join('')}</div>`, '<button class="primary">Save</button>')),
};

function seat(ready) {
  // The arrangement: the tapped piece stands in the gold glow; the game's swap mark (marks.ts) shows each piece it may
  // trade places with under the arrangement rules (board.mjs seatSwaps).
  return table({ id: board('b', { fen: '8/8/8/8/8/8/PPPPPPPP/RNBGKMAL w - - 0 1', rules: MVP, seat: 'RNBGKMAL', sel: ready ? null : 'b1', veil: 'Their side stays hidden until both players are ready.' }),
    them: { pic: king('Shadow', true), name: 'mira_k', sub: ready ? 'Choosing · 3 days left' : 'Choosing' },
    me: { pic: king('Mud'), name: 'stone_saar', sub: 'Mud · March · tap the coin to change', power: 'Mud', turn: !ready },
    context: ready ? '<span>Waiting for the other player.</span><span>mira_k has 3 days to choose.</span>' : '<span>Tap a marked piece to swap the knight with it.</span><span>The guard stays next to the king.</span>',
    moves: 'Your back rank: R N B G K M A L', bar: ['shuffle', 'ready', 'menu'], primary: ready ? '' : 'ready', disabled: ready ? ['shuffle', 'ready'] : [] });
}

function profile() {
  const rows = [
    ['', 'mira_k', 'w', '', 'Your turn · move 14', ['fairy', 'cards', 'powers'], 'turn'],
    ['', 'Open game', 'w', '', 'Waiting for an opponent', ['fairy', 'arrange'], 'open'],
    ['10 Oct', 'Computer · Club', 'w', 'W', 'King taken', ['fairy', 'arrange']],
    ['9 Oct', 'olek', 'b', 'L', 'Resigned', ['classic']],
    ['9 Oct', 'brasska', 'w', 'D', 'Draw agreed', ['fairy', 'powers']],
    ['8 Oct', 'mira_k', 'b', 'W', 'Time claim', ['fairy', 'cards']],
    ['7 Oct', 'Computer · Strong', 'w', 'L', 'King taken', ['fairy']],
  ];
  return page('stone_saar', `
    <div class="who-row">${portrait(PRESETS[5], 'big')}<div class="grow"><div class="rating"><b>1500</b><span class="q" aria-label="new rating">?</span></div><small>Rating · new until you play more games with people</small></div></div>
    <div class="split">
      <div class="scroll"><div class="totals"><div><b>23</b><span>Played</span></div><div><b>12</b><span>Won</span></div><div><b>3</b><span>Drawn</span></div><div><b>8</b><span>Lost</span></div></div>
        <ol class="rows">${rows.map(([d, who, c, r, how, f, k]) => `<li><span class="when">${d || (k === 'turn' ? '<b class="turn-mark">Turn</b>' : '<b class="open-mark">Open</b>')}</span>${pi('king', c)}<span class="grow"><b>${who}</b><small>${how}</small></span>${feats(f)}<span class="res res-${r.toLowerCase()}">${r}</span></li>`).join('')}</ol></div>
      <div class="side-col">
        <h3 class="group-head">Badges <small>6 of 10</small></h3>
        <div class="badges">${BADGES.map(([id, n, how, got]) => `<figure class="badge ${got ? '' : 'no'}" title="${how}"><img src="art/badge-${id}.webp" alt=""><figcaption>${n}</figcaption></figure>`).join('')}</div>
        ${row('Collection', 'Every piece, king, power and card.')}
        ${row('Settings', 'Symbols only, Show threats.')}
      </div>
    </div>`, '', 'profile-sheet');
}

const state = q.get('s') || 'home';
document.getElementById('app').innerHTML = (S[state] ?? S.home)();
document.body.dataset.state = state;
await document.fonts.ready;
for (const [id, fixture] of Object.entries(BOARDS)) {
  const words = await drawGame(document.querySelector(`[data-board="${id}"]`), fixture);
  const context = document.querySelector('#context-text[data-auto]'), moves = document.querySelector('#last-move[data-auto]');
  if (context) context.innerHTML = [words.context.line, words.context.note].filter(Boolean).map(t => `<span>${t}</span>`).join('');
  if (moves) moves.innerHTML = words.story;
}
if (state === 'profile-badges') document.querySelector('.new-game-body').scrollTop = 9999;
window.STATES = Object.keys(S);
