import type { HistoryEntry } from './protocol';
import type { KingName } from '../rules/rules';

export const BADGES = {
 first_win: 'First Win', friend_match: 'Friend Match', stranger_match: 'Stranger Match', purist: 'Purist', fairy_tale: 'Fairy Tale',
 architect: 'Architect', card_sharp: 'Card Sharp', crowned: 'Crowned', royal_collection: 'Royal Collection', giant_slayer: 'Giant Slayer',
} as const;
export type Badge = keyof typeof BADGES;
export interface EarlierRecord { badges: readonly Badge[]; wonKings: readonly KingName[] }

export function earnedBadges(game: HistoryEntry, earlier: EarlierRecord): Badge[] {
 if (game.reason === 'abort' || game.reason === 'no_start') return [];
 const badges: Badge[] = [];
 if (game.result === 'won') badges.push('first_win');
 if (game.kind === 'friend') badges.push('friend_match');
 if (game.kind === 'random') badges.push('stranger_match');
 if (game.result === 'won' && game.features.classic) badges.push('purist');
 if (game.result === 'won' && game.features.fairy) badges.push('fairy_tale');
 if (game.result === 'won' && game.features.arrangement) badges.push('architect');
 if (game.result === 'won' && game.features.cards) badges.push('card_sharp');
 if (game.result === 'won' && game.features.powers) badges.push('crowned');
 if (game.result === 'won' && new Set([...earlier.wonKings, game.features.king]).size === 6) badges.push('royal_collection');
 if (game.result === 'won' && game.kind === 'solo' && game.opponent.computer && game.opponent.level === 'strong') badges.push('giant_slayer');
 return badges.filter(badge => !earlier.badges.includes(badge));
}
