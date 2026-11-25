/**
 * Change guards for a new piece, king power or card: the plugin and Muse forms that have no
 * table of their own. Each case comes from the real lists (LETTERS, POOL, PROMOTIONS,
 * RELEASED_CARDS), so a new entry there makes these tests name the place to change.
 */
import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { art, symbols } from '../src/account-game/art';
import { RELEASED_CARDS } from '../src/content/cards';
import { GameRules } from '../src/game-rules';
import { matchMove } from '../src/muse/match-words';
import { DEFAULT_RULES, K, LETTERS, NAMES, PROMOTIONS } from '../src/rules/engine';
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

const legal = (fen: string, rules: object): string[] => {
  const context = new GameRules(rules as never), pos = context.fromFen(fen);
  return context.legalMoves(pos).map(m => context.toLan(pos, m));
};

describe('Muse: move notation for each piece letter', () => {
  const pieces = [...LETTERS].filter(l => l !== ' ' && l !== 'P');
  it.each(pieces)('reads the letter %s in a move like "Xd5"', l => {
    const fen = l === 'K' ? '4k3/8/8/8/8/8/8/4K3 w - - 0 1' : `4k3/8/8/8/3${l}4/8/8/4K3 w - - 0 1`;
    const from = l === 'K' ? 'e1' : 'd4', list = legal(fen, DEFAULT_RULES);
    const lan = list.find(m => m.startsWith(`${l}${from}-`));
    expect(lan, `test position: no plain move for ${l} from ${from}; change the test position`).toBeDefined();
    const said = `${l}${lan!.slice(4, 6)}`, r = matchMove(DEFAULT_RULES as never, fen, list, said);
    expect(r.kind, `src/muse/match-words.ts SAN: add the letter ${l} to the piece class (Muse refuses "${said}")`).not.toBe('none');
  });

  const promotions = PROMOTIONS.map(t => LETTERS[t]);
  const rules = { ...DEFAULT_RULES, promotionSet: 'anyNonKing' };
  it.each(promotions)('reads the promotion "b8=%s"', l => {
    const fen = '4k3/1P6/8/8/8/8/8/4K3 w - - 0 1', list = legal(fen, rules);
    expect(list, `test position: no promotion to ${l}; change the test position`).toContain(`b7-b8=${l}`);
    const r = matchMove(rules as never, fen, list, `b8=${l}`);
    expect(r.kind === 'one' ? r.move.id : r.kind, `src/muse/match-words.ts SAN: add the letter ${l} to the promotion class`).toBe(`b7-b8=${l}`);
  });
});

describe('plugin: card motion for each released card', () => {
  it('has a motion recipe and a motion map for each released card', () => {
    const missing = RELEASED_CARDS.map(c => c.id.toLowerCase())
      .flatMap(id => [`src/plugin/card-motion/recipes/${id}.ts`, `src/plugin/assets/card-motion/${id}.webp`])
      .filter(path => !existsSync(path));
    expect(missing, 'plugin card motion: add the recipe and the map (tools/card-motion), or the card shows a still picture').toEqual([]);
  });
});
