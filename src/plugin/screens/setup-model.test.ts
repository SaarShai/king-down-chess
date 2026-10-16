import { expect, it } from 'vitest';
import { readSetup, quickSetup, withToggle, createArguments, pieceLocked, withPiece, withCard, cleanKing, availablePowers, shownKing, soloChoice } from './setup-model';
import { DEFAULT_OPTIONS } from '../../match/setup';
import type { View } from '../../match/protocol';

it('starts a new account with the approved defaults and no king pick', () => {
  expect(readSetup(null)).toEqual({
    kind: 'solo', colour: 'white', level: 'club', king: null,
    options: { fairy: true, pool: ['Q','O','L','R','B','N','A','G','M','S'], arrangement: true, classic: false, cards: false,
      cardPool: ['Freeze','IceWall','Strike','Haste','Flight','Sacrifice','March','Leap','Salvation','MirrorB','Firewall','EarthQuake','Burn','FireStarter','Control','Rally','MorphP','Mimic','Vault','Curse','SkyLift'], kingPowers: false },
  });
});

it('starts Play now at Beginner with an automatic army when no setup is saved', () => {
  expect(quickSetup(undefined)).toEqual({
    ...readSetup(null), level: 'beginner', options: { ...DEFAULT_OPTIONS, arrangement: false },
  });
});

it.each(['friend', 'random'] as const)('uses Beginner and an automatic army for a saved %s setup without changing it', kind => {
  const saved = { ...readSetup(null), kind, level: 'strong' as const, colour: 'black' as const,
    options: { ...DEFAULT_OPTIONS, kingPowers: true }, king: { king: 'Shadow', power: 'Darkness' } as const };
  const before = structuredClone(saved);
  expect(quickSetup(saved)).toEqual({ ...saved, kind: 'solo', level: 'beginner', options: { ...saved.options, arrangement: false } });
  expect(createArguments(quickSetup(saved))).toMatchObject({ level: 'beginner', options: { arrangement: false } });
  expect(saved).toEqual(before);
  expect(readSetup(saved)).toEqual(before);
});

it('keeps hidden toggles, sends only visible choices and locks the last pool entries', () => {
  let state = withToggle(readSetup(null), 'fairy', false);
  state = withToggle(state, 'classic', true);
  expect(createArguments(state).options).toMatchObject({ fairy: false, arrangement: false, classic: true });
  state = withToggle(state, 'fairy', true);
  expect(createArguments(state).options).toMatchObject({ fairy: true, arrangement: true, classic: false });
  expect(createArguments(withToggle(state, 'fairy', false)).options).toMatchObject({ classic: true });
  state = { ...state, kind: 'friend', options: { ...state.options, pool: ['N','A','M','S'], cards: true, cardPool: ['Freeze','IceWall','Strike','Haste'] } };
  expect(pieceLocked(state.options, 'A')).toBe(true);
  expect(pieceLocked(state.options, 'S')).toBe(true);
  expect(withPiece(state, 'S', false).options.pool).toEqual(['N','A','M','S']);
  state = withPiece(state, 'Q', true);
  expect(pieceLocked(state.options, 'Q')).toBe(false);
  expect(pieceLocked(state.options, 'A')).toBe(true);
  expect(withCard(state, 'Freeze', false).options.cardPool).toEqual(['IceWall','Strike','Haste']);
  expect(withCard(state, 'Leap', true).options.cardPool).toEqual(['Freeze','IceWall','Strike','Haste','Leap']);
  expect(createArguments(state)).not.toHaveProperty('level');
  expect(createArguments(state)).not.toHaveProperty('king');
});

it('lets a card draft go below four and stops Pick four at four', () => {
  let state: ReturnType<typeof readSetup> = { ...readSetup(null), options: { ...DEFAULT_OPTIONS, cards: true, cardPool: [] } };
  for (const card of ['Freeze','IceWall','Strike','Haste'] as const) state = withCard(state, card, true, true);
  expect(withCard(state, 'Leap', true, true)).toBe(state);
  expect(withCard(state, 'Haste', true, true)).toBe(state);
  state = withCard(state, 'Freeze', false, true);
  expect(state.options.cardPool).toEqual(['IceWall','Strike','Haste']);
  expect(withCard(state, 'Leap', true, true).options.cardPool).toEqual(['IceWall','Strike','Haste','Leap']);
  expect(withCard(state, 'Leap', true).options.cardPool).toHaveLength(4);
});

it('restores saved choices and removes old lab pieces and Rescue from the pools', () => {
  const saved = { kind: 'friend', colour: 'black', level: 'strong', king: { king: 'Shadow', power: 'Darkness' },
    options: { ...DEFAULT_OPTIONS, pool: ['C', ...DEFAULT_OPTIONS.pool], cardPool: [...DEFAULT_OPTIONS.cardPool, 'Rescue'] } };
  expect(readSetup(saved)).toEqual({ ...saved, options: DEFAULT_OPTIONS });
});

it('cleans card-incompatible picks and uses the actual solo seat default when there is no pick', () => {
  const cards = { ...DEFAULT_OPTIONS, cards: true, kingPowers: true };
  expect(availablePowers(cards, 'Frost')).toEqual([]);
  expect(availablePowers(cards, 'Mud')).toEqual(['March']);
  expect(cleanKing(cards, { king: 'Mud', power: 'Leap' })).toEqual({ king: 'Mud', power: 'March' });
  expect(cleanKing(cards, { king: 'Frost', power: 'Freeze' }, 'black')).toEqual({ king: 'Shadow', power: 'Darkness' });
  expect(cleanKing(cards, null)).toBeNull();
  const remembered = readSetup({ kind: 'random', colour: 'black', level: 'club', options: cards, king: { king: 'Mud', power: 'Leap' } });
  expect(remembered.king).toEqual({ king: 'Mud', power: 'March' });
  expect(withToggle({ ...remembered, options: { ...cards, cards: false }, king: { king: 'Mud', power: 'Leap' } }, 'cards', true).king).toEqual({ king: 'Mud', power: 'March' });
  expect(shownKing({ ...remembered, colour: 'random', king: null })).toEqual({ king: 'Spirit', power: 'Mercy' });
  const view = { kind: 'solo', status: 'setup', game_id: 'game', revision: 4, seat: 1, options: { ...cards, arrangement: false }, draw: 'RNBQKBNR', choices: [null, { king: { king: 'Shadow', power: 'Darkness' }, order: 'RNBQKBNR' }] } as View;
  expect(soloChoice(view, null)).toEqual({ game_id: 'game', expected_revision: 4, king: { king: 'Shadow', power: 'Darkness' }, order: 'RNBQKBNR', ready: true });
  expect(soloChoice({ ...view, options: { ...cards, arrangement: true } }, null)).toBeNull();
  expect(soloChoice({ ...view, options: { ...cards, arrangement: true } }, { king: 'Mud', power: 'March' })).toMatchObject({ king: { king: 'Mud', power: 'March' }, ready: false });
  expect(soloChoice({ ...view, options: { ...cards, kingPowers: false } }, { king: 'Mud', power: 'March' })).toBeNull();
  expect(soloChoice({ ...view, kind: 'friend', status: 'waiting' }, remembered.king)).toBeNull();
  expect(readSetup({ ...remembered, options: { ...cards, pool: ['C'] }, king: { king: 'Spirit', power: 'Freeze' } })).toMatchObject({ options: DEFAULT_OPTIONS, king: null });
});
