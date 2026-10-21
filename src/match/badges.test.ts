import { describe, expect, it } from 'vitest';
import { BADGES, earnedBadges, type Badge, type EarlierRecord } from './badges';
import type { HistoryEntry } from './protocol';

const game: HistoryEntry = { rating_policy: 'legacy',
 game_id: 'game', finished_at: '2026-10-11T12:00:00.000Z', kind: 'solo', colour: 'white', result: 'won', reason: 'checkmate',
 opponent: { handle: null, icon: null, computer: true, deleted: false, level: 'club' },
 features: { fairy: false, arrangement: false, classic: false, cards: false, powers: false, king: 'Spirit', power: null },
};
const earlier: EarlierRecord = { badges: [], wonKings: [] };

describe('badges earned from a finished game (spec Q12)', () => {
 it('earns First Win for a win, once', () => {
  expect(earnedBadges(game, earlier)).toEqual(['first_win']);
  expect(earnedBadges({ ...game, result: 'lost' }, earlier)).toEqual([]);
  expect(earnedBadges(game, { ...earlier, badges: ['first_win'] })).toEqual([]);
 });
 it('earns Friend Match for a finished friend game, also a loss', () => {
  expect(earnedBadges({ ...game, kind: 'friend', result: 'lost' }, earlier)).toEqual(['friend_match']);
 });
 it('earns Stranger Match for a finished random game, also a draw', () => {
  expect(earnedBadges({ ...game, kind: 'random', result: 'drawn' }, earlier)).toEqual(['stranger_match']);
 });
 it('earns Purist for a Classic win', () => {
  expect(earnedBadges({ ...game, features: { ...game.features, classic: true } }, { ...earlier, badges: ['first_win'] })).toEqual(['purist']);
 });
 it('earns Fairy Tale for a win with fairy pieces', () => {
  expect(earnedBadges({ ...game, features: { ...game.features, fairy: true } }, { ...earlier, badges: ['first_win'] })).toEqual(['fairy_tale']);
 });
 it('earns Architect for a win with the player arrangement', () => {
  expect(earnedBadges({ ...game, features: { ...game.features, arrangement: true } }, { ...earlier, badges: ['first_win'] })).toEqual(['architect']);
 });
 it('earns Card Sharp for a win with cards', () => {
  expect(earnedBadges({ ...game, features: { ...game.features, cards: true } }, { ...earlier, badges: ['first_win'] })).toEqual(['card_sharp']);
 });
 it('earns Crowned for a win with a king power', () => {
  expect(earnedBadges({ ...game, features: { ...game.features, powers: true, power: 'Mercy' } }, { ...earlier, badges: ['first_win'] })).toEqual(['crowned']);
 });
 it('earns Royal Collection on the sixth king win', () => {
  const kings = ['Frost', 'Flame', 'Stratus', 'Mud', 'Spirit', 'Shadow'] as const;
  for (const [index, king] of kings.entries()) {
   const prior = { badges: ['first_win'] as const, wonKings: kings.slice(0, index) };
   expect(earnedBadges({ ...game, features: { ...game.features, king } }, prior)).toEqual(index === 5 ? ['royal_collection'] : []);
  }
  expect(earnedBadges(game, { badges: ['first_win'], wonKings: ['Frost', 'Flame', 'Stratus', 'Mud', 'Spirit'] })).toEqual([]);
 });
 it('earns Giant Slayer only for a win against the Strong computer', () => {
  const strong = { ...game, opponent: { ...game.opponent, level: 'strong' as const } };
  const prior = { ...earlier, badges: ['first_win'] as const };
  expect(earnedBadges(strong, prior)).toEqual(['giant_slayer']);
  expect(earnedBadges({ ...strong, result: 'lost' }, prior)).toEqual([]);
  expect(earnedBadges({ ...strong, kind: 'friend', opponent: { ...strong.opponent, computer: false } }, { ...prior, badges: ['first_win', 'friend_match'] })).toEqual([]);
 });
 it('earns no badges for abort or no start, and never repeats an earned badge', () => {
  const all = { ...game, kind: 'friend' as const, features: { ...game.features, classic: true, fairy: true, arrangement: true, cards: true, powers: true } };
  expect(earnedBadges({ ...all, reason: 'abort' }, earlier)).toEqual([]);
  expect(earnedBadges({ ...all, reason: 'no_start' }, earlier)).toEqual([]);
  expect(earnedBadges(all, { badges: Object.keys(BADGES) as Badge[], wonKings: ['Frost', 'Flame', 'Stratus', 'Mud', 'Spirit', 'Shadow'] })).toEqual([]);
  expect(earnedBadges({ ...all, result: 'lost' }, { ...earlier, badges: ['friend_match'] })).toEqual([]);
 });
});
