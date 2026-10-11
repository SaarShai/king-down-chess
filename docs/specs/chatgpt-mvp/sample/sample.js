// Ticket 02 sample: each state is one screen of the MVP. ?s=<state>. data.js comes from the real rule texts.
const UI = '/public/ui/';
const q = new URLSearchParams(location.search);
const wide = innerWidth >= 900;
document.documentElement.classList.toggle('wide', wide);

const ic = (n, cls = 'i') => `<svg class="${cls}"><use href="#i-${n}"/></svg>`;
const pieceIcon = n => `<svg class="pi" viewBox="0 0 48 48"><use href="#pi-${n}"/></svg>`;
const FILE = { P: 'pawn', N: 'knight', B: 'bishop', R: 'rook', Q: 'queen', A: 'archer', L: 'paladin', G: 'guard', M: 'maester', S: 'beast', O: 'ogre' };
const fig = (l, kings = { w: 'mud', b: 'shadow' }) => {
  const w = l === l.toUpperCase(), t = l.toUpperCase();
  return t === 'K' ? `${UI}kings/${w ? kings.w : kings.b + '-b'}.webp` : `${UI}pieces/${FILE[t]}-${w ? 'w' : 'b'}.webp`;
};
const NAME = { IceWall: 'Ice Wall', MirrorB: 'Mirror B', EarthQuake: 'Earth Quake', FireStarter: 'Fire Starter', MorphP: 'Morph P', SkyLift: 'Sky Lift', HolyLight: 'Holy Light', DeathTouch: 'Death Touch' };
const nm = c => NAME[c] ?? c;
const ART = new Set(['Freeze', 'IceWall', 'Leap', 'March', 'Mimic', 'Sacrifice', 'Salvation', 'SkyLift', 'Vault']);
const cardArt = c => ART.has(c) ? `${UI}cards/${c.toLowerCase()}.webp` : '';
const ALWAYS_ON = new Set(['HolyLight', 'Mercy', 'DeathTouch', 'Darkness', 'March']);
const coin = (king, cls = '') => `<span class="coin ${cls}"><img class="em" src="${UI}emblems/${king.toLowerCase()}.webp" alt=""><img class="fr" src="art/coin-frame.webp" alt="${king} king"></span>`;
const avatar = (src, cls = '') => `<span class="avatar ${cls}" style="background-image:url(${src})"></span>`;
const PRESETS = [...['spirit', 'shadow', 'frost', 'flame', 'stratus', 'mud'].map(k => `${UI}kings/${k}.webp`),
  ...['pawn', 'knight', 'bishop', 'rook', 'queen', 'archer', 'paladin', 'guard', 'maester', 'beast', 'ogre'].map(p => `${UI}pieces/${p}-w.webp`)];
const FEAT = { fairy: 'Fairy pieces', arrange: 'Arrangement', classic: 'Classic', cards: 'Cards', powers: 'King powers' };
const feats = list => `<span class="feat" aria-label="${list.map(f => FEAT[f]).join(', ')}">${list.map(f => ic(f)).join('')}</span>`;
const BADGES = [
  ['first-win', 'First Win', 'Win a game.', 1], ['friend-match', 'Friend Match', 'Finish a game with a friend.', 1],
  ['stranger-match', 'Stranger Match', 'Finish a game with a random player.', 1], ['purist', 'Purist', 'Win a Classic game.', 0],
  ['fairy-tale', 'Fairy Tale', 'Win with fairy pieces.', 1], ['architect', 'Architect', 'Win with your own arrangement.', 1],
  ['card-sharp', 'Card Sharp', 'Win a game with cards.', 0], ['crowned', 'Crowned', 'Win with a king power.', 1],
  ['royal-collection', 'Royal Collection', 'Win with all six kings.', 0], ['giant-slayer', 'Giant Slayer', 'Beat the Strong computer.', 0],
];

// A board from 8 rank strings, rank 8 first; '.' is empty. marks: { sq: 'sel'|'mv'|'last'|'threat' } with 'e2' squares.
function board(ranks, { kings, marks = {}, veil = '', sym = false } = {}) {
  let html = '';
  for (const [sq, m] of Object.entries(marks)) for (const cls of m.split(' ')) {
    const f = sq.charCodeAt(0) - 97, r = +sq[1] - 1;
    html += `<div class="sq ${cls}" style="left:${f * 12.5}%;top:${(7 - r) * 12.5}%"></div>`;
  }
  ranks.forEach((row, i) => [...row].forEach((l, f) => {
    if (l === '.') return;
    const t = l.toUpperCase(), name = t === 'K' ? 'king' : FILE[t];
    html += sym
      ? `<div class="p" style="left:${f * 12.5}%;top:${i * 12.5 + 1.5}%;height:9.5%;align-items:center"><svg class="pi ${l === t ? '' : 'pb'}" style="width:78%;height:100%;${l === t ? '' : '--pi-disc:#4a4850;--pi-ring:#6e6a74;--pi-glyph:#f3ead7'}" viewBox="0 0 48 48"><use href="#pi-${name}"/></svg></div>`
      : `<div class="p" style="left:${f * 12.5}%;top:${i * 12.5 - 3.4}%"><img src="${fig(l, kings)}" alt="${l === t ? 'White' : 'Black'} ${name}"></div>`;
  }));
  return `<div class="boardwrap"><div class="board">${html}${veil ? `<div class="veil">${veil}</div>` : ''}</div></div>`;
}
const MID = ['r..gk.a.', 'pp.m.ppp', '..p..s..', '...pP...', '..L.....', '..N..O..', 'PP...PPP', 'R..GK.A.'];
const START = ['nolmkgar', 'pppppppp', '........', '........', '........', '........', 'PPPPPPPP', 'RAGKMLON'];
const HAND = ['Vault', 'Leap', 'Salvation', 'Curse'];
const mini = (c, spent) => `<span class="mini ${spent ? 'spent' : ''}" style="${cardArt(c) ? `background-image:url(${cardArt(c)})` : ''}" title="${nm(c)}${spent ? ' (spent)' : ''}">${cardArt(c) ? '' : nm(c)}</span>`;
const hand = spent => `<span class="hand" aria-label="Hand">${HAND.map(c => mini(c, c === spent)).join('')}</span>`;

const head = (title, back = true) => `<header class="host-head">${back ? `<span class="x" aria-label="Back">${ic('back')}</span>` : ''}<span class="app">${title}</span><span class="sp"></span><span class="x" aria-label="Close">${ic('close')}</span></header>`;
const composer = `<div class="composer"><div class="pill">${ic('plus')}<span>Ask anything</span>${ic('mic')}</div></div>`;
const full = (title, body, extra = '', back = true) => head(title, back) + `<main class="screen">${body}</main>` + extra + composer;

function setupRows({ fairy = true, arrange = true, classic = false, cards = true, powers = true } = {}) {
  const t = (on, key, title, line, all, sub) => `<div class="item ${on ? 'on' : ''} ${sub ? 'sub-item' : ''}"><span class="ico">${ic(key)}</span><div class="grow"><h3>${title}</h3><p class="sub">${line}</p></div>${all && on ? `<span class="allbtn">All${ic('chev')}</span>` : ''}<span class="switch ${on ? 'on' : ''}" role="switch" aria-checked="${on}" aria-label="${title}"></span></div>`;
  return `<div class="list">
    ${t(fairy, 'fairy', 'Fairy pieces', fairy ? 'Draw 7 pieces from the King Down pool.' : 'Use only the chess pieces.', true)}
    ${fairy ? t(arrange, 'arrange', 'Arrangement', 'Each player orders their own back rank.', false, true)
      : t(classic, 'classic', 'Classic chess', classic ? 'Real chess: the normal start, castling, en passant.' : 'The chess pieces in a random order.', false, true)}
    ${t(cards, 'cards', 'Cards', 'Both players get the same 4 cards.', true)}
    ${t(powers, 'powers', 'King powers', 'Each king carries one power.', false)}
  </div>`;
}
function setupBody(opts = {}) {
  const powers = opts.powers ?? true;
  return `<div class="col">
    <div><h1>New game</h1><p class="sub">Against the computer</p></div>
    <div class="label">Your colour</div><div class="seg"><span class="on">White</span><span>Black</span><span>Random</span></div>
    <div class="label">Level</div><div class="seg"><span>Beginner</span><span>Casual</span><span class="on">Club</span><span>Strong</span></div>
    <div class="label">Game</div>${setupRows(opts)}
    ${powers ? `<div class="list"><div class="item">${coin('Mud', 'sm')}<div class="grow"><h3>Your king</h3><p class="sub">Mud · March</p></div><span class="chev">${ic('chev')}</span></div></div>`
      : `<p class="tiny">King powers are off: White plays the Spirit King, Black the Shadow King.</p>`}
    <button class="btn primary block">Start game</button>
  </div>`;
}
const sheet = (title, sub, body, foot) => `<div class="scrim"></div><section class="sheet" role="dialog" aria-label="${title}"><div class="grab"></div><div class="col"><div class="sheet-head"><div class="grow"><h2>${title}</h2><p class="sub">${sub}</p></div><span class="x" aria-label="Close">${ic('close')}</span></div>${body}</div>${foot ? `<div class="sheet-foot">${foot}</div>` : ''}</section>`;

const PIECES = [['archer', 'Archer', 'Shoots without moving'], ['paladin', 'Paladin', 'Jumps over its own pieces'], ['guard', 'Guard', 'Only a king takes it'],
  ['maester', 'Maester', 'Swaps with a friend'], ['beast', 'Beast', 'One bite per turn'], ['ogre', 'Ogre', 'Shoves a neighbour'],
  ['rook', 'Rook', 'Moves in straight lines'], ['bishop', 'Bishop', 'Moves on diagonals'], ['knight', 'Knight', 'Jumps in an L'], ['queen', 'Queen', 'Moves in any line']];

const S = {
  home: () => `<main class="screen chat"><div class="thread">
      <div class="bubble">Let's play King Down</div>
      <p class="said">Here is King Down. Tap Play to start a game.</p>
      <div class="inline">
        <div class="hero"><img src="${UI}kings/spirit.webp" alt="Spirit King" style="left:5%"><img src="${UI}pieces/beast-w.webp" alt="" style="left:27%;height:118px"><img src="${UI}pieces/ogre-b.webp" alt="" style="right:25%;height:120px"><img src="${UI}kings/shadow-b.webp" alt="Shadow King" style="right:5%"></div>
        <div class="body"><div class="row"><div class="grow"><h2>King Down</h2><p class="sub">Your move in 2 games</p></div></div>
        <div class="actions"><button class="btn primary">Play</button><button class="btn">Your games</button></div></div>
      </div></div></main>` + composer,

  play: () => full('King Down', `<div class="col">
      <h1>Play</h1>
      <div class="list">
        <div class="item on"><span class="ico">${ic('cpu')}</span><div class="grow"><h3>Computer</h3><p class="sub">Four levels, from Beginner to Strong.</p></div><span class="chev">${ic('chev')}</span></div>
        <div class="item"><span class="ico">${ic('friend')}</span><div class="grow"><h3>A friend</h3><p class="sub">Send a 6-letter code.</p></div><span class="chev">${ic('chev')}</span></div>
        <div class="item"><span class="ico">${ic('globe')}</span><div class="grow"><h3>A random player</h3><p class="sub">Join an open game or open your own.</p></div><span class="chev">${ic('chev')}</span></div>
      </div>
      <div class="label">Join with a code</div>
      <div class="row"><span class="field ph">K7QX2M</span><button class="btn">Join</button></div>
      <div class="label">Your games</div>
      <div class="list">
        <div class="item">${avatar(PRESETS[10])}<div class="grow"><h3>mira_k</h3><p class="sub">Move 14 · ${feats(['fairy', 'cards', 'powers'])}</p></div><span class="chip turn">Your turn</span></div>
        <div class="item"><span class="ico">${ic('clock')}</span><div class="grow"><h3>Waiting for an opponent</h3><p class="sub">Open for 23 h · ${feats(['fairy', 'arrange'])}</p></div></div>
      </div>
      <div class="row"><button class="btn quiet grow">${ic('user')}Profile</button><button class="btn quiet grow">${ic('gear')}Settings</button></div>
    </div>`, '', false),

  setup: () => full('New game', setupBody()),
  'setup-classic': () => full('New game', setupBody({ fairy: false, classic: true, cards: false, powers: false })),

  'setup-pieces': () => full('New game', setupBody(), sheet('Fairy pieces', 'The draw takes 7 pieces from the checked kinds. The king and the pawns are always in.',
    `<div class="note">${ic('lock')}<span>7 kinds are checked, the least the pool keeps. Check another kind to free a lock.</span></div>
     <div class="grid">${PIECES.map(([f, n, l], i) => {
       const on = ![2, 4, 9].includes(i);
       return `<div class="pick ${on ? 'locked' : ''}"><img class="fig" src="${UI}pieces/${f}-w.webp" alt=""><div class="t"><b>${n}</b><span>${l}</span></div><span class="box ${on ? 'locked' : ''}" role="checkbox" aria-checked="${on}" aria-disabled="${on}" aria-label="${n}">${on ? ic('lock') : ''}</span></div>`;
     }).join('')}</div>`, `<span class="grow sub">7 of 10 kinds</span><button class="btn primary">Done</button>`)),

  'setup-cards': () => full('New game', setupBody(), sheet('Cards', 'The deal takes 4 cards from the checked cards. Both players get the same 4.',
    `<div class="cardgrid">${Object.entries(KD.cards).map(([c, line], i) => {
       const on = ![9, 12, 13, 16, 18].includes(i);
       const art = cardArt(c);
       return `<div class="cface ${on ? '' : 'out'}"><div class="art" style="${art ? `background-image:url(${art})` : ''}">${art ? '' : ic('cards')}</div><div class="nm">${nm(c)}</div><div class="ln">${line}</div><span class="box ${on ? 'on' : ''}" role="checkbox" aria-checked="${on}" aria-label="${nm(c)}">${on ? ic('check') : ''}</span></div>`;
     }).join('')}</div>`, `<span class="grow sub">16 of 21 · at least 4</span><button class="btn primary">Done</button>`)),

  'setup-king': () => full('New game', setupBody(), sheet('Your king', 'Pick a king, then one of its two powers.',
    `<div class="note">${ic('cards')}<span>Cards are on, so only powers that are always on can play.</span></div>
     <div class="label">1 · King</div>
     <div class="grid" style="grid-template-columns:repeat(${wide ? 6 : 3},minmax(0,1fr))">${Object.entries(KD.kings).map(([k, ps]) => {
       const ok = ps.some(p => ALWAYS_ON.has(p));
       return `<div class="badge ${ok ? '' : 'no'}" style="gap:6px">${coin(k, `lg ${ok ? '' : 'off'} ${k === 'Mud' ? 'sel' : ''}`)}<b>${k}</b><span class="tiny">${ok ? ps.filter(p => ALWAYS_ON.has(p)).map(nm).join(', ') : 'No power with cards'}</span></div>`;
     }).join('')}</div>
     <div class="label">2 · Power of the Mud King</div>
     <div class="list">${KD.kings.Mud.map(p => {
       const ok = ALWAYS_ON.has(p);
       return `<div class="item ${p === 'March' ? 'on' : ''}" style="${ok ? '' : 'opacity:.5'}"><span class="box ${p === 'March' ? 'on' : ''}" style="border-radius:50%" role="radio" aria-checked="${p === 'March'}" ${ok ? '' : 'aria-disabled="true"'}>${p === 'March' ? ic('check') : ''}</span><div class="grow"><h3>${nm(p)}${ok ? ' · always on' : ''}</h3><p class="sub">${ok ? KD.powers[p] : 'Not with cards: it has uses.'}</p></div></div>`;
     }).join('')}</div>`, `<span class="grow sub">Mud · March</span><button class="btn primary">Done</button>`)),

  'friend-code': () => full('Invite a friend', `<div class="col">
      <h1>Your game code</h1>
      <div class="code">K7QX2M</div>
      <button class="btn primary block">${ic('copy')}Copy code</button>
      <p class="sub">Your friend says “Join King Down game K7QX2M” in ChatGPT, or types the code in Play → Join. They need the King Down connection.</p>
      <div class="list"><div class="item"><span class="ico">${ic('clock')}</span><div class="grow"><h3>Waiting for your friend</h3><p class="sub">The code works for 24 hours.</p></div></div>
      <div class="item"><span class="ico">${ic('eye')}</span><div class="grow"><h3>Game features</h3><p class="sub">${feats(['fairy', 'arrange', 'cards', 'powers'])} You play White.</p></div></div></div>
      <button class="btn">Cancel game</button>
    </div>`),

  seat: () => full('Set up your side', seat(false)),
  'seat-waiting': () => full('Set up your side', seat(true)),

  board: () => full('King Down', game({ marks: { c4: 'sel', b5: 'mv', a6: 'mv', d5: 'mv threat', e6: 'mv', d3: 'mv', e2: 'mv' }, status: 'Your move · move 14', acts: ['Resign', 'Offer draw'] })),
  'board-abort': () => full('King Down', game({ ranks: START, status: 'Your move · move 1', acts: ['Resign', 'Offer draw', 'Abort'], spent: { me: null, them: null }, note: 'Abort ends the game with no result. It works until each side moves once.' })),
  'board-claim': () => full('King Down', game({ status: 'mira_k has not moved for 3 days', acts: ['Resign', 'Offer draw', 'Claim the win'], turn: 'them' })),
  'board-symbols': () => full('King Down', game({ sym: true, status: 'Your move · move 14', acts: ['Resign', 'Offer draw'], marks: { e5: 'threat', c4: 'threat' }, note: 'Symbols only and Show threats are on (Settings).' })),

  end: () => full('King Down', game({ status: '', acts: [] }), `<div class="scrim"></div><div class="dialog end" role="dialog" aria-label="Game over">
      <img class="k" src="${UI}kings/mud.webp" alt="Mud King">
      <h1>You win</h1><p class="sub">You took the Shadow King · move 31</p>
      <p>Rating <b>1561</b><span class="q">?</span> <span class="sub">(+61)</span></p>
      <div class="newbadge"><img src="art/badge-fairy-tale.webp" alt=""><div><b>New badge: Fairy Tale</b><p class="tiny">Win with fairy pieces.</p></div></div>
      <div class="actions" style="width:100%"><button class="btn primary">Rematch</button><button class="btn">Your games</button></div>
      <p class="tiny">A rematch keeps the features and swaps the colours.</p></div>`),

  lobby: () => full('A random player', `<div class="col">
      <div class="row"><h1 class="grow">Open games</h1><span class="tiny">14 players online</span></div>
      <button class="btn primary block">Find an opponent</button>
      <p class="tiny">Takes the oldest open game, or opens yours with your features.</p>
      <div class="list">${[['olek', 2, 'Fairy, cards', ['fairy', 'arrange', 'cards'], '2 min'], ['sun_tzu_fan', 5, 'Classic', ['classic'], '6 min'], ['brasska', 12, 'Fairy, powers', ['fairy', 'powers'], '11 min'], ['quiet.rook', 7, 'Fairy', ['fairy', 'arrange'], '19 min']].map(([h, a, , f, t]) =>
        `<div class="item">${avatar(PRESETS[a])}<div class="grow"><h3>${h}</h3><p class="sub">${feats(f)} · ${t}</p></div><button class="btn sm">Accept</button></div>`).join('')}</div>
      <p class="tiny">Each game shows its features: ${['fairy', 'arrange', 'classic', 'cards', 'powers'].map(f => `${ic(f, 'i')} ${FEAT[f]}`).join(' · ')}.</p>
    </div>`),

  'lobby-wait': () => full('A random player', `<div class="col" style="text-align:center;align-items:stretch">
      <div class="wait" role="img" aria-label="Waiting"></div>
      <h1>Looking for an opponent</h1>
      <p class="sub">Your game is open with these features: ${feats(['fairy', 'arrange', 'cards'])}</p>
      <p class="sub">It stays open for 24 hours, also when you close ChatGPT. It shows in Your games.</p>
      <button class="btn primary block">Play the computer while you wait</button>
      <button class="btn block">Cancel my open game</button>
    </div>`),

  'opponent-found': () => full('King Down', game({ ranks: START.map((r, i) => i === 6 ? 'PPP.PPPP' : i === 4 ? '...P....' : r), status: 'Computer · Club', acts: ['Resign'], opp: ['Computer · Club', PRESETS[16]], cards: false }), `<div class="scrim"></div><div class="dialog" role="dialog" aria-label="Opponent found">
      ${avatar(PRESETS[7], 'lg')}<h1>Opponent found</h1><p class="sub"><b>olek</b> joined your open game. Switch now? The computer game then ends with no result.</p>
      <div class="actions" style="width:100%"><button class="btn primary">Switch now</button><button class="btn">Not now</button></div></div>`),

  profile: () => full('Profile', profile()),
  'profile-badges': () => full('Profile', profile()),

  collection: () => full('Collection', `<div class="col">
      <div><h1>Collection</h1><p class="sub">Every piece, king, power and card. All unlocked.</p></div>
      <div class="seg"><span class="on">Pieces</span><span>Kings</span><span>Powers</span><span>Cards</span></div>
      <div class="grid">${[['pawn', 'Pawn', 'Steps forward, takes on the diagonal'], ...PIECES].map(([f, n, l]) =>
        `<div class="pick"><img class="fig" src="${UI}pieces/${f}-w.webp" alt=""><div class="t"><b>${n}</b><span>${l}</span></div><span class="chip ok">${ic('check')}</span></div>`).join('')}</div>
      <div class="label">Kings</div>
      <div class="grid">${Object.entries(KD.kings).map(([k, ps]) => `<div class="pick">${coin(k, 'sm')}<div class="t"><b>${k}</b><span>${ps.map(nm).join(' · ')}</span></div><span class="chip ok">${ic('check')}</span></div>`).join('')}</div>
    </div>`),

  settings: () => full('Settings', `<div class="col">
      <h1>Settings</h1>
      <div class="list">
        <div class="item"><span class="ico">${ic('target')}</span><div class="grow"><h3>Symbols only</h3><p class="sub">Show each piece as its flat symbol, not the painted figure.</p></div><span class="switch" role="switch" aria-checked="false" aria-label="Symbols only"></span></div>
        <div class="item sub-item" style="padding-left:62px"><div class="symdemo"><img src="${UI}pieces/knight-w.webp" alt="Painted knight"><span class="chev">${ic('chev')}</span>${pieceIcon('knight')}</div></div>
        <div class="item on"><span class="ico">${ic('eye')}</span><div class="grow"><h3>Show threats</h3><p class="sub">Mark your pieces that the opponent can take.</p></div><span class="switch on" role="switch" aria-checked="true" aria-label="Show threats"></span></div>
      </div>
      <div class="label">You</div>
      <div class="list"><div class="item">${avatar(PRESETS[5])}<div class="grow"><h3>stone_saar</h3><p class="sub">Name and picture</p></div><span class="chev">${ic('chev')}</span></div></div>
      <p class="tiny">Your settings and record follow you to any device and any chat.</p>
    </div>`),

  handle: () => full('Name and picture', `<div class="col">
      <div><h1>Pick a name and a picture</h1><p class="sub">Your opponents see these. Not your real name or photo.</p></div>
      <div class="label">Name</div>
      <div class="row"><span class="field" style="letter-spacing:0">stone_saar</span><span class="chip ok">${ic('check')} Free</span></div>
      <p class="tiny">Each name is unique. You pick it once, at your first game against a person.</p>
      <div class="label">Picture</div>
      <div class="presets">${PRESETS.map((p, i) => `<span class="avatar ${i === 5 ? 'sel' : ''}" role="radio" aria-checked="${i === 5}" style="background-image:url(${p})"></span>`).join('')}</div>
      <button class="btn primary block">Save</button>
    </div>`),
};

function seat(ready) {
  const ranks = ['........', 'pppppppp', '........', '........', '........', '........', 'PPPPPPPP', 'RAGKMLON'];
  return `<div class="game">
    ${board(ranks, { marks: ready ? {} : { b1: 'sel', g1: 'mv' }, veil: 'Their side stays hidden until both players are ready.' })}
    <div class="side">
      <div class="bar">${coin('Mud')}<div class="who"><b>Your king: Mud</b><span class="tiny">March · tap to change</span></div><span class="chip">${ic('clock')} 3 days</span></div>
      <p class="status">${ready ? 'Waiting for the other player…' : 'Tap two pieces to swap them.'}</p>
      <div class="note">${ic('check')}<span>Bishops on opposite colours. The guard next to the king.</span></div>
      <div class="actions"><button class="btn" ${ready ? 'aria-disabled="true"' : ''}>${ic('shuffle')}Shuffle</button><button class="btn primary" ${ready ? 'aria-disabled="true"' : ''}>${ready ? `${ic('check')}Ready` : 'Ready'}</button></div>
      ${ready ? `<p class="tiny" style="text-align:center">mira_k is choosing. They have 3 days.</p>` : ''}
    </div></div>`;
}

function game({ ranks = MID, marks = { d4: 'last', d5: 'last' }, status, acts, turn = 'me', spent = { me: 'Leap', them: 'Vault' }, opp = ['mira_k · 1540', PRESETS[10]], cards = true, note = '', sym = false }) {
  const icons = { Resign: 'flag', 'Offer draw': 'hand', Abort: 'x-circle', 'Claim the win': 'clock' };
  const them = `<div class="bar">${avatar(opp[1])}<div class="who"><b>${opp[0]}</b>${cards ? hand(spent.them) : ''}</div>${cards ? coin('Shadow', 'sm') : ''}</div>`;
  const me = `<div class="bar">${avatar(PRESETS[5])}<div class="who"><b>stone_saar · 1500?</b>${cards ? hand(spent.me) : ''}</div>${cards ? coin('Mud', 'sm') : ''}</div>`;
  const act = `<div class="gameacts">${acts.map(a => `<button class="btn ${a === 'Claim the win' ? 'primary' : ''}">${ic(icons[a])}${a}</button>`).join('')}</div>`;
  return `<div class="game">
    ${wide ? '' : them}
    ${board(ranks, { marks, sym })}
    <div class="side">${wide ? them : ''}${wide ? '' : me}
      <div class="mid">${status ? `<p class="status">${status}</p>` : ''}${act}
      ${note ? `<p class="tiny" style="text-align:center">${note}</p>` : ''}
      ${wide && cards ? `<p class="tiny" style="text-align:center">Both hands are open. A crossed card is spent for its player. The coin is the king's power: tap it to read.</p>` : ''}</div>
      ${wide ? me : ''}
    </div></div>`;
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
  return `<div class="col profile">
    <div class="row">${avatar(PRESETS[5], 'lg')}<div class="grow"><h1>stone_saar</h1><div class="rating"><b>1500</b><span class="q" aria-label="new rating">?</span><span class="tiny">Rating · new until more games with people</span></div></div></div>
    <div class="split">
      <div class="scroll"><div class="totals"><div><b>23</b><span>Played</span></div><div><b>12</b><span>Won</span></div><div><b>3</b><span>Drawn</span></div><div><b>8</b><span>Lost</span></div></div>
        <div class="rows">${rows.map(([d, who, c, r, how, f, k]) => `<div><span class="when">${d || (k === 'turn' ? '<span class="chip turn">Turn</span>' : '<span class="chip">Open</span>')}</span><span class="dot ${c}" aria-label="${c === 'w' ? 'White' : 'Black'}"></span><span class="grow"><b>${who}</b><br><span class="how">${how}</span></span>${feats(f)}<span class="res ${r.toLowerCase()}">${r}</span></div>`).join('')}</div></div>
      <div class="col" style="padding:0">
        <div class="row"><h2 class="grow">Badges</h2><span class="tiny">6 of 10</span></div>
        <div class="badges">${BADGES.map(([id, n, how, got]) => `<div class="badge ${got ? '' : 'no'}" title="${how}"><img src="art/badge-${id}.webp" alt=""><b>${n}</b></div>`).join('')}</div>
        <div class="list"><div class="item"><span class="ico">${ic('book')}</span><div class="grow"><h3>Collection</h3><p class="sub">Every piece, king, power and card</p></div><span class="chev">${ic('chev')}</span></div>
        <div class="item"><span class="ico">${ic('gear')}</span><div class="grow"><h3>Settings</h3><p class="sub">Symbols only, Show threats</p></div><span class="chev">${ic('chev')}</span></div></div>
      </div>
    </div></div>`;
}

// The piece icons go inline, so each army's disc colours reach them through CSS variables.
await Promise.all(['pawn', 'knight', 'bishop', 'rook', 'queen', 'king', 'archer', 'paladin', 'guard', 'maester', 'beast', 'ogre'].map(async n => {
  const svg = await (await fetch(`${UI}icons/${n}.svg`)).text();
  document.querySelector('svg[aria-hidden]').insertAdjacentHTML('beforeend', svg.replace(/<svg[^>]*>/, `<symbol id="pi-${n}" viewBox="0 0 48 48">`).replace('</svg>', '</symbol>'));
}));
const state = q.get('s') || 'home';
document.getElementById('app').innerHTML = (S[state] ?? S.home)();
if (state === 'profile-badges') document.querySelector('.screen').scrollTop = 9999;
window.STATES = Object.keys(S);
