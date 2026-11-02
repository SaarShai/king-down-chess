/** Check painted walk keys against their source and the one rest transform. */
export function runMoveGates({ bank, source, catalogHashes, restHashes, transform, height, ranges }) {
  const failures = [], checks = [];
  const fail = (name, ok) => { checks.push({ name, ok }); if (!ok) failures.push(name); };
  const frames = bank.frames ?? [];
  fail('painted-keys', frames.length === source.length && new Set(frames.map(f => f.sha256)).size >= 4 && frames.every((f, i) => f.sha256 === source[i]?.sha256 && catalogHashes.has(f.sha256) && !restHashes.has(f.sha256) && (!f.method || f.method === 'authored')));
  let time = 0;
  const timesMatch = frames.every((f, i) => {
    const ok = f.timeMs === time && f.durationMs === source[i]?.durationMs && Number.isFinite(f.durationMs) && f.durationMs > 0;
    time += f.durationMs; return ok;
  });
  fail('timing', timesMatch && time === bank.durationMs);
  const k = height / bank.bodyHeightPx, expected = transform.scaleGamePxPerSourcePx;
  const placement = frames.map((frame, i) => {
    const origin = source[i], pad = origin?.pivot?.map((v, axis) => v - transform.canonicalPivot[axis]);
    if (!origin || !pad || !Array.isArray(frame.pivot) || frame.pivot.some((v, axis) => v !== origin.pivot[axis]) || !Number.isFinite(origin.scale) || !Array.isArray(origin.translation) || !Array.isArray(bank.pivot)) return Infinity;
    const scaleError = Math.abs(k - expected) * origin.scale * (origin.span ?? 1024);
    const offsets = origin.translation.map((value, axis) => Math.abs((value - bank.pivot[axis]) * k - ((value - pad[axis]) * expected + transform.offsetGamePx[axis])));
    return Math.max(scaleError, ...offsets);
  });
  const maxPlacementErrorPx = Math.max(...placement);
  fail('placement', placement.length === source.length && Number.isFinite(maxPlacementErrorPx) && maxPlacementErrorPx <= 0.5);
  fail('range', Number.isFinite(ranges.topRangeAt160) && ranges.topRangeAt160 >= 0 && ranges.topRangeAt160 <= 9.9 && Number.isFinite(ranges.groundRangeAt160) && ranges.groundRangeAt160 >= 0 && ranges.groundRangeAt160 <= 20.6);
  return { status: failures.length ? 'fail' : 'pass', checks, failures, maxPlacementErrorPx };
}
