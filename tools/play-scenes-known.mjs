// Each mark names one case and one fault. A mark that matches no fault fails the check.
const cases = (scenes, sizes, scales) => scenes.flatMap(scene =>
  sizes.flatMap(size => scales.map(scale => `${scene} ${size} ${scale}%`)));

export const KNOWN = new Map([
  [cases(['online-loss', 'online-loss-offer'], ['320x568'], [100, 150]),
    [`text "${'w'.repeat(20)}" is cut by span.play-opponent-name`], 'the bar cuts a 20-letter name with an ellipsis at 320 px'],
].flatMap(([places, lines, reason]) => places.flatMap(place => lines.map(line => [`${place}: ${line}`, reason]))));
