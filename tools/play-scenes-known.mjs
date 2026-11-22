// Each mark names one case and one fault. A mark that matches no fault fails the check.
const cases = (scenes, sizes, scales) => scenes.flatMap(scene =>
  sizes.flatMap(size => scales.map(scale => `${scene} ${size} ${scale}%`)));

export const KNOWN = new Map([
  [cases(['online-loss', 'online-loss-offer'], ['320x568'], [100, 150]),
    [`text "${'w'.repeat(20)}" is cut by span.play-opponent-name`], 'the bar cuts a 20-letter name with an ellipsis at 320 px'],
  [cases(['new-game', 'setup-friend'], ['667x375', '568x320'], [150]),
    ['control "More options" is cut by the scroll box div.setup-body at rest'], 'the lower edge of the tiles and More options need a scroll at 150%'],
  [cases(['new-game'], ['667x375', '568x320'], [150]),
    ['control "Off" is cut by the scroll box div.setup-body at rest'], 'the lower edge of the Powers and Cards tiles needs a scroll at 150%'],
  [cases(['new-game'], ['568x320'], [150]), [
    'control "Powers" is cut by the scroll box div.setup-body at rest',
    'control "Cards" is cut by the scroll box div.setup-body at rest',
    'control "FRIEND" overlaps control "Friendly"',
    'control "FRIEND" overlaps text "Friendly"',
    'control "Friendly" overlaps text "Friend"',
    'control "Powers" overlaps text "Dark King"',
    'text "Friend" overlaps text "Friendly"',
  ], 'at 568x320 with 150% text the opponent choice covers part of the level choice and the controls need a scroll'],
  [cases(['setup-friend'], ['568x320'], [150]), [
    'control "FRIEND" overlaps control "Powers"',
    'control "Powers" overlaps text "Friend"',
  ], 'at 568x320 with 150% text the opponent choice covers part of the Powers tile'],
].flatMap(([places, lines, reason]) => places.flatMap(place => lines.map(line => [`${place}: ${line}`, reason]))));
