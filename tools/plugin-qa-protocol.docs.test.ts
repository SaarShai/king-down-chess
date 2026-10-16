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

test.each([
  'docs/qa/plugin-qa-protocol.md',
  'docs/specs/chatgpt-mvp/release/TESTER-GUIDE.md',
  'docs/specs/chatgpt-mvp/release/LIVE-CHECKS.md',
  'docs/specs/chatgpt-mvp/spec.md',
])('%s gives the full invite and side on Join', path => {
  const text = readFileSync(path, 'utf8');
  expect(text).toMatch(/Share.*Copy/);
  expect(text).toMatch(/full invite/);
  expect(text).toMatch(/Your games.*Share/);
  expect(text).toContain('Join and take White');
  expect(text).toContain('Join and take Black');
  expect(text).not.toContain('Copy the code');
  if (path === 'docs/qa/plugin-qa-protocol.md') {
    expect(text).toContain('Select the invite and copy it');
    expect(text).not.toContain('compare it with the code');
  }
});
