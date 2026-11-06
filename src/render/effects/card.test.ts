import { afterEach, describe, expect, it, vi } from 'vitest';
import { GameRules } from '../../game-rules';
import { POWERS_BALANCED, parseKings } from '../../rules/rules';
import { toFen } from '../../rules/setup';
import * as pieces from '../../rules/engine';
import { SHARED_MECHANICS, assertMechanicExpected, type SharedMechanic } from '../../../tools/fixtures/shared-mechanics';
import { RELEASED_CARDS } from '../../content/cards';
import { CAST_PREPARE_MS, cardAction, cardPlayback, walkAction } from './card';
import { powerOverlay, type TailedOverlay } from './power-overlays';
import { viewBoard } from './view-harness';

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
      const walks = walkAction(context, pos, move) !== null;
      if (move.power || pos.haste !== undefined || pos.marks?.[pos.turn]?.all) expect(effect === null).toBe(walks);
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

  it('does not add card effects to ordinary captures, reserve drops or passes', () => {
    const context = new GameRules({ hands: [['Burn'], ['Burn']] });
    const pos = context.fromFen('7k/8/8/3p4/4P3/8/8/K7 w - - 0 1');
    const capture = context.legalMoves(pos).find(m => !m.power && m.captures.length)!;
    expect(capture).toBeDefined();
    expect(cardPlayback(context, pos, capture)).toBeNull();
    expect(cardPlayback(context, pos, { from: 0, to: 0, captures: [], drop: pieces.G })).toBeNull();
    expect(cardPlayback(context, pos, { from: 0, to: 0, captures: [], pass: true })).toBeNull();
  });

  it('plays the same effect for a king power as for its card', () => {
    const powers = new GameRules({ kings: [{ king: 'Frost', power: 'Freeze' }, null] });
    const pos = powers.fromFen('7k/8/8/3p4/4P3/8/8/K7 w - - 0 1');
    expect(cardAction(powers, pos, { from: 35, to: 35, captures: [], power: 'freeze' })?.id).toBe('Freeze');
  });

  it('the Mercy king flies only over a piece in his path', () => {
    const mercy = new GameRules({ kings: [{ king: 'Spirit', power: 'Mercy' }, null] });
    const pos = mercy.fromFen('7k/8/8/8/8/8/4N3/4K3 w - - 0 1');
    expect(cardAction(mercy, pos, { from: 4, to: 20, captures: [] })?.id).toBe('MercyHop');
    expect(cardAction(mercy, pos, { from: 4, to: 22, captures: [] })).toBeNull();
    expect(cardAction(mercy, pos, { from: 4, to: 5, captures: [] })).toBeNull();
  });

  it.each(['Sacrifice', 'MorphP'])('%s swaps the figure on the board once, behind the shroud', id => {
    const fixture = fixtures.find(f => f.item === id)!, { context, before } = game(fixture);
    const move = legal(context, before, fixture.actions[0]), effect = cardPlayback(context, before, move)!;
    const on = (t: number) => effect.position(t).board[move.from];
    expect(on(.34)).toBe(before.board[move.from]);
    expect(on(.5)).toBe(0);
    expect(on(.62)).toBe(context.makeMove(before, move).board[move.from]);
  });

  it('keeps the real walk under Strike, Haste, Rally, Fire Starter and March; the air moves stay card playback', () => {
    for (const fixture of fixtures) {
      const { context, before } = game(fixture), move = legal(context, before, fixture.actions[0]);
      const walking = ['Strike', 'Haste', 'Rally', 'FireStarter', 'March'].includes(fixture.item) || (fixture.item === 'Flight' && pieces.typeOf(before.board[move.from]) === pieces.N);
      if (walking) {
        expect(cardAction(context, before, move), fixture.id).toBeNull();
        expect(powerOverlay(context, before, move), fixture.id).not.toBeNull();
      } else if (['Flight', 'Leap', 'Vault', 'SkyLift'].includes(fixture.item)) expect(cardAction(context, before, move), fixture.id).not.toBeNull();
    }
  });

  it('shows always-on March only on the double step a plain pawn lacks', () => {
    const context = new GameRules({ ...POWERS_BALANCED, kings: parseKings('Mud:March,none'), marchUses: 0 });
    const away = context.fromFen('7k/8/8/8/8/4P3/8/K7 w - - 0 1'), home = context.fromFen('7k/8/8/8/8/8/4P3/K7 w - - 0 1');
    expect(powerOverlay(context, away, legal(context, away, 'e3-e5'))).not.toBeNull();
    expect(powerOverlay(context, away, legal(context, away, 'e3-e4'))).toBeNull();
    expect(powerOverlay(context, home, legal(context, home, 'e2-e4'))).toBeNull();
  });

  it('does not add an overlay to a plain walk', () => {
    const context = new GameRules({ hands: [[], []] }), pos = context.fromFen('7k/8/8/8/8/8/4P3/K7 w - - 0 1');
    expect(powerOverlay(context, pos, legal(context, pos, 'e2-e3'))).toBeNull();
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
    // Freeze uses the local release (ticket 86): the old mark goes at the release, after the preparation.
    const effect = cardPlayback(context, before, legal(context, before, '!F:e5'))!, release = CAST_PREPARE_MS / effect.duration;
    expect(effect.position(release * .99).marks?.[0]?.sq).toBe(35);
    expect(effect.position(release * 1.01).marks?.[0]).toBeUndefined();
    expect(effect.position(1).marks?.[0]?.sq).toBe(36);
  });
});

describe('production PaintedView card invocation and scene lifecycle', () => {
  it('starts another game quietly at the next ply with equal rules, then allows its live effects', async () => {
    const { view, advance } = await viewBoard(), fixture = fixtures.find(f => f.item === 'Freeze')!;
    const { context, before } = game(fixture), move = legal(context, before, fixture.actions[0]);
    const frozen = context.makeMove(before, move);
    view.setRules(context); view.sync(before); advance(10); view.sync(frozen);
    const effects = (view as unknown as { stateEffects: { frames: { kind: string; since: number; clear?: number }[]; forward: boolean } }).stateEffects;
    expect(effects.frames.some(s => s.kind === 'freeze')).toBe(true);
    const other = new GameRules(context.rules), first = structuredClone(before);
    first.ply = frozen.ply + 1;
    // The account game boundary skips playback before discarding its effect history.
    view.skip(); view.resetEffects(); view.setRules(other); advance(10); view.sync(first);
    expect(effects.forward).toBe(false);
    expect(effects.frames).toEqual([]);
    advance(10); view.sync(other.makeMove(first, legal(other, first, fixture.actions[0])));
    expect(effects.forward).toBe(true);
    expect(effects.frames).toContainEqual(expect.objectContaining({ kind: 'freeze', since: 30 }));
    expect(effects.frames.every(s => s.clear == null)).toBe(true);
    view.dispose();
  });

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

  it.each(['Sacrifice', 'MorphP'])('%s never blends two figures', async id => {
    const { view, scene, advance } = await viewBoard(), fixture = fixtures.find(f => f.item === id)!, { context, before } = game(fixture);
    view.setRules(context); const ghost = vi.spyOn(scene, 'ghost');
    const running = view.animateMove(before, legal(context, before, fixture.actions[0]));
    for (let i = 0; i < 40; i++) advance(50);
    advance(10000); await running;
    expect(ghost).not.toHaveBeenCalled(); view.dispose();
  });

  it('Salvation raises a whole figure with no fade', async () => {
    const { view, scene, advance } = await viewBoard(), fixture = fixtures.find(f => f.item === 'Salvation')!, { context, before } = game(fixture);
    view.setRules(context); const ghost = vi.spyOn(scene, 'ghost');
    const running = view.animateMove(before, legal(context, before, fixture.actions[0]));
    for (let i = 0; i < 40; i++) advance(50);
    advance(10000); await running;
    expect(ghost).toHaveBeenCalled();
    for (const call of ghost.mock.calls) expect(call[3]).toBe(1);
    view.dispose();
  });

  it('a Strike plays the plain walk and its landing outlives the move until skip', async () => {
    const { view, scene, advance } = await viewBoard(), fixture = fixtures.find(f => f.item === 'Strike')!;
    const { context, before } = game(fixture), move = legal(context, before, fixture.actions[0]);
    view.setRules(context); const play = vi.spyOn(scene, 'play');
    const running = view.animateMove(before, move);
    expect(play).toHaveBeenCalledExactlyOnceWith(move, expect.not.objectContaining({ effect: expect.anything() }));
    advance(10000); await running;
    const tail = () => (view as unknown as { tail: { overlay: TailedOverlay } | null }).tail;
    expect(tail()?.overlay.tailMs).toBeGreaterThan(0);
    view.sync(context.makeMove(before, move));
    expect(tail()).not.toBeNull();
    view.skip(); expect(tail()).toBeNull();
    view.dispose();
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
      // A walk that keeps the plain path reports contact as any plain move does (a Knight also at a quiet landing).
      if (effect) expect(contact).toHaveBeenCalledTimes(move.captures.length ? 1 : 0);
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
