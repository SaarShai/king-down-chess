export interface EffectAnchor {
  id: string;
  context: string;
  feature: number;
  value: number;
  low: number | null;
  high: number | null;
}

/** A local response curve. It cannot transfer an effect to a different deal or ruleset. */
export function predictEffect(anchors: EffectAnchor[], feature: number, context: string) {
  const rows = anchors.filter(r => r.context === context).sort((a, b) => a.feature - b.feature);
  if (new Set(rows.map(r => r.feature)).size !== rows.length) throw new Error('Duplicate effect anchor. Keep separate seeds or pool them with their covariance.');
  const exact = rows.find(r => r.feature === feature);
  if (exact) return { status: 'measured', value: exact.value, low: exact.low, high: exact.high, evidence: [exact.id], reason: 'This feature value is measured in this context.' };
  const a = rows.filter(r => r.feature < feature).at(-1);
  const b = rows.find(r => r.feature > feature);
  if (!a || !b) return { status: 'no-data', value: null, low: null, high: null, evidence: [], reason: 'No extrapolation beyond the measured feature range.' };
  const t = (feature - a.feature) / (b.feature - a.feature);
  const mix = (x: number, y: number) => x * (1 - t) + y * t;
  // This envelope carries source error only. It does not bound curvature between measurements.
  return { status: 'model', value: mix(a.value, b.value), low: a.low === null || b.low === null ? null : mix(a.low, b.low), high: a.high === null || b.high === null ? null : mix(a.high, b.high), evidence: [a.id, b.id], reason: 'Linear interpolation. The error envelope excludes unknown curve error and is not a new 95% confidence interval.' };
}
