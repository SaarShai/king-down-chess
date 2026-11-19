import { existsSync } from 'node:fs';
import { afterEach, expect, it, vi } from 'vitest';
import { guideEntries, guideSections } from './guide';
import { pieces, powerLines, resultText } from './texts';
import { DEFAULT_RULES, POWERS_BALANCED } from '../../rules/rules';
import { RELEASED_CARDS } from '../../content/cards';
import { KINGS, P, K, type PowerName } from '../../rules/engine';
import { GameRules } from '../../game-rules';
import { cardText, powerText } from '../../powers-ui';
import { pieceGuide } from '../../read';
import type { PieceType } from '../../rules/engine';

afterEach(() => vi.unstubAllGlobals());
it('has four guide sections and all released entries', () => {
  expect(guideSections).toEqual(['Pieces', 'Kings and powers', 'Cards', 'How a turn works']);
  expect(guideEntries('Pieces').map(item => item.name)).toEqual(['Archer', 'Beast', 'Guard', 'Maester', 'Ogre', 'Paladin', 'Pawn', 'Knight', 'Bishop', 'Rook', 'Queen', 'King']);
  expect(guideEntries('Kings and powers')).toHaveLength(Object.values(KINGS).flat().length);
  expect(guideEntries('Cards').map(item => item.id)).toEqual(RELEASED_CARDS.map(card => card.id));
  expect(guideEntries('How a turn works')).toHaveLength(5);
  expect(guideEntries('unknown')).toEqual([]);
});
it('uses the in-game piece rule without inactive chess actions', () => {
  expect(DEFAULT_RULES.classicChess).toBe(false);
  for (const entry of guideEntries('Pieces')) expect(entry.full).toBe(pieces[+entry.id].full);
  expect(pieces[P].full).toContain('No en passant in this game.');
  expect(pieces[K].full).toContain('No castling in this game.');
});
it.each(guideEntries('Pieces'))('reads $name facts from pieceGuide', entry => {
  const context = new GameRules();
  const type = +entry.id as PieceType, source = pieceGuide(context, type);
  const facts = [source.moves, source.captures, source.special].filter(Boolean).join(' ').replace(/\bTakes\b/g, 'Captures').replace(/\btakes\b/g, 'captures').replace(/\btaken\b/g, 'captured').replace(/\btake\b/g, 'capture').replace('Select "Stop here" to end the chain.', 'Select End turn to end the chain.');
  const extra = type === P ? ' The path must be clear. Choose a new piece on the last rank. No en passant in this game.' : type === K ? ' Stay out of attack. No castling in this game.' : '';
  expect(pieces[type].full, entry.name).toBe(facts + extra);
  expect(entry.full, entry.name).toBe(facts + extra);
});
it('reads current power and card content with balanced rules and capture words', () => {
  const rules = new GameRules(POWERS_BALANCED).rules;
  const capture = (line: string) => line.replace(/\bTakes\b/g, 'Captures').replace(/\btakes\b/g, 'captures').replace(/\btaken\b/g, 'captured').replace(/\btake\b/g, 'capture');
  for (const entry of guideEntries('Kings and powers')) expect(entry.full.toLowerCase()).toBe(`${capture(powerText(entry.id as PowerName, rules)).toLowerCase()}.`);
  for (const card of RELEASED_CARDS) expect(guideEntries('Cards').find(entry => entry.id === card.id)?.full.toLowerCase()).toBe(`${capture(cardText(card.id, rules)).toLowerCase()}.`);
});
it('uses short lines from the copy table', () => {
  for (const section of guideSections.slice(0, 3)) for (const entry of guideEntries(section)) { expect(entry.short.length).toBeLessThanOrEqual(60); expect(entry.short).toMatch(/\.$/); }
  expect(powerLines.Flight).toBe('Move to an empty square in your half; no king.');
  expect(powerLines.MirrorB).toBe('Copy another card in your hand; that card stays.');
  expect(Object.fromEntries(guideEntries('Pieces').map(entry => [entry.name, entry.short]))).toEqual({
    Pawn: 'Move forward; capture diagonally. Promote on the last rank.', Knight: 'Jump two squares, then one across; jump over pieces.',
    Bishop: 'Move on a clear diagonal; pieces block the path.', Rook: 'Move on a clear rank or file; pieces block the path.',
    Queen: 'Move on a clear rank, file or diagonal; pieces block it.', King: 'Move one safe square. Only a king can capture a Guard.',
    Archer: 'Shoot two squares straight or diagonally ahead, over pieces.', Beast: 'Step one square; each later chain step must capture.',
    Guard: 'Step without capture; only a king can capture it.', Maester: 'Step or swap with an adjacent own piece; keep the king safe.',
    Ogre: 'Push and follow; never push a king or off the board.', Paladin: 'Queen paths over own pieces; non-pawn capture removes both.',
  });
  const approved = {
    Freeze: 'Stop an enemy except the king. It still attacks.', IceWall: 'Protect a piece, not the king; a push still works.',
    Strike: 'Move like a queen; no pawn, king or capture.', Haste: 'Move one piece up to twice; neither move captures.',
    Flight: 'Move to an empty square in your half; no king.', Sacrifice: 'Replace a pawn with a lost piece; no pawn, Guard or king.',
    March: 'Move a pawn two squares from any rank; the path stays clear.', Leap: 'Rook, Bishop or Queen: jump own pawns, not other pieces.',
    HolyLight: 'Protect pieces beside the king, not on its diagonals.', Mercy: 'The king jumps; its shelter stops captures except by pawns.',
    DeathTouch: 'King: capture beside it or two ahead or back; never move.', Darkness: 'Pawns step diagonally too; capture only straight ahead.',
    Salvation: 'Your back rank: return a lost piece; no pawn, Guard or king.', MirrorB: 'Copy another card in your hand; that card stays.',
    Firewall: 'Protect all pieces for the next enemy turn; a push works.', EarthQuake: 'Push pieces away; kings and blocked or edge pieces stay.',
    Burn: 'Capture on d4, e4, d5 or e5; no pawn or king can act.', FireStarter: 'Capture on the enemy back rank; no pawn or king can act.',
    Control: 'Move like a different adjacent own type; no pawn or king.', Rally: 'Move up to two different pieces; neither move captures.',
    MorphP: 'Change your pawn into a Knight or Bishop; it stays here.', Mimic: 'Use another own type to move, not capture; no pawn or king.',
    Vault: 'Jump exactly one piece with a Rook, Bishop or Queen.', Curse: 'Move an enemy to an empty square; no king or last-rank pawn.',
    SkyLift: 'Swap two different own types; no pawn or king.',
  };
  expect(powerLines).toEqual(approved);
  for (const section of ['Kings and powers', 'Cards']) for (const entry of guideEntries(section)) expect(entry.short, entry.name).toBe(approved[entry.id as keyof typeof approved]);
});

it('names End turn in the Beast rule for both Guide and Full rule', () => {
  const guide = guideEntries('Pieces').find(entry => entry.name === 'Beast')!;
  for (const rule of [guide.full, pieces[+guide.id].full]) {
    expect(rule).toContain('Select End turn to end the chain.'); expect(rule).not.toContain('Stop here');
  }
});
it.each([
  ['checkmate', false, 1, 'You win', 'Checkmate.'],
  ['checkmate', false, 0, 'The computer wins', 'Checkmate.'],
  ['playing', true, 0, 'The computer wins', 'You resign.'],
  ['stalemate', false, 1, 'Draw', 'No legal action and no check.'],
  ['draw50', false, 1, 'Draw', 'No progress for 100 actions.'],
  ['drawRepetition', false, 1, 'Draw', 'The same position occurs three times.'],
  ['drawMaterial', false, 1, 'Draw', 'Insufficient material.'],
] as const)('separates result %s from its cause', (status, resigned, side, title, cause) => {
  expect(resultText(status, resigned, side)).toEqual({ title, cause });
});
it('halves Fast times, restores Normal and uses reduced motion for Off and the system', async () => {
  const values = new Map([['--motion-strength', '2'], ['--dur-tab-in', '520ms']]);
  const root = { dataset: {} as Record<string, string>, style: { setProperty: (key: string, value: string) => values.set(key, value) } };
  vi.stubGlobal('document', { documentElement: root, addEventListener() {} });
  vi.stubGlobal('getComputedStyle', () => ({ getPropertyValue: (name: string) => values.get(name) ?? '200ms' }));
  const { setInterfaceMotion, ms, time, calm } = await import('./motion');
  setInterfaceMotion('fast', false); expect(ms('--dur-tab-in')).toBe(260); expect(time(420)).toBe(210); expect(calm()).toBe(false);
  setInterfaceMotion('normal', false); expect(ms('--dur-tab-in')).toBe(520); expect(time(420)).toBe(420);
  setInterfaceMotion('off', false); expect(calm()).toBe(true);
  setInterfaceMotion('normal', true); expect(calm()).toBe(true);
});

it('has local figure and painting files for every guide entry', () => {
  for (const section of guideSections) for (const entry of guideEntries(section)) if (entry.art) expect(existsSync(`public${entry.art}`), entry.art).toBe(true);
});
it('hash routes name the place to open; any other hash opens Play', async () => {
  vi.stubGlobal('document', { documentElement: { dataset: {}, style: { setProperty() {} } }, addEventListener() {} });
  vi.stubGlobal('getComputedStyle', () => ({ getPropertyValue: () => '200ms' }));
  const { placeOf } = await import('./shell');
  expect(['#guide', '#you', '#play', 'guide', '', '#game', '#Guide', '#you/x'].map(placeOf)).toEqual(['guide', 'you', 'play', 'guide', 'play', 'play', 'play', 'play']);
});
