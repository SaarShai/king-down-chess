import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/** The parked features of round 3 (docs/PARKED.md) have no player entry point. Their source stays. */
const read = (path: string): string => readFileSync(path, 'utf8');
const sources = (dir: string): string[] => readdirSync(dir).filter(name => name.endsWith('.ts') && !name.includes('.test.')).map(name => join(dir, name));

describe('parked entry points', () => {
  const page = read('index.html'), account = read('src/plugin/index.html');

  it('New game has no pass-and-play choice', () => {
    expect(page).not.toMatch(/id="mode-two"|value="two"/);
  });

  it('no New game army or rematch seats two people on one device', () => {
    expect(read('src/main.ts')).not.toMatch(/\['human', 'human'\]/);
    expect(read('src/screen/play.ts')).toMatch(/rematch \? rematchPlayers\(sides\)/);
    expect(read('src/ui/home.ts')).not.toMatch(/Two players on this device/);
  });

  it('a saved link game does not restore the Send your turn mode', () => {
    expect(read('src/screen/play.ts')).not.toMatch(/linkSide = (saved|s)\.link|linkSide = s\.link ===/);
  });

  it('the menu has no Send the game link button', () => {
    expect(page).not.toMatch(/id="share"|Send the game link/);
  });

  it('Review starts no key-moment search', () => {
    expect(read('src/screen/play.ts')).not.toMatch(/listMoments\(\)/);
  });

  it('/play/ has no code typing and no code tiles', () => {
    expect(account).not.toMatch(/id="join-code"|id="join-entry"|id="friend-code"|game-code/);
    expect(read('src/plugin/screens/setup.ts')).not.toMatch(/Join with a code|id="token"|join-form/);
  });

  it('the QA steps do not ask for code typing', () => {
    expect(read('docs/qa/plugin-qa-protocol.md')).not.toMatch(/join with a code|type (the|a) code/i);
  });

  it('no screen reaches named invitations or the invitation inbox', () => {
    const files = ['src/online/client.ts', 'src/online/runtime.ts', ...sources('src/account-game'), ...sources('src/plugin/screens')];
    for (const file of files) expect(read(file), file).not.toMatch(/\/api\/friends|\/decline'|kingdown_friends|kingdown_decline_invite|recipient_(id|handle)|invitations/);
  });
});
