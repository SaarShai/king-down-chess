import type { RatingPolicy, View } from '../match/protocol';

export const policyLabel = (policy: RatingPolicy, kind: View['kind'] = 'random') => ({ legacy: kind === 'solo' ? 'Legacy' : 'Legacy rated', casual: 'Casual', 'ranked-v1': 'Ranked' })[policy];
export const RANKED_RULES = 'Random opponent and colour. 3 days per move. Full fairy pool, drawn arrangement, four shared cards and an always-on king power.';
export const RANKED_HELP = 'Built-in legal choices, previews, rules and threat indicators are allowed. Do not use engine, AI or human advice about an active ranked position. General rule explanations are allowed.';
export const policyDetail = (policy: RatingPolicy, kind: View['kind']) => kind === 'solo' ? 'Computer games do not change ratings.' : policy === 'ranked-v1' ? `${RANKED_RULES} ${RANKED_HELP}` : policy === 'legacy' ? 'This game keeps the rating rules from before Ranked and Casual.' : 'This game does not change ratings.';
