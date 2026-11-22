// Each mark names one case of the 150% text pass of plugin-ui-check.mjs and one fault. A mark that matches no fault fails the check.
// The pass runs in the board part, where the player is host1 and an 8-letter tag. Not marked: in the full run the player
// has a 16-letter name, and at 150% text at 390x844 the seat and end screens cut it and the line under it.
const cases = (screens, sizes, scales) => screens.flatMap(screen =>
  sizes.flatMap(size => scales.map(scale => `${screen} ${size} ${scale}%`)));
// The run tag of the names (host1-294255f7) changes in each run, so a mark names it <tag>.
export const markOf = (where, line) => `${where}: ${line.replace(/-[0-9a-f]{8}\b/g, '-<tag>')}`;
const rowNames = ['text "Computer · Club" is cut by b', 'text "Computer · Casual" is cut by b', 'text "host1-<tag>" is cut by b', 'text "host2-<tag>" is cut by b'];
const rowMarks = ['text "Turn" is cut by b.turn-mark', 'text "Open" is cut by b.open-mark'];

export const KNOWN = new Map([
  [cases(['profile'], ['320x568', '390x844', '400x900', '1440x900'], [150]), rowMarks, 'the `.rows b` box cuts the Turn and Open marks of a game row'],
  [cases(['profile'], ['320x568', '390x844', '400x900'], [150]), rowNames, 'the `.rows b` box cuts the long opponent names of a game row'],
  [cases(['profile'], ['320x568'], [150]), ['text "Open game" is cut by b'], 'the `.rows b` box cuts the open game row at 320 px'],
  [cases(['home'], ['320x568'], [150]), ['control "Resume host2-<tag> · Your move" does not scroll into the safe area', 'control "Your games (42)" does not scroll into the safe area'], 'at 320x568 the Home buttons stay under the host composer; at 100% text "Your games" does too'],
  [cases(['seat', 'end'], ['320x568'], [150]), ['text "host0-<tag>" is cut by b'], 'at 320 px the player name cuts in the seat row'],
  [cases(['seat'], ['320x568'], [150]), ['text "White · Spirit King" is cut by small'], 'at 320 px the line under the player name cuts'],
  [cases(['end'], ['320x568'], [150]), ['text "New player · White" is cut by small'], 'at 320 px the line under the player name cuts'],
  [cases(['board'], ['320x568'], [150]), ['text "Choose your king and arrangement." is cut by div'], 'at 320 px the board prompt cuts'],
].flatMap(([places, lines, reason]) => places.flatMap(place => lines.map(line => [`${place}: ${line}`, reason]))));
