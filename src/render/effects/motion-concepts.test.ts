import { afterEach, describe, expect, it, vi } from 'vitest';
import { GameRules } from '../../game-rules';
import { POWERS_BALANCED, parseKings } from '../../rules/rules';
import { Q, N, typeOf, type Move, type Position } from '../../rules/engine';
import { SHARED_MECHANICS } from '../../../tools/fixtures/shared-mechanics';
import { ASCENSION_MS, PromotionPlayback, ascension } from './promotion';
import { CAST_PREPARE_MS, cardPlayback } from './card';
import { StateEffects } from './states';
import { viewBoard } from './view-harness';
import { drawHero } from './card-hero';
import { drawSpell } from './card-spell';
import { drawFirewall, drawFreeze } from './materials';
import type { PaintedScene } from '../../../docs/2d-first-pieces/board/scene.mjs';
vi.mock('./card-hero', async original => ({ ...await original<typeof import('./card-hero')>(), drawHero: vi.fn() }));
vi.mock('./card-spell', async original => ({ ...await original<typeof import('./card-spell')>(), drawSpell: vi.fn() }));
vi.mock('./materials', () => ({ drawFreeze: vi.fn(), drawIceWall: vi.fn(), drawFirewall: vi.fn() }));

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); vi.clearAllMocks(); });
const legal = (context: GameRules, pos: Position, lan: string) => {
  const found = context.legalMoves(pos).filter(m => context.toLan(pos, m) === lan);
  expect(found, lan).toHaveLength(1);
  return found[0];
};

// The approved promotion preview's legal quiet d7-d8 promotions (motion concepts, ticket 86).
const rules = new GameRules({});
const promoting = rules.fromFen('r1b2rk1/pp1P1ppp/2n1pn2/2p5/2P1P3/2N2N2/PP3PPP/R1B1R1K1 w - - 0 24');

describe('promotion reveal', () => {
  it('shows the chosen identity by the midpoint and ends with no dust', () => {
    expect(ascension(0)).toEqual({ t: 0, reveal: 0, pawn: 1, material: 0 });
    expect(ascension(.42).reveal).toBe(1);
    expect(ascension(.5)).toMatchObject({ reveal: 1, pawn: 0 });
    expect(ascension(.2).material).toBeGreaterThan(.9);
    expect(ascension(1).material).toBe(0);
    // The pawn and the new piece overlap: the square is never empty.
    for (let t = 0; t <= 1; t += .01) expect(ascension(t).pawn + ascension(t).reveal).toBeGreaterThan(.99);
  });

  it.each([['d7-d8=Q', Q], ['d7-d8=N', N]] as const)('%s hides only the promotion square from the scene until the end', (lan, type) => {
    const move = legal(rules, promoting, lan), after = rules.makeMove(promoting, move), reveal = new PromotionPlayback(promoting, move, after);
    expect(reveal.duration).toBe(ASCENSION_MS);
    expect(reveal.scene).toEqual({ from: move.to, to: move.to, captures: [] });
    const shown = reveal.position(.5);
    expect(shown.board[move.to]).toBe(0);
    for (let sq = 0; sq < 64; sq++) if (sq !== move.to) expect(shown.board[sq]).toBe(after.board[sq]);
    expect(reveal.position(1)).toBe(after);
    expect(typeOf(after.board[move.to])).toBe(type);
  });

  it('draws the pawn and the chosen piece in the promotion row only, both on the promotion square', () => {
    const move = legal(rules, promoting, 'd7-d8=Q'), after = rules.makeMove(promoting, move), reveal = new PromotionPlayback(promoting, move, after);
    const ghost = vi.fn(), scene = { foot: () => ({ x: 0, y: 0 }), cell: (sq: number) => ({ col: sq % 8, row: 7 - (sq >> 3) }), ghost } as unknown as PaintedScene;
    const ctx = new Proxy({}, { get: () => () => {}, set: () => true }) as CanvasRenderingContext2D;
    for (let row = 0; row < 8; row++) reveal.draw(ctx, scene, 'over', row, .35);
    expect(ghost.mock.calls.map(call => call.slice(1, 3))).toEqual([[promoting.board[move.from], move.to], [after.board[move.to], move.to]]);
    ghost.mockClear(); reveal.draw(ctx, scene, 'over', 0, 1);
    expect(ghost).not.toHaveBeenCalled();
  });

  it('reveals after the scene move, at the move speed; a capture keeps its own scene move', async () => {
    const { view, scene, advance } = await viewBoard();
    view.setRules(rules); view.setPace('fast');
    const play = vi.spyOn(scene, 'play'), move = legal(rules, promoting, 'd7-d8=N');
    const running = view.animateMove(promoting, move);
    expect(play).toHaveBeenCalledExactlyOnceWith(move, expect.not.objectContaining({ effect: expect.anything() }));
    for (let i = 0; i < 400 && play.mock.calls.length < 2; i++) { advance(10); await Promise.resolve(); }
    expect(play).toHaveBeenCalledTimes(2);
    expect(play.mock.calls[1][1]).toMatchObject({ effect: expect.any(PromotionPlayback), speed: .5 });
    expect(scene.animating).toBe(true);
    advance(ASCENSION_MS / 2 + 20); await running;
    expect(scene.animating).toBe(false);
    const capture = rules.fromFen('2r3k1/1P6/8/8/8/8/8/6K1 w - - 0 1'), take = legal(rules, capture, 'b7xc8=Q');
    play.mockClear(); view.setPace('normal'); view.sync(capture);
    const again = view.animateMove(capture, take); advance(10000); await Promise.resolve(); advance(10000); await again;
    expect(play.mock.calls.map(call => !!call[1]?.effect)).toEqual([false, true]);
    view.dispose();
  });

  it.each(['reduced', 'hidden'] as const)('a running reveal ends at once when the page turns %s', async change => {
    const { view, scene, advance, media, doc, docEvents } = await viewBoard();
    view.setRules(rules);
    const play = vi.spyOn(scene, 'play'), running = view.animateMove(promoting, legal(rules, promoting, 'd7-d8=Q'));
    for (let i = 0; i < 400 && play.mock.calls.length < 2; i++) { advance(10); await Promise.resolve(); }
    expect(play.mock.calls[1]?.[1]?.effect).toBeInstanceOf(PromotionPlayback);
    advance(100); expect(scene.animating).toBe(true);
    if (change === 'reduced') { media.matches = true; docEvents.get('reduced')!(); }
    else { doc.hidden = true; docEvents.get('visibilitychange')!(); }
    expect(scene.animating).toBe(false);
    await running;
    view.dispose();
  });

  it.each(['reduced', 'off', 'skip'] as const)('%s shows the chosen piece with no reveal', async mode => {
    const { view, scene, advance } = await viewBoard(mode === 'reduced');
    view.setRules(rules); if (mode === 'off') view.setPace('off');
    const play = vi.spyOn(scene, 'play'), move = legal(rules, promoting, 'd7-d8=Q');
    const running = view.animateMove(promoting, move);
    if (mode === 'skip') { advance(50); view.skip(); }
    advance(10000); await Promise.resolve(); advance(10000); await running;
    expect(play.mock.calls.some(call => !!call[1]?.effect)).toBe(false);
    expect(scene.animating).toBe(false);
    view.dispose();
  });
});

const fixture = (item: string) => SHARED_MECHANICS.find(row => row.id === `card-${item.toLowerCase()}`)!;
function cardGame(item: string, hand?: string[]) {
  const f = fixture(item), kings = f.setup.kings ? parseKings(f.setup.kings) : undefined;
  const context = new GameRules({ ...(kings?.some(Boolean) ? POWERS_BALANCED : {}), ...(kings ? { kings } : {}), hands: [(hand ?? f.setup.hand!) as never, []] });
  return { context, before: context.fromFen(f.setup.fen!), actions: f.actions };
}

describe('card casting local release', () => {
  it.each(['Freeze', 'Firewall'])('%s grows its material in place after the preparation', id => {
    const { context, before, actions } = cardGame(id), move = legal(context, before, actions[0]), cast = cardPlayback(context, before, move)!;
    expect(cast.local).toBe(true);
    expect(cast.releaseProgress(0)).toBe(0);
    expect(cast.releaseProgress(CAST_PREPARE_MS)).toBe(0);
    expect(cast.releaseProgress(CAST_PREPARE_MS + (id === 'Freeze' ? 450 : 480))).toBe(.42);
    // The result board shows from the release; the new mark's own state waits for the end.
    const prepared = cast.position((CAST_PREPARE_MS - 1) / cast.duration);
    expect(prepared.turn).toBe(before.turn); expect(prepared.used).toEqual(before.used); expect(prepared.board).toEqual(before.board);
    const released = cast.position((CAST_PREPARE_MS + 1) / cast.duration);
    expect(released.used).toEqual(cast.after.used);
    expect(released.marks?.[before.turn]).toBeUndefined();
    expect(cast.position(1)).toEqual(cast.after);
  });

  it('draws no king source, trail or impact for the local release; other cards keep theirs', () => {
    const heroes = vi.mocked(drawHero), spells = vi.mocked(drawSpell);
    const scene = { foot: (sq: number) => ({ x: sq, y: sq }), cell: (sq: number) => ({ col: sq % 8, row: 7 - (sq >> 3) }), ghost() {} } as unknown as PaintedScene;
    const ctx = new Proxy({}, { get: () => () => {}, set: () => true }) as CanvasRenderingContext2D;
    for (const id of ['Freeze', 'Firewall']) {
      const { context, before, actions } = cardGame(id), cast = cardPlayback(context, before, legal(context, before, actions[0]))!;
      for (const t of [.05, .3, .5, .7, .9]) for (const layer of ['under', 'over'] as const) cast.draw(ctx, scene, layer, 7, t);
    }
    expect(heroes).not.toHaveBeenCalled(); expect(spells).not.toHaveBeenCalled();
    // The material grows where it acts: the frozen piece, or each piece of the protected army.
    expect(vi.mocked(drawFreeze).mock.calls.map(call => call[1].progress).at(-1)).toBeCloseTo(.42);
    expect(vi.mocked(drawFirewall)).toHaveBeenCalled();
    const burn = cardGame('Burn'), strike = cardPlayback(burn.context, burn.before, legal(burn.context, burn.before, burn.actions[0]))!;
    expect(strike.local).toBe(false);
    strike.draw(ctx, scene, 'under', undefined, .3);
    expect(heroes).toHaveBeenCalled();
  });

  it('keeps the follow-up move after Firewall and a Mirror copy on their approved playback', () => {
    const { context, before, actions } = cardGame('Firewall'), cast = legal(context, before, actions[0]), protectedPos = context.makeMove(before, cast);
    expect(cardPlayback(context, protectedPos, legal(context, protectedPos, actions[1]))!.local).toBe(false);
    const mirror = cardGame('MirrorB', ['MirrorB', 'Freeze']), copy = legal(mirror.context, mirror.before, mirror.actions[0]);
    expect(cardPlayback(mirror.context, mirror.before, copy)!.local).toBe(false);
  });

  it('does not refill a spent card', () => {
    const { context, before, actions } = cardGame('Freeze'), cast = cardPlayback(context, before, legal(context, before, actions[0]))!;
    expect(cast.after.used).toEqual([1, 0]);
    expect(context.legalMoves(cast.after).some((m: Move) => m.power === 'freeze')).toBe(false);
  });
});

describe('check withdrawal', () => {
  const checkers = [{ sq: 0, king: 4, path: 'straight' as const }];
  it('starts when the evasion plays, after a live move or a load; reduced motion removes it at once', async () => {
    for (const reduced of [false, true]) for (const loaded of [false, true]) {
      const { view, advance } = await viewBoard(reduced);
      const context = new GameRules({}), start = context.fromFen('7k/8/8/8/8/8/8/1r2K3 b - - 0 1'), checked = context.makeMove(start, legal(context, start, 'Rb1-a1'));
      const effects = (view as unknown as { stateEffects: StateEffects }).stateEffects;
      view.setRules(context);
      const shown = loaded ? context.fromFen('7k/8/8/8/8/8/8/r3K3 w - - 1 2') : checked;
      if (!loaded) { view.sync(start); advance(10); }
      view.sync(shown);
      // The plugin and the web game mark the move first, then play it.
      view.highlight({ check: 4, checkers }); advance(10); view.highlight({});
      expect(effects.withdrawn).toBeUndefined();
      void view.animateMove(shown, legal(context, shown, 'Ke1-e2'));
      expect(effects.withdrawn).toEqual(reduced ? undefined : { king: 4, since: expect.any(Number) });
      view.dispose();
    }
  });

  it('shows no withdrawal when a page hides the mark, reviews, rewinds or resyncs', async () => {
    const { view, advance } = await viewBoard(), context = new GameRules({});
    const start = context.fromFen('7k/8/8/8/8/8/8/1r2K3 b - - 0 1'), checked = context.makeMove(start, legal(context, start, 'Rb1-a1'));
    const effects = (view as unknown as { stateEffects: StateEffects }).stateEffects;
    view.setRules(context); view.sync(start); advance(10); view.sync(checked);
    // A modal promotion picker or the game-end ceremony hides the mark and plays no move; the mark can come back.
    view.highlight({ check: 4, checkers }); view.highlight({}); advance(10);
    view.highlight({ check: 4, checkers }); void view.animateMove(checked, legal(context, checked, 'Ke1-e2'));
    expect(effects.withdrawn).toBeUndefined();
    view.skip(); view.sync(checked);
    // The web review clears the marks first, then shows the earlier board.
    view.highlight({ check: 4, checkers }); view.highlight({}); view.sync(start);
    void view.animateMove(start, legal(context, start, 'Rb1-a1'));
    expect(effects.withdrawn).toBeUndefined();
    // An undo shows the earlier board first, then clears the marks.
    view.skip(); view.sync(checked); view.highlight({ check: 4, checkers }); view.sync(start); view.highlight({});
    expect(effects.withdrawn).toBeUndefined();
    view.dispose();
  });

  it('keeps the withdrawal through a card that ends check', async () => {
    const { view, advance } = await viewBoard(), context = new GameRules({ hands: [['Curse'] as never, []] });
    const checked = context.fromFen('4k3/8/8/8/8/8/8/r3K3 w - - 0 1'), cast = legal(context, checked, '!C:a1-a2');
    const effects = (view as unknown as { stateEffects: StateEffects }).stateEffects;
    view.setRules(context); view.sync(checked); view.highlight({ check: 4, checkers }); advance(10); view.highlight({});
    void view.animateMove(checked, cast);
    expect(effects.withdrawn).toEqual({ king: 4, since: expect.any(Number) });
    view.dispose();
  });

  it('withdraws at once when the board showed the live move first (a replayed reply)', async () => {
    const { view, advance } = await viewBoard(), context = new GameRules({});
    const checked = context.fromFen('7k/8/8/8/8/8/8/r3K3 w - - 0 1'), evaded = context.makeMove(checked, legal(context, checked, 'Ke1-f2'));
    const effects = (view as unknown as { stateEffects: StateEffects }).stateEffects;
    view.setRules(context); view.sync(checked); view.highlight({ check: 4, checkers }); advance(10);
    view.sync(evaded); view.highlight({});
    expect(effects.withdrawn).toEqual({ king: 4, since: expect.any(Number) });
    view.dispose();
  });
});
