// Each mark names one case and one fault. A mark that matches no fault fails the check.
const cases = (scenes, sizes, scales) => scenes.flatMap(scene =>
  sizes.flatMap(size => scales.map(scale => `${scene} ${size} ${scale}%`)));
const smallCards = ['guide-cards 320x568 150%'];
const cardOverlap = (left, right, leftCopy, rightCopy) => [
  `control "${right}" overlaps text "${left}"`,
  `control "${right}" overlaps text "${leftCopy}"`,
  `text "${left}" overlaps text "${right}"`,
  `text "${leftCopy}" overlaps text "${rightCopy}"`,
];

export const KNOWN = new Map([
  [cases(['online-loss', 'online-loss-offer'], ['320x568'], [100, 150]),
    [`text "${'w'.repeat(20)}" is cut by span.play-opponent-name`], 'the bar cuts a 20-letter name with an ellipsis at 320 px'],
  [cases(['guide-pieces', 'guide-cards'], ['320x568'], [150]), [
    'control "KINGS" overlaps text "Pieces"',
    'control "RULES" overlaps text "Cards"',
    'text "Pieces" overlaps text "Kings"',
    'text "Cards" overlaps text "Rules"',
  ], 'the tabs have too little room for their labels at 150%'],
  [smallCards, [
    'text "Sacrifice" crosses the right viewport edge',
    'text "Replace a pawn with a lost piece; no paw" crosses the right viewport edge',
  ], 'the title and description of Sacrifice extend past the right edge'],
  [[...smallCards, 'guide-cards 360x640 150%'],
    cardOverlap('Salvation', 'Mirror', 'Your back rank: return a lost piece; no', 'Copy another card in your hand; that car'),
    'the Salvation title and description extend into Mirror'],
  [smallCards, cardOverlap('Firewall', 'Earth Quake', 'Protect all pieces for the next enemy tu', 'Push pieces away; kings and blocked or e'),
    'the Firewall title and description extend into Earth Quake'],
  [smallCards, cardOverlap('Control', 'Rally', 'Move like a different adjacent own type;', 'Move up to two different pieces; neither'),
    'the Control title and description extend into Rally'],
].flatMap(([places, lines, reason]) => places.flatMap(place => lines.map(line => [`${place}: ${line}`, reason]))));
