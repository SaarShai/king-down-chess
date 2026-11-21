// Each mark names one case and one fault. A mark that matches no fault fails the check.
const cases = (scenes, sizes, scales) => scenes.flatMap(scene =>
  sizes.flatMap(size => scales.map(scale => `${scene} ${size} ${scale}%`)));
const soloWithHand = ['solo-turn', 'solo-piece-reader', 'solo-card-reader', 'solo-staged'];
const splitKingWords = (...headings) => headings.flatMap(([king, ...words]) =>
  words.map(word => `word "${word}" breaks over two lines in h2 (${king} King)`));

export const KNOWN = new Map([
  [cases(['online-loss', 'online-loss-offer'], ['320x568'], [100, 150]),
    [`text "${'w'.repeat(20)}" is cut by span.play-opponent-name`], 'the bar cuts a 20-letter name with an ellipsis at 320 px'],
  [cases([...soloWithHand, 'solo-power-armed'], ['320x568'], [100, 150]),
    ['text "Computer" is cut by span.play-opponent-name'], 'the power and menu leave too little room for the name'],
  [cases(soloWithHand, ['320x568'], [100, 150]),
    ['text "Fierce" is cut by small.opponent-clock'], 'the opponent cards badge leaves too little room for the level'],
  [cases(['guide-kings'], ['320x568', '360x640', '390x844'], [150]),
    splitKingWords(['Earth', 'Earth'], ['Shadow', 'Shadow']), 'the king name wraps within a word under the portrait at large text'],
  [cases(['guide-kings'], ['1280x800'], [100]), splitKingWords(['Shadow', 'Shadow']),
    'the desktop list fixes the portrait column at 56 px, which splits Shadow'],
  [cases(['guide-kings'], ['1280x800'], [150]),
    splitKingWords(['Frost', 'Frost', 'King'], ['Flame', 'Flame', 'King'], ['Sky', 'King'],
      ['Earth', 'Earth', 'King'], ['Spirit', 'Spirit', 'King'], ['Shadow', 'Shadow', 'King']),
    'large text splits names in the 56 px portrait column'],
].flatMap(([places, lines, reason]) => places.flatMap(place => lines.map(line => [`${place}: ${line}`, reason]))));
