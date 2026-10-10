import { stable, type MeasurementContext } from './measurements';
import { RULE_DIMENSIONS } from './schema';
import { ALL_CARDS, KINGS } from '../rules/rules';

export interface TargetContext {
  sourceHash: string;
  specKey: string;
  flags: Record<string, unknown>;
  pool: string;
  mode: 'ordinary' | 'powers' | 'cards' | 'classic-odds';
  depth?: number;
  cardPool?: string[];
  effectiveRulesHash?: string;
  sourceArchiveSha256?: string;
  /** Cite the source that checks eval prices for this immutable source hash. */
  priceReview: string;
  reason: string;
}

/** A name or a partial rule diff cannot certify a target context. */
export function matchesTarget(context: MeasurementContext, reviewed: TargetContext[]): boolean {
  if (context.flagsKind !== 'full' || !context.flags || !Object.keys(context.flags).length || !context.pool ||
    !context.sourceHash || !context.specKey || !['none', 'matchup'].includes(context.variantScope)) return false;
  if (Object.keys(context.flags).length !== Object.keys(RULE_DIMENSIONS).length ||
    !Object.entries(RULE_DIMENSIONS).every(([key, dimension]) => {
      const value = context.flags![key];
      if ('domain' in dimension) {
        if (dimension.domain === 'kingPair') return Array.isArray(value) && value.length === 2 && value.every(choice => choice === null || choice && typeof choice === 'object' && Object.entries(KINGS).some(([king, powers]) => choice.king === king && powers.some(power => choice.power === power)));
        if (dimension.domain === 'cardPair') return Array.isArray(value) && value.length === 2 && value.every(hand => Array.isArray(hand) && hand.every(card => ALL_CARDS.some(name => name === card)));
        return !!value && typeof value === 'object' && !Array.isArray(value) && Object.entries(value).every(([card, move]) => ALL_CARDS.some(name => name === card) && Number.isSafeInteger(move) && move >= 1);
      }
      return dimension.allowed.some(allowed => stable(allowed) === stable(value));
    })) return false;
  if (context.commitSource === 'queue') return false;
  const entrants = context.settings?.entrants ?? (context.settings?.kind === 'classic-odds' ? ['classic-odds'] : null);
  if (!Array.isArray(entrants) || !entrants.length || entrants.some(e => typeof e !== 'string')) return false;
  const mode = context.settings?.kind === 'classic-odds' ? 'classic-odds' : entrants.some(e => /^cards?[:\d]/.test(e)) ? 'cards' : entrants.every(e => e === 'none') ? 'ordinary' : 'powers';
  return reviewed.some(r => r.reason?.trim() && r.priceReview?.trim() && r.mode === mode &&
    (r.depth === undefined || r.depth === context.depth) &&
    (context.stampSource !== 'derived' || !!r.effectiveRulesHash && r.effectiveRulesHash === context.settings?.effectiveRulesHash) &&
    (r.sourceArchiveSha256 === undefined || r.sourceArchiveSha256 === context.sourceArchiveSha256) &&
    (mode !== 'cards' || !!r.cardPool && stable(r.cardPool) === stable(context.settings?.cardPool)) &&
    r.sourceHash === context.sourceHash && r.specKey === context.specKey && r.pool === context.pool &&
    !!r.flags && stable(r.flags) === stable(context.flags));
}
