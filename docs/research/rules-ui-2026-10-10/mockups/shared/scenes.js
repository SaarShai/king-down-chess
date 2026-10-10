/* King Down: the verified scenes (grammar.md G22). Hard-coded data. There is NO move generator here.
 * Each square was worked out by hand from the current rules (docs/RULES.md, src/rules/engine.ts, research:content,
 * 2026-10-10) and matches the movesOf() lists in G22. KD.scenes.check() re-reads the data for slips (it runs no rules).
 *
 * Global: window.KD.scenes = { list, byId, get(id), patterns, check() }.
 *
 * SCENE FORMAT (marks.js draw() reads it)
 *   id, ref ('S1'), title, line (one sentence)
 *   pieces:  [{ sq, k: 'paladin'|'pawn'|..|'king', side: 'w'|'b', open?, img? ('kings/mud.webp'), ghost? }]
 *   seals:   [{ a, pill?, when?, asleep? }] in canonical() order. Index 0, 1, 2 = sockets I, II, III. `by` fields use these indexes.
 *   marks:   [{ sq, k: 'move'|'take'|'both'|'shot'|'moveshot'|'blocked'|'blocked-move', cond?: 'awake'|'asleep'|'pattern',
 *              by?: [rule idx] (the rules that change this square), on?: 'e5' (shows only on hover/focus of that square),
 *              power?, diff?: '+'|'-', byWords? }]
 *   rails:   [{ from, to, end: 'x'|'blocked'|'stop'|'arrow'|'edge'|'none', style?: 'awake'|'asleep', power?, startAt?, by? }]
 *   arches:  [{ from, over, to, power?: 'mud', by? }]
 *   effects: [{ k: 'push', from, to } | { k: 'follow', from, to, on } | { k: 'swap', a, b } | { k: 'threat', from, to, stopped?, imp? }
 *             | { k: 'rune', sq, barred? } | { k: 'frost', sq, turns } | { k: 'icewall', sq } | { k: 'becomes', sq }
 *             | { k: 'pip', sq, n, on } | { k: 'sight', from, to, on } | { k: 'hop', from, to }]
 *   impressions: [{ sq, list: [{ a, by } | { power } | { card }], on? }]
 *   chalk:   [{ zone: 'startRank'|'ownHalf'|'enemyHalf'|'lastRank'|'capital', by? }]  (shows on isolate, preview or opts.chalk)
 *   knots:   [{ a, b, type: 'gold'|'cracked'|'unknown', words }]
 *   why:     { d7: { count, occupant, icon, side, sum: {base, imps, result, captions}, foot?, steps? } }
 *   power:   { king, name, uses, spent, armed?, echo? } ; card: { name, lab: true } ; dim: true (the move is spent)
 */
(function () {
  'use strict';
  const KD = (window.KD = window.KD || {});
  // notation only: a list of squares with one mark kind
  const each = (list, k, extra = {}) => list.split(' ').map((sq) => ({ sq, k, ...extra }));
  const P = (sq, k, side = 'w', extra = {}) => ({ sq, k, side, ...extra });
  const clone = (o) => JSON.parse(JSON.stringify(o));

  /* ---- S1 PALADIN: the hero ---- */
  const paladin = {
    id: 'paladin', ref: 'S1', title: 'Paladin',
    line: 'Queen lines that pass its own pieces. It cannot take a king. After it takes a piece (not a pawn), it is removed too.',
    pieces: [P('d4', 'paladin', 'w', { open: true }), P('d5', 'pawn'), P('b2', 'bishop'), P('b1', 'king', 'w', { img: 'kings/spirit.webp' }),
      P('d7', 'knight', 'b'), P('b6', 'pawn', 'b'), P('g7', 'king', 'b', { img: 'kings/shadow-b.webp' })],
    seals: [{ a: 'linesPass', pill: 'own' }, { a: 'cannotTake', pill: 'king' }, { a: 'removedAfter', pill: 'piece', when: { on: 'takes' } }],
    marks: [
      { sq: 'd6', k: 'move', by: [0] },
      ...each('e5 f6 e4 f4 g4 h4 e3 f2 g1 d3 d2 d1 c3', 'move'),
      { sq: 'a1', k: 'move', by: [0] },
      ...each('c4 b4 a4 c5', 'move'),
      { sq: 'd7', k: 'take', by: [0, 2] },
      { sq: 'b6', k: 'take' },
      { sq: 'g7', k: 'blocked', by: [1], byWords: 'Cannot take a king' },
    ],
    rails: [
      { from: 'd4', to: 'd7', end: 'x' }, { from: 'd4', to: 'g7', end: 'blocked' }, { from: 'd4', to: 'h4', end: 'arrow' },
      { from: 'd4', to: 'g1', end: 'arrow' }, { from: 'd4', to: 'd1', end: 'arrow' }, { from: 'd4', to: 'a1', end: 'arrow' },
      { from: 'd4', to: 'a4', end: 'arrow' }, { from: 'd4', to: 'b6', end: 'x' },
    ],
    arches: [{ from: 'd4', over: 'd5', to: 'd6', by: [0] }, { from: 'c3', over: 'b2', to: 'a1', by: [0] }],
    effects: [],
    impressions: [
      { sq: 'd7', list: [{ a: 'linesPass', by: 0 }, { a: 'removedAfter', by: 2 }] },
      { sq: 'a1', list: [{ a: 'linesPass', by: 0 }] },
      { sq: 'g7', list: [{ a: 'cannotTake', by: 1 }] },
    ],
    knots: [
      { a: 0, b: 2, type: 'gold', words: 'Both shape d7.' },
      { a: 0, b: 1, type: 'unknown', words: 'Not checked yet.' },
      { a: 1, b: 2, type: 'unknown', words: 'Not checked yet.' },
    ],
    diff: { without0: ['d6', 'd7', 'a1'], without1: 'g7 becomes a take with removal', with2: 'removal on d7 only' },
    why: {
      d7: { count: 3, occupant: 'Black knight', icon: 'knight', side: 'b',
        sum: { base: { k: 'move', rail: 'n' }, imps: [{ a: 'linesPass' }, { a: 'removedAfter' }], result: { k: 'take', tag: { a: 'removedAfter' } },
          captions: ['line', 'passes own pieces', 'removed too', 'takes, then leaves'] },
        foot: 'On b6 it takes a pawn and stays.',
        steps: [
          { crop: 'c3:e7', pieces: [P('d4', 'paladin', 'w', { open: true }), P('d5', 'pawn'), P('d7', 'knight', 'b')], effects: [{ k: 'hop', from: 'd4', to: 'd7', bulge: 0.35 }] },
          { crop: 'c3:e7', pieces: [P('d7', 'knight', 'b', { ghost: true }), P('d7', 'paladin', 'w', { open: true }), P('d5', 'pawn')], marks: [{ sq: 'd7', k: 'take' }] },
          { crop: 'c3:e7', pieces: [P('d5', 'pawn')], impressions: [{ sq: 'd7', list: [{ a: 'removedAfter' }] }] },
        ] },
      g7: { count: 2, occupant: 'Black king', icon: 'king', side: 'b',
        sum: { base: { k: 'move', rail: 'ne' }, imps: [{ a: 'cannotTake' }], result: { k: 'blocked' }, captions: ['line', 'cannot take a king', 'refused'] } },
      d6: { count: 2, occupant: 'Empty', sum: { base: { k: 'move', rail: 'n' }, imps: [{ a: 'linesPass' }], result: { k: 'move' }, captions: ['line', 'passes own pieces', 'move'] } },
      a1: { count: 2, occupant: 'Empty', sum: { base: { k: 'move', rail: 'sw' }, imps: [{ a: 'linesPass' }], result: { k: 'move' }, captions: ['line', 'passes own pieces', 'move'] } },
      b6: { count: 1, occupant: 'Black pawn', icon: 'pawn', side: 'b', sum: { base: { k: 'move', rail: 'nw' }, imps: [], result: { k: 'take' }, captions: ['line', 'takes'] }, foot: 'It takes a pawn and stays.' },
    },
  };

  /* ---- S2 PAWN and MY PAWN ---- */
  const pawnSeals = (asleep) => [
    { a: 'step2', when: { on: 'zone', zone: 'startRank' }, asleep },
    { a: 'becomes', pill: 'choice', when: { on: 'reaches', zone: 'lastRank' } },
  ];
  const pawn = {
    id: 'pawn', ref: 'S2', title: 'Pawn on d4', line: 'One step ahead. Takes one step on a forward diagonal. The double step sleeps here.',
    pieces: [P('d4', 'pawn', 'w', { open: true })], seals: pawnSeals(true),
    marks: [{ sq: 'd5', k: 'move' }, ...each('c5 e5', 'take'), { sq: 'd6', k: 'move', cond: 'asleep', by: [0] }],
    impressions: [{ sq: 'd6', list: [{ a: 'step2', by: 0 }] }],
    chalk: [{ zone: 'startRank', by: [0] }],
    why: { d6: { count: 2, occupant: 'Empty', sum: { base: { k: 'move', cond: 'awake' }, imps: [{ a: 'step2' }], result: { k: 'empty', cond: 'asleep' }, captions: ['step 2', 'on its start rank', 'asleep here'] } } },
  };
  const pawnE2 = {
    id: 'pawn-e2', ref: 'S2', title: 'Pawn on e2', line: 'On its start rank the double step wakes up.',
    pieces: [P('e2', 'pawn', 'w', { open: true })], seals: pawnSeals(false),
    marks: [{ sq: 'e3', k: 'move' }, { sq: 'e4', k: 'move', cond: 'awake', by: [0] }, ...each('d3 f3', 'take')],
    impressions: [{ sq: 'e4', list: [{ a: 'step2', by: 0 }] }],
    chalk: [{ zone: 'startRank', by: [0] }],
  };
  const pawnE2Knight = clone(pawnE2);
  Object.assign(pawnE2Knight, { id: 'pawn-e2-knight', title: 'Pawn on e2, knight on d3', line: 'With a knight on d3, d3 is a take.' });
  pawnE2Knight.pieces.push(P('d3', 'knight', 'b'));

  const myPawnSeals = (step2Asleep) => [{ a: 'step2', when: { on: 'zone', zone: 'startRank' }, asleep: step2Asleep }, { a: 'becomes', pill: 'choice', when: { on: 'reaches', zone: 'lastRank' } }];
  const mypawn = {
    id: 'mypawn', ref: 'S2', title: 'My Pawn', line: 'A copy with Move or take painted on both forward diagonals.', yours: true, from: 'Pawn',
    pieces: [P('d4', 'pawn', 'w', { open: true })], seals: myPawnSeals(true),
    marks: [{ sq: 'd5', k: 'move' }, ...each('c5 e5', 'both'), { sq: 'd6', k: 'move', cond: 'asleep', by: [0] }],
    impressions: [{ sq: 'd6', list: [{ a: 'step2', by: 0 }] }],
    chalk: [{ zone: 'startRank', by: [0] }],
    compare: { changed: ['c5', 'e5'] },
  };

  // MY PAWN + movesLike [a queen] on a center square. Canonical order: I step2, II movesLike, III becomes.
  const qSeals = (step2Asleep, likeAsleep) => [
    { a: 'step2', when: { on: 'zone', zone: 'startRank' }, asleep: step2Asleep },
    { a: 'movesLike', pill: 'queen', when: { on: 'zone', zone: 'capital' }, asleep: likeAsleep },
    { a: 'becomes', pill: 'choice', when: { on: 'reaches', zone: 'lastRank' } },
  ];
  const qKnots = [
    { a: 1, b: 2, type: 'gold', words: 'Both shape d8 and h8.' },
    { a: 0, b: 1, type: 'unknown', words: 'Not checked yet.' },
    { a: 0, b: 2, type: 'unknown', words: 'Not checked yet.' },
  ];
  const awake = (list, extra = {}) => each(list, 'move', { cond: 'awake', by: [1], ...extra });
  const mypawnQueen = {
    id: 'mypawn-queen', ref: 'S2', title: 'My Pawn, moves like a queen', line: 'On a center square it also moves and takes like a queen.', yours: true, from: 'Pawn',
    pieces: [P('d4', 'pawn', 'w', { open: true })], seals: qSeals(true, false),
    marks: [
      { sq: 'd5', k: 'move' }, ...each('c5 e5', 'both'),
      ...awake('d6 d7'), { sq: 'd8', k: 'move', cond: 'awake', by: [1, 2] },
      ...awake('f6 g7'), { sq: 'h8', k: 'move', cond: 'awake', by: [1, 2] },
      ...awake('e4 f4 g4 h4 e3 f2 g1 d3 d2 d1 c3 b2 a1 c4 b4 a4 b6 a7'),
    ],
    rails: ['d8', 'h8', 'h4', 'g1', 'd1', 'a1', 'a4', 'a7'].map((to) => ({ from: 'd4', to, end: 'arrow', style: 'awake', by: [1] })),
    effects: [{ k: 'becomes', sq: 'd8', by: [2] }, { k: 'becomes', sq: 'h8', by: [2] }],
    impressions: [
      { sq: 'd4', list: [{ a: 'movesLike', by: 1 }] },
      { sq: 'd8', list: [{ a: 'movesLike', by: 1 }, { a: 'becomes', by: 2 }] },
      { sq: 'h8', list: [{ a: 'movesLike', by: 1 }, { a: 'becomes', by: 2 }] },
    ],
    chalk: [{ zone: 'capital', by: [1] }, { zone: 'startRank', by: [0] }, { zone: 'lastRank', by: [2] }],
    knots: qKnots,
  };
  const mypawnQueenKnight = clone(mypawnQueen);
  Object.assign(mypawnQueenKnight, { id: 'mypawn-queen-knight', title: 'My Pawn, knight on d3', line: 'The south line ends in a take on d3. d2 and d1 are not reached.' });
  mypawnQueenKnight.pieces.push(P('d3', 'knight', 'b'));
  mypawnQueenKnight.marks = mypawnQueenKnight.marks.filter((m) => m.sq !== 'd2' && m.sq !== 'd1').map((m) => (m.sq === 'd3' ? { sq: 'd3', k: 'take', cond: 'awake', by: [1] } : m));
  mypawnQueenKnight.rails = mypawnQueenKnight.rails.map((r) => (r.to === 'd1' ? { from: 'd4', to: 'd3', end: 'x', style: 'awake', by: [1] } : r));

  const mypawnB4 = {
    id: 'mypawn-queen-b4', ref: 'S2', title: 'My Pawn on b4', line: 'Off the center squares, the queen lines sleep.', yours: true, from: 'Pawn',
    pieces: [P('b4', 'pawn', 'w', { open: true })], seals: qSeals(true, true),
    marks: [{ sq: 'b5', k: 'move' }, ...each('a5 c5', 'both'), { sq: 'b6', k: 'move', cond: 'asleep', by: [0] }],
    rails: ['b8', 'f8', 'h4', 'e1', 'b1', 'a3', 'a4', 'a5'].map((to) => ({ from: 'b4', to, end: 'edge', style: 'asleep', by: [1] })),
    impressions: [{ sq: 'b6', list: [{ a: 'step2', by: 0 }] }],
    chalk: [{ zone: 'capital', by: [1] }, { zone: 'startRank', by: [0] }],
    knots: qKnots,
  };
  const mypawnE2 = {
    id: 'mypawn-queen-e2', ref: 'S2', title: 'My Pawn on e2', line: 'On its start rank the double step wakes. The queen lines sleep.', yours: true, from: 'Pawn',
    pieces: [P('e2', 'pawn', 'w', { open: true })], seals: qSeals(false, true),
    marks: [{ sq: 'e3', k: 'move' }, ...each('d3 f3', 'both'), { sq: 'e4', k: 'move', cond: 'awake', by: [0] }],
    rails: ['e8', 'h5', 'h2', 'f1', 'e1', 'd1', 'a2', 'a6'].map((to) => ({ from: 'e2', to, end: 'edge', style: 'asleep', by: [1] })),
    impressions: [{ sq: 'e4', list: [{ a: 'step2', by: 0 }] }],
    chalk: [{ zone: 'capital', by: [1] }, { zone: 'startRank', by: [0] }],
    knots: qKnots,
  };

  /* ---- S3 ARCHER (far2 shot) ---- */
  const archer = {
    id: 'archer', ref: 'S3', title: 'Archer', line: 'Steps to empty squares. Shoots 2 squares away and stays. Never takes a neighbour.',
    pieces: [P('d4', 'archer', 'w', { open: true }), P('b4', 'pawn'), P('d6', 'knight', 'b'), P('f6', 'bishop', 'b'), P('f4', 'pawn', 'b'), P('d2', 'rook', 'b'), P('e5', 'pawn', 'b')],
    seals: [],
    marks: [...each('d5 d3 e4 c4 c5 e3 c3', 'move'), ...each('d6 f4 d2 f6 b6', 'shot')],
    effects: ['d6', 'f4', 'd2', 'f6', 'b6'].map((to) => ({ k: 'sight', from: 'd4', to, on: to })),
  };
  const archerAlone = {
    id: 'archer-alone', ref: 'S3', title: 'Archer alone', line: 'Eight steps. Six shots: 2 straight in four directions and 2 on the forward diagonals.',
    pieces: [P('d4', 'archer', 'w', { open: true })], seals: [],
    marks: [...each('c3 d3 e3 c4 e4 c5 d5 e5', 'move'), ...each('d6 f4 b4 d2 f6 b6', 'shot')],
  };

  /* ---- S4 BEAST (chain) and MY BEAST ---- */
  const beastPieces = () => [P('d4', 'beast', 'w', { open: true }), P('c3', 'pawn'), P('e5', 'pawn', 'b'), P('f6', 'knight', 'b'), P('g7', 'king', 'b', { img: 'kings/shadow-b.webp' })];
  const beast = {
    id: 'beast', ref: 'S4', title: 'Beast', line: 'Steps anywhere near. After a take it may take again (never a king).',
    pieces: beastPieces(), seals: [{ a: 'chain', when: { on: 'takes' } }],
    marks: [...each('d5 d3 e4 c4 c5 e3', 'both'), { sq: 'e5', k: 'both', by: [0] },
      { sq: 'f6', k: 'take', by: [0], on: 'e5' }, { sq: 'g7', k: 'blocked', by: [0], on: 'e5', byWords: 'Takes again: not a king' }],
    effects: [{ k: 'pip', sq: 'f6', n: 2, on: 'e5' }, { k: 'pip', sq: 'g7', n: 3, on: 'e5' },
      { k: 'hop', from: 'e5', to: 'f6', bulge: 0.25, on: 'e5' }],
    impressions: [{ sq: 'e5', list: [{ a: 'chain', by: 0 }] }, { sq: 'g7', list: [{ a: 'chain', by: 0 }], on: 'e5' }],
  };
  const mybeast = {
    id: 'mybeast', ref: 'S4', title: 'My Beast, removed after a piece', line: 'It takes e5, then f6, then it is removed.', yours: true, from: 'Beast',
    pieces: beastPieces(), seals: [{ a: 'chain', when: { on: 'takes' } }, { a: 'removedAfter', pill: 'piece', when: { on: 'takes' } }],
    marks: [...each('d5 d3 e4 c4 c5 e3', 'both'), { sq: 'e5', k: 'both', by: [0] }, { sq: 'f6', k: 'take', by: [0, 1], on: 'e5' }],
    effects: [{ k: 'pip', sq: 'f6', n: 2, on: 'e5' }, { k: 'hop', from: 'e5', to: 'f6', bulge: 0.25, on: 'e5' }],
    impressions: [{ sq: 'e5', list: [{ a: 'chain', by: 0 }] }, { sq: 'f6', list: [{ a: 'removedAfter', by: 1 }], on: 'e5' }],
    knots: [{ a: 0, b: 1, type: 'gold', words: 'Both shape f6.' }],
  };
  const mybeastAny = {
    id: 'mybeast-any', ref: 'S4', title: 'My Beast, removed after anything', line: 'It takes e5 and is removed. Takes again never fires.', yours: true, from: 'Beast',
    pieces: beastPieces(), seals: [{ a: 'chain', when: { on: 'takes' } }, { a: 'removedAfter', pill: 'any', when: { on: 'takes' } }],
    marks: [...each('d5 d3 e4 c4 c5 e3', 'both'), { sq: 'e5', k: 'both', by: [1] }],
    impressions: [{ sq: 'e5', list: [{ a: 'removedAfter', by: 1 }] }],
    knots: [{ a: 0, b: 1, type: 'cracked', words: 'Removed too stops Takes again.' }],
  };

  /* ---- S5 MAESTER (swap) ---- */
  const maester = {
    id: 'maester', ref: 'S5', title: 'Maester', line: 'Steps and takes next to it. Swaps places with a friend next to it.',
    pieces: [P('d4', 'maester', 'w', { open: true }), P('e4', 'rook'), P('d3', 'pawn'), P('c5', 'knight', 'b')],
    seals: [{ a: 'swap', pill: 'friend' }],
    marks: [...each('d5 c4 e5 e3 c3', 'both'), { sq: 'c5', k: 'both' }],
    effects: [{ k: 'swap', a: 'd4', b: 'e4', by: [0] }, { k: 'swap', a: 'd4', b: 'd3', by: [0] }],
  };

  /* ---- S6 OGRE (push) ---- */
  const ogre = {
    id: 'ogre', ref: 'S6', title: 'Ogre', line: 'Steps and takes next to it. Pushes a piece 1 square away and follows. Only a king takes a guard.',
    pieces: [P('d4', 'ogre', 'w', { open: true }), P('e4', 'knight'), P('d5', 'pawn', 'b'), P('c3', 'guard', 'b')],
    seals: [{ a: 'push', pill: 'follow' }],
    marks: [...each('d3 c4 e5 c5 e3', 'both'), { sq: 'd5', k: 'both' }, { sq: 'c3', k: 'blocked', byWords: 'Only a king takes a guard' }],
    effects: [
      { k: 'push', from: 'd5', to: 'd6', by: [0] }, { k: 'push', from: 'e4', to: 'f4', by: [0] }, { k: 'push', from: 'c3', to: 'b2', by: [0] },
      { k: 'follow', from: 'd4', to: 'd5', on: 'd6', by: [0] }, { k: 'follow', from: 'd4', to: 'e4', on: 'f4', by: [0] }, { k: 'follow', from: 'd4', to: 'c3', on: 'b2', by: [0] },
    ],
    impressions: [{ sq: 'c3', list: [{ a: 'cannotBeTaken' }] }],
  };

  /* ---- S7 GUARD (Safe rule, Threats eye on) ---- */
  const guard = {
    id: 'guard', ref: 'S7', title: 'Guard', line: 'Steps to empty squares and never takes. Only a king can take it.',
    pieces: [P('d4', 'guard', 'w', { open: true }), P('d3', 'king', 'w', { img: 'kings/spirit.webp' }), P('e5', 'pawn', 'b')],
    seals: [{ a: 'cannotBeTaken', pill: 'allButKing' }],
    marks: each('d5 e4 c4 c5 e3 c3', 'move'),
    effects: [{ k: 'threat', from: 'e5', to: 'd4', stopped: true, imp: { a: 'cannotBeTaken' }, by: [0], byWords: 'only a king can take it' }],
    threats: true,
  };

  /* ---- S8 ROOK + LEAP (piece + power) ---- */
  const rookPieces = () => [P('d1', 'rook', 'w', { open: true }), P('d2', 'pawn'), P('e1', 'king', 'w', { img: 'kings/mud.webp' }), P('d7', 'pawn', 'b'), P('g8', 'king', 'b', { img: 'kings/shadow-b.webp' })];
  const rook = {
    id: 'rook', ref: 'S8', title: 'Rook', line: 'Its own pawn and king stop its lines.',
    pieces: rookPieces(), seals: [],
    marks: each('c1 b1 a1', 'move'),
    rails: [{ from: 'd1', to: 'a1', end: 'arrow' }, { from: 'd1', to: 'd2', end: 'stop' }, { from: 'd1', to: 'e1', end: 'stop' }],
    power: { king: 'mud', name: 'Leap', uses: 3, spent: 0 },
  };
  const rookLeap = {
    id: 'rook-leap', ref: 'S8', title: 'Rook with Leap armed', line: 'Leap: it passes your own pawns. d3 to d6 open, and d7 is a take. A king still stops it.',
    pieces: rookPieces(), seals: [],
    marks: [...each('c1 b1 a1', 'move'), ...each('d3 d4 d5 d6', 'move', { by: ['leap'] }), { sq: 'd7', k: 'take', by: ['leap'] }],
    rails: [{ from: 'd1', to: 'a1', end: 'arrow' }, { from: 'd1', to: 'e1', end: 'stop' }, { from: 'd1', to: 'd7', startAt: 'd3', end: 'x', power: true, by: ['leap'] }],
    arches: [{ from: 'd1', over: 'd2', to: 'd3', power: 'mud', by: ['leap'] }],
    impressions: [{ sq: 'd7', list: [{ power: 'mud', by: 'leap' }] }],
    power: { king: 'mud', name: 'Leap', uses: 3, spent: 0, armed: true },
  };

  /* ---- S9 ECHO ---- */
  const echo = clone(paladin);
  Object.assign(echo, { id: 'echo', ref: 'S9', title: 'Paladin with Leap armed', line: 'Leap adds nothing here: the Paladin already passes its own pieces. No mark changes.',
    power: { king: 'mud', name: 'Leap', uses: 3, spent: 0, armed: true, echo: true } });
  echo.pieces = echo.pieces.map((p) => (p.sq === 'b1' ? { ...p, img: 'kings/mud.webp' } : p));
  delete echo.why;

  /* ---- S10 FREEZE (card and power) ---- */
  const freezePieces = (king) => [P('d4', 'paladin', 'w', { open: true }), P('b1', 'king', 'w', { img: `kings/${king}.webp` }),
    P('c6', 'knight', 'b'), P('e5', 'pawn', 'b'), P('h8', 'rook', 'b'), P('g8', 'king', 'b', { img: 'kings/shadow-b.webp' })];
  const freezeMarks = () => [...each('d5 d6 d7 d8 e4 f4 g4 h4 e3 f2 g1 d3 d2 d1 c3 b2 a1 c4 b4 a4 c5 b6 a7', 'move'), { sq: 'e5', k: 'take' }];
  const freezeRails = () => [
    { from: 'd4', to: 'd8', end: 'arrow' }, { from: 'd4', to: 'e5', end: 'x' }, { from: 'd4', to: 'h4', end: 'arrow' }, { from: 'd4', to: 'g1', end: 'arrow' },
    { from: 'd4', to: 'd1', end: 'arrow' }, { from: 'd4', to: 'a1', end: 'arrow' }, { from: 'd4', to: 'a4', end: 'arrow' }, { from: 'd4', to: 'a7', end: 'arrow' },
  ];
  const freeze = {
    id: 'freeze', ref: 'S10', title: 'Freeze: pick a target', line: 'Freeze an enemy piece, not the king. Two pieces threaten the Paladin.',
    pieces: freezePieces('spirit'), seals: paladin.seals,
    marks: freezeMarks(), rails: freezeRails(),
    effects: [{ k: 'threat', from: 'c6', to: 'd4' }, { k: 'threat', from: 'e5', to: 'd4' },
      { k: 'rune', sq: 'c6' }, { k: 'rune', sq: 'e5' }, { k: 'rune', sq: 'h8' }, { k: 'rune', sq: 'g8', barred: true }],
    card: { name: 'Freeze', lab: true }, threats: true,
  };
  const freezeCard = {
    id: 'freeze-card', ref: 'S10', title: 'Freeze card on c6', line: 'LAB card. It is your move, so the Paladin cannot move this turn.',
    pieces: freezePieces('spirit'), seals: paladin.seals,
    marks: freezeMarks(), rails: freezeRails(), dim: true,
    effects: [{ k: 'frost', sq: 'c6', turns: 1 }, { k: 'threat', from: 'c6', to: 'd4', stopped: true, imp: { card: 'freeze' }, byWords: 'Freeze card' }, { k: 'threat', from: 'e5', to: 'd4' }],
    card: { name: 'Freeze', lab: true, cost: 'move', duration: 'them' }, threats: true,
  };
  const frostPower = {
    id: 'frost-power', ref: 'S10', title: 'Frost king: Freeze on c6', line: 'A free action. Then you make your move, so the Paladin keeps its marks.',
    pieces: freezePieces('frost'), seals: paladin.seals,
    marks: freezeMarks(), rails: freezeRails(),
    effects: [{ k: 'frost', sq: 'c6', turns: 1 }, { k: 'threat', from: 'c6', to: 'd4', stopped: true, imp: { power: 'frost' }, byWords: 'Freeze (Frost king)' }, { k: 'threat', from: 'e5', to: 'd4' }],
    power: { king: 'frost', name: 'Freeze', uses: 1, spent: 1, cost: 'free', duration: 'them' }, threats: true,
  };

  /* ---- S11 KNIGHT and S12 LINE PIECES ---- */
  const knight = {
    id: 'knight', ref: 'S11', title: 'Knight', line: 'It leaps. Each square is Move or take. No rails.',
    pieces: [P('d4', 'knight', 'w', { open: true })], seals: [], marks: each('c6 e6 b5 f5 b3 f3 c2 e2', 'both'),
  };
  const lines = (dirs) => dirs.map((to) => ({ from: 'd4', to, end: 'arrow' }));
  const bishop = {
    id: 'bishop', ref: 'S12', title: 'Bishop', line: 'Four diagonal lines to the edge.',
    pieces: [P('d4', 'bishop', 'w', { open: true })], seals: [],
    marks: each('e5 f6 g7 h8 e3 f2 g1 c3 b2 a1 c5 b6 a7', 'move'), rails: lines(['h8', 'g1', 'a1', 'a7']),
  };
  const rookAlone = {
    id: 'rook-alone', ref: 'S12', title: 'Rook', line: 'Four straight lines to the edge.',
    pieces: [P('d4', 'rook', 'w', { open: true })], seals: [],
    marks: each('d5 d6 d7 d8 e4 f4 g4 h4 d3 d2 d1 c4 b4 a4', 'move'), rails: lines(['d8', 'h4', 'd1', 'a4']),
  };
  const queen = {
    id: 'queen', ref: 'S12', title: 'Queen', line: 'Eight lines to the edge.',
    pieces: [P('d4', 'queen', 'w', { open: true })], seals: [],
    marks: [...bishop.marks, ...rookAlone.marks].map((m) => ({ ...m })), rails: lines(['d8', 'h8', 'h4', 'g1', 'd1', 'a1', 'a4', 'a7']),
  };

  const list = [paladin, pawn, pawnE2, pawnE2Knight, mypawn, mypawnQueen, mypawnQueenKnight, mypawnB4, mypawnE2,
    archer, archerAlone, beast, mybeast, mybeastAny, maester, ogre, guard, rook, rookLeap, echo, freeze, freezeCard, frostPower,
    knight, bishop, rookAlone, queen];
  for (const sc of list) { sc.marks = sc.marks || []; sc.rails = sc.rails || []; sc.arches = sc.arches || []; sc.effects = sc.effects || []; sc.impressions = sc.impressions || []; sc.chalk = sc.chalk || []; sc.knots = sc.knots || []; sc.seals = sc.seals || []; }
  const byId = Object.fromEntries(list.map((s) => [s.id, s]));

  /* ---- 7x7 patterns (model.ts PRESETS) for diagrams and ledge glyphs. x right, y forward. ---- */
  const ring8 = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
  const stepAll = (mark) => ring8.map(([x, y]) => ({ x, y, mark }));
  const patterns = {
    pawn: { icon: 'pawn', squares: [{ x: 0, y: 1, mark: 'move' }, { x: -1, y: 1, mark: 'take' }, { x: 1, y: 1, mark: 'take' }, { x: 0, y: 2, mark: 'move', cond: true }], lines: [] },
    knight: { icon: 'knight', squares: [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]].map(([x, y]) => ({ x, y, mark: 'both' })), lines: [] },
    bishop: { icon: 'bishop', squares: [], lines: ['ne', 'se', 'sw', 'nw'] },
    rook: { icon: 'rook', squares: [], lines: ['n', 'e', 's', 'w'] },
    queen: { icon: 'queen', squares: [], lines: ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'] },
    archer: { icon: 'archer', squares: [...stepAll('move'), ...[[0, 2], [0, -2], [2, 0], [-2, 0], [2, 2], [-2, 2]].map(([x, y]) => ({ x, y, mark: 'shoot' }))], lines: [] },
    paladin: { icon: 'paladin', squares: [], lines: ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'], pass: 'own' },
    guard: { icon: 'guard', squares: stepAll('move'), lines: [] },
    maester: { icon: 'maester', squares: stepAll('both'), lines: [] },
    beast: { icon: 'beast', squares: stepAll('both'), lines: [] },
    ogre: { icon: 'ogre', squares: stepAll('both'), lines: [] },
    king: { icon: 'king', squares: stepAll('both'), lines: [] },
    mypawn: { icon: 'pawn', squares: [{ x: 0, y: 1, mark: 'move' }, { x: -1, y: 1, mark: 'both' }, { x: 1, y: 1, mark: 'both' }, { x: 0, y: 2, mark: 'move', cond: true }], lines: [] },
  };
  const presetRules = {
    pawn: ['step2', 'becomes'], paladin: ['linesPass', 'cannotTake', 'removedAfter'], guard: ['cannotBeTaken'], maester: ['swap'], beast: ['chain'], ogre: ['push'],
  };

  /* ---- self-check: the data agrees with itself and with the G22 lists (no rules are run) ---- */
  const G22 = {
    paladin: { move: 'd6 e5 f6 e4 f4 g4 h4 e3 f2 g1 d3 d2 d1 c3 a1 c4 b4 a4 c5', take: 'd7 b6', blocked: 'g7' },
    pawn: { move: 'd5 d6', take: 'c5 e5' },
    'pawn-e2': { move: 'e3 e4', take: 'd3 f3' },
    archer: { move: 'd5 d3 e4 c4 c5 e3 c3', shot: 'd6 f4 d2 f6 b6' },
    'archer-alone': { move: 'c3 d3 e3 c4 e4 c5 d5 e5', shot: 'd6 f4 b4 d2 f6 b6' },
    beast: { both: 'd5 d3 e4 c4 c5 e3 e5', take: 'f6', blocked: 'g7' },
    maester: { both: 'd5 c4 e5 e3 c3 c5' },
    ogre: { both: 'd3 c4 e5 c5 e3 d5', blocked: 'c3' },
    guard: { move: 'd5 e4 c4 c5 e3 c3' },
    rook: { move: 'c1 b1 a1' },
    'rook-leap': { move: 'c1 b1 a1 d3 d4 d5 d6', take: 'd7' },
    freeze: { move: 'd5 d6 d7 d8 e4 f4 g4 h4 e3 f2 g1 d3 d2 d1 c3 b2 a1 c4 b4 a4 c5 b6 a7', take: 'e5' },
    knight: { both: 'c6 e6 b5 f5 b3 f3 c2 e2' },
  };
  function check() {
    const problems = [];
    const F = 'abcdefgh';
    const pq = (q) => [F.indexOf(q[0]), +q.slice(1)];
    for (const sc of list) {
      const at = {};
      for (const p of sc.pieces) if (!p.ghost) { if (at[p.sq]) problems.push(`${sc.id}: two pieces on ${p.sq}`); at[p.sq] = p; }
      const open = sc.pieces.find((p) => p.open);
      const marks = {};
      for (const m of sc.marks) { if (marks[m.sq]) problems.push(`${sc.id}: two marks on ${m.sq}`); marks[m.sq] = m; }
      for (const m of sc.marks) {
        const occ = at[m.sq];
        if (occ && occ.side === open.side) problems.push(`${sc.id}: a mark on its own piece at ${m.sq}`);
        if (m.k === 'move' && occ) problems.push(`${sc.id}: a move mark on an occupied square ${m.sq}`);
        if (m.k === 'blocked' && !occ) problems.push(`${sc.id}: a blocked take on an empty square ${m.sq}`);
      }
      for (const r of sc.rails) {
        const [f0, r0] = pq(r.from), [f1, r1] = pq(r.to);
        const dx = Math.sign(f1 - f0), dy = Math.sign(r1 - r0);
        if (!(f1 - f0 === 0 || r1 - r0 === 0 || Math.abs(f1 - f0) === Math.abs(r1 - r0))) problems.push(`${sc.id}: rail ${r.from}-${r.to} is not a line`);
        if (r.style === 'asleep') continue;
        let f = f0 + dx, k = r0 + dy;
        const passed = new Set(sc.arches.map((a) => a.over));
        const start = r.startAt ? pq(r.startAt) : null;
        while (f !== f1 || k !== r1) {
          const q = F[f] + k;
          const beforeStart = start && (dx ? (f - start[0]) * dx < 0 : (k - start[1]) * dy < 0);
          if (!beforeStart) {
            if (at[q] && !passed.has(q)) problems.push(`${sc.id}: rail ${r.from}-${r.to} runs through ${q}, which is not passed over`);
            if (!at[q] && !(marks[q] && /move|both/.test(marks[q].k))) problems.push(`${sc.id}: rail ${r.from}-${r.to} has no move mark on ${q}`);
          }
          f += dx; k += dy;
        }
        const end = r.to, occ = at[end];
        if (r.end === 'x' && !(occ && occ.side !== open.side && marks[end] && /take|both/.test(marks[end].k))) problems.push(`${sc.id}: rail end x at ${end} has no enemy take`);
        if (r.end === 'blocked' && !(occ && marks[end] && marks[end].k === 'blocked')) problems.push(`${sc.id}: rail end blocked at ${end}`);
        if (r.end === 'stop' && !(occ && occ.side === open.side)) problems.push(`${sc.id}: rail stop at ${end} has no friend`);
        if (r.end === 'arrow') {
          const [ff, kk] = [f1 + dx, r1 + dy];
          if (ff >= 0 && ff <= 7 && kk >= 1 && kk <= 8) problems.push(`${sc.id}: arrow at ${end} is not at the board edge`);
          if (!marks[end]) problems.push(`${sc.id}: arrow end ${end} has no mark`);
        }
      }
      const exp = G22[sc.id];
      if (exp) {
        for (const kind of Object.keys(exp)) {
          const want = exp[kind].split(' ').sort().join(' ');
          const got = sc.marks.filter((m) => m.k === kind).map((m) => m.sq).sort().join(' ');
          if (want !== got) problems.push(`${sc.id}: ${kind} squares differ from G22. want [${want}] got [${got}]`);
        }
      }
    }
    return problems;
  }

  KD.scenes = { list, byId, get: (id) => byId[id], patterns, presetRules, check };
})();
