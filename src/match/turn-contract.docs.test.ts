// W7 ticket 06: the service refuses a player's turn command that stops part-way. The computer plays one action for
// each call. The service contract in the plugin guide states this rule, so a change to the rule changes the guide.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';

const read = (file: string) => readFileSync(join(import.meta.dirname, '../..', file), 'utf8');

it('the plugin guide states the whole-turn rule that the service applies', () => {
  expect(read('src/match/service.ts')).toMatch(/lans !== 'computer' && snapshot\.status === 'playing' && snapshot\.turn === mover\) fail\('INVALID_MOVE', 400, UNFINISHED\)/);
  const contract = read('docs/plugin-preparation.md').split('\n').find(line => line.startsWith('Each move checks the authenticated seat'));
  expect(contract, 'the service contract paragraph in docs/plugin-preparation.md').toBeDefined();
  expect(contract).toContain("A player's command must contain the whole turn.");
  expect(contract).toContain('After a Haste or free power first action, the same command must also contain the second move or the pass `--`.');
  expect(contract).toContain('A command that stops part-way gets `INVALID_MOVE` and changes nothing.');
  expect(contract).toContain('Each computer call plays one action, so the computer can keep its turn from one call to the next.');
  expect(contract).not.toMatch(/may keep the same player to move/);
});
