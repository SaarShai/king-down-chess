import { afterEach, describe, expect, it, vi } from 'vitest';
import { GameRules } from '../../game-rules';
import { POWERS_BALANCED, parseKings } from '../../rules/rules';
import { toFen } from '../../rules/setup';
import * as pieces from '../../rules/engine';
import { SHARED_MECHANICS, assertMechanicExpected, type SharedMechanic } from '../../../tools/fixtures/shared-mechanics';
import { RELEASED_CARDS } from '../../content/cards';
import { cardAction, cardPlayback } from './card';
import { PaintedView } from '../PaintedView';
import type { PaintedScene } from '../../../docs/2d-first-pieces/board/scene.mjs';

const fixtures = RELEASED_CARDS.map(card => SHARED_MECHANICS.find(row => row.id === card.fixtureId)!);
function game(fixture: SharedMechanic) {
  const kings = fixture.setup.kings ? parseKings(fixture.setup.kings) : undefined;
  const context = new GameRules({ ...(kings?.some(Boolean) ? POWERS_BALANCED : {}), ...(kings ? { kings } : {}), hands: [fixture.setup.hand!, fixture.setup.hand!] });
  return { context, before: context.fromFen(fixture.setup.fen!) };
}
function legal(context: GameRules, before: pieces.Position, lan: string) {
  const matches = context.legalMoves(before).filter(m => context.toLan(before, m) === lan);
  expect(matches).toHaveLength(1);
  return matches[0];
}
function expected(context: GameRules, pos: pieces.Position, fixture: SharedMechanic) {
  assertMechanicExpected({ fen: toFen(pos), rules: context.rules, turn: pos.turn, legal: context.legalMoves(pos).map(m => context.toLan(pos, m)) }, fixture.expected, fixture.id);
}

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('released card playback uses real engine frames', () => {
  it.each(fixtures)('$id keeps the full legal result', fixture => {
    const { context, before } = game(fixture);
    let pos = before;
    for (const lan of fixture.actions) {
      const move = legal(context, pos, lan), effect = cardPlayback(context, pos, move);
      if (move.power || pos.haste !== undefined || pos.marks?.[pos.turn]?.all) expect(effect).not.toBeNull();
      if (effect) {
        const original = new Uint8Array(pos.board);
        expect(effect.position(0).board).toEqual(pos.board);
        for (const t of [.23, .36, .5, .62, .84, 1]) effect.position(t);
        const after = context.makeMove(pos, move);
        expect(effect.position(1)).toEqual(after);
        expect(pos.board).toEqual(original);
        pos = after;
      } else pos = context.makeMove(pos, move);
    }
    expected(context, pos, fixture);
  });

  it('Mirror copies every released non-Mirror card without spending the copied card', () => {
    for (const fixture of fixtures.filter(f => f.item !== 'MirrorB')) {
      const { context: original, before } = game(fixture);
      const context = new GameRules({ ...original.rules, hands: [['MirrorB', fixture.item as typeof RELEASED_CARDS[number]['id']], []] });
      const originalMove = legal(original, before, fixture.actions[0]);
      const move = context.legalMoves(before).find(m => m.via === 'mirrorb' && m.power === originalMove.power && m.from === originalMove.from && m.to === originalMove.to && m.promo === originalMove.promo && m.drop === originalMove.drop && JSON.stringify(m.captures) === JSON.stringify(originalMove.captures));
      expect(move, fixture.id).toBeDefined();
      const effect = cardPlayback(context, before, move!)!;
      expect(effect.action).toMatchObject({ id: fixture.item, mirror: true });
      expect(effect.duration).toBe(1300);
      expect(effect.position(1).used).toEqual([1, 0]);
    }
  });

  it('does not add card effects to ordinary captures, reserve drops, passes or king powers', () => {
    const context = new GameRules({ hands: [['Burn'], ['Burn']] });
    const pos = context.fromFen('7k/8/8/3p4/4P3/8/8/K7 w - - 0 1');
    const capture = context.legalMoves(pos).find(m => !m.power && m.captures.length)!;
    expect(capture).toBeDefined();
    expect(cardPlayback(context, pos, capture)).toBeNull();
    expect(cardPlayback(context, pos, { from: 0, to: 0, captures: [], drop: pieces.G })).toBeNull();
    expect(cardPlayback(context, pos, { from: 0, to: 0, captures: [], pass: true })).toBeNull();
    const powers = new GameRules({ kings: [{ king: 'Frost', power: 'Freeze' }, null] });
    expect(cardAction(powers, pos, { from: 35, to: 35, captures: [], power: 'freeze' })).toBeNull();
  });

  it('anchors borrowed material at a real matching lender away from a1', () => {
    const context = new GameRules({ hands: [['Control'], []] });
    const before = context.fromFen('4k3/8/8/1p6/8/8/RN6/4K3 w - - 0 1');
    const move = context.legalMoves(before).find(m => m.power === 'control' && m.from === 9 && m.to === 33)!;
    const effect = cardPlayback(context, before, move)!;
    expect(effect).not.toBeNull();
    expect((effect as unknown as { frame: { lender: number } }).frame.lender).toBe(8);
  });

  it('removes the old mark at contact while the new material forms', () => {
    const context = new GameRules({ hands: [['Freeze', 'Freeze'], []], markTurns: 2 });
    let before = context.fromFen('7k/8/8/3nn3/8/8/P7/K7 w - - 0 1');
    before = context.makeMove(before, legal(context, before, '!F:d5'));
    before = context.makeMove(before, legal(context, before, 'Kh8-g8'));
    const effect = cardPlayback(context, before, legal(context, before, '!F:e5'))!;
    expect(effect.position(.61).marks?.[0]?.sq).toBe(35);
    expect(effect.position(.63).marks?.[0]).toBeUndefined();
    expect(effect.position(1).marks?.[0]?.sq).toBe(36);
  });
});

/** The real scene runs on a controlled frame clock. No production timer is replaced by a sample player. */
function dom(reduced = false) {
  let now = 0, id = 0;
  const raf = new Map<number, FrameRequestCallback>(), docEvents = new Map<string, () => void>();
  const ctx = new Proxy({} as CanvasRenderingContext2D, {
    get(target, key) {
      if (Reflect.has(target, key)) return Reflect.get(target, key);
      if (key === 'measureText') return () => ({ width: 1 });
      if (key === 'getImageData' || key === 'createImageData') return (_x: number, _y: number, w = 1, h = 1) => ({ data: new Uint8ClampedArray(Math.max(1, w * h) * 4) });
      return () => ctx;
    },
    set(target, key, value) { Reflect.set(target, key, value); return true; },
  });
  const element = () => ({ width: 960, height: 1024, style: {}, classList: { add() {}, toggle() {} }, getContext: () => ctx, appendChild() {}, addEventListener() {}, getBoundingClientRect: () => ({ width: 960, height: 1024 }), getClientRects: () => [1] });
  const doc = { createElement: element, hidden: false, addEventListener: (name: string, fn: () => void) => docEvents.set(name, fn) };
  const media = { matches: reduced, addEventListener: (_: string, fn: () => void) => docEvents.set('reduced', fn) };
  vi.stubGlobal('document', doc);
  vi.stubGlobal('DOMMatrix', class { scale() { return this; } translate() { return this; } });
  vi.stubGlobal('setTimeout', () => 0);
  vi.stubGlobal('clearTimeout', () => {});
  vi.stubGlobal('Image', class { width = 1152; height = 1152; naturalWidth = 1152; complete = true; onload?: () => void; set src(_: string) { queueMicrotask(() => this.onload?.()); } decode() { return Promise.resolve(); } });
  vi.stubGlobal('matchMedia', () => media);
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  vi.stubGlobal('performance', { now: () => now });
  vi.stubGlobal('requestAnimationFrame', (fn: FrameRequestCallback) => { raf.set(++id, fn); return id; });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => raf.delete(id));
  const advance = (ms: number) => { now += ms; const tasks = [...raf.values()]; raf.clear(); tasks.forEach(fn => fn(now)); };
  return { element, doc, media, docEvents, advance };
}
async function viewBoard(reduced = false) {
  const clock = dom(reduced), view = new PaintedView(clock.element() as unknown as HTMLElement);
  for (let i = 0; i < 12; i++) await Promise.resolve();
  clock.advance(0); await view.ready();
  return { ...clock, view, scene: (view as unknown as { scene: PaintedScene }).scene };
}

describe('production PaintedView card invocation and scene lifecycle', () => {
  it.each(['Freeze', 'IceWall', 'Firewall'])('%s hands its formed material to the persistent state without a second onset', async id => {
    const { view, advance } = await viewBoard(), { context, before } = game(fixtures.find(f => f.item === id)!);
    const fixture = fixtures.find(f => f.item === id)!, move = legal(context, before, fixture.actions[0]);
    view.setRules(context);
    const running = view.animateMove(before, move);
    advance(10000); await running;
    view.sync(context.makeMove(before, move));
    const effects = (view as unknown as { stateEffects: { frames: { kind: string; since: number }[]; forward: boolean } }).stateEffects;
    const kind = id === 'Freeze' ? 'freeze' : id === 'IceWall' ? 'ward' : 'firewall';
    const states = effects.frames.filter(s => s.kind === kind);
    expect(states.length).toBeGreaterThan(0);
    expect(states.every(s => s.since === -Infinity)).toBe(true);
    expect(effects.forward).toBe(true); // A new Check still gets its own live entrance.
    view.dispose();
  });

  it.each(['Freeze', 'IceWall', 'Firewall'])('skip then sync keeps %s settled and cannot mark an unrelated replacement', async id => {
    const { view, advance } = await viewBoard(), fixture = fixtures.find(f => f.item === id)!;
    const { context, before } = game(fixture), move = legal(context, before, fixture.actions[0]);
    view.setRules(context);
    const running = view.animateMove(before, move); advance(100); view.skip(); await running;
    view.sync(context.makeMove(before, move));
    const effects = (view as unknown as { stateEffects: { frames: { owner: number; since: number }[] } }).stateEffects;
    expect(effects.frames.filter(s => s.owner === before.turn).every(s => s.since === -Infinity)).toBe(true);
    view.sync(before);
    const again = view.animateMove(before, move); advance(100); view.skip(); await again;
    const replacement = context.fromFen('7k/8/8/8/8/8/P7/K7 w - - 0 1'); view.sync(replacement);
    expect(effects.frames).toEqual([]); view.dispose();
  });

  it('keeps ordinary captures on existing scene playback and reserve drops immediate', async () => {
    const { view, scene, advance } = await viewBoard();
    const context = new GameRules({ hands: [['Burn'], ['Burn']] });
    const before = context.fromFen('7k/8/8/3p4/4P3/8/8/K7 w - - 0 1');
    const move = context.legalMoves(before).find(m => !m.power && m.captures.length)!;
    view.setRules(context); const play = vi.spyOn(scene, 'play');
    const running = view.animateMove(before, move); advance(10000); await running;
    expect(play).toHaveBeenCalledExactlyOnceWith(move, expect.not.objectContaining({ effect: expect.anything() }));
    play.mockClear();
    await view.animateMove(before, { from: 8, to: 8, captures: [], drop: pieces.G });
    expect(play).not.toHaveBeenCalled(); view.dispose();
  });

  it.each(fixtures)('$id reaches the scene and emits one contact per capture action', async fixture => {
    const { view, scene, advance } = await viewBoard(), { context, before } = game(fixture);
    const play = vi.spyOn(scene, 'play'); view.setRules(context);
    let pos = before;
    for (const lan of fixture.actions) {
      const move = legal(context, pos, lan), contact = vi.fn(), effect = cardPlayback(context, pos, move);
      const running = view.animateMove(pos, move, contact);
      if (effect) {
        expect(play).toHaveBeenLastCalledWith(move, expect.objectContaining({ effect: expect.anything() }));
        advance(effect.duration * .61); expect(contact).not.toHaveBeenCalled();
        advance(effect.duration * .02);
        expect(contact).toHaveBeenCalledTimes(move.captures.length ? 1 : 0);
      }
      advance(10000); await running;
      expect(scene.animating).toBe(false);
      expect(contact).toHaveBeenCalledTimes(move.captures.length ? 1 : 0);
      pos = context.makeMove(pos, move); view.sync(pos);
    }
    expected(context, pos, fixture); view.dispose();
  });

  it.each(['skip', 'sync', 'replace', 'pass', 'off', 'reduced', 'hidden', 'dispose'] as const)('%s settles pending playback without a stale contact', async how => {
    const clock = await viewBoard(), { view, scene, advance } = clock;
    const { context, before } = game(fixtures.find(f => f.item === 'Burn')!);
    view.setRules(context);
    const move = legal(context, before, 'Ra2xd5!N'), contact = vi.fn();
    const running = view.animateMove(before, move, contact); advance(100);
    let replacement: Promise<void> | undefined;
    if (how === 'skip') view.skip();
    if (how === 'sync') view.sync(context.makeMove(before, move));
    if (how === 'replace') { replacement = view.animateMove(before, move); advance(2000); }
    if (how === 'pass') replacement = view.animateMove(before, { from: 4, to: 4, captures: [], pass: true });
    if (how === 'off') view.setPace('off');
    if (how === 'reduced') { clock.media.matches = true; clock.docEvents.get('reduced')!(); }
    if (how === 'hidden') { clock.doc.hidden = true; clock.docEvents.get('visibilitychange')!(); }
    if (how === 'dispose') view.dispose();
    await running; await replacement; advance(10000);
    expect(contact).not.toHaveBeenCalled(); expect(scene.animating).toBe(false);
    view.dispose();
  });

  it.each(['off', 'reduced', 'hidden'] as const)('%s does not start a card clock', async mode => {
    const clock = await viewBoard(mode === 'reduced'), { view, scene } = clock;
    if (mode === 'off') view.setPace('off');
    if (mode === 'hidden') clock.doc.hidden = true;
    const { context, before } = game(fixtures.find(f => f.item === 'Freeze')!);
    view.setRules(context); const play = vi.spyOn(scene, 'play');
    await view.animateMove(before, legal(context, before, '!F:d5'));
    expect(play).not.toHaveBeenCalled(); view.dispose();
  });

  it('a contact that replaces the position cannot draw the old result', async () => {
    const { view, scene, advance } = await viewBoard(), { context, before } = game(fixtures.find(f => f.item === 'Burn')!);
    const replacement = context.fromFen('7k/8/8/8/8/8/8/K7 w - - 0 1');
    view.setRules(context);
    const contact = vi.fn(() => view.sync(replacement));
    const running = view.animateMove(before, legal(context, before, 'Ra2xd5!N'), contact);
    advance(1000); await running; advance(10000);
    expect(contact).toHaveBeenCalledOnce(); expect(scene.animating).toBe(false);
    expect((scene as unknown as { position: pieces.Position }).position).toBe(replacement);
    view.dispose();
  });

  it('Fast halves the card duration; sync and reload do not replay it', async () => {
    const { view, scene, advance } = await viewBoard(), { context, before } = game(fixtures.find(f => f.item === 'Burn')!);
    view.setRules(context); view.setPace('fast'); const contact = vi.fn();
    const move = legal(context, before, 'Ra2xd5!N'), running = view.animateMove(before, move, contact);
    advance(740); expect(scene.animating).toBe(true);
    advance(20); await running; expect(scene.animating).toBe(false); expect(contact).toHaveBeenCalledOnce();
    const play = vi.spyOn(scene, 'play'), after = context.makeMove(before, move);
    view.sync(after); view.sync(after); view.highlight({}); advance(10000);
    expect(play).not.toHaveBeenCalled(); view.dispose();
  });
});
