/** Automatic gates for a candidate animation bank. Each gate fails with a short, plain message. */

// Fail when over 30% of the exterior alpha edge is near the matte and at least 72 summed RGB levels closer to it than to the nearest opaque colour.
export const HALO_LIMIT = 0.3;
// 0.035 clears clean scores near 0.02 and catches the faint feet at 0.046.
export const GHOST_MARGIN = 0.035;
export const ghostLimit = frames => Math.max(...frames.filter(frame => frame.method === 'authored').map(frame => frame.ghost)) + GHOST_MARGIN;
export const BASELINE_TOLERANCE_PX = 2;
export const HEAD_JUMP_LIMIT_PX = 20;
export const HEAD_SCALE_SPREAD_LIMIT = 0.10;

const check = (name, ok, message, metrics = {}) => ({ name, ok, message: ok ? 'ok' : message, metrics });
const round = n => Math.round(n * 1000) / 1000;

export function runGates({ bank, frames, geometry, endpoints = {}, plan, movement = null }) {
  const checks = [];
  const failing = [];
  const fail = (name, ok, message, metrics) => { const result = check(name, ok, message, metrics); checks.push(result); if (!ok) failing.push(`${name}: ${result.message}`); };

  const formatBad = frames.filter(frame => frame.metadata.channels !== 4).map(frame => frame.file);
  fail('rgba', formatBad.length === 0, `${formatBad.length} frame(s) have no alpha channel: ${formatBad.slice(0, 3).join(', ')}`, { frames: frames.length });

  const exteriorBad = frames.filter(frame => frame.measure.borderOpaque > 0 || frame.measure.alphaMin !== 0 || frame.measure.alphaMax < 250);
  fail('exterior', exteriorBad.length === 0,
    `${exteriorBad.length} frame(s) lack a transparent exterior or a full alpha range: ${exteriorBad.slice(0, 3).map(frame => `${frame.file} border=${frame.measure.borderOpaque} alpha=${frame.measure.alphaMin}..${frame.measure.alphaMax}`).join('; ')}`,
    { frames: frames.length, minAlpha: Math.min(...frames.map(frame => frame.measure.alphaMin)), maxAlpha: Math.max(...frames.map(frame => frame.measure.alphaMax)) });

  const worst = frames.reduce((top, frame) => frame.fringe.ratio > top.fringe.ratio ? frame : top, frames[0]);
  fail('matte-halo', worst.fringe.ratio <= HALO_LIMIT,
    `Frame ${worst.file} has a matte-coloured edge: ${round(worst.fringe.ratio * 100)}% of its exterior edge is closer to the matte than its opaque interior (limit ${HALO_LIMIT * 100}%)`,
    { worst: worst.file, ratio: round(worst.fringe.ratio), edgePixels: worst.fringe.edgePixels, mattePixels: worst.fringe.mattePixels, limit: HALO_LIMIT });

  const limit = ghostLimit(frames);
  const inbetweens = frames.filter(frame => frame.method !== 'authored');
  const ghostWorst = inbetweens.reduce((top, frame) => !top || frame.ghost > top.ghost ? frame : top, null);
  fail('ghost', !ghostWorst || ghostWorst.ghost <= limit,
    `Frame ${ghostWorst?.file} has ghost score ${round(ghostWorst?.ghost)} (limit ${round(limit)})`,
    { worst: ghostWorst?.file ?? null, score: ghostWorst ? round(ghostWorst.ghost) : null, authored: round(limit - GHOST_MARGIN), limit: round(limit) });

  const pivot = bank.pivot;
  const targetPivot = movement?.pivot ?? geometry.pivot, baseline = movement?.baseline ?? geometry.pivot[1];
  const pivotOk = Array.isArray(pivot) && pivot.length === 2 && pivot.every((value, axis) => Math.abs(value - targetPivot[axis]) < 1e-9);
  const baselineBad = [frames[0], frames.at(-1)].filter(frame => Math.abs(frame.measure.bottom - baseline) > BASELINE_TOLERANCE_PX);
  const keyBaselines = frames.filter(frame => frame.method === 'authored').map(frame => Math.abs(frame.measure.bottom - baseline));
  const drift = frames.reduce((max, frame) => Math.max(max, Math.abs(frame.measure.bottom - baseline)), 0);
  const restBad = movement ? frames.filter(frame => frame.method === 'authored' && frame.sources[0] === movement.rest.sha256 && !frame.restMatch) : [];
  fail('geometry', pivotOk && baselineBad.length === 0 && keyBaselines.every(delta => delta <= BASELINE_TOLERANCE_PX) && !restBad.length,
    !pivotOk ? `Bank pivot ${JSON.stringify(pivot)} does not equal the locked pivot ${JSON.stringify(targetPivot)}`
      : restBad.length ? `Movement rest pixels differ: ${restBad.map(frame => frame.file).join(', ')}`
      : `Baseline is more than ${BASELINE_TOLERANCE_PX} px from the locked baseline (end frames: ${baselineBad.map(frame => `${frame.file} ${round(frame.measure.bottom - baseline)}`).join(', ')})`,
    { pivot, lockedPivot: targetPivot, endBaselinePx: [round(frames[0].measure.bottom - baseline), round(frames.at(-1).measure.bottom - baseline)], maxDriftPx: round(drift) });

  if (movement) {
    const walk = frames.slice(1, -1).filter(frame => frame.sources[0] !== movement.rest.sha256);
    const positions = walk.map(frame => frame.transform?.measuredHeadX);
    const scales = walk.map(frame => frame.transform?.measuredHeadScale);
    const restPositions = [frames[0], frames.at(-1)].map(frame => frame.transform?.measuredHeadX);
    const valid = [...positions, ...scales, ...restPositions].every(Number.isFinite) && scales.every(scale => scale > 0);
    const maxJump = valid ? Math.max(0, ...positions.slice(1).map((x, i) => Math.abs(x - positions[i]))) : Infinity;
    const startJump = valid && positions.length ? Math.abs(restPositions[0] - positions[0]) : valid ? 0 : Infinity;
    const endJump = valid && positions.length ? Math.abs(positions.at(-1) - restPositions[1]) : valid ? 0 : Infinity;
    const loopJump = valid && positions.length ? Math.abs(positions.at(-1) - positions[0]) : valid ? 0 : Infinity;
    const scaleSpread = !valid ? Infinity : scales.length ? Math.max(...scales) / Math.min(...scales) - 1 : 0;
    fail('steadiness', valid && Math.max(maxJump, startJump, endJump, loopJump) <= HEAD_JUMP_LIMIT_PX && scaleSpread <= HEAD_SCALE_SPREAD_LIMIT,
      `Head jumps within ${round(maxJump)}, start ${round(startJump)}, end ${round(endJump)}, loop ${round(loopJump)} px (limit ${HEAD_JUMP_LIMIT_PX}); scale spread ${round(scaleSpread)} (limit ${HEAD_SCALE_SPREAD_LIMIT})`,
      { maxHeadJumpPx: round(maxJump), startHeadJumpPx: round(startJump), endHeadJumpPx: round(endJump), loopHeadJumpPx: round(loopJump), headScaleSpread: round(scaleSpread), headJumpLimitPx: HEAD_JUMP_LIMIT_PX, headScaleSpreadLimit: HEAD_SCALE_SPREAD_LIMIT });
  }

  const first = movement ? (frames[0].restMatch && movement.endpoint) : endpoints[frames[0].sha256], last = movement ? (frames.at(-1).restMatch && movement.endpoint) : endpoints[frames.at(-1).sha256];
  const allowed = new Set([bank.from, bank.to, bank.facing].filter(Boolean));
  const facingOk = entry => entry && (bank.kind !== 'turn' || entry.facing == null || allowed.has(entry.facing));
  fail('endpoints', Boolean(first) && Boolean(last) && facingOk(first) && facingOk(last),
    !first ? `The first frame ${frames[0].sha256.slice(0, 12)} is not a shipped endpoint for ${bank.character}/${bank.army}. Start the bank on the rest pose or an approved turn edge.`
      : !last ? `The last frame ${frames.at(-1).sha256.slice(0, 12)} is not a shipped endpoint for ${bank.character}/${bank.army}. End the bank on the rest pose or an approved turn edge.`
        : `Endpoint facings are not part of this turn (${bank.from ?? ''} to ${bank.to ?? bank.facing}): first is ${first.bank} (${first.facing ?? 'unknown'}), last is ${last.bank} (${last.facing ?? 'unknown'})`,
    { first: first ?? null, last: last ?? null });

  const times = frames.map(frame => frame.timeMs);
  const steps = times.slice(1).map((time, index) => Math.round((time - times[index]) * 1000) / 1000);
  const timingBad = times.length !== plan.frameCount || times[0] !== 0 || Math.abs(times.at(-1) - plan.durationMs) > 1e-9
    || steps.some((step, index) => index && Math.abs(step - steps[0]) > 1e-9) || Math.abs(steps[0] - plan.frameMs) > 1e-9;
  fail('timing', !timingBad, `Frame times do not match the plan: ${times.length} frames at ${times.slice(0, 4).join(', ')} ms (plan: ${plan.frameCount} frames at ${plan.frameMs} ms, ${plan.durationMs} ms)`,
    { frameCount: times.length, frameMs: steps[0], durationMs: times.at(-1), plan: { frameCount: plan.frameCount, frameMs: plan.frameMs, durationMs: plan.durationMs } });

  const methods = frames.reduce((counts, frame) => ({ ...counts, [frame.method]: (counts[frame.method] ?? 0) + 1 }), {});
  for (const frame of frames) if (!['authored', 'rife', 'hold', 'film'].includes(frame.method) || !/^[a-f0-9]{64}$/.test(frame.sha256)) failing.push(`provenance: frame ${frame.file} has method ${frame.method} and hash ${frame.sha256}`);
  checks.push(check('provenance', failing.every(line => !line.startsWith('provenance')), 'Every frame needs a known method and a content hash', { methods }));

  return { status: failing.length ? 'fail' : 'pass', checks, failing };
}
