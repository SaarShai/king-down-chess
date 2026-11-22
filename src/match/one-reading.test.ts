// One rule reading (decision 188): a game with a hand or a powered king plays under POWERS_BALANCED in each builder.
import { readFileSync } from 'node:fs';
import { afterEach, expect, it, vi } from 'vitest';
import { createMatch, loadMatch, LocalMatch } from './index';
import { buildSetup, DEFAULT_OPTIONS, defaultChoice, draw } from './setup';
import type { View } from './protocol';
import { DEFAULT_OPTIONS as LOCAL, rulesFor } from '../interface/play/new-game';
import { soloSave } from '../online/launch';
import { DEFAULT_RULES, POWERS_BALANCED, setRules, type Rules } from '../rules/rules';
import type { Color } from '../rules/engine';

vi.mock('../platform', () => ({ inApp: false, apiOrigin: '' }));
const flags = (rules: Partial<Rules>) => Object.fromEntries(Object.keys(POWERS_BALANCED).map(key => [key, rules[key as keyof Rules]]));
const BALANCED = flags({ ...DEFAULT_RULES, ...POWERS_BALANCED }), PRINTED = flags(DEFAULT_RULES);
const rng = () => 0.51;
afterEach(() => setRules());

it('gives a new cards-only match the balanced flags', async () => {
  const match = await createMatch({ hand: ['Freeze', 'IceWall', 'Strike', 'Haste'] });
  try { expect(flags((await match.snapshot()).rules)).toEqual(BALANCED); }
  finally { await match.close(); }
});

it.each([['pieces', false, false], ['powers', true, false], ['cards', false, true], ['both', true, true]] as const)(
  'builds the same flags for a %s game on the solo page, the match worker and the solo hand-over', async (type, kingPowers, cards) => {
    const options = { ...DEFAULT_OPTIONS, kingPowers, cards, arrangement: false }, dealt = draw(options, rng);
    const choices = [0, 1].map(seat => defaultChoice(options, dealt, seat as Color, rng, seat === 1));
    const match = await createMatch(buildSetup(options, dealt, [choices[0], choices[1]]));
    try {
      const server = (await match.snapshot()).rules;
      const handOver = soloSave({ kind: 'solo', status: 'setup', seat: 0, level: 'casual', options, draw: dealt.army, deal: dealt.hand, choices } as unknown as View).rules!;
      const solo = { ...DEFAULT_RULES, ...rulesFor(type, rng, LOCAL) };
      expect(server.hands.some(hand => hand.length)).toBe(cards);
      expect(server.kings.some(Boolean)).toBe(kingPowers);
      expect(handOver.hands).toEqual(server.hands);
      expect(flags(server)).toEqual(type === 'pieces' ? PRINTED : BALANCED);
      expect(flags(handOver)).toEqual(flags(server));
      expect(flags(solo)).toEqual(flags(server));
    } finally { await match.close(); }
  }, 20_000);

it('loads and replays a cards-only match saved under engine e58d7d37 with its printed flags', async () => {
  // Made with engines/e58d7d37….mjs: Freeze ends the turn, then a pawn's Strike captures (the printed readings).
  const save = readFileSync(new URL('./fixtures/cards-only-e58d7d37.save.json', import.meta.url), 'utf8').trimEnd(), saved = JSON.parse(save);
  expect(saved.commands.map((c: { lan: string }) => c.lan)).toEqual(['!F:d5', 'Ke8-f8', 'c6xd5!']);
  const old = await loadMatch(save), fresh = await createMatch(saved.setup), current = new LocalMatch();
  try {
    const state = await old.snapshot();
    expect(flags(state.rules)).toEqual(PRINTED);
    expect(state.history).toEqual(['!F:d5', 'Ke8-f8', 'c6xd5!']);
    expect(state.fen).toBe(saved.commands.at(-1).fen);
    expect(await old.exportSave()).toBe(save);
    const next = await old.apply({ id: 'after-release', expectedRevision: state.revision, lan: state.legal[0] });
    expect(next.revision).toBe(4);
    expect(JSON.parse(await old.exportSave()).engine).toBe(saved.engine);
    // A new game with the same setup gets the balanced flags; the current worker refuses the old save.
    expect(flags((await fresh.snapshot()).rules)).toEqual(BALANCED);
    await expect(current.initialize(save, true)).rejects.toMatchObject({ code: 'MATCH_INCOMPATIBLE' });
  } finally { await Promise.all([old.close(), fresh.close(), current.close()]); }
}, 20_000);
