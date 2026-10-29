// F26: the ticket 21 Display check debug line is out of the build, and the QA protocol does not ask for it.
import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';

test('the build and the QA protocol have no Display check line', () => {
  for (const path of ['src/plugin/app.ts', 'src/plugin/index.html', 'src/plugin/app.css', 'src/account-game/hall.ts', 'docs/qa/plugin-qa-protocol.md']) {
    const text = readFileSync(path, 'utf8');
    expect(text, path).not.toContain('Display check');
    expect(text, path).not.toContain('layout-check');
  }
});

test('the QA hall step names the current home actions, setup and menu rows', () => {
  const shared = readFileSync('src/account-game/hall.ts', 'utf8');
  const html = readFileSync('src/plugin/index.html', 'utf8') + shared;
  const sequence = readFileSync('docs/qa/plugin-qa-protocol.md', 'utf8').split('## 3. Test sequence\n')[1];
  const hall = sequence.split('\n').find(line => line.startsWith('2. '))!;
  expect(hall).toContain('**Quick-start hall.**');
  for (const id of ['home-play', 'home-games', 'games-head', 'setup-start']) {
    const control = new RegExp(`<[^>]+id="${id}"[^>]*>(.*?)</(?:button|h3)>`, 's').exec(html)![1];
    expect(hall).toContain(`"${control.replace(/<[^>]+>/g, '')}"`);
  }
  const rows = [...shared.matchAll(/\['(?:profile|settings)', '([^']+)'/g)].map(match => match[1]);
  expect(rows).toEqual(['Settings', 'Profile']);
  for (const row of rows) expect(hall).toContain(row);
  expect(hall).toContain('"Play now" always starts a Casual computer game with an automatic army and no seat screen.');
  expect(hall).toContain('Check this for a new player and for a saved A friend setup with First rank sorting set to Player and level Strong.');
  expect(hall).toContain('Open Game options: it has no code field, because a friend joins by the invite link only');
  expect(hall).toContain('The saved setup stays after Play now, including the opponent, level and First rank sorting choices.');
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

// Spec J7 a, B3 b and W7: the bar holds Undo, the turn button and Menu, a deadline action shows on the board,
// and the read button keeps its built name. The words come from the build, so a tester reads the bar it shows.
test.each([
  'docs/qa/plugin-qa-protocol.md',
  'docs/specs/chatgpt-mvp/release/TESTER-GUIDE.md',
  'docs/specs/chatgpt-mvp/release/LIVE-CHECKS.md',
])('%s names the board actions of the build', path => {
  const html = readFileSync('src/plugin/index.html', 'utf8'), board = readFileSync('src/plugin/screens/board.ts', 'utf8');
  const text = readFileSync(path, 'utf8'), plain = text.replaceAll('**', ''), reload = /<button id="reload">([^<]+)</.exec(html)![1];
  const bar = html.split('<nav id="table-bar"')[1].split('</nav>')[0];
  expect([...bar.matchAll(/<button id="([^"]+)"/g)].map(match => match[1])).toEqual(['undo', 'end-turn', 'board-menu']);
  const undo = /<button id="undo"[^>]*>.*?<span>([^<]+)</.exec(bar)![1], menu = /<button id="board-menu"[^>]*>.*?<span class="label">([^<]+)</.exec(bar)![1];
  const [, computer, person] = /label = mode\(\) === 'computer' \? '([^']+)' : '([^']+)'/.exec(board)!;
  // The live checks name no read button; the other two list the Menu items.
  if (!path.endsWith('LIVE-CHECKS.md')) expect(text).toContain(reload);
  expect(text).not.toMatch(/\bReload\b/);
  expect(plain).toContain(`The bar shows ${undo}, ${computer} (${person} in a game with a person) and ${menu}.`);
  expect(plain).not.toMatch(/bar shows only/);
  expect(text).not.toMatch(/Menu[^.|]*Claim/);
  // W7 removed Stop here: the turn button sends the turn.
  expect(board).not.toContain('Stop here');
  expect(text).not.toContain('Stop here');
});

// Spec W8 a: the end card shows New player, not "?", while the rating is new.
test.each(['docs/specs/chatgpt-mvp/release/TESTER-GUIDE.md', 'docs/specs/chatgpt-mvp/release/LIVE-CHECKS.md'])('%s gives New player for a new rating on the end card', path => {
  expect(readFileSync('src/plugin/screens/end.ts', 'utf8')).toContain("'New player'");
  expect(readFileSync(path, 'utf8')).toContain('New player');
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

// These release steps must use the current end actions and the computer's colour rule.
test.each(['TESTER-GUIDE.md', 'LIVE-CHECKS.md', 'RUNBOOK.md'])('%s describes the current end card', file => {
  const text = readFileSync(`docs/specs/chatgpt-mvp/release/${file}`, 'utf8').replaceAll('**', '');
  for (const words of ['New game', 'See the board', 'Game result', 'Skip',
    'Play again keeps your colour against the computer',
    'A computer abort returns to Menu with the same setup', '1 s after a live result opens']) expect(text).toContain(words);
  expect(text).not.toContain('Your games opens the profile scroll');
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
