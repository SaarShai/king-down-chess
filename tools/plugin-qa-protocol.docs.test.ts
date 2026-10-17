// UX review U4: the Display check line stays hidden until a long press on the Settings title. Each QA protocol line
// that reads the line must say how to show it, with the press time of the code, or a QA run stops on a false Blocker.
import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';

test('each QA protocol line that reads the Display check line says how to show it', () => {
  const press = /\$\('layout-check'\)\.hidden = false; \}, (\d+)\)/.exec(readFileSync('src/plugin/app.ts', 'utf8'))?.[1];
  expect(press, 'the long press that shows #layout-check in src/plugin/app.ts').toBeDefined();
  const lines = readFileSync('docs/qa/plugin-qa-protocol.md', 'utf8').split('\n').filter(line => line.includes('Display check'));
  expect(lines.length).toBeGreaterThan(0);
  for (const line of lines) expect(line).toContain(`press the "Settings" title for about ${press} ms`);
});

// Ticket 17-b: the harness frame acts as ChatGPT's (a second origin, the sandbox, the resource CSP). A QA agent who reads
// that the harness has no CSP adds a second one by hand, and one who reads "same-origin" tries to read the frame.
test('the QA protocol describes the harness frame as the harness builds it', () => {
  const sandbox = /sandbox = '([^']+)'/.exec(readFileSync('tools/plugin-ui-harness.ts', 'utf8'))?.[1];
  expect(sandbox, 'the frame sandbox in framePolicy() in tools/plugin-ui-harness.ts').toBeDefined();
  const protocol = readFileSync('docs/qa/plugin-qa-protocol.md', 'utf8');
  expect(protocol).toContain(`the sandbox \`${sandbox}\``);
  expect(protocol).toContain('`_meta.ui.csp`');
  expect(protocol).not.toMatch(/no CSP|no sandbox|same-origin iframe|missing CSP/i);
});
