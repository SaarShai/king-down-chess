/* King Down: shared mark renderer (grammar.md G0 to G22). One renderer draws every mark at any size.
 *
 * Load: <link rel="stylesheet" href="shared/grammar.css"> and <script src="shared/marks.js"></script>.
 * Global: window.KD.marks (also window.KDMarks). Every builder returns a markup STRING (SVG or HTML),
 * so a page can put it in innerHTML. Colours mirror the G1 tokens in grammar.css.
 *
 * BOARD
 *   draw(svg, scene, opts)        Draw one board scene (scenes.js format) into an <svg>. Returns the markup.
 *                                 opts: { s: 80 (square px), origin: {x:0,y:0} (top-left of a8 corner of the field),
 *                                 layers: ['board','chalk','under','pieces','over'] (pick some to split a board in two SVGs),
 *                                 focus: rule index 0..2 (isolate: that rule bright and glowing, all else at 25%),
 *                                 hover: 'e5' (show the marks that only show on hover or focus of that square),
 *                                 showAll: true (show every hover-only mark), chalk: true (show the zone chalk),
 *                                 preview: true (added marks pulse), select: 'd7' (gold selection ring),
 *                                 dim: true (all marks at 25%, e.g. the move is spent), ripple: true (G19 entry),
 *                                 assets: 'assets/' (path prefix for art), imps: 'all' | rule index (phone: only that rule) }
 *   drawString(scene, opts)       The same, as a string, with no element.
 *   viewBox(s, crop, origin)      A viewBox string for a crop of the board: crop 'c3:e7' (corners) or null.
 *   squareXY(name, s, origin)     {x, y} of the top-left corner of a square, e.g. squareXY('d4', 80).
 *
 * SINGLE MARKS (brushes, keys, Why tiles, specimen)
 *   tile(kind, size, o)           One square mark as an <svg> of size x size. The tile is 0.8 of the size (G2).
 *                                 kind: 'move' | 'take' | 'both' | 'shot' | 'moveshot' | 'blocked' | 'blocked-move' | 'empty'
 *                                 o: { cond: 'pattern'|'awake'|'asleep', power, diff: '+'|'-', rail: 'n'|'ne'|..., tag: impression,
 *                                      xtag: true (alias badge: the take badge, top-left), imps: [impression...], fill: true (tile
 *                                      fills the box), stone: 'light'|'dark' }
 *                                 A take is a red target (ring + dot; + middle ring from 64px); a shot is the target pierced
 *                                 by an arrow from the lower left; blocked is a grey target with a bar.
 *   tileMarkup(kind, x, y, s, o)  The raw SVG elements of one square mark at (x, y), for your own SVG.
 *   diagram(pattern, o)           A 7x7 reach diagram (G4 diagram ends, G5 bridge, G6 pattern form). Glyph mode when s < 12.
 *                                 pattern: { squares: [{x, y, mark, cond}], lines: ['n',...], pass: 'own'|'any'|null, icon: 'pawn' }
 *                                 o: { s: 36, cells: true, light, dark, icon, assets }
 *   impression(imp, size)         One impression disc as <svg>. imp: {a:'linesPass'} (piece rule) | {power:'mud'} | {card:'freeze'}.
 *   effect(kind, size, o)         One effect sample in a square <svg>: 'push' | 'swap' | 'becomes' | 'power' | 'rune' | 'rune-barred'
 *                                 | 'frost' | 'icewall' | 'threat' | 'threat-stopped' | 'arch' | 'arch-power' | 'pip'.
 *
 * RULE OBJECTS
 *   seal(a, size, o)              A wax seal (12 lobes) with its sigil. a = vocab block id. o: {asleep, dim, echo, title}.
 *   sigil(name, size, o)          A bare sigil <svg> (any key of SIGILS). o: {color, width}.
 *   socket(innerHtml)             A recessed 44px socket (empty: a "+").
 *   chip(when, o)                 A When chip: a plate (state) or a flag (event). when = a vocab.ts When. o: {hollow}.
 *   picto(when, size)             The 14px When pictogram alone.
 *   whenWords(when)               The words of vocab.ts whenWords().
 *   pill(text, o)                 A value capsule with a caret. o: {choice, on}.
 *   knot(type, o)                 'gold' | 'cracked' | 'unknown' knot between two seals. o: {w, h}.
 *   coin(king, o)                 The KIT power coin. o: {uses: n | Infinity, spent: n, size, state: 'armed'|'used'|'echo'}.
 *   status(kind, size)            Status disc: 'official' | 'lab' | 'designed'.
 *   tag(kind)                     'yours' | 'original' tag; plaque('try') the Try board plaque.
 *   facets(spec)                  The G17 facet band (targets, turn cost, captures, uses, duration, condition).
 *   whySum(sum, o)                The G16 sum row: [base] + [impression] ... = [result], with captions.
 *
 * DATA
 *   BLOCKS                        The 10 vocab blocks: {a, group, title, event, sigil, pill, when}. GROUPS in order.
 *   SIGILS                        24x24 stroke paths: the 10 blocks (with the G11 dagger, links, mask) and the extras.
 *   NAMES                         The hover names of every mark kind (G18).
 *   C                             The colour table (mirror of grammar.css G1).
 *   ensureDefs()                  Put the shared gradients and filters in the page once (draw() and tile() call it).
 *
 * OPT-IN LOOK (default off, so a page that does not set it draws as before)
 *   look.wash = true              Board tiles are a wash (55% fill, thin edge, inset) so the stone shows; a take on an
 *                                 occupied square is a red ring under the feet, a red edge and the corner target badge
 *                                 (no white card); asleep is a pale stitched tile with a moon pip; a shot is the target
 *                                 pierced by an arrow; hop arcs are dashed gold-ink with an arrowhead; m.quill draws a 16px quill
 *                                 pip (a painted change) and diff '-' draws a dashed outline only; no dog-ears.
 *   look.familyWax = true         Each seal family has its own wax colour, the glyph is 50% gold, and no event spark.
 */
(function () {
  'use strict';
  const KD = (window.KD = window.KD || {});
  const LOOK = { wash: false, familyWax: false };

  /* ---------------- colours (mirror grammar.css G1) ---------------- */
  const C = {
    green: '#7cb342', greenHi: '#9ccc65', greenLo: '#6a9a36', navy: '#1c2e5c', red: '#d63428',
    white: '#fbf7ee', halo: 'rgba(251,247,238,.92)',
    bFill: '#c9bfac', bX: '#8a8072', bBar: '#4d453c',
    pMid: '#7fb2ff', pEdge: '#2f5ea8', pHi: '#e3f0ff', notch: '#2c5a8f',
    push: '#2f7f75', swap: '#7a58c0',
    accB: '#9c3a2d', acc: '#842c21', accD: '#5a1c14',
    chalk: 'rgba(251,247,238,.95)', chalkSh: 'rgba(43,38,33,.55)',
    gold: '#c99a3e', goldB: '#e9c071', goldI: '#7a5712',
    ink: '#2b2621', inkSoft: '#5b5045', s100: '#ebe6da', s300: '#c9bfac', s500: '#8a8072', s700: '#4d453c',
    vellum: '#fbf7ee', parch: '#f3ead7', parchD: '#e7d8b8',
    stoneLight: '#e0d2b4', stoneDark: '#362e26', dLight: '#e2d3b2', dDark: '#4a4036',
  };

  /* ---------------- sigils (24x24, stroked) ---------------- */
  const SIGILS = {
    // the 10 vocab blocks (vocab.ts icon), with the three G11 replacements
    step2: 'M7 13l5-5 5 5M7 19l5-5 5 5',
    movesLike: 'M4 7c3-2 13-2 16 0 0 6-3 10-8 10S4 13 4 7zM8.5 10.5h2M13.5 10.5h2',
    linesPass: 'M3 18c3-9 15-9 18 0M12 15v4',
    chain: 'M9.5 14.5l5-5M8 11l-2.5 2.5a3.5 3.5 0 0 0 5 5L13 16M16 13l2.5-2.5a3.5 3.5 0 0 0-5-5L11 8',
    cannotBeTaken: 'M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z',
    push: 'M3 12h11M10 8l4 4-4 4M19 5v14',
    swap: 'M4 9h15l-4-4M20 15H5l4 4',
    becomes: 'M12 21V10M8 14l4-4 4 4M6 7l3 2 3-5 3 5 3-2',
    cannotTake: 'M5 5l14 14M12 3a9 9 0 1 0 .01 0',
    // G11 gives "M12 2.5v19M7 8h10" (a cross). The blade here tapers to a point so it reads as a dagger, not a cross.
    removedAfter: 'M12 2.5v3.5M7.5 8h9M10.4 8v9.5L12 21.5l1.6-4V8',
    // extras
    spark: 'M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9',
    crown: 'M4 18h16M4.5 18L3.5 8.5l5 4L12 5l3.5 7.5 5-4-1 9.5',
    card: 'M7 3.5h10a1.5 1.5 0 0 1 1.5 1.5v14a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 19V5A1.5 1.5 0 0 1 7 3.5z',
    hourglass: 'M7 3h10M7 21h10M8 3c0 5 7.5 6.5 7.5 9S8 16 8 21M16 3c0 5-7.5 6.5-7.5 9S16 16 16 21',
    lock: 'M7.5 11V8a4.5 4.5 0 0 1 9 0v3M5.5 11h13v9.5h-13z',
    lockOpen: 'M7.5 11V8a4.5 4.5 0 0 1 8.7-1.6M5.5 11h13v9.5h-13z',
    eye: 'M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12zM12 9.3a2.7 2.7 0 1 0 .01 0',
    die: 'M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM8.5 8.5h.01M15.5 15.5h.01M12 12h.01M15.5 8.5h.01M8.5 15.5h.01',
    broom: 'M15 3l-4.5 9M7 12h8.5l2 8.5H5zM9 16v4.5M13 16v4.5',
    quill: 'M20 3.5C12 4 6.5 9.5 5 20.5M5 20.5l3.2-1.2M9 13.5h5.5M7.5 17h4',
    scale: 'M12 3.5v17M7 20.5h10M4 7h16M6.5 7l-3 6.5h6zM17.5 7l-3 6.5h6zM10.5 4.5h3',
    moon: 'M15.5 4a8.5 8.5 0 1 0 4.8 13.6A7 7 0 0 1 15.5 4z',
    near: 'M12 3.5a8.5 8.5 0 1 0 .01 0M12 8a1.8 1.8 0 1 0 .01 0M9.5 16.5l1-4.5h3l1 4.5z',
    map: 'M4 4h16v16H4zM4 12h16M12 4v16',
    key: 'M8 15.5a3.5 3.5 0 1 1 3.4-4.5H20M16.5 11v3M19.5 11v2.5',
    plus: 'M12 5v14M5 12h14',
    minus: 'M5 12h14',
    flip: 'M4 20V9l5-5h11v16zM4 9h5V4',
    take: 'M12 4a8 8 0 1 0 .01 0M12 11a1 1 0 1 0 .01 0', // the take target: ring and dot
    shot: 'M13.5 3.5a7 7 0 1 0 .01 0M13.5 9.5a1 1 0 1 0 .01 0M4 20l9-9M3 18h3v3M5.5 15.5h3v3', // the target pierced by an arrow
    eraser: 'M14.5 4.5l5 5-9 9H6l-2.5-2.5zM9 10l5 5M6 18.5h14',
    mirror: 'M12 3v18M9 7l-5 5 5 5zM15 7l5 5-5 5z',
  };

  /* ---------------- the 10 vocab blocks (mirror of src/workshop/vocab.ts BLOCKS) ---------------- */
  const GROUPS = ['Moving', 'Taking', 'Safe', 'Moving others', 'Changing', 'Holding back'];
  const BLOCKS = [
    { a: 'step2', group: 'Moving', title: 'Steps 2 straight ahead', event: false, when: { on: 'zone', zone: 'startRank' }, short: 'steps 2 straight ahead' },
    { a: 'movesLike', group: 'Moving', title: 'Also moves like another piece', event: false, when: { on: 'zone', zone: 'capital' }, pill: { key: 'as', choices: [['king', 'a king'], ['knight', 'a knight'], ['bishop', 'a bishop'], ['rook', 'a rook'], ['queen', 'a queen']], def: 'queen' }, short: 'also moves like' },
    { a: 'linesPass', group: 'Moving', title: 'Its lines pass over pieces', event: false, when: { on: 'always' }, pill: { key: 'over', choices: [['own', 'its own pieces'], ['any', 'any piece']], def: 'own' }, short: 'its lines pass over' },
    { a: 'chain', group: 'Taking', title: 'Takes again', event: true, when: { on: 'takes' }, short: 'takes again' },
    { a: 'cannotBeTaken', group: 'Safe', title: 'Some pieces cannot take it', event: false, when: { on: 'always' }, pill: { key: 'by', choices: [['pawns', 'by pawns'], ['allButKing', 'by anything but a king']], def: 'pawns' }, short: 'cannot be taken' },
    { a: 'push', group: 'Moving others', title: 'Pushes a piece next to it', event: false, when: { on: 'always' }, pill: { key: 'then', choices: [['follow', 'and follow it'], ['stay', 'and stay']], def: 'follow' }, short: 'pushes a piece next to it' },
    { a: 'swap', group: 'Moving others', title: 'Swaps with a piece next to it', event: false, when: { on: 'always' }, pill: { key: 'with', choices: [['friend', 'a friend'], ['enemy', 'an enemy']], def: 'friend' }, short: 'swaps with' },
    { a: 'becomes', group: 'Changing', title: 'Becomes another piece', event: true, when: { on: 'reaches', zone: 'lastRank' }, pill: { key: 'into', choices: [['choice', 'a piece you choose'], ['Q', 'a queen'], ['R', 'a rook'], ['B', 'a bishop'], ['N', 'a knight'], ['A', 'an archer']], def: 'choice' }, short: 'becomes' },
    { a: 'cannotTake', group: 'Holding back', title: 'Cannot take …', event: false, when: { on: 'always' }, pill: { key: 'what', choices: [['king', 'a king'], ['pawns', 'pawns'], ['any', 'anything']], def: 'king' }, short: 'cannot take' },
    { a: 'removedAfter', group: 'Holding back', title: 'Is removed after it takes', event: true, when: { on: 'takes' }, pill: { key: 'what', choices: [['piece', 'a piece, not a pawn'], ['any', 'anything']], def: 'piece' }, short: 'is removed after it takes' },
  ];
  BLOCKS.forEach((b) => (b.sigil = SIGILS[b.a]));
  const blockOf = (a) => BLOCKS.find((b) => b.a === a);

  /* ---------------- hover names (G18) ---------------- */
  const NAMES = {
    move: 'Move', take: 'Take only', both: 'Move or take', shot: 'Shot: takes from here', moveshot: 'Move or shot',
    line: 'Line', arch: 'Passes over', cond: 'Only sometimes', asleep: 'Asleep here', blocked: 'Blocked by: ', 'blocked-move': 'Blocked by: ',
    chalk: 'Where ', push: 'Pushes', swap: 'Swaps', becomes: 'Becomes', power: "King's power", rune: 'LAB card', frost: 'Frozen',
    threat: 'Can hit this piece', icewall: 'Ice Wall', empty: 'Empty',
  };

  /* ---------------- small helpers ---------------- */
  const n = (v) => Math.round(v * 100) / 100;
  const FILES = 'abcdefgh';
  const parse = (name) => ({ f: FILES.indexOf(name[0]), r: +name.slice(1) });
  const sqName = (f, r) => FILES[f] + r;
  const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const fw = (s) => (s < 24 ? 1 : s < 40 ? 1.5 : 2);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const DIR = { n: [0, 1], ne: [1, 1], e: [1, 0], se: [1, -1], s: [0, -1], sw: [-1, -1], w: [-1, 0], nw: [-1, 1] };
  const line = (x1, y1, x2, y2, stroke, w, extra = '') =>
    `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" stroke="${stroke}" stroke-width="${n(w)}" ${extra}/>`;
  // target sizes as a share of the tile side: take radius; shot radius and its shift up-right (room for the arrow)
  const TR = 0.32, SR = 0.27, SO = 0.07;
  const rrect = (x, y, w, h, r, attrs) => `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="${n(r)}" ${attrs}/>`;

  /* ---------------- shared defs ---------------- */
  const DEFS = `
<linearGradient id="kdm-green" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.greenHi}"/><stop offset=".55" stop-color="${C.green}"/><stop offset="1" stop-color="${C.greenLo}"/></linearGradient>
<linearGradient id="kdm-grey" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d6cdbb"/><stop offset="1" stop-color="#bdb29d"/></linearGradient>
<radialGradient id="kdm-wax" cx=".38" cy=".3" r=".78"><stop offset="0" stop-color="#b24a3a"/><stop offset=".35" stop-color="${C.accB}"/><stop offset=".72" stop-color="${C.acc}"/><stop offset="1" stop-color="${C.accD}"/></radialGradient>
<radialGradient id="kdm-wax-taking" cx=".38" cy=".3" r=".78"><stop offset="0" stop-color="#6b2a22"/><stop offset=".45" stop-color="#4a1712"/><stop offset="1" stop-color="#22090a"/></radialGradient>
<radialGradient id="kdm-wax-safe" cx=".38" cy=".3" r=".78"><stop offset="0" stop-color="#7d9cbc"/><stop offset=".45" stop-color="#4f6f93"/><stop offset="1" stop-color="#2a405c"/></radialGradient>
<radialGradient id="kdm-wax-others" cx=".38" cy=".3" r=".78"><stop offset="0" stop-color="#4fa197"/><stop offset=".45" stop-color="#2f7f75"/><stop offset="1" stop-color="#174c46"/></radialGradient>
<radialGradient id="kdm-wax-changing" cx=".38" cy=".3" r=".78"><stop offset="0" stop-color="#f1cf7e"/><stop offset=".45" stop-color="#d0a046"/><stop offset="1" stop-color="#8a6418"/></radialGradient>
<radialGradient id="kdm-wax-holding" cx=".38" cy=".3" r=".78"><stop offset="0" stop-color="#77706a"/><stop offset=".45" stop-color="#4c4640"/><stop offset="1" stop-color="#26221f"/></radialGradient>
<filter id="kdm-arc-shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="1" stdDeviation="1.2" flood-color="#1d1915" flood-opacity=".55"/></filter>
<radialGradient id="kdm-wax-grey" cx=".38" cy=".3" r=".78"><stop offset="0" stop-color="#a59a88"/><stop offset=".7" stop-color="#8a8072"/><stop offset="1" stop-color="#5f574c"/></radialGradient>
<radialGradient id="kdm-glow-red"><stop offset="0" stop-color="rgb(214,52,40)" stop-opacity=".55"/><stop offset=".6" stop-color="rgb(214,52,40)" stop-opacity=".3"/><stop offset="1" stop-color="rgb(214,52,40)" stop-opacity="0"/></radialGradient>
<radialGradient id="kdm-glow-gold"><stop offset="0" stop-color="${C.goldB}" stop-opacity=".95"/><stop offset=".55" stop-color="${C.goldB}" stop-opacity=".55"/><stop offset="1" stop-color="${C.goldB}" stop-opacity="0"/></radialGradient>
<radialGradient id="kdm-frost"><stop offset="0" stop-color="rgb(127,178,255)" stop-opacity=".6"/><stop offset=".55" stop-color="rgb(127,178,255)" stop-opacity=".35"/><stop offset="1" stop-color="rgb(127,178,255)" stop-opacity="0"/></radialGradient>
<pattern id="kdm-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="8" stroke="rgba(251,247,238,.18)" stroke-width="1"/><line x1="1" y1="0" x2="1" y2="8" stroke="rgba(43,38,33,.10)" stroke-width="1"/></pattern>
<pattern id="kdm-crystal" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><path d="M0 3.5h7M3.5 0v7" stroke="rgba(255,255,255,.55)" stroke-width=".6"/></pattern>
<filter id="kdm-rim" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="0" stdDeviation=".75" flood-color="#2b2621" flood-opacity=".7"/></filter>
<filter id="kdm-seal-shadow" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="2.5" stdDeviation="2.2" flood-color="#1d1915" flood-opacity=".42"/></filter>
<filter id="kdm-soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.2"/></filter>`;
  let defsDone = false;
  function ensureDefs() {
    if (defsDone || typeof document === 'undefined' || !document.body) return;
    if (document.getElementById('kdm-defs')) { defsDone = true; return; }
    const d = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    d.id = 'kdm-defs';
    d.setAttribute('aria-hidden', 'true');
    d.setAttribute('style', 'position:absolute;width:0;height:0;overflow:hidden');
    d.innerHTML = `<defs>${DEFS}</defs>`;
    document.body.prepend(d);
    defsDone = true;
  }

  /* ---------------- the target (take), the pierced target (shot), the bar ----------------
   * targetMark: a red bullseye. An outer ring and a filled dot; a middle ring too when R >= 16 (board size, 64px and up).
   * A thin vellum halo (1px each side) keeps it clear on light and dark stone and on a green tile.
   * shotMark: the same target pierced by an arrow (ink shaft and fletching) that enters from the lower left.
   * o: { color, halo (null = no halo), rw (ring width), len (shaft length / R, default 1.75) } */
  function targetMark(cx, cy, R, o = {}) {
    const col = o.color || C.red, halo = o.halo === undefined ? C.white : o.halo;
    const rw = o.rw || Math.max(1.2, 0.2 * R);
    const mid = R >= 16;
    const mr = 0.6 * R, mw = rw * 0.72, dr = Math.max(1, (mid ? 0.25 : 0.36) * R);
    const c = (r, attrs) => `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" ${attrs}/>`;
    let g = '';
    if (halo) {
      g += c(R, `fill="none" stroke="${halo}" stroke-width="${n(rw + 2)}"`);
      if (mid) g += c(mr, `fill="none" stroke="${halo}" stroke-width="${n(mw + 2)}"`);
      g += c(dr + 1, `fill="${halo}"`);
    }
    g += c(R, `fill="none" stroke="${col}" stroke-width="${n(rw)}"`);
    if (mid) g += c(mr, `fill="none" stroke="${col}" stroke-width="${n(mw)}"`);
    return g + c(dr, `fill="${col}"`);
  }
  function shotMark(cx, cy, R, o = {}) {
    const halo = o.halo === undefined ? C.white : o.halo, ink = o.ink || C.ink;
    const u = Math.SQRT1_2, td = [-u, u], pp = [u, u]; // td: toward the tail (lower left); pp: across the shaft
    const sw = Math.max(1.5, 0.18 * R), L = (o.len || 1.75) * R;
    const tip = [cx - td[0] * 0.08 * R, cy - td[1] * 0.08 * R];
    const tail = [cx + td[0] * L, cy + td[1] * L];
    const f = Math.max(2.2, 0.36 * R);
    // two fletching chevrons near the tail, swept back
    let fl = '';
    for (const k of [0.8, 1]) {
      const p = [cx + td[0] * L * k, cy + td[1] * L * k];
      const a = [p[0] + (td[0] + pp[0]) * f * 0.7, p[1] + (td[1] + pp[1]) * f * 0.7], b = [p[0] + (td[0] - pp[0]) * f * 0.7, p[1] + (td[1] - pp[1]) * f * 0.7];
      fl += `M${n(a[0])} ${n(a[1])}L${n(p[0])} ${n(p[1])}L${n(b[0])} ${n(b[1])}`;
    }
    const shaft = `M${n(tail[0])} ${n(tail[1])}L${n(tip[0])} ${n(tip[1])}`;
    const fw2 = Math.max(1.2, sw * 0.8);
    let g = targetMark(cx, cy, R, o);
    if (halo) g += `<path d="${shaft}" stroke="${halo}" stroke-width="${n(sw + 2)}" stroke-linecap="round" fill="none"/><path d="${fl}" stroke="${halo}" stroke-width="${n(fw2 + 2)}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
    g += `<path d="${shaft}" stroke="${ink}" stroke-width="${n(sw)}" stroke-linecap="round" fill="none"/>`;
    g += `<path d="${fl}" stroke="${ink}" stroke-width="${n(fw2)}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
    return g;
  }
  function bar(cx, cy, len, w, color = C.bBar, under = C.white) {
    return line(cx - len / 2, cy, cx + len / 2, cy, under, w + 2, 'stroke-linecap="round"') + line(cx - len / 2, cy, cx + len / 2, cy, color, w, 'stroke-linecap="round"');
  }

  /* ---------------- G2/G3/G6/G7: one tile ----------------
   * x0, y0: top-left of the TILE; t: tile side; s: the square size that sets stroke widths. */
  function tileAt(kind, x0, y0, t, s, o = {}) {
    if (s < 12) return glyphTile(kind, x0, y0, t, o);
    if (LOOK.wash) return tileWash(kind, x0, y0, t, s, o);
    const cx = x0 + t / 2, cy = y0 + t / 2;
    const r = Math.max(3, 0.05 * s);
    const w = fw(s);
    const cond = o.cond;
    const asleep = cond === 'asleep';
    const blocked = kind === 'blocked' || kind === 'blocked-move';
    const green = kind === 'move' || kind === 'both' || kind === 'moveshot';
    const takes = kind === 'take' || kind === 'both';
    const shoots = kind === 'shot' || kind === 'moveshot';
    const fill = green ? 'url(#kdm-green)' : blocked ? 'url(#kdm-grey)' : kind === 'empty' ? 'none' : C.white;
    const frame = blocked ? C.bBar : C.navy;
    const dash = cond ? `stroke-dasharray="${s < 40 ? '3 2' : '4 3'}"` : '';
    let out = '';
    // power ring sits outside the frame (G9)
    if (o.power) {
      const pi = Math.max(1.5, 0.045 * t);
      out += rrect(x0 - pi - 2, y0 - pi - 2, t + 2 * pi + 4, t + 2 * pi + 4, r + pi + 2, `fill="none" stroke="${C.pEdge}" stroke-width="4"`);
      out += rrect(x0 - pi - 2, y0 - pi - 2, t + 2 * pi + 4, t + 2 * pi + 4, r + pi + 2, `fill="none" stroke="${C.pMid}" stroke-width="2"`);
    }
    // vellum halo, 1.5px outside the frame
    out += rrect(x0, y0, t, t, r, `fill="none" stroke="${C.halo}" stroke-width="${n(w + 3)}"${asleep ? ' stroke-opacity=".5"' : ''}`);
    if (!asleep && fill !== 'none') {
      out += rrect(x0, y0, t, t, r, `fill="${fill}"${cond === 'pattern' ? ' fill-opacity=".45"' : ''}`);
      // laid-tile bevel
      const b = w / 2 + 0.75;
      out += line(x0 + r, y0 + b, x0 + t - r, y0 + b, 'rgba(255,255,255,.35)', 1);
      out += line(x0 + r, y0 + t - b, x0 + t - r, y0 + t - b, 'rgba(28,46,92,.25)', 1);
    }
    if (asleep) out += rrect(x0, y0, t, t, r, `fill="rgba(251,247,238,.18)"`);
    out += rrect(x0, y0, t, t, r, `fill="none" stroke="${frame}" stroke-width="${w}" ${dash}${asleep ? ' stroke-opacity=".5"' : ''}`);
    const op = asleep ? ' opacity=".5"' : '';
    if (s < 24) out += `<g${op}>${glyphTarget(kind, cx, cy, t)}</g>`; // thumbnails: ring + dot (+ a short stroke for a shot)
    else {
      if (takes) out += `<g${op}>${targetMark(cx, cy, TR * t)}</g>`;
      if (shoots) out += `<g${op}>${shotMark(cx + SO * t, cy - SO * t, SR * t)}</g>`;
      if (kind === 'blocked') out += targetMark(cx, cy, TR * t, { color: C.bX, halo: 'rgba(251,247,238,.6)' });
    }
    if (blocked) out += bar(cx, cy, 0.78 * t, clamp(0.0375 * s, 1.5, 3.5));
    if (o.diff) out += dogEar(x0, y0 + t, o.diff, s);
    return out;
  }
  // look.wash: o.wash (the board) gives a 60% green fill and a thin edge; brushes, keys and Why tiles stay full strength.
  // A take or shot tile stays near white (94%) and a refused tile near solid grey (88%) on both stones, so the two
  // never meet in one mid grey and the grey target on a refused tile stays clear on dark stone.
  // Both forms use the moon tile for asleep; a take is the target, a shot the target pierced by an arrow.
  function moonPip(cx, cy, d) {
    return `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(d / 2 + 1.2)}" fill="${C.halo}"/><circle cx="${n(cx)}" cy="${n(cy)}" r="${n(d / 2)}" fill="${C.vellum}" stroke="${C.navy}" stroke-width="1.2" stroke-opacity=".7"/>` +
      sigilInline('moon', cx - d * 0.33, cy - d * 0.33, d * 0.66, C.navy, 2.6);
  }
  function tileWash(kind, x0, y0, t, s, o) {
    const wash = !!o.wash;
    if (wash) { const ins = 0.065 * s; x0 += ins; y0 += ins; t -= 2 * ins; }
    const cx = x0 + t / 2, cy = y0 + t / 2;
    const r = Math.max(3, 0.06 * s);
    const cond = o.cond, asleep = cond === 'asleep';
    const blocked = kind === 'blocked' || kind === 'blocked-move';
    const green = kind === 'move' || kind === 'both' || kind === 'moveshot';
    const takes = kind === 'take' || kind === 'both';
    const shoots = kind === 'shot' || kind === 'moveshot';
    const ghost = o.diff === '-';
    const w = wash ? 1.5 : fw(s);
    const dash = cond || ghost ? `stroke-dasharray="${s < 40 ? '3 2' : '4 3'}"` : '';
    let out = '';
    if (o.power) {
      const pi = Math.max(1.5, 0.045 * t);
      out += rrect(x0 - pi - 2, y0 - pi - 2, t + 2 * pi + 4, t + 2 * pi + 4, r + pi + 2, `fill="none" stroke="${C.pEdge}" stroke-width="${wash ? 3 : 4}"`);
      out += rrect(x0 - pi - 2, y0 - pi - 2, t + 2 * pi + 4, t + 2 * pi + 4, r + pi + 2, `fill="none" stroke="${C.pMid}" stroke-width="${wash ? 1.5 : 2}"`);
    }
    if (ghost) return out + rrect(x0, y0, t, t, r, `fill="none" stroke="${C.halo}" stroke-width="${w + 2}" stroke-opacity=".6"`) + rrect(x0, y0, t, t, r, `fill="none" stroke="${C.navy}" stroke-width="${w}" stroke-opacity=".6" ${dash}`);
    // fill: green (or white for a take, grey for blocked); asleep is a pale green
    const fill = asleep ? C.greenHi : green ? 'url(#kdm-green)' : blocked ? 'url(#kdm-grey)' : kind === 'empty' ? 'none' : C.white;
    const fo = asleep ? (wash ? 0.32 : 0.45) : wash ? (green ? 0.6 : blocked ? 0.88 : 0.94) : cond === 'pattern' ? 0.45 : 1;
    out += rrect(x0, y0, t, t, r, `fill="none" stroke="${C.halo}" stroke-width="${n(w + (wash ? 1.5 : 3))}" stroke-opacity="${wash ? 0.55 : asleep ? 0.6 : 1}"`);
    if (fill !== 'none') out += rrect(x0, y0, t, t, r, `fill="${fill}" fill-opacity="${fo}"`);
    if (!wash && !asleep && fill !== 'none') {
      const b = w / 2 + 0.75;
      out += line(x0 + r, y0 + b, x0 + t - r, y0 + b, 'rgba(255,255,255,.35)', 1);
      out += line(x0 + r, y0 + t - b, x0 + t - r, y0 + t - b, 'rgba(28,46,92,.25)', 1);
    }
    out += rrect(x0, y0, t, t, r, `fill="none" stroke="${blocked ? C.bBar : C.navy}" stroke-width="${w}" stroke-opacity="${wash ? 0.7 : asleep ? 0.6 : 1}" ${dash}`);
    const th = wash ? 'rgba(251,247,238,.8)' : C.white;
    if (s < 24) out += glyphTarget(kind, cx, cy, t);
    else {
      if (takes) out += targetMark(cx, cy, TR * t, { halo: th });
      if (shoots) out += shotMark(cx + SO * t, cy - SO * t, SR * t, { halo: th });
      if (kind === 'blocked') out += targetMark(cx, cy, TR * t, { color: C.bX, halo: 'rgba(251,247,238,.6)' });
    }
    if (blocked) out += bar(cx, cy, 0.78 * t, clamp(0.0375 * s, 1.5, 3.5));
    if (asleep && s >= 24) out += moonPip(x0 + t - 0.13 * s, y0 + t - 0.13 * s, clamp(0.2 * s, 10, 16));
    if (o.quill && s >= 24) out += quillPip(x0 + 0.13 * s, y0 + t - 0.13 * s, clamp(0.2 * s, 12, 16));
    return out;
  }
  function quillPip(cx, cy, d) {
    return `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(d / 2 + 1.2)}" fill="${C.halo}"/><circle cx="${n(cx)}" cy="${n(cy)}" r="${n(d / 2)}" fill="${C.vellum}" stroke="${C.goldI}" stroke-width="1.3"/>` +
      sigilInline('quill', cx - d * 0.34, cy - d * 0.34, d * 0.68, C.goldI, 2.4);
  }
  // G2 glyph mode: no frame, no halo
  function glyphTile(kind, x0, y0, t, o) {
    const blocked = kind === 'blocked' || kind === 'blocked-move';
    const green = kind === 'move' || kind === 'both' || kind === 'moveshot';
    const fill = green ? C.green : blocked ? C.bFill : C.white;
    const op = o.cond ? ' opacity=".5"' : '';
    let out = `<g${op}><rect x="${n(x0)}" y="${n(y0)}" width="${n(t)}" height="${n(t)}" fill="${fill}"/>`;
    out += glyphTarget(kind, x0 + t / 2, y0 + t / 2, t);
    return out + '</g>';
  }
  // glyph form of the target: a ring and a dot (a dot alone below 8px); a shot adds a short ink stroke from the lower left
  function glyphTarget(kind, cx, cy, t) {
    if (!['take', 'both', 'shot', 'moveshot', 'blocked'].includes(kind)) return '';
    const col = kind === 'blocked' ? C.bX : C.red, shot = kind === 'shot' || kind === 'moveshot';
    if (shot) { cx += 0.06 * t; cy -= 0.06 * t; }
    let g = t < 8
      ? `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(0.3 * t)}" fill="${col}"/>`
      : `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(0.33 * t - 0.5)}" fill="none" stroke="${col}" stroke-width="1"/><circle cx="${n(cx)}" cy="${n(cy)}" r="${n(Math.max(0.9, 0.11 * t))}" fill="${col}"/>`;
    if (shot) {
      g += `<path d="M${n(cx - 0.5 * t)} ${n(cy + 0.5 * t)}L${n(cx - 0.05 * t)} ${n(cy + 0.05 * t)}" stroke="${C.ink}" stroke-width="${t < 8 ? 0.8 : 1.1}" stroke-linecap="round"/>`;
    }
    return g;
  }
  // G10 diff dog-ear: 14px folded corner at the bottom-left of the tile
  function dogEar(x, yb, sign, s) {
    const d = s < 40 ? 10 : 14;
    const p = `M${n(x)} ${n(yb - d)}L${n(x + d)} ${n(yb)}H${n(x + 2)}a2 2 0 0 1 -2 -2z`;
    const cx = x + d * 0.33, cy = yb - d * 0.33, h = d * 0.2;
    let g = `<path d="${p}" fill="${C.vellum}" stroke="${C.goldI}" stroke-width="1"/>`;
    g += line(cx - h, cy, cx + h, cy, C.goldI, 1.6, 'stroke-linecap="round"');
    if (sign === '+') g += line(cx, cy - h, cx, cy + h, C.goldI, 1.6, 'stroke-linecap="round"');
    return g;
  }
  function tileMarkup(kind, x, y, s, o = {}) {
    if (s < 12) return glyphTile(kind, x + 1, y + 1, s - 2, o);
    return tileAt(kind, x + 0.1 * s, y + 0.1 * s, 0.8 * s, s, o);
  }

  /* ---------------- G4 rails ---------------- */
  function railMarkup(p0, p1, s, o = {}) {
    if (s < 12) return line(p0[0], p0[1], p1[0], p1[1], C.green, 1.5, `stroke-linecap="round"${o.style === 'asleep' ? ' opacity=".4"' : o.style === 'awake' || o.style === 'pattern' ? ' opacity=".6"' : ''}`);
    const w = o.wash ? Math.max(3, 0.04 * s) : Math.max(4, 0.1 * s), e = o.wash ? 0.9 : s < 48 ? 1 : 1.5;
    const edge = o.power ? C.pEdge : C.navy;
    const style = o.style || 'solid';
    if (style === 'solid' && o.wash) {
      return `<g opacity=".85">${line(p0[0], p0[1], p1[0], p1[1], C.halo, w + 2 * e + 1.5, 'stroke-opacity=".6"') + line(p0[0], p0[1], p1[0], p1[1], edge, w + 2 * e, 'stroke-opacity=".75"') + line(p0[0], p0[1], p1[0], p1[1], C.green, w)}</g>`;
    }
    if (style === 'solid') {
      return line(p0[0], p0[1], p1[0], p1[1], C.halo, w + 2 * e + 2) + line(p0[0], p0[1], p1[0], p1[1], edge, w + 2 * e) + line(p0[0], p0[1], p1[0], p1[1], C.green, w);
    }
    // stitched edges: two parallel dashed lines
    const dx = p1[0] - p0[0], dy = p1[1] - p0[1], L = Math.hypot(dx, dy) || 1;
    const nx = -dy / L, ny = dx / L, off = w / 2 + e / 2;
    const dash = `stroke-dasharray="${s < 40 ? '3 2' : '4 3'}"`;
    let out = '';
    if (style === 'awake' || style === 'pattern') {
      out += line(p0[0], p0[1], p1[0], p1[1], C.halo, w + 2 * e + 2);
      out += line(p0[0], p0[1], p1[0], p1[1], C.green, w, style === 'pattern' ? 'stroke-opacity=".45"' : '');
    }
    const op = style === 'asleep' ? ' opacity=".4"' : '';
    out += `<g${op}>`;
    if (style === 'asleep') out += line(p0[0], p0[1], p1[0], p1[1], C.halo, w + 2 * e + 2, 'stroke-opacity=".5"');
    for (const k of [1, -1]) out += line(p0[0] + nx * off * k, p0[1] + ny * off * k, p1[0] + nx * off * k, p1[1] + ny * off * k, edge, e + (style === 'asleep' ? 0.5 : 0), dash);
    return out + '</g>';
  }
  function arrowHead(tip, u, s, o = {}) {
    const L = (o.wash ? 0.17 : 0.22) * s, hw = (o.wash ? 0.11 : 0.15) * s;
    const bx = tip[0] - u[0] * L, by = tip[1] - u[1] * L, px = -u[1], py = u[0];
    const d = `M${n(tip[0])} ${n(tip[1])}L${n(bx + px * hw)} ${n(by + py * hw)}L${n(bx - px * hw)} ${n(by - py * hw)}z`;
    const edge = o.power ? C.pEdge : C.navy;
    return `<path d="${d}" fill="none" stroke="${C.halo}" stroke-width="${s < 48 ? 4 : 5}" stroke-linejoin="round"/><path d="${d}" fill="${o.style === 'asleep' ? 'none' : C.green}" stroke="${edge}" stroke-width="${s < 48 ? 1.25 : 1.5}" stroke-linejoin="round"${o.style === 'asleep' ? ' opacity=".4"' : ''}/>`;
  }
  function stopBar(pt, u, s) {
    const px = -u[1], py = u[0], h = 0.25 * s;
    const a = [pt[0] + px * h, pt[1] + py * h], b = [pt[0] - px * h, pt[1] - py * h];
    return line(a[0], a[1], b[0], b[1], C.halo, 6, 'stroke-linecap="round"') + line(a[0], a[1], b[0], b[1], C.navy, 3, 'stroke-linecap="round"');
  }
  // diagram end: a chevron with a small red target past its tip (it slides on and takes the first enemy)
  function chevronT(tip, u, s, o = {}) {
    const L = Math.max(4, 0.26 * s), hw = Math.max(3, 0.2 * s);
    const bx = tip[0] - u[0] * L, by = tip[1] - u[1] * L, px = -u[1], py = u[0];
    const d = `M${n(bx + px * hw)} ${n(by + py * hw)}L${n(tip[0])} ${n(tip[1])}L${n(bx - px * hw)} ${n(by - py * hw)}`;
    const edge = o.power ? C.pEdge : C.navy;
    let g = '';
    if (s < 12) return `<path d="${d}" fill="none" stroke="${C.green}" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round"/>`;
    g += `<path d="${d}" fill="none" stroke="${edge}" stroke-width="${n(Math.max(3.5, 0.1 * s) + 2)}" stroke-linejoin="round" stroke-linecap="round"/>`;
    g += `<path d="${d}" fill="none" stroke="${C.green}" stroke-width="${n(Math.max(2, 0.1 * s))}" stroke-linejoin="round" stroke-linecap="round"/>`;
    const tr = Math.max(2.6, 0.12 * s);
    const tc = [tip[0] + u[0] * tr * 1.55, tip[1] + u[1] * tr * 1.55];
    g += targetMark(tc[0], tc[1], tr, { rw: Math.max(1.2, 0.045 * s) });
    return g;
  }

  /* ---------------- G5 arches ---------------- */
  function archMarkup(p0, p1, s, o = {}) {
    const mx = (p0[0] + p1[0]) / 2, my = (p0[1] + p1[1]) / 2;
    const vx = p1[0] - p0[0], vy = p1[1] - p0[1], L = Math.hypot(vx, vy) || 1;
    let nx = -vy / L, ny = vx / L;
    if (o.left) { nx = vy / L; ny = -vx / L; }
    else if (Math.abs(vx) < 1e-6) { if (nx < 0) { nx = -nx; ny = -ny; } } else if (ny > 0) { nx = -nx; ny = -ny; }
    const bulge = (o.bulge || 0.45) * s;
    const c = [mx + nx * bulge * 2, my + ny * bulge * 2];
    const d = `M${n(p0[0])} ${n(p0[1])}Q${n(c[0])} ${n(c[1])} ${n(p1[0])} ${n(p1[1])}`;
    const gold = LOOK.wash && !o.power && !o.color;
    const sw = gold ? (s >= 40 ? 2.5 : 1.8) : o.width || (s >= 40 ? 2 : 1.5);
    const col = o.power ? C.pEdge : gold ? C.goldI : o.color || C.navy, halo = o.power ? C.pMid : gold ? C.goldB : C.halo;
    let g = gold
      ? `<g filter="url(#kdm-arc-shadow)"><path d="${d}" fill="none" stroke="${halo}" stroke-width="${n(sw + 2.5)}" stroke-linecap="round" stroke-opacity=".75"/><path d="${d}" fill="none" stroke="${col}" stroke-width="${sw}" stroke-linecap="round" stroke-dasharray="6 4"/></g>`
      : `<path d="${d}" fill="none" stroke="${halo}" stroke-width="${n(sw + 3)}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${col}" stroke-width="${sw}" stroke-linecap="round"/>`;
    if (gold && o.head !== false && s >= 24) o = { ...o, head: true };
    if (o.head) {
      const u = [(p1[0] - c[0]), (p1[1] - c[1])], ul = Math.hypot(u[0], u[1]);
      const uu = [u[0] / ul, u[1] / ul], hl = Math.max(5, 0.12 * s), hw = hl * 0.6;
      const b = [p1[0] - uu[0] * hl, p1[1] - uu[1] * hl];
      g += `<path d="M${n(p1[0])} ${n(p1[1])}L${n(b[0] - uu[1] * hw)} ${n(b[1] + uu[0] * hw)}L${n(b[0] + uu[1] * hw)} ${n(b[1] - uu[0] * hw)}z" fill="${col}" stroke="${halo}" stroke-width="1"/>`;
    }
    return { svg: g, apex: [mx + nx * bulge, my + ny * bulge] };
  }

  /* ---------------- G12 impressions ---------------- */
  function sigilInline(name, x, y, size, color, width = 2.2) {
    const p = SIGILS[name] || name;
    return `<svg x="${n(x)}" y="${n(y)}" width="${n(size)}" height="${n(size)}" viewBox="0 0 24 24" overflow="visible"><path d="${p}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }
  function sparkPath(cx, cy, r) {
    // a small 4-point star (the event spark)
    const k = r * 0.32;
    return `M${n(cx)} ${n(cy - r)}L${n(cx + k)} ${n(cy - k)}L${n(cx + r)} ${n(cy)}L${n(cx + k)} ${n(cy + k)}L${n(cx)} ${n(cy + r)}L${n(cx - k)} ${n(cy + k)}L${n(cx - r)} ${n(cy)}L${n(cx - k)} ${n(cy - k)}z`;
  }
  function impMarkup(imp, cx, cy, d, assets) {
    const R = d / 2;
    let ring = C.acc, inner = '';
    if (imp.power) {
      ring = C.pEdge;
      const e = d * 14 / 18;
      inner = `<image href="${assets}emblems/${imp.power}.webp" x="${n(cx - e / 2)}" y="${n(cy - e / 2)}" width="${n(e)}" height="${n(e)}" preserveAspectRatio="xMidYMid meet"/>`;
    } else if (imp.card) {
      ring = C.accD;
      const k = d / 18, w = 10 * k, h = 14 * k, x = cx - w / 2, y = cy - h / 2;
      inner = `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="${n(1.2 * k)}" fill="${C.vellum}" stroke="${C.goldI}" stroke-width="${n(Math.max(0.8, 0.9 * k))}"/>` +
        `<path d="M${n(x + w - 5.2 * k)} ${n(y)}H${n(x + w - 1.2 * k)}a${n(1.2 * k)} ${n(1.2 * k)} 0 0 1 ${n(1.2 * k)} ${n(1.2 * k)}V${n(y + 5.2 * k)}z" fill="${C.acc}"/>` +
        line(x + 2.2 * k, y + h * 0.62, x + w - 2.2 * k, y + h * 0.62, C.goldI, Math.max(0.6, 0.7 * k)) + line(x + 2.2 * k, y + h * 0.78, x + w - 3.6 * k, y + h * 0.78, C.goldI, Math.max(0.6, 0.7 * k));
    } else {
      const sg = d * 12 / 18;
      inner = sigilInline(imp.a, cx - sg / 2, cy - sg / 2, sg, C.acc, d >= 30 ? 2 : 2.4);
    }
    let g = `<circle cx="${n(cx)}" cy="${n(cy + 0.6)}" r="${n(R)}" fill="rgba(29,25,21,.28)"/>`;
    g += `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(R - 0.75)}" fill="${C.vellum}" stroke="${ring}" stroke-width="1.5"/>` + inner;
    const ev = imp.event != null ? imp.event : imp.a && blockOf(imp.a) ? blockOf(imp.a).event : false;
    if (ev) {
      const a = Math.PI * 0.75, sx = cx + Math.cos(a) * (R - 0.5), sy = cy + Math.sin(a) * (R - 0.5), sr = Math.max(3, d * 0.2);
      g += `<path d="${sparkPath(sx, sy, sr)}" fill="${C.goldI}" stroke="${C.vellum}" stroke-width=".8" stroke-linejoin="round"/>`;
    }
    return g;
  }
  const impSize = (s) => clamp(Math.round(s * 0.225), 12, 20);
  function impsOnSquare(list, x, y, s, assets) {
    const d = impSize(s);
    let g = '';
    const shown = list.length > 2 ? list.slice(0, 2) : list;
    shown.forEach((imp, i) => {
      g += impMarkup(imp, x + s - 3 - d / 2 - i * (d + 2), y + 3 + d / 2, d, assets);
    });
    if (list.length > 2) {
      const px = x + s - 3 - 2 * (d + 2) - d * 0.75, py = y + 3 + d / 2;
      g += `<rect x="${n(px - d * 0.55)}" y="${n(py - d * 0.38)}" width="${n(d * 1.1)}" height="${n(d * 0.76)}" rx="${n(d * 0.38)}" fill="${C.vellum}" stroke="${C.s500}"/>` +
        `<text x="${n(px)}" y="${n(py + d * 0.2)}" text-anchor="middle" font-family="Alegreya Sans, sans-serif" font-weight="700" font-size="${n(d * 0.5)}" fill="${C.ink}">+${list.length - 2}</text>`;
    }
    return g;
  }
  // the take badge on an occupied target (top-left): a small take tile with the target in it (a shot: the pierced
  // target; blocked: a grey target with the bar). Square, so it never reads as a round impression.
  function takeBadge(x, y, s, kind) {
    const blocked = kind === 'blocked', shot = kind === 'shot' || kind === 'moveshot';
    const g = s < 48 ? 15 : clamp(0.27 * s, 15, 22);
    const x0 = x + 3, y0 = y + 3, cx = x0 + g / 2, cy = y0 + g / 2;
    let out = rrect(x0, y0, g, g, 3, `fill="${blocked ? C.bFill : C.white}" stroke="${C.halo}" stroke-width="3"`);
    out += rrect(x0, y0, g, g, 3, `fill="${blocked ? C.bFill : C.white}" stroke="${blocked ? C.bBar : C.navy}" stroke-width="1.5"`);
    const rw = Math.max(1.3, g * 0.09);
    if (shot) out += shotMark(cx + g * 0.08, cy - g * 0.08, g * 0.28, { halo: null, rw, len: 1.6 });
    else out += targetMark(cx, cy, g * 0.34, { color: blocked ? C.bX : C.red, halo: null, rw });
    if (blocked) out += bar(cx, cy, g * 0.78, 2);
    return out;
  }

  /* ---------------- G9 effects ---------------- */
  function arrowLine(p0, p1, color, w, o = {}) {
    const vx = p1[0] - p0[0], vy = p1[1] - p0[1], L = Math.hypot(vx, vy) || 1, u = [vx / L, vy / L];
    const a = [p0[0] + u[0] * (o.trim0 || 0), p0[1] + u[1] * (o.trim0 || 0)];
    const b = [p1[0] - u[0] * (o.trim1 || 0), p1[1] - u[1] * (o.trim1 || 0)];
    const hl = o.head || 10, hw = hl * 0.62;
    const heads = o.both ? [[b, u], [a, [-u[0], -u[1]]]] : [[b, u]];
    let shaft0 = a, shaft1 = [b[0] - u[0] * hl * 0.7, b[1] - u[1] * hl * 0.7];
    if (o.both) shaft0 = [a[0] + u[0] * hl * 0.7, a[1] + u[1] * hl * 0.7];
    const op = o.opacity != null ? ` opacity="${o.opacity}"` : '';
    let g = `<g${op}>`;
    if (o.halo !== false) {
      g += line(shaft0[0], shaft0[1], shaft1[0], shaft1[1], C.halo, w + 3, 'stroke-linecap="round"');
      for (const [t, uu] of heads) {
        const bb = [t[0] - uu[0] * hl, t[1] - uu[1] * hl];
        g += `<path d="M${n(t[0])} ${n(t[1])}L${n(bb[0] - uu[1] * hw)} ${n(bb[1] + uu[0] * hw)}L${n(bb[0] + uu[1] * hw)} ${n(bb[1] - uu[0] * hw)}z" fill="${C.halo}" stroke="${C.halo}" stroke-width="3" stroke-linejoin="round"/>`;
      }
    }
    g += line(shaft0[0], shaft0[1], shaft1[0], shaft1[1], color, w, `stroke-linecap="round"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}`);
    for (const [t, uu] of heads) {
      const bb = [t[0] - uu[0] * hl, t[1] - uu[1] * hl];
      g += `<path d="M${n(t[0])} ${n(t[1])}L${n(bb[0] - uu[1] * hw)} ${n(bb[1] + uu[0] * hw)}L${n(bb[0] + uu[1] * hw)} ${n(bb[1] - uu[0] * hw)}z" fill="${color}"/>`;
    }
    return g + '</g>';
  }
  function runeRing(cx, cy, r, barred) {
    const col = barred ? C.s500 : C.pMid;
    let g = `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="none" stroke="${barred ? C.halo : C.pEdge}" stroke-width="${barred ? 4 : 3.5}"/>`;
    g += `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="none" stroke="${col}" stroke-width="2"/>`;
    // six rune diamonds on the ring (the coin-notch shape), not ticks: ticks would read as a gun sight next to the take target
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 3, px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r;
      const d = Math.max(3, r * 0.17);
      g += `<path d="M${n(px)} ${n(py - d)}L${n(px + d)} ${n(py)}L${n(px)} ${n(py + d)}L${n(px - d)} ${n(py)}z" fill="${barred ? C.s300 : C.pHi}" stroke="${barred ? C.s500 : C.pEdge}" stroke-width="1.5" stroke-linejoin="round"/>`;
    }
    if (barred) {
      const k = r * 0.78;
      g += line(cx - k, cy + k, cx + k, cy - k, C.halo, 5, 'stroke-linecap="round"') + line(cx - k, cy + k, cx + k, cy - k, C.bBar, 3, 'stroke-linecap="round"');
    }
    return g;
  }
  function baseRing(cx, cy, s, kind, turns) {
    const rx = 0.36 * s, ry = 0.11 * s;
    let g = `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(rx)}" ry="${n(ry)}" fill="rgba(127,178,255,.25)" stroke="${C.pEdge}" stroke-width="3.5"/>`;
    g += `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(rx)}" ry="${n(ry)}" fill="none" stroke="${C.pMid}" stroke-width="2"/>`;
    return g;
  }
  function ringPips(cx, cy, s, kind, turns) {
    // pips sit on the front of the base ring, below the feet
    const d = clamp(0.17 * s, 10, 15);
    const k = kind === 'icewall' ? 1 : turns || 1;
    let g = '';
    for (let i = 0; i < k; i++) {
      const px = cx + (i - (k - 1) / 2) * (d + 2), py = cy + 0.11 * s;
      g += `<circle cx="${n(px)}" cy="${n(py)}" r="${n(d / 2)}" fill="${C.pHi}" stroke="${C.pEdge}" stroke-width="1.5"/>`;
      g += sigilInline(kind === 'icewall' ? 'cannotBeTaken' : 'moon', px - d * 0.34, py - d * 0.34, d * 0.68, C.pEdge, 2.6);
    }
    return g;
  }
  function frostOverlay(x, y, s) {
    return `<rect x="${n(x + 1)}" y="${n(y + 1)}" width="${n(s - 2)}" height="${n(s - 2)}" rx="${n(0.06 * s)}" fill="url(#kdm-frost)"/>` +
      `<rect x="${n(x + 0.12 * s)}" y="${n(y + 0.12 * s)}" width="${n(0.76 * s)}" height="${n(0.76 * s)}" rx="${n(0.1 * s)}" fill="url(#kdm-crystal)" opacity=".8"/>` +
      `<rect x="${n(x + 2)}" y="${n(y + 2)}" width="${n(s - 4)}" height="${n(s - 4)}" rx="${n(0.06 * s)}" fill="none" stroke="rgba(227,240,255,.9)" stroke-width="1.5"/>`;
  }
  function becomesFan(x, y, s, assets) {
    const k = 0.3 * s;
    let g = '<g opacity=".4">';
    ['queen', 'rook', 'bishop', 'knight'].forEach((p, i) => {
      const off = (i - 1.5) * 0.19 * s, rot = (i - 1.5) * 12;
      const cx = x + s / 2 + off, cy = y + s * 0.72;
      g += `<image href="${assets}icons/${p}.svg" x="${n(cx - k / 2)}" y="${n(cy - k / 2)}" width="${n(k)}" height="${n(k)}" transform="rotate(${rot} ${n(cx)} ${n(y + s * 1.1)})"/>`;
    });
    return g + '</g>';
  }
  function pip(cx, cy, d, num) {
    return `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(d / 2 + 1.5)}" fill="${C.halo}"/><circle cx="${n(cx)}" cy="${n(cy)}" r="${n(d / 2)}" fill="${C.ink}"/>` +
      `<text x="${n(cx)}" y="${n(cy + d * 0.3)}" text-anchor="middle" font-family="Alegreya Sans, sans-serif" font-weight="700" font-size="${n(d * 0.78)}" fill="${C.vellum}">${num}</text>`;
  }

  /* ---------------- G8 zones ---------------- */
  const ZONES = {
    startRank: (side) => FILES.split('').map((f) => f + (side === 'b' ? 7 : 2)),
    ownHalf: (side) => FILES.split('').flatMap((f) => (side === 'b' ? [5, 6, 7, 8] : [1, 2, 3, 4]).map((r) => f + r)),
    enemyHalf: (side) => FILES.split('').flatMap((f) => (side === 'b' ? [1, 2, 3, 4] : [5, 6, 7, 8]).map((r) => f + r)),
    lastRank: (side) => FILES.split('').map((f) => f + (side === 'b' ? 1 : 8)),
    capital: () => ['d4', 'e4', 'd5', 'e5'],
  };
  function chalkMarkup(squares, s, ox, oy, picto) {
    const set = new Set(squares);
    let fills = '', edges = '';
    let minF = 9, maxR = 0;
    for (const q of squares) {
      const { f, r } = parse(q);
      const x = ox + f * s, y = oy + (8 - r) * s;
      fills += `<rect x="${n(x)}" y="${n(y)}" width="${s}" height="${s}" fill="url(#kdm-hatch)"/>`;
      const nb = { t: sqName(f, r + 1), b: sqName(f, r - 1), l: f > 0 ? sqName(f - 1, r) : '', r: f < 7 ? sqName(f + 1, r) : '' };
      const i = 2;
      if (!set.has(nb.t)) edges += `M${n(x + i)} ${n(y + i)}H${n(x + s - i)}`;
      if (!set.has(nb.b)) edges += `M${n(x + i)} ${n(y + s - i)}H${n(x + s - i)}`;
      if (!set.has(nb.l)) edges += `M${n(x + i)} ${n(y + i)}V${n(y + s - i)}`;
      if (!set.has(nb.r)) edges += `M${n(x + s - i)} ${n(y + i)}V${n(y + s - i)}`;
      if (r > maxR || (r === maxR && f < minF)) { maxR = r; minF = f; }
    }
    // join the inner edges, so the outline reads as one shape
    let g = fills;
    g += `<path d="${edges}" fill="none" stroke="${C.chalkSh}" stroke-width="5" stroke-linecap="round" transform="translate(.6 .9)"/>`;
    g += `<path d="${edges}" fill="none" stroke="${C.chalk}" stroke-width="3" stroke-linecap="round"/>`;
    if (picto) {
      const x = ox + minF * s + 4, y = oy + (8 - maxR) * s + 4, d = 20;
      g += `<rect x="${n(x)}" y="${n(y)}" width="${d}" height="${d}" rx="4" fill="${C.vellum}" stroke="${C.goldI}"/>`;
      g += `<svg x="${n(x + 2)}" y="${n(y + 2)}" width="16" height="16" viewBox="0 0 24 24">${pictoInner(picto)}</svg>`;
    }
    return g;
  }

  /* ---------------- G14 When pictograms and words ---------------- */
  const ZONE_WORDS = { startRank: 'on its start rank', ownHalf: 'in your half', enemyHalf: 'in the enemy half', lastRank: 'on the last rank', capital: 'on a center square' };
  const BODY = { P: 'pawn', N: 'knight', B: 'bishop', R: 'rook', Q: 'queen', A: 'archer', L: 'paladin', G: 'guard', M: 'maester', S: 'beast', O: 'ogre' };
  function whenWords(w) {
    switch (w.on) {
      case 'always': return 'always';
      case 'zone': return ZONE_WORDS[w.zone];
      case 'near': return w.who === 'king' ? 'next to your king' : w.who === 'friend' ? 'next to one of your pieces' : w.who === 'enemy' ? 'next to an enemy piece' : `next to your ${BODY[w.who]}`;
      case 'fromMove': return `from move ${w.n}`;
      case 'beforeMove': return `before move ${w.n}`;
      case 'afterFirstCapture': return 'after its first capture';
      case 'afterCard': return 'on your turn after your opponent plays any card';
      case 'takes': return 'when it takes';
      case 'firstTake': return 'when it takes for the first time';
      case 'reaches': return 'when it reaches the last rank';
    }
    return '';
  }
  const isEvent = (w) => ['takes', 'firstTake', 'reaches'].includes(w.on);
  function mapPicto(zone) {
    // a mini 8x8 map (cells 2.5) with the zone filled
    const x0 = 2, c = 2.5;
    let fill = '';
    const rows = { startRank: [[0, 6, 8, 1]], ownHalf: [[0, 4, 8, 4]], enemyHalf: [[0, 0, 8, 4]], lastRank: [[0, 0, 8, 1]], capital: [[3, 3, 2, 2]] }[zone] || [];
    for (const [f, r, w, h] of rows) fill += `<rect x="${x0 + f * c}" y="${x0 + r * c}" width="${w * c}" height="${h * c}" fill="currentColor"/>`;
    return `<rect x="2" y="2" width="20" height="20" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.6"/>` +
      `<path d="M7 2v20M12 2v20M17 2v20M2 7h20M2 12h20M2 17h20" stroke="currentColor" stroke-width=".5" opacity=".45"/>` + fill;
  }
  const strokeP = (d, w = 2) => `<path d="${d}" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const numText = (t, x = 18.5, y = 22.5, fs = 11) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Alegreya Sans, sans-serif" font-weight="800" font-size="${fs}" fill="currentColor" stroke="${C.vellum}" stroke-width="2.4" paint-order="stroke">${t}</text>`;
  function pictoInner(w) {
    switch (w.on) {
      case 'zone': return mapPicto(w.zone);
      case 'near': return strokeP(SIGILS.near, 1.8);
      case 'fromMove': case 'beforeMove': return strokeP('M6 2.5h9M6 19.5h9M7 2.5c0 4.5 6.5 5.8 6.5 8.5S7 15 7 19.5M14 2.5c0 4.5-6.5 5.8-6.5 8.5S14 15 14 19.5', 1.9) + numText(w.n, 18.5, 23, 10.5);
      case 'afterFirstCapture': return `<circle cx="9.5" cy="9.5" r="6.8" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="9.5" cy="9.5" r="2.6" fill="currentColor"/>` + numText('1', 19, 23, 12);
      case 'afterCard': return strokeP(SIGILS.card, 1.9) + `<path d="M12.5 3.5h4a1.5 1.5 0 0 1 1.5 1.5v4z" fill="${C.acc}"/>`;
      case 'takes': return `<path d="${sparkPath(12, 12, 10)}" fill="currentColor"/>`;
      case 'firstTake': return `<path d="${sparkPath(10, 11, 9)}" fill="currentColor"/>` + numText('1', 19, 23, 12);
      case 'reaches': return `<path d="${sparkPath(6.5, 7, 5.5)}" fill="currentColor"/>` + strokeP('M3 21h18M7 17l-.5-6 3.5 2.5 2-4.5 2 4.5 3.5-2.5-.5 6z', 1.7);
      default: return '';
    }
  }
  function picto(w, size = 14) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">${pictoInner(w)}</svg>`;
  }
  function chip(w, o = {}) {
    if (!w || w.on === 'always') return '';
    const cls = isEvent(w) ? 'flag' : 'plate';
    return `<span class="${cls}${o.hollow ? ' is-hollow' : ''}" title="${esc(whenWords(w))}"><span>${picto(w)}${esc(o.words || whenWords(w))}</span></span>`;
  }
  const pill = (text, o = {}) => `<span class="pill${o.choice ? ' is-choice' : ''}${o.on ? ' is-on' : ''}">${esc(text)}</span>`;

  /* ---------------- G11 seals ---------------- */
  const SCALLOP = (() => {
    const N = 12, Rv = 42.5, cx = 50, cy = 50;
    const pts = [];
    for (let i = 0; i <= N; i++) { const a = (i / N) * Math.PI * 2 - Math.PI / 2; pts.push([cx + Math.cos(a) * Rv, cy + Math.sin(a) * Rv]); }
    const chord = 2 * Rv * Math.sin(Math.PI / N), rl = chord * 0.6;
    let d = `M${n(pts[0][0])} ${n(pts[0][1])}`;
    for (let i = 1; i <= N; i++) d += `A${n(rl)} ${n(rl)} 0 0 1 ${n(pts[i][0])} ${n(pts[i][1])}`;
    return d + 'z';
  })();
  function seal(a, size = 44, o = {}) {
    const b = blockOf(a);
    const ev = o.event != null ? o.event : b ? b.event : false;
    const grey = o.grey;
    const title = o.title != null ? o.title : b ? b.title : a;
    if (LOOK.familyWax && b && !grey) return sealFamily(a, b, size, o, title);
    let g = `<svg class="kd-seal" width="${size}" height="${size}" viewBox="0 0 100 100" role="img" aria-label="${esc(title)}"${o.asleep ? ' style="filter:grayscale(1);opacity:.5"' : o.dim ? ' style="opacity:.45"' : o.echo ? ' style="opacity:.5"' : ''}><title>${esc(title)}</title>`;
    g += `<g filter="url(#kdm-seal-shadow)"><path d="${SCALLOP}" fill="url(#${grey ? 'kdm-wax-grey' : 'kdm-wax'})" stroke="${grey ? '#4d453c' : C.accD}" stroke-width="1.2"/></g>`;
    // pressed rim
    g += `<circle cx="50" cy="50" r="33.5" fill="none" stroke="rgba(40,10,6,.38)" stroke-width="2.4"/>`;
    g += `<circle cx="50" cy="51.2" r="33.5" fill="none" stroke="rgba(255,214,196,.22)" stroke-width="1.2"/>`;
    g += `<ellipse cx="38" cy="30" rx="16" ry="8" fill="rgba(255,236,226,.16)" transform="rotate(-30 38 30)"/>`;
    // sigil, 55% of the seal, with a faint deboss shadow
    g += `<svg x="22.5" y="23.7" width="55" height="55" viewBox="0 0 24 24"><path d="${SIGILS[a] || a}" fill="none" stroke="rgba(40,10,6,.55)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    g += `<svg x="22.5" y="22.5" width="55" height="55" viewBox="0 0 24 24"><path d="${SIGILS[a] || a}" fill="none" stroke="${C.vellum}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    if (ev) g += `<circle cx="81" cy="19" r="11" fill="${C.vellum}" stroke="${C.accD}" stroke-width="1.5"/><path d="${sparkPath(81, 19, 7.5)}" fill="${C.goldI}"/>`;
    return g + '</svg>';
  }
  // look.familyWax: one wax colour for each GROUPS family; the glyph is 50% of the seal, embossed gold; no event spark
  const FAMILY_WAX = {
    Moving: ['kdm-wax', C.accD, '#f3d58e', 'rgba(40,10,6,.6)'],
    Taking: ['kdm-wax-taking', '#1a0706', '#f0cf86', 'rgba(0,0,0,.7)'],
    Safe: ['kdm-wax-safe', '#22364e', '#f5dc9e', 'rgba(12,24,40,.6)'],
    'Moving others': ['kdm-wax-others', '#123d38', '#f5dc9e', 'rgba(6,30,27,.6)'],
    Changing: ['kdm-wax-changing', '#6f4f12', '#4a3208', 'rgba(255,240,200,.75)'],
    'Holding back': ['kdm-wax-holding', '#1e1b18', '#ecc97d', 'rgba(0,0,0,.65)'],
  };
  function sealFamily(a, b, size, o, title) {
    const [grad, edge, glyph, deboss] = FAMILY_WAX[b.group] || FAMILY_WAX.Moving;
    const st = o.asleep ? ' style="filter:grayscale(1);opacity:.5"' : o.dim ? ' style="opacity:.45"' : o.echo ? ' style="opacity:.5"' : '';
    let g = `<svg class="kd-seal" width="${size}" height="${size}" viewBox="0 0 100 100" role="img" aria-label="${esc(title)}"${st}><title>${esc(title)}</title>`;
    g += `<g filter="url(#kdm-seal-shadow)"><path d="${SCALLOP}" fill="url(#${grad})" stroke="${edge}" stroke-width="1.2"/></g>`;
    g += `<circle cx="50" cy="50" r="33.5" fill="none" stroke="rgba(0,0,0,.32)" stroke-width="2.4"/>`;
    g += `<circle cx="50" cy="51.2" r="33.5" fill="none" stroke="rgba(255,236,210,.22)" stroke-width="1.2"/>`;
    g += `<ellipse cx="38" cy="30" rx="16" ry="8" fill="rgba(255,240,226,.16)" transform="rotate(-30 38 30)"/>`;
    // embossed glyph: a dark lower edge, a light upper edge, then the gold stroke
    const P = SIGILS[a] || a;
    g += `<svg x="25" y="26.4" width="50" height="50" viewBox="0 0 24 24"><path d="${P}" fill="none" stroke="${deboss}" stroke-width="2.9" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    g += `<svg x="25" y="24.2" width="50" height="50" viewBox="0 0 24 24"><path d="${P}" fill="none" stroke="rgba(255,250,235,.35)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    g += `<svg x="25" y="25" width="50" height="50" viewBox="0 0 24 24"><path d="${P}" fill="none" stroke="${glyph}" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    return g + '</svg>';
  }
  function sigil(name, size = 24, o = {}) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true"><path d="${SIGILS[name] || name}" fill="none" stroke="${o.color || 'currentColor'}" stroke-width="${o.width || 2}" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }
  const socket = (inner) => `<span class="socket">${inner || '+'}</span>`;

  /* ---------------- G15 knots ---------------- */
  function knot(type, o = {}) {
    // o.vertical: draw the knot standing up (between seal rows); the arc bulges to the left and the glyph stays upright
    if (o.vertical) {
      const len = o.h || 96, wid = o.w || 22;
      const inner = knot(type, { w: len, h: wid }).replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
      const mx = len / 2, my = wid * 0.24;
      // un-rotate the middle glyph: it is drawn around (mx, my) in the horizontal frame
      const body = inner.replace(/<g transform="translate\(([^)]*)\)">/, (m, t) => `<g transform="translate(${t}) rotate(90)">`)
        .replace(/(<text[^>]*?)>\?<\/text>/, (m, a) => `${a} transform="rotate(90 ${n(mx)} ${n(my)})">?</text>`);
      return `<svg class="knot" width="${wid}" height="${len}" viewBox="0 0 ${wid} ${len}" overflow="visible" aria-label="${type === 'gold' ? 'They combine here' : type === 'cracked' ? 'One rule stops the other here' : 'Not checked yet'}"><g transform="translate(0 ${len}) rotate(-90)">${body}</g></svg>`;
    }
    const w = o.w || 96, h = o.h || 22, pad = 4;
    const d = `M${pad} ${h - 3}Q${w / 2} ${-h * 0.55} ${w - pad} ${h - 3}`;
    const mx = w / 2, my = h * 0.24;
    let g = `<svg class="knot" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" overflow="visible" aria-label="${type === 'gold' ? 'They combine here' : type === 'cracked' ? 'One rule stops the other here' : 'Not checked yet'}">`;
    if (type === 'gold') {
      g += `<path d="${d}" fill="none" stroke="${C.goldB}" stroke-width="4" stroke-linecap="round" opacity=".5"/><path d="${d}" fill="none" stroke="${C.goldI}" stroke-width="2" stroke-linecap="round"/>`;
      // a small reef knot at the middle
      g += `<g transform="translate(${n(mx)} ${n(my)})"><ellipse cx="0" cy="0" rx="8.5" ry="6" fill="${C.vellum}"/>` +
        `<path d="M-7 1.5c2-5 5-5 7-1.5s5 3.5 7-1.5M-7-1.5c2 5 5 5 7 1.5s5-3.5 7 1.5" fill="none" stroke="${C.goldI}" stroke-width="1.8" stroke-linecap="round"/></g>`;
    } else if (type === 'cracked') {
      const gap = 7;
      g += `<path d="${d}" fill="none" stroke="${C.s500}" stroke-width="2" stroke-linecap="round" stroke-dasharray="${n(w * 0.56 - gap)} ${n(gap * 2.2)} 999"/>`;
      g += `<path d="M${n(mx - 6)} ${n(my - 6)}l3 4-3 3 4 3-2 3M${n(mx + 3)} ${n(my - 7)}l-2 4 3 3-3 3 3 3" fill="none" stroke="${C.s500}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`;
    } else {
      g += `<path d="${d}" fill="none" stroke="${C.s300}" stroke-width="1.5" stroke-linecap="round"/>`;
      g += `<circle cx="${n(mx)}" cy="${n(my)}" r="7.5" fill="${C.vellum}" stroke="${C.s500}"/><text x="${n(mx)}" y="${n(my + 3.6)}" text-anchor="middle" font-family="Alegreya Sans, sans-serif" font-weight="700" font-size="10.5" fill="${C.inkSoft}">?</text>`;
    }
    g += `<circle cx="${pad}" cy="${h - 3}" r="2.4" fill="${type === 'gold' ? C.goldI : type === 'cracked' ? C.s500 : C.s300}"/><circle cx="${w - pad}" cy="${h - 3}" r="2.4" fill="${type === 'gold' ? C.goldI : type === 'cracked' ? C.s500 : C.s300}"/>`;
    return g + '</svg>';
  }

  /* ---------------- coin, status, tags, plaque ---------------- */
  function coin(king, o = {}) {
    const size = o.size || 48, assets = o.assets || 'assets/';
    let notches = '';
    if (o.uses === Infinity) notches = '<span class="inf">∞</span>';
    else if (o.uses) for (let i = 0; i < o.uses; i++) notches += `<span class="notch${i < (o.spent || 0) ? ' is-spent' : ''}"></span>`;
    return `<span class="coin"${o.state ? ` data-state="${o.state}"` : ''} style="width:${size}px;height:${size}px" title="${esc(o.title || king)}"><img src="${assets}emblems/${king}.webp" alt="">${notches ? `<span class="notches">${notches}</span>` : ''}</span>`;
  }
  function statusSvg(kind, size = 14) {
    const r = size / 2 - 1, c = size / 2;
    if (kind === 'official') return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${c}" cy="${c}" r="${r}" fill="${C.goldI}"/><circle cx="${c - r * 0.3}" cy="${c - r * 0.35}" r="${r * 0.28}" fill="rgba(255,240,200,.35)"/></svg>`;
    if (kind === 'lab') return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${c}" cy="${c}" r="${r - 0.6}" fill="${C.vellum}" stroke="${C.acc}" stroke-width="1.4"/><path d="M${c} ${c - r + 0.6}A${r - 0.6} ${r - 0.6} 0 0 0 ${c} ${c + r - 0.6}z" fill="${C.acc}"/></svg>`;
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${c}" cy="${c}" r="${r - 0.7}" fill="none" stroke="${C.s500}" stroke-width="1.5"/></svg>`;
  }
  const status = (kind, size = 14) => `<span class="status" style="width:${size}px;height:${size}px" title="${{ official: 'Official', lab: 'Lab', designed: 'Designed, not built' }[kind] || kind}">${statusSvg(kind, size)}</span>`;
  function tag(kind, words) {
    if (kind === 'yours') return `<span class="tag-yours">${sigil('quill', 13)}${esc(words || 'Yours')}</span>`;
    return `<span class="tag-original">${statusSvg('official', 10)}${esc(words || 'Original')}</span>`;
  }
  const plaque = () => `<span class="plaque" title="An example board. No check test. The other side does not move.">${sigil('lockOpen', 13)}Try board</span>`;

  /* ---------------- G17 facet band ---------------- */
  function facets(f) {
    const cell = (inner, cap, live) => `<span class="facet${live ? ' is-live' : ''}"><span class="cell">${inner}${live ? '' : `<svg class="lock" viewBox="0 0 24 24"><path d="${SIGILS.lock}" fill="none" stroke="currentColor" stroke-width="2.6"/></svg>`}</span>${cap ? `<small>${esc(cap)}</small>` : ''}</span>`;
    const live = new Set(f.live || []);
    let h = '<span class="facets">';
    // 1 targets
    const t = f.targets || {};
    let ti = `<svg width="30" height="30" viewBox="0 0 30 30"><circle cx="${t.notKing ? 12 : 15}" cy="15" r="9" fill="${t.side === 'b' ? '#4a4850' : '#fffcf4'}" stroke="${C.ink}" stroke-width="1.5"/>`;
    ti += `<path d="M${t.notKing ? 8.5 : 11.5} 19h7l-1-3.5a2.6 2.6 0 1 0-5 0z" fill="${t.side === 'b' ? '#f3ead7' : C.ink}"/>`;
    if (t.notKing) ti += `<g transform="translate(18 15) scale(.48)"><path d="${SIGILS.crown}" fill="none" stroke="${C.inkSoft}" stroke-width="2.6" stroke-linejoin="round"/><path d="M2 3l20 18" stroke="${C.red}" stroke-width="3" stroke-linecap="round"/></g>`;
    h += cell(ti + '</svg>', f.caps && f.caps[0]);
    // 2 turn cost
    const dot = (x, full) => `<circle cx="${x}" cy="15" r="5" fill="${full ? C.ink : 'none'}" stroke="${C.ink}" stroke-width="1.6"/>`;
    const cost = f.cost === 'free' ? dot(9, false) + dot(21, true) : f.cost === 'two' ? dot(9, true) + dot(21, true) : dot(15, true);
    h += cell(`<svg width="30" height="30" viewBox="0 0 30 30">${cost}</svg>`, f.caps && f.caps[1]);
    // 3 captures
    let cap = '';
    if (f.captures === 'never') cap = targetMark(15, 14, 9, { color: C.bX, halo: null, rw: 2.2 }) + bar(15, 14, 22, 2.5);
    else cap = targetMark(15, 13, 9, { halo: null, rw: 2.2 }) + (f.captures === 'must' ? line(6, 26, 24, 26, C.red, 2.4, 'stroke-linecap="round"') : '');
    h += cell(`<svg width="30" height="30" viewBox="0 0 30 30">${cap}</svg>`, f.caps && f.caps[2]);
    // 4 uses
    let u = '';
    if (f.uses === Infinity) u = `<span style="font:700 20px/1 var(--font-body);color:${C.pEdge}">∞</span>`;
    else if (f.uses) { u = '<span style="display:flex;gap:3px">'; for (let i = 0; i < f.uses; i++) u += `<span style="width:9px;height:9px;box-sizing:border-box;transform:rotate(45deg);background:${i < (f.spent || 0) ? C.s300 : C.pMid};border:1.5px solid ${i < (f.spent || 0) ? C.s500 : C.notch}"></span>`; u += '</span>'; }
    else u = `<span style="font:400 11px/1.1 var(--font-body);color:${C.inkSoft};text-align:center">one<br>card</span>`;
    h += cell(u, f.caps && f.caps[3], live.has('uses'));
    // 5 duration
    let d = '<svg width="34" height="30" viewBox="0 0 34 30">';
    if (f.duration === 'always') d += `<text x="17" y="21" text-anchor="middle" font-family="Alegreya Sans, sans-serif" font-weight="700" font-size="20" fill="${C.pEdge}">∞</text>`;
    else if (f.duration === 'now') d += `<circle cx="17" cy="15" r="4" fill="${C.ink}"/>`;
    else {
      const on = f.duration === 'them' ? [1] : f.duration === 'you' ? [0] : [1, 2];
      for (let i = 0; i < 3; i++) d += `<rect x="${1 + i * 11}" y="13" width="10" height="11" rx="1.5" fill="${i === 1 ? '#4a4850' : '#fffcf4'}" stroke="${C.s700}"/>`;
      for (const i of on) d += `<rect x="${1 + i * 11}" y="6" width="10" height="4.5" rx="2" fill="${C.pMid}" stroke="${C.pEdge}"/>`;
    }
    h += cell(d + '</svg>', f.caps && f.caps[4], live.has('duration'));
    if (f.when) h += `<span class="facet is-cond"><span style="height:40px;display:grid;align-items:center">${chip(f.when)}</span>${f.caps && f.caps[5] ? `<small>${esc(f.caps[5])}</small>` : ''}</span>`;
    return h + '</span>';
  }

  /* ---------------- single tile, impression, effect as <svg> ---------------- */
  function tile(kind, size = 56, o = {}) {
    ensureDefs();
    let inner = '';
    if (o.fill) {
      const t = size - 6, s = t / 0.8;
      inner = tileAt(kind, 3, 3, t, s, o);
    } else {
      const s = size;
      if (o.rail) {
        // a rail stub through the square, with a chevron in its direction (the Why "line" part)
        const [dx, dy] = DIR[o.rail], u = [dx, -dy], L = Math.hypot(u[0], u[1]), uu = [u[0] / L, u[1] / L];
        const c = [s / 2, s / 2];
        inner += railMarkup([c[0] - uu[0] * s * 0.5, c[1] - uu[1] * s * 0.5], [c[0] + uu[0] * s * (o.railHead ? 0.28 : 0.5), c[1] + uu[1] * s * (o.railHead ? 0.28 : 0.5)], s);
      }
      inner += tileMarkup(kind, 0, 0, s, o);
      if (o.rail && o.railHead) {
        const [dx, dy] = DIR[o.rail], u = [dx, -dy], L = Math.hypot(u[0], u[1]), uu = [u[0] / L, u[1] / L];
        inner += arrowHead([s / 2 + uu[0] * s * 0.46, s / 2 + uu[1] * s * 0.46], uu, s * 0.8);
      }
      if (o.xtag || o.badge) inner += takeBadge(0, 0, s, kind);
      const list = o.imps || (o.tag ? [o.tag] : []);
      if (list.length) inner += impsOnSquare(list, 0, 0, s, o.assets || 'assets/');
    }
    const bg = o.stone ? `<rect width="${size}" height="${size}" fill="${o.stone === 'dark' ? C.stoneDark : C.stoneLight}"/>` : '';
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" overflow="visible" role="img" aria-label="${esc(NAMES[kind] || kind)}">${bg}${inner}</svg>`;
  }
  function impression(imp, size = 18, o = {}) {
    ensureDefs();
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" overflow="visible" role="img" aria-label="${esc(imp.a ? (blockOf(imp.a) || {}).title : imp.power ? 'King power' : 'LAB card')}">${impMarkup(imp, size / 2, size / 2, size, o.assets || 'assets/')}</svg>`;
  }
  function effect(kind, s = 80, o = {}) {
    ensureDefs();
    const a = o.assets || 'assets/';
    const c = s / 2;
    let g = '';
    switch (kind) {
      case 'push': g = arrowLine([s * 0.12, c], [s * 0.92, c], C.push, 3, { head: Math.max(7, s * 0.125) }); break;
      case 'follow': g = arrowLine([s * 0.12, c], [s * 0.88, c], C.push, 1.5, { head: Math.max(6, s * 0.1) }); break;
      case 'swap': g = arrowLine([s * 0.1, c], [s * 0.9, c], C.swap, 3, { both: true, head: Math.max(7, s * 0.125) }); break;
      case 'becomes': g = tileMarkup('move', 0, 0, s) + becomesFan(0, 0, s, a) + impsOnSquare([{ a: 'becomes' }], 0, 0, s, a); break;
      case 'power': g = tileMarkup('move', 0, 0, s, { power: true }) + impsOnSquare([{ power: o.king || 'mud' }], 0, 0, s, a); break;
      case 'rune': g = runeRing(c, c, s * 0.38, false); break;
      case 'rune-barred': g = runeRing(c, c, s * 0.38, true); break;
      case 'frost': g = frostOverlay(0, 0, s) + baseRing(c, s * 0.8, s) + ringPips(c, s * 0.8, s, 'frost', o.turns || 1); break;
      case 'icewall': g = baseRing(c, s * 0.8, s) + ringPips(c, s * 0.8, s, 'icewall'); break;
      case 'threat': g = arrowLine([s * 0.1, s * 0.9], [s * 0.9, s * 0.1], C.red, 2, { opacity: 0.6, head: 9 }); break;
      case 'threat-stopped': g = arrowLine([s * 0.1, s * 0.9], [s * 0.9, s * 0.1], C.s500, 2, { head: 9 }) + bar(c, c, s * 0.24, 3) + impMarkup(o.imp || { a: 'cannotBeTaken' }, c + s * 0.2, c + s * 0.2, impSize(s), a); break;
      case 'arch': g = archMarkup([s * 0.08, s * 0.85], [s * 0.92, s * 0.85], s * 0.9).svg; break;
      case 'arch-power': { const r = archMarkup([s * 0.08, s * 0.85], [s * 0.92, s * 0.85], s * 0.9, { power: true }); g = r.svg + impMarkup({ power: o.king || 'mud' }, r.apex[0], r.apex[1], impSize(s), a); break; }
      case 'pip': g = pip(c, c, 14, o.n || 2); break;
      case 'stop': g = railMarkup([0, c], [s * 0.6, c], s) + stopBar([s * 0.6, c], [1, 0], s); break;
      case 'baseglow': g = `<ellipse cx="${c}" cy="${s * 0.8}" rx="${s * 0.36}" ry="${s * 0.12}" fill="url(#kdm-glow-red)"/>`; break;
    }
    return `<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" overflow="visible" role="img" aria-label="${esc(NAMES[kind] || kind)}">${g}</svg>`;
  }

  /* ---------------- G16 Why sum row ---------------- */
  function whySum(sum, o = {}) {
    const T = o.tile || 56, I = o.imp || 40, a = o.assets || 'assets/';
    const caps = sum.captions || [];
    let i = 0;
    const part = (svg) => `<span class="part">${svg}${o.words === false ? '' : `<small>${esc(caps[i++] || '')}</small>`}</span>`;
    let h = '<span class="why-sum">';
    h += part(tile(sum.base.k, T, { rail: sum.base.rail, railHead: true, cond: sum.base.cond, assets: a }));
    for (const imp of sum.imps || []) h += `<span class="op">+</span>` + part(`<span style="display:grid;place-items:center;height:${T}px">${impression(imp, I, { assets: a })}</span>`);
    if (sum.with) h += `<span class="op">+</span>` + part(sum.with);
    h += `<span class="op">=</span>` + part(tile(sum.result.k, T, { cond: sum.result.cond, tag: sum.result.tag, xtag: sum.result.xtag, assets: a }));
    return h + '</span>';
  }

  /* ---------------- 7x7 diagram ---------------- */
  function diagram(p, o = {}) {
    ensureDefs();
    const s = o.s || 36, a = o.assets || 'assets/';
    const W = 7 * s;
    const light = o.light || C.dLight, dark = o.dark || C.dDark;
    const glyph = s < 12;
    let g = '';
    if (o.cells !== false && !(glyph && o.cells == null)) {
      for (let r = 0; r < 7; r++) for (let f = 0; f < 7; f++) g += `<rect x="${n(f * s)}" y="${n(r * s)}" width="${n(s)}" height="${n(s)}" fill="${(f + r) % 2 ? dark : light}"/>`;
    }
    const cc = (x, y) => [(x + 3) * s + s / 2, (3 - y) * s + s / 2];
    // o.iso (optional): 'pass' | 'cond' | 'lines' | 'squares' | 'none', or a list of them. The named parts glow
    // (kdm-iso) and every other part drops to 25% (kdm-dim). Without o.iso the output is unchanged.
    const isoOn = (part) => (Array.isArray(o.iso) ? o.iso.includes(part) : o.iso === part);
    const WP = (part, svg) => (o.iso == null || !svg ? svg : `<g class="${isoOn(part) ? 'kdm-iso' : 'kdm-dim'}">${svg}</g>`);
    const g0 = g; g = '';
    // rails first
    for (const dir of p.lines || []) {
      const [dx, dy] = DIR[dir];
      const u = [dx, -dy], L = Math.hypot(u[0], u[1]), uu = [u[0] / L, u[1] / L];
      const c0 = cc(0, 0);
      const p0 = [c0[0] + u[0] * s * 0.42, c0[1] + u[1] * s * 0.42];
      const end = cc(dx * 3, dy * 3);
      const tip = [end[0] + u[0] * s * (glyph ? 0.45 : 0.08), end[1] + u[1] * s * (glyph ? 0.45 : 0.08)];
      const L2 = glyph ? 0 : Math.max(4, 0.26 * s);
      const p1 = [tip[0] - uu[0] * L2 * 0.6, tip[1] - uu[1] * L2 * 0.6];
      g += railMarkup(p0, p1, s, { style: p.condLines });
    }
    const linePart = p.condLines ? 'cond' : 'lines';
    // gt and gep keep the original order (used when o.iso is not set); gs, gc, ge and gp split the parts for o.iso
    const gl = g;
    let gt = '', gs = '', gc = '', gep = '', ge = '', gp = '';
    // tiles
    for (const q of p.squares || []) {
      const [x, y] = [(q.x + 3) * s, (3 - q.y) * s];
      const t = tileMarkup(q.mark === 'shoot' ? 'shot' : q.mark === 'moveShoot' ? 'moveshot' : q.mark, x, y, s, { cond: q.cond ? (glyph ? true : 'pattern') : undefined });
      gt += t;
      if (q.cond) gc += t; else gs += t;
    }
    // line ends and bridges
    for (const dir of p.lines || []) {
      const [dx, dy] = DIR[dir];
      const u = [dx, -dy], L = Math.hypot(u[0], u[1]), uu = [u[0] / L, u[1] / L];
      const end = cc(dx * 3, dy * 3);
      const tip = [end[0] + u[0] * s * (glyph ? 0.45 : 0.08), end[1] + u[1] * s * (glyph ? 0.45 : 0.08)];
      const ch = chevronT(tip, uu, s);
      ge += ch; gep += ch;
      if (p.pass && !glyph) {
        // a small navy bridge over the first cell: a short hump across the rail
        const c1 = cc(dx, dy), h = dx && dy ? 0.3 : 0.32;
        const b0 = [c1[0] - uu[0] * s * h, c1[1] - uu[1] * s * h], b1 = [c1[0] + uu[0] * s * h, c1[1] + uu[1] * s * h];
        const br = `<circle cx="${n(c1[0])}" cy="${n(c1[1])}" r="${n(Math.max(2, 0.09 * s))}" fill="${C.navy}" stroke="${C.halo}" stroke-width="1.2"/>` +
          archMarkup(b0, b1, s, { bulge: 0.24, left: true, width: s < 30 ? 1.3 : 2 }).svg;
        gp += br; gep += br;
      }
    }
    g = o.iso == null ? g0 + gl + gt + gep : g0 + WP(linePart, gl) + WP('cond', gc) + WP('squares', gs) + WP(linePart, ge) + WP('pass', gp);
    // the piece in the centre
    const c0 = cc(0, 0);
    if (o.icon || p.icon) {
      const k = glyph ? s * 1.1 : s * 0.84;
      g += `<image href="${a}icons/${o.icon || p.icon}.svg" x="${n(c0[0] - k / 2)}" y="${n(c0[1] - k / 2)}" width="${n(k)}" height="${n(k)}"/>`;
    } else g += `<circle cx="${n(c0[0])}" cy="${n(c0[1])}" r="${n(s * 0.3)}" fill="${C.ink}" stroke="${C.goldB}" stroke-width="${glyph ? 1 : 2}"/>`;
    return `<svg width="${n(W)}" height="${n(W)}" viewBox="0 0 ${n(W)} ${n(W)}" overflow="visible" role="img" aria-label="${esc(o.label || 'Reach diagram')}">${g}</svg>`;
  }

  /* ---------------- the board ---------------- */
  function squareXY(name, s = 80, origin) {
    const { f, r } = parse(name);
    return { x: (origin ? origin.x : 0) + f * s, y: (origin ? origin.y : 0) + (8 - r) * s };
  }
  function viewBox(s = 80, crop, origin) {
    const ox = origin ? origin.x : 0, oy = origin ? origin.y : 0;
    if (!crop) return `0 0 ${ox * 2 + 8 * s} ${oy * 2 + 8 * s}`;
    const [a, b] = crop.split(':').map(parse);
    const f0 = Math.min(a.f, b.f), f1 = Math.max(a.f, b.f), r0 = Math.min(a.r, b.r), r1 = Math.max(a.r, b.r);
    return `${ox + f0 * s} ${oy + (8 - r1) * s} ${(f1 - f0 + 1) * s} ${(r1 - r0 + 1) * s}`;
  }
  const pieceImg = (p) => p.img || (p.k === 'king' ? (p.side === 'b' ? 'kings/shadow-b.webp' : 'kings/spirit.webp') : `pieces/${p.k}-${p.side || 'w'}.webp`);

  function drawString(scene, o = {}) {
    const s = o.s || 80, ox = o.origin ? o.origin.x : 0, oy = o.origin ? o.origin.y : 0;
    const A = o.assets || 'assets/';
    const layers = new Set(o.layers || ['board', 'chalk', 'under', 'pieces', 'over']);
    const XY = (q) => { const { f, r } = parse(q); return [ox + f * s, oy + (8 - r) * s]; };
    const CTR = (q) => { const [x, y] = XY(q); return [x + s / 2, y + s / 2]; };
    const pieces = scene.pieces || [];
    const at = {};
    for (const p of pieces) if (!p.ghost) at[p.sq] = p;
    const openP = pieces.find((p) => p.open);
    const side = openP ? openP.side || 'w' : 'w';
    const focus = o.focus != null ? o.focus : null;
    const dimAll = o.dim != null ? o.dim : !!scene.dim;
    let ripple = 0;
    // visibility and the isolate / dim / diff classes for one element
    function wrap(svg, meta = {}) {
      if (!svg) return '';
      if (meta.on && !(o.showAll || o.hover === meta.on)) return '';
      const cls = [];
      if (o.focusAll) cls.push(meta.by && o.focusAll.every((i) => meta.by.includes(i)) ? 'kdm-iso' : 'kdm-dim');
      else if (focus != null) cls.push(meta.by && meta.by.includes(focus) ? 'kdm-iso' : 'kdm-dim');
      else if (dimAll && !meta.keep) cls.push('kdm-dim');
      if (meta.diff === '-') cls.push('kdm-ghost');
      if (meta.diff === '+' && o.preview) cls.push('kdm-pulse');
      let style = '';
      if (o.ripple && meta.sq && openP) {
        const a = parse(meta.sq), b = parse(openP.sq);
        const ring = Math.max(Math.abs(a.f - b.f), Math.abs(a.r - b.r));
        cls.push('kdm-ripple');
        style = ` style="animation-delay:${ring * 40}ms"`;
        ripple++;
      }
      const t = meta.name ? `<title>${esc(meta.name)}</title>` : '';
      return `<g${cls.length ? ` class="${cls.join(' ')}"` : ''}${style}>${t}${svg}</g>`;
    }
    const isEnemy = (q) => at[q] && (at[q].side || 'w') !== side;
    const out = { board: '', chalk: '', under: '', pieces: '', over: '' };

    if (layers.has('board') && !o.noBoard) out.board = `<image href="${A}board/stone-board.webp" x="${ox}" y="${oy}" width="${8 * s}" height="${8 * s}" preserveAspectRatio="none"/>`;

    // chalk zones
    if (layers.has('chalk')) {
      for (const z of scene.chalk || []) {
        const show = o.chalk || z.always || (focus != null && z.by && z.by.includes(focus));
        if (!show) continue;
        const squares = z.squares || ZONES[z.zone](z.side || side);
        out.chalk += `<g><title>${esc(NAMES.chalk + (z.words || ZONE_WORDS[z.zone] || ''))}</title>${chalkMarkup(squares, s, ox, oy, z.zone ? { on: 'zone', zone: z.zone } : null)}</g>`;
      }
    }

    // UNDER: frost, rails, tiles, line ends, base glows and rings
    let under = '';
    for (const e of scene.effects || []) {
      if (e.k === 'frost') { const [x, y] = XY(e.sq); under += wrap(frostOverlay(x, y, s), { ...e, keep: true, name: NAMES.frost }); }
    }
    for (const rl of scene.rails || []) {
      const a = parse(rl.from), b = parse(rl.to);
      const dx = Math.sign(b.f - a.f), dy = Math.sign(b.r - a.r);
      const u = [dx, -dy], L = Math.hypot(u[0], u[1]), uu = [u[0] / L, u[1] / L];
      const diag = dx && dy;
      const c0 = CTR(rl.from), c1 = CTR(rl.to);
      let p0 = [c0[0] + u[0] * s * 0.42, c0[1] + u[1] * s * 0.42];
      if (rl.startAt) { const cs = CTR(rl.startAt); p0 = [cs[0] - u[0] * s * 0.5, cs[1] - u[1] * s * 0.5]; }
      let p1 = c1, extra = '';
      const style = rl.style || 'solid';
      if (rl.end === 'stop') { p1 = [c1[0] - u[0] * s * 0.5, c1[1] - u[1] * s * 0.5]; extra = stopBar(p1, uu, s); }
      else if (rl.end === 'arrow') {
        const tip = [c1[0] + u[0] * s * (diag ? 0.4 : 0.44), c1[1] + u[1] * s * (diag ? 0.4 : 0.44)];
        p1 = [tip[0] - uu[0] * s * 0.16, tip[1] - uu[1] * s * 0.16];
        extra = arrowHead(tip, uu, s, { power: rl.power, style, wash: LOOK.wash });
      } else if (rl.end === 'edge') {
        p1 = [c1[0] + u[0] * s * (diag ? 0.4 : 0.44), c1[1] + u[1] * s * (diag ? 0.4 : 0.44)];
      }
      under += wrap(railMarkup(p0, p1, s, { power: rl.power, style, wash: LOOK.wash }), { ...rl, name: NAMES.line });
      rl._end = extra;
    }
    // look.wash: a take on an enemy figure is a red ring under its feet and a red edge, not a white card
    const ringTake = (m) => LOOK.wash && s >= 24 && at[m.sq] && isEnemy(m.sq) && m.k !== 'move' && m.k !== 'blocked-move' && !m.diff;
    for (const m of scene.marks || []) {
      const [x, y] = XY(m.sq);
      const name = m.k.startsWith('blocked') ? NAMES.blocked + (m.byWords || 'a rule') : m.cond === 'asleep' ? NAMES.asleep : m.cond ? NAMES.cond : NAMES[m.k];
      let t;
      if (ringTake(m)) {
        const blk = m.k === 'blocked', col = blk ? C.bBar : C.red, i = 0.06 * s;
        t = rrect(x + i, y + i, s - 2 * i, s - 2 * i, 0.06 * s, `fill="none" stroke="${C.halo}" stroke-width="4" stroke-opacity=".5"`) +
          rrect(x + i, y + i, s - 2 * i, s - 2 * i, 0.06 * s, `fill="${blk ? 'rgba(201,191,172,.18)' : 'rgba(214,52,40,.08)'}" stroke="${col}" stroke-width="2"${m.cond ? ' stroke-dasharray="4 3"' : ''}`) +
          `<ellipse cx="${n(x + s / 2)}" cy="${n(y + s * 0.9)}" rx="${n(s * 0.34)}" ry="${n(s * 0.1)}" fill="none" stroke="${col}" stroke-width="2.5" stroke-opacity=".6"/>`;
      } else t = tileMarkup(m.k, x, y, s, { cond: m.cond, power: m.power, diff: m.diff, wash: LOOK.wash, quill: m.quill });
      under += wrap(t, { ...m, name: `${m.sq}: ${name}` });
    }
    for (const rl of scene.rails || []) if (rl._end) { under += wrap(rl._end, rl); delete rl._end; }
    // red base glow under occupied targets; gold under the open piece
    for (const m of scene.marks || []) {
      if (!at[m.sq] || !isEnemy(m.sq) || m.k === 'move' || m.k === 'blocked-move' || m.k === 'blocked') continue;
      const [x, y] = XY(m.sq);
      under += wrap(`<ellipse cx="${n(x + s / 2)}" cy="${n(y + s * 0.9)}" rx="${n(s * 0.38)}" ry="${n(s * 0.12)}" fill="url(#kdm-glow-red)"/>`, m);
    }
    const threatened = new Set((scene.effects || []).filter((e) => e.k === 'threat' && !e.stopped && !(e.on && !(o.showAll || o.hover === e.on))).map((e) => e.to));
    for (const q of threatened) { const [x, y] = XY(q); under += `<ellipse cx="${n(x + s / 2)}" cy="${n(y + s * 0.9)}" rx="${n(s * 0.4)}" ry="${n(s * 0.13)}" fill="url(#kdm-glow-red)"/>`; }
    if (openP && !o.noOpenGlow) { const [x, y] = XY(openP.sq); under += `<ellipse cx="${n(x + s / 2)}" cy="${n(y + s * 0.9)}" rx="${n(s * 0.36)}" ry="${n(s * 0.11)}" fill="url(#kdm-glow-gold)"/>`; }
    for (const e of scene.effects || []) {
      if (e.k === 'frost' || e.k === 'icewall') { const [x, y] = XY(e.sq); under += wrap(baseRing(x + s / 2, y + s * 0.9, s), { ...e, keep: true }); }
    }
    out.under = under;

    // PIECES
    for (const p of pieces) {
      const [x, y] = XY(p.sq);
      const h = 0.9 * s, w = 0.9 * s;
      out.pieces += `<image href="${A}${pieceImg(p)}" x="${n(x + (s - w) / 2)}" y="${n(y + s - 0.075 * s - h)}" width="${n(w)}" height="${n(h)}" preserveAspectRatio="xMidYMax meet" filter="url(#kdm-rim)"${p.ghost ? ' opacity=".35"' : ''}><title>${esc(`${p.sq}: ${p.side === 'b' ? 'Black' : 'White'} ${p.k}`)}</title></image>`;
    }

    // OVER: arches, tags, impressions, arrows, rings, pips
    let over = '';
    for (const e of scene.effects || []) {
      if (e.k === 'frost' || e.k === 'icewall') { const [x, y] = XY(e.sq); over += wrap(ringPips(x + s / 2, y + s * 0.9, s, e.k, e.turns), { ...e, keep: true }); }
    }
    for (const ar of scene.arches || []) {
      const p0 = CTR(ar.from), p1 = CTR(ar.to);
      const r = archMarkup(p0, p1, s, { power: !!ar.power });
      let g = r.svg;
      if (ar.power) g += impMarkup({ power: ar.power }, r.apex[0], r.apex[1], impSize(s), A);
      over += wrap(g, { ...ar, name: NAMES.arch });
    }
    for (const m of scene.marks || []) {
      if (!at[m.sq] || !isEnemy(m.sq) || m.k === 'move' || m.k === 'blocked-move') continue;
      const [x, y] = XY(m.sq);
      let g = takeBadge(x, y, s, m.k);
      if (m.k === 'blocked') g += bar(x + s / 2, y + s * 0.955, s * 0.56, clamp(0.0375 * s, 1.5, 3));
      over += wrap(g, m);
    }
    for (const e of scene.effects || []) {
      const meta = { ...e, keep: e.k !== 'push' && e.k !== 'swap' && e.k !== 'follow' };
      if (e.k === 'push') over += wrap(arrowLine(CTR(e.from), CTR(e.to), C.push, 3, { trim0: s * 0.16, trim1: s * 0.18, head: clamp(s * 0.125, 7, 10) }), { ...meta, name: NAMES.push });
      else if (e.k === 'follow') over += wrap(arrowLine(CTR(e.from), CTR(e.to), C.push, 1.5, { trim0: s * 0.2, trim1: s * 0.24, head: clamp(s * 0.1, 6, 8) }), { ...meta, on: e.on || '*' });
      else if (e.k === 'swap') over += wrap(arrowLine(CTR(e.a), CTR(e.b), C.swap, 3, { both: true, trim0: s * 0.12, trim1: s * 0.12, head: clamp(s * 0.125, 7, 10) }), { ...meta, name: NAMES.swap });
      else if (e.k === 'threat') {
        const c0 = CTR(e.from), c1 = CTR(e.to);
        if (e.stopped) {
          const mx = (c0[0] + c1[0]) / 2, my = (c0[1] + c1[1]) / 2;
          const vx = c1[0] - c0[0], vy = c1[1] - c0[1], L = Math.hypot(vx, vy), px = -vy / L, py = vx / L;
          let g = arrowLine(c0, c1, C.s500, 2, { trim0: s * 0.22, trim1: s * 0.28, head: 9 });
          g += line(mx + px * s * 0.13, my + py * s * 0.13, mx - px * s * 0.13, my - py * s * 0.13, C.halo, 6, 'stroke-linecap="round"') + line(mx + px * s * 0.13, my + py * s * 0.13, mx - px * s * 0.13, my - py * s * 0.13, C.bBar, 3, 'stroke-linecap="round"');
          if (e.imp) g += impMarkup(e.imp, mx - px * s * 0.32, my - py * s * 0.32, impSize(s), A);
          over += wrap(g, { ...meta, name: 'Stopped: ' + (e.byWords || 'a rule') });
        } else over += wrap(arrowLine(c0, c1, C.red, 2, { trim0: s * 0.22, trim1: s * 0.28, head: 9, opacity: 0.6 }), { ...meta, name: NAMES.threat });
      } else if (e.k === 'rune') { const c = CTR(e.sq); over += wrap(runeRing(c[0], c[1], s * 0.42, e.barred), { ...meta, name: e.barred ? 'Not the king' : NAMES.rune }); }
      else if (e.k === 'becomes') { const [x, y] = XY(e.sq); over += wrap(becomesFan(x, y, s, A), { ...meta, keep: false, name: NAMES.becomes }); }
      else if (e.k === 'pip') { const [x, y] = XY(e.sq); over += wrap(pip(x + s - 3 - 7, y + s - 3 - 7, 14, e.n), meta); }
      else if (e.k === 'sight') {
        const r = archMarkup(CTR(e.from), CTR(e.to), s, { bulge: 0.2, width: 1.5 });
        over += wrap(r.svg, { ...meta, keep: false });
      } else if (e.k === 'hop') {
        const r = archMarkup(CTR(e.from), CTR(e.to), s, { bulge: e.bulge || 0.45, width: 2, color: C.ink, head: true });
        over += wrap(r.svg, meta);
      }
    }
    for (const im of scene.impressions || []) {
      let list = im.list;
      if (o.imps != null && o.imps !== 'all') list = list.filter((x) => x.by === o.imps);
      if (!list.length) continue;
      const [x, y] = XY(im.sq);
      over += wrap(impsOnSquare(list, x, y, s, A), { ...im, by: list.map((x) => x.by).filter((b) => b != null) });
    }
    const sel = o.select || scene.select;
    if (sel) {
      const [x, y] = XY(sel);
      over += rrect(x + 1, y + 1, s - 2, s - 2, 0.07 * s, `fill="none" stroke="${C.ink}" stroke-width="5"`) + rrect(x + 1.5, y + 1.5, s - 3, s - 3, 0.07 * s, `fill="none" stroke="${C.goldB}" stroke-width="3"`);
    }
    out.over = over;
    const order = ['board', 'chalk', 'under', 'pieces', 'over'];
    return order.filter((k) => layers.has(k)).map((k) => `<g class="kdm-${k}">${out[k]}</g>`).join('');
  }
  function draw(svg, scene, o = {}) {
    ensureDefs();
    const markup = drawString(scene, o);
    if (svg) {
      if (!svg.getAttribute('viewBox')) svg.setAttribute('viewBox', viewBox(o.s || 80, o.crop, o.origin));
      svg.innerHTML = markup;
    }
    return markup;
  }

  KD.marks = {
    draw, drawString, viewBox, squareXY, tile, tileMarkup, diagram, impression, effect,
    seal, sigil, socket, chip, picto, whenWords, pill, knot, coin, status, tag, plaque, facets, whySum,
    ensureDefs, BLOCKS, GROUPS, SIGILS, NAMES, ZONES, ZONE_WORDS, C, blockOf, look: LOOK,
  };
  window.KDMarks = KD.marks;
  if (typeof document !== 'undefined') {
    if (document.body) ensureDefs();
    else document.addEventListener('DOMContentLoaded', ensureDefs);
  }
})();
