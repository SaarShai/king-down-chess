export const durationMs = 100;
export function beamState(elapsedMs) {
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0 || elapsedMs >= durationMs) return null;
  const attack = Math.min(1, elapsedMs / 12);
  const decay = Math.min(1, (durationMs - elapsedMs) / 30);
  const reach = Math.max(0, Math.min(1, (elapsedMs - 12) / 18));
  return {opacity: attack * decay, reach, impact: reach === 1 ? decay : 0};
}
// Boundary self-checks catch pre-release flashes, lingering rays and early impacts.
if (beamState(-1) !== null || beamState(100) !== null || beamState(0).opacity !== 0 ||
    beamState(12).reach !== 0 || beamState(30).reach !== 1 || beamState(20).impact !== 0)
  throw new Error('Invalid beam timing');

export async function loadEffect(baseURL = import.meta.url) {
  const response = await fetch(new URL('effect.json', baseURL));
  if (!response.ok) throw new Error('Beam metadata failed to load');
  const meta = await response.json();
  const sprite = new Image(), flare = new Image();
  sprite.src = new URL(meta.sprite, baseURL); flare.src = new URL(meta.flare.sprite, baseURL);
  await Promise.all([sprite.decode(),flare.decode()]);
  return {durationMs, draw(ctx, {elapsedMs, origin, target, scale = 1}) {
    const phase = beamState(elapsedMs);
    if (!phase || !origin || !target || ![...origin,...target,scale].every(Number.isFinite) || scale <= 0) return;
    const dx = target[0] - origin[0], dy = target[1] - origin[1], distance = Math.hypot(dx,dy);
    if (distance < 1) return;
    const glowHeight = 40 * scale;
    ctx.save(); ctx.translate(...origin); ctx.rotate(Math.atan2(dy,dx));
    ctx.globalAlpha *= phase.opacity;
    if (phase.reach > 0) ctx.drawImage(sprite, ...meta.shaftSourceRect, 0, -glowHeight/2, distance*phase.reach, glowHeight);
    const emitterScale = .065 * scale, [fx,fy] = meta.flare.anchor;
    ctx.drawImage(flare, -fx*emitterScale, -fy*emitterScale, flare.width*emitterScale, flare.height*emitterScale);
    if (phase.impact) {
      ctx.globalAlpha *= phase.impact;
      const impactScale = (.08 + Math.sin((elapsedMs-30)/70*Math.PI)*.025) * scale;
      ctx.drawImage(flare, distance-fx*impactScale, -fy*impactScale, flare.width*impactScale, flare.height*impactScale);
    }
    ctx.restore();
  }};
}
