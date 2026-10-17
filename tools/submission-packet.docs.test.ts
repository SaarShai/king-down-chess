// Ticket 15 (part 15-packet): the packet grades and texts must fit the merged build.
import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';

const checklist = readFileSync('docs/submission/checklist.md', 'utf8');
const grade = (n: number) => checklist.match(new RegExp(`^\\| ${n} \\|[^|]*\\|[^|]*\\| ([^|]+) \\|`, 'm'))![1];

test('the re-check grades rows 8, 17, 27, 31, 33 and 40', () => {
 expect(checklist).toMatch(/^\| 17 \|.*\| owner \| Screenshots required\./m);
 expect([8, 17, 27, 31, 33, 40].map(grade)).toEqual(['met', 'owner', 'met', 'met', 'met', 'met']);
});

test('N2 gives the King Down scope as its reason, not a hint value', () => {
 const n2 = readFileSync('docs/submission/test-cases.md', 'utf8').match(/^\| N2 \|.*$/m)![0];
 expect(n2).toContain('Every tool acts only on King Down games and accounts');
 expect(n2).not.toContain('openWorldHint');
});

test('the limit refusals quoted in row 31 are the server text', () => {
 expect(readFileSync('src/plugin/service.ts', 'utf8')).toContain("'Too many new games. Wait one minute, then try again.'");
 expect(checklist).toContain('"Too many new games. Wait one minute, then try again."');
});

test('the release notes record the short-code decision, and the runbook has the website note', () => {
 expect(readFileSync('docs/submission/release-notes.md', 'utf8')).toContain('the listing needs no note about the change from plain short codes to HMAC short codes');
 expect(readFileSync('docs/specs/chatgpt-mvp/release/RUNBOOK.md', 'utf8')).toContain('Old short codes stop working at this release');
});

// After the merge: the packet names the turn button words that the board shows (W7, T1 a) and the D7 fullscreen open.
const imported = JSON.parse(readFileSync('docs/submission/package/plugin.json', 'utf8')).extensions['com.openai'].review.test_cases;
const rows = new Map(readFileSync('docs/submission/test-cases.md', 'utf8').split('\n').filter(line => /^\| [PN]\d \|/.test(line))
  .map(line => { const [id, ...cells] = line.slice(2, -2).split(' | '); return [id, cells] as const; }));
const plain = (cell: string) => cell.replaceAll('`', '');
const [computer, person] = /label = mode\(\) === 'computer' \? '([^']+)' : '([^']+)'/.exec(readFileSync('src/plugin/screens/board.ts', 'utf8'))?.slice(1) ?? [];

test('reads the turn button words of the board', () => {
  expect([computer, person]).toEqual(['End turn', 'Send your turn']);
});

test('both copies hold five positive and three negative cases with the same prompts and tools', () => {
  expect([...rows.keys()]).toEqual(['P1', 'P2', 'P3', 'P4', 'P5', 'N1', 'N2', 'N3']);
  expect([imported.positive.length, imported.negative.length]).toEqual([5, 3]);
  for (const [id, [, prompt, tools]] of rows) {
    const copy = imported[id[0] === 'P' ? 'positive' : 'negative'][+id.slice(1) - 1];
    expect(copy.prompt, id).toBe(prompt);
    if (id[0] === 'P') expect(copy.tools_triggered, id).toBe(plain(tools));
  }
});

test('the two P2 copies agree word for word, and the two P1 expected results agree', () => {
  const [description, prompt, tools, expected] = rows.get('P2')!;
  expect(imported.positive[1]).toEqual({ description, prompt, tools_triggered: plain(tools), expected_behavior: expected });
  expect(imported.positive[0].expected_behavior).toBe(rows.get('P1')![3]);
});

test('P1 gives the D7 fullscreen open', () => {
  expect(rows.get('P1')![3]).toContain('ChatGPT opens King Down fullscreen at the Play hall. The app sends no fullscreen request on mount.');
});

test('P2: a board move sends nothing, Undo takes it back, and the turn button sends the whole turn', () => {
  const [, , , expected, source] = rows.get('P2')!;
  expect(expected).toContain(`A move on the board changes the board only. Undo takes it back. ${computer} (the sword button) sends kingdown_move with the turn's moves; then kingdown_computer returns the computer reply on the board.`);
  expect(expected).not.toContain('A move on the board sends kingdown_move');
  expect(source).toContain(`\`src/plugin/screens/board.ts\`: Undo and ${computer}.`);
});

test('the demo video (checklist row 49) shows a computer game with one move, then the turn button', () => {
  expect(checklist.split('\n').find(line => line.startsWith('| 49 |'))).toContain(`a computer game with one move, then ${computer},`);
});

test('the skill names both turn button words', () => {
  expect(readFileSync('docs/submission/package/skills/play-king-down/SKILL.md', 'utf8')).toContain(
    `A turn goes to the game only when the player presses the turn button on the board: ${computer} against the computer, ${person} against a person.`);
});

// The review seed creates one active friend game and one active computer game.
test('both P3 copies use the review seed count', () => {
  expect(rows.get('P3')![3]).toContain('2 active games; your turn in 1.');
  expect(imported.positive[2].expected_behavior).toContain('2 active games; your turn in 1.');
});
