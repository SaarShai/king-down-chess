import { DEFAULT_RULES, type Rules } from '../rules/rules';
import { POOL } from '../rules/setup';
import { adjudication, usePairs, type RunSpec } from './spec-plan';

export function specKeyParts(spec: RunSpec, pinnedEvaluation: unknown = null) {
  return {
    seed: spec.seed,
    ai: spec.ai,
    backRanks: spec.backRanks ?? null,
    asymmetric: spec.asymmetric ?? null,
    commonSeeds: !!spec.commonSeeds,
    rules: { ...DEFAULT_RULES, ...spec.rules },
    baseRules: spec.baseRules ?? null,
    values: spec.values ?? null,
    baseValues: spec.baseValues ?? null,
    evalParams: pinnedEvaluation,
    powerHold: spec.powerHold ?? null,
    powerHoldSides: spec.powerHoldSides ?? null,
    multiPv: !!spec.multiPv,
    openingRandomPlies: spec.openingRandomPlies ?? 0,
    maxPlies: spec.maxPlies ?? 300,
    pairs: usePairs(spec),
    adjudicate: adjudication(spec),
  };
}

export interface Stamp { rules: Rules; rulesKey: string; pool: string; specKey: string; specKeyVersion?: number; src: string }

export function stampParts(spec: RunSpec) {
  const rules = { ...DEFAULT_RULES, ...spec.rules }; // exactly what run() puts in RULES
  // Keys added later (kings, hands, piles, fromMove, design) count only when set, so stamps of older runs still match.
  const keyed: Partial<Rules> = { ...rules };
  if (!rules.hands[0].length && !rules.hands[1].length) delete keyed.hands;
  if (!rules.piles[0].length && !rules.piles[1].length) delete keyed.piles;
  if (!rules.kings[0] && !rules.kings[1]) delete keyed.kings;
  if (!Object.keys(rules.fromMove).length) delete keyed.fromMove;
  if (!rules.design) delete keyed.design;
  return { rules, keyed, pool: (Array.isArray(spec.backRanks) ? undefined : spec.backRanks?.pool) ?? POOL };
}
