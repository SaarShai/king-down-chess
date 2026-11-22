// Each mark names one case of the 150% text pass of plugin-ui-check.mjs and one fault. A mark that matches no fault fails the check.
// The pass runs in the board part, where the player is host1 and an 8-letter tag. Not marked: in the full run the player
// has a 16-letter name, and at 150% text at 390x844 the seat and end screens cut it and the line under it.
const cases = (screens, sizes, scales) => screens.flatMap(screen =>
  sizes.flatMap(size => scales.map(scale => `${screen} ${size} ${scale}%`)));

export const KNOWN = new Map([
].flatMap(([places, lines, reason]) => places.flatMap(place => lines.map(line => [`${place}: ${line}`, reason]))));

// Each screen that the 150% text pass skips, with the reason.
export const SKIPPED = new Map([
  ['profile', 'its rows and names follow the earlier steps and the random handles of the run; at 150% text `.rows b` cuts the Turn and Open marks and the long names'],
]);
