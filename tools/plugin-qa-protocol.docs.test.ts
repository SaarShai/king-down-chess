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


test('the display spec records D7 a in its overview and Q25 decision', () => {
  const spec = readFileSync('docs/specs/chatgpt-mvp/spec.md', 'utf8');
  const overview = spec.split('## Decisions')[0];
  const display = spec.split('\n').find(line => line.startsWith('| Q25, Q25b |'))!;
  for (const text of [overview, display]) {
    expect(text).toContain('D7 a (owner, 2026-10-15)');
    expect(text).toContain('ChatGPT opens the game in fullscreen at once.');
    expect(text).toContain('only after a player selects an action');
  }
});
