import type { MeasurementContext } from './measurements';

export interface TargetContext {
  sourceHash: string;
  specKey: string;
  reason: string;
}

/** specKey fixes rules, pool, seed, search, prices, adjudication and other run inputs. */
export function matchesTarget(context: MeasurementContext, reviewed: TargetContext[]): boolean {
  return context.flagsKind === 'full' && !!context.sourceHash && !!context.specKey && reviewed.some(r =>
    !!r.reason && r.sourceHash === context.sourceHash && r.specKey === context.specKey);
}
