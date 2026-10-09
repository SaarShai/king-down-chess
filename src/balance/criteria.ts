export interface Estimate {
  id: string;
  value: number | null;
  low: number | null;
  high: number | null;
  state?: 'valid' | 'pending' | 'void' | 'stale' | 'unknown';
}

export interface Band {
  id: string;
  min: number | null;
  max: number | null;
  approval: 'approved' | 'proposed' | 'open';
}

export interface Verdict {
  status: 'pass' | 'fail' | 'no-data';
  reason: string;
  evidence: string[];
  approval: Band['approval'];
}

/** A point inside a band is not evidence that its whole interval is inside. */
export function assessBand(band: Band, estimate?: Estimate): Verdict {
  const result = (status: Verdict['status'], reason: string): Verdict => ({ status, reason, evidence: estimate ? [estimate.id] : [], approval: band.approval });
  if (!estimate || (estimate.state && estimate.state !== 'valid') || estimate.value === null) return result('no-data', estimate?.state ? `Evidence is ${estimate.state}.` : 'No matching measurement.');
  const { low, high, value } = estimate;
  if (low === null || high === null) return result('no-data', 'The source gives no usable interval.');
  if (![value, low, high].every(Number.isFinite) || low > value || value > high) throw new Error(`Invalid estimate ${estimate.id}`);
  const min = band.min ?? -Infinity;
  const max = band.max ?? Infinity;
  if (min > max) throw new Error(`Invalid band ${band.id}`);
  if (low >= min && high <= max) return result('pass', 'The whole interval is in the band.');
  if (high < min || low > max) return result('fail', 'The whole interval is outside the band.');
  return result('no-data', 'The interval crosses a limit. More precision is needed.');
}

/** The draw gate must pass before a change can pass the other outcome gates. */
export function assessGame(draws: Verdict, white: Verdict, length?: Verdict): Verdict {
  const checks = [draws, white, ...(length ? [length] : [])];
  const first = checks.find(c => c.status === 'fail') ?? checks.find(c => c.status !== 'pass');
  return { status: first?.status ?? 'pass', reason: draws.status !== 'pass' ? `Draw gate: ${draws.reason}${first?.status === 'fail' && first !== draws ? ' Another outcome fails.' : ''}` : first?.reason ?? 'All outcome gates pass.', evidence: checks.flatMap(c => c.evidence), approval: checks.some(c => c.approval !== 'approved') ? 'proposed' : 'approved' };
}

/** Keep odds outside the local calibration as bounds, not false point prices. */
export function oddsWorth(elo: Estimate, pawnScale: Estimate, referencePawns: number, maxDistance = 1.5) {
  if ([elo, pawnScale].some(e => e.state && e.state !== 'valid')) return null;
  if (elo.value === null || pawnScale.value === null || pawnScale.value <= 0 || elo.low === null || elo.high === null || pawnScale.low === null || pawnScale.high === null || pawnScale.low <= 0) return null;
  if (![elo.value, elo.low, elo.high, pawnScale.value, pawnScale.low, pawnScale.high, referencePawns, maxDistance].every(Number.isFinite) || elo.low > elo.value || elo.value > elo.high || pawnScale.low > pawnScale.value || pawnScale.value > pawnScale.high || maxDistance <= 0) return null;
  const offset = elo.value / pawnScale.value;
  const value = referencePawns + offset;
  if (Math.abs(offset) > maxDistance) return { value: null, bound: referencePawns + Math.sign(offset) * maxDistance, relation: offset > 0 ? 'greater-than' : 'less-than', interval: null };
  const corners = [elo.low / pawnScale.low, elo.low / pawnScale.high, elo.high / pawnScale.low, elo.high / pawnScale.high];
  return { value, bound: null, relation: 'estimate', interval: [referencePawns + Math.min(...corners), referencePawns + Math.max(...corners)], intervalKind: 'source-error envelope, not a joint confidence interval' };
}
