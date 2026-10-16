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

test('the QA hall step names the current home actions, setup and menu rows', () => {
  const html = readFileSync('src/plugin/index.html', 'utf8');
  const sequence = readFileSync('docs/qa/plugin-qa-protocol.md', 'utf8').split('## 3. Test sequence\n')[1];
  const hall = sequence.split('\n').find(line => line.startsWith('2. '))!;
  expect(hall).toContain('**Quick-start hall.**');
  for (const id of ['home-play', 'home-games', 'games-head', 'setup-start']) {
    const control = new RegExp(`<[^>]+id="${id}"[^>]*>(.*?)</(?:button|h3)>`, 's').exec(html)![1];
    expect(hall).toContain(`"${control.replace(/<[^>]+>/g, '')}"`);
  }
  const play = html.split('data-screen="play"')[1].split('</section>')[0];
  const rows = [...play.matchAll(/class="row-title">([^<]+)</g)].map(match => match[1]);
  expect(rows).toEqual(['Profile', 'Settings']);
  for (const row of rows) expect(hall).toContain(row);
  expect(hall).toContain('"Play now" always starts a Beginner computer game with an automatic army and no seat screen.');
  expect(hall).toContain('Check this for a new player and for a saved A friend setup with Arrangement on and level Strong.');
  expect(hall).toContain('Select A friend to see "Join with a code"');
  expect(hall).toContain('The saved setup stays after Play now, including the opponent, level and Arrangement choices.');
  expect(hall).toContain('Open New game to check these saved choices.');
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
