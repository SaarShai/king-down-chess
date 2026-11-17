import { expect, it, vi } from 'vitest';
import { createCharacterRuntime } from '../../render/painted/character-runtime.mjs';

it('keeps the rest still while a figure part is in transfer, and drops it only for a figure the package lacks', async () => {
  let release = () => {};
  const part = new Promise<void>(resolve => { release = resolve; });
  const fetcher = vi.fn(async (url: string) => {
    if (url.endsWith('pawn.white.json')) await part;
    return { ok: true, json: async () => url.endsWith('index.json') ? { schemaVersion: 2, parts: { 'pawn:white': 'parts/pawn.white.json' }, effects: {} } : { banks: [] } };
  }) as unknown as typeof fetch;
  const runtime = createCharacterRuntime({ url: 'https://example.invalid/character-runtime/index.json', fetcher, wake: () => {} });
  await runtime.ready();
  expect(runtime.has('pawn', 'white')).toBe(false);
  expect(runtime.lacks('pawn', 'white')).toBe(false); // its part loads: the still stays
  expect(runtime.lacks('ogre', 'white')).toBe(true); // no part in the index
  release(); await vi.waitFor(() => expect(runtime.lacks('pawn', 'white')).toBe(true)); // the part has no idle bank
  runtime.dispose();
});

it('makes the motion curves from the lab formulas at strength Exaggerated', async () => {
  vi.stubGlobal('document', { documentElement: { style: { setProperty() {} }, dataset: {} }, addEventListener() {} });
  vi.stubGlobal('getComputedStyle', () => ({ getPropertyValue: () => '2' }));
  const { E, springZ, curves } = await import('./motion');
  expect(springZ(2)).toBeCloseTo(.40);
  const spring = E.spring(springZ(2)), peak = Math.max(...Array.from({ length: 101 }, (_, i) => spring(i / 100)));
  expect(peak).toBeGreaterThan(1.2); expect(peak).toBeLessThan(1.3); expect(spring(1)).toBe(1);
  expect(E.heavy(.1)(.72)).toBeCloseTo(1.1); expect(E.heavy(.1)(1)).toBeCloseTo(1);
  for (const value of Object.values(curves(2))) expect(value).toMatch(/^linear\(0, .*, 1\)$/);
  // The game screen carries the board: it never goes past its place.
  expect(Math.max(...curves(2)['--ease-screen-in'].slice(7, -1).split(', ').map(Number))).toBe(1);
  vi.unstubAllGlobals();
});

it('keeps a freeze that the computer\'s card ends on the board until the card ends, so it thaws once', async () => {
  const { Game } = await import('../../game');
  const { POWERS_BALANCED } = await import('../../rules/rules');
  const { parseSq } = await import('../../rules/engine');
  const { CardPlayback, cardAction } = await import('../../render/effects/card');
  const { DraftTurn } = await import('./turn');
  const game = new Game('RNBQKBNR', { ...POWERS_BALANCED, kings: [{ king: 'Frost', power: 'Freeze' }, { king: 'Frost', power: 'Freeze' }] });
  game.load(game.context.fromFen('7k/7p/n7/8/8/8/7P/K6N w - - 0 1'));
  const draft = new DraftTurn(game); draft.arm('freeze');
  draft.stage(draft.at(parseSq('a6'), parseSq('a6'))[0]); draft.commit();
  const reply = game.legal.find(m => m.power === 'freeze')!;
  const action = cardAction(game.context, game.pos, reply)!;
  const card = new CardPlayback(game.pos, reply, action, game.context);
  expect(game.pos.marks?.[0]?.sq).toBe(parseSq('a6'));
  expect((card.after.marks?.[0]?.left ?? 0) > 0).toBe(false); // the computer's turn ends the player's freeze
  for (const t of [.8, 1]) expect(card.position(t).marks?.[0]?.sq).toBe(parseSq("a6")); // it still shows on the last card frame
});

it('shows the game at its final position with a 120 ms fade, or 60 ms at Fast', async () => {
  const root = { style: { setProperty() {} }, dataset: { motion: 'normal' } };
  vi.stubGlobal('document', { documentElement: root, addEventListener() {} });
  vi.stubGlobal('getComputedStyle', () => ({ getPropertyValue: () => '2' }));
  vi.stubGlobal('window', { scrollTo: vi.fn() });
  vi.stubGlobal('innerHeight', 800);
  vi.resetModules();
  try {
    const { screenChange } = await import('./motion');
    const from = { animate: vi.fn(() => ({ finished: Promise.resolve() })) };
    const to = { animate: vi.fn(() => ({ finished: Promise.resolve() })) };
    for (const [pace, duration] of [['normal', 120], ['fast', 60]] as const) {
      root.dataset.motion = pace;
      await screenChange(from as unknown as HTMLElement, to as unknown as HTMLElement);
      expect(to.animate).toHaveBeenLastCalledWith([{ opacity: 0 }, { opacity: 1 }], { duration, easing: 'linear' });
    }
  } finally { vi.unstubAllGlobals(); vi.resetModules(); }
});
