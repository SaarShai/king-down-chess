import { createHash } from 'node:crypto';
import { ALL_CARDS, KINGS } from '../rules/rules';
import { RULE_DIMENSIONS } from './schema';
import { stable, type Measurement } from './measurements';

/** A measured context is a point in the rules space, including old and branch-only readings. */
export function measuredVersions(measurements: Measurement[]) {
  const versions = new Map<string, { id: string; element: string; version: string | null; measurementId: string; runs: string[]; findings: string[] }>();
  for (const row of measurements) {
    if (!['valid', 'unverified'].includes(row.validity)) continue;
    const key = stable({ element: row.element, version: row.version, context: row.context });
    if (versions.has(key)) { const v = versions.get(key)!; if (!v.runs.includes(row.run)) v.runs.push(row.run); continue; }
    const findings: string[] = [];
    if (!row.context.flags) findings.push('The source has no rule flags. This version has no complete point in the design space.');
    for (const [key, value] of Object.entries(row.context.flags ?? {})) {
      const dimension = RULE_DIMENSIONS[key as keyof typeof RULE_DIMENSIONS];
      if (!dimension) { findings.push(`Unknown rule flag: ${key}.`); continue; }
      let fits: boolean;
      if (!('domain' in dimension)) fits = (dimension.allowed as readonly unknown[]).includes(value);
      else if (dimension.domain === 'cardPair') fits = Array.isArray(value) && value.length === 2 && value.every(hand => Array.isArray(hand) && hand.every(card => (ALL_CARDS as readonly unknown[]).includes(card)));
      else if (dimension.domain === 'kingPair') fits = Array.isArray(value) && value.length === 2 && value.every(king => king === null || typeof king === 'object' && king.king in KINGS && (KINGS[king.king as keyof typeof KINGS] as readonly unknown[]).includes(king.power));
      else fits = !!value && typeof value === 'object' && !Array.isArray(value) && Object.entries(value).every(([card, move]) => (ALL_CARDS as readonly string[]).includes(card) && Number.isSafeInteger(move) && (move as number) > 0);
      if (!fits) findings.push(`Rule value does not fit ${key}: ${stable(value)}.`);
    }
    if (row.context.flagsKind !== 'full') findings.push('Only a rule diff is known. The unstated dimensions remain unknown.');
    versions.set(key, { id: `tested:${createHash('sha256').update(key).digest('hex').slice(0, 16)}`, element: row.element, version: row.version, measurementId: row.id, runs: [row.run], findings });
  }
  return [...versions.values()].sort((a, b) => a.id.localeCompare(b.id));
}
