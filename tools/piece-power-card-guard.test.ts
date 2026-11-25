/**
 * Change guards for a new piece, king power or card: the plugin and Muse forms that have no
 * table of their own. Each case comes from the real lists (LETTERS, POOL, PROMOTIONS,
 * RELEASED_CARDS), so a new entry there makes these tests name the place to change.
 */
import { describe, expect, it } from 'vitest';
import { art, symbols } from '../src/account-game/art';
import { K, LETTERS, NAMES } from '../src/rules/engine';
import { CLASSIC_CHESS, POOL } from '../src/rules/setup';

const released = [...new Set(['P', ...CLASSIC_CHESS, ...POOL])].map(l => LETTERS.indexOf(l));

describe('plugin: art for each released piece', () => {
  it('has a white and a black painting and an icon for each released piece', () => {
    const missing: string[] = [];
    for (const t of released) {
      if (t === K) continue; // the king uses the king portrait
      for (const side of ['w', 'b']) if (!art(`ui/pieces/${NAMES[t]}-${side}.webp`)) missing.push(`public/ui/pieces/${NAMES[t]}-${side}.webp (src/plugin/screens/board.ts and setup.ts show it)`);
      if (!symbols[`../../public/ui/icons/${NAMES[t]}.svg`]) missing.push(`public/ui/icons/${NAMES[t]}.svg (src/plugin/screens/collection.ts throws without it)`);
    }
    expect(missing, 'plugin: add the painting or the icon of the released piece').toEqual([]);
  });
});
