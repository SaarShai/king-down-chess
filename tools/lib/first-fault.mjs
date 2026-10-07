// The first fault line of a browser-check log, for the runner's report line (checks-and-hooks/06, story 10).
// Node prints an uncaught error as a source location ("file:///...:N"), the source line, a caret line and
// then the message. The source line holds "Error(" for each thrown Error, so the search skips the
// location, the source line and the caret line, and prefers a line that starts with a verdict or an error.

const strict = /^(\w*Error\b|FAIL\b|XPASS\b)/;
const loose = /\bFAIL\b|Error\b|\bfailed\b|\bTimeout\b|\btimed out\b/;

/** The fault line of a log text, or null when the log holds no line. */
export function firstFault(text) {
  const all = text.split('\n').map(l => l.trim());
  const context = new Set();
  all.forEach((line, i) => {
    if (/^file:\/\/\S+:\d+$/.test(line)) context.add(i).add(i + 1);
    if (/^\^+$/.test(line)) context.add(i).add(i - 1);
  });
  const lines = all.filter((line, i) => line && !context.has(i));
  return lines.find(l => strict.test(l)) ?? lines.find(l => !/^XFAIL\b/.test(l) && loose.test(l)) ?? lines.at(-1) ?? null;
}
