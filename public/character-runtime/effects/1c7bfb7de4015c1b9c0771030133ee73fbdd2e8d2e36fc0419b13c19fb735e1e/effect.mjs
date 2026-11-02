export const durationMs = 760;
export const contactMs = 600;
export const emissionMs = 240;
const tip = [1608, 472];
const nativeWidth = 1774;
const point = p => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite);
const smooth = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
function random(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value + 0x6d2b79f5) >>> 0;
    let t = Math.imul(value ^ (value >>> 15), value | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// This pure sampler is also the trajectory check's source of positions.
export function sampleParticles({elapsedMs, origin, target, secondaryOrigin, seed = 1, scale = 1,
  emissionMs: emissionWindow = emissionMs, originAt}) {
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0 || elapsedMs >= durationMs ||
      !point(origin) || !point(target) || !Number.isFinite(scale) || scale <= 0 ||
      (secondaryOrigin !== undefined && !point(secondaryOrigin)) ||
      !Number.isFinite(emissionWindow) || emissionWindow <= 0 ||
      (originAt !== undefined && typeof originAt !== 'function')) return [];
  emissionWindow = Math.min(emissionMs, emissionWindow);
  const rng = random(seed);
  const particles = [];
  const origins = secondaryOrigin ? [origin, secondaryOrigin] : [origin];
  for (let palm = 0; palm < origins.length; palm++) {
    for (let i = 0; i < 12; i++) {
      const launchMs = Math.min(emissionMs, i * 20 + palm * 11 + (i ? rng() * 12 : 0)) * (emissionWindow / emissionMs);
      const fadeMs = 98 + rng() * 62;
      const bendSample = rng() - 0.5;
      const exponent = 0.8 + rng() * 0.48;
      const tumble = (rng() - 0.5) * 1.3;
      const width = (54 + rng() * 22) * scale;
      if (elapsedMs < launchMs || elapsedMs >= contactMs + fadeMs) continue;
      let start = origins[palm];
      if (originAt !== undefined) {
        // Recompute from launch time so an airborne shard cannot follow a later palm pose.
        try { start = originAt(launchMs, palm); } catch { continue; }
        if (!point(start)) continue;
      }
      const dx = target[0] - start[0], dy = target[1] - start[1];
      const distance = Math.hypot(dx, dy);
      const nx = distance ? -dy / distance : 0, ny = distance ? dx / distance : 0;
      const bend = bendSample * Math.min(distance * 0.42, 120 * scale);
      const u = Math.min(1, (elapsedMs - launchMs) / (contactMs - launchMs));
      const q = u ** exponent;
      const bow = Math.sin(Math.PI * q) * bend;
      const x = start[0] + dx * q + nx * bow;
      const y = start[1] + dy * q + ny * bow;
      const tangentX = dx + nx * Math.PI * Math.cos(Math.PI * q) * bend;
      const tangentY = dy + ny * Math.PI * Math.cos(Math.PI * q) * bend;
      const angle = Math.atan2(tangentY, tangentX) + Math.sin(Math.PI * u) * tumble;
      const alpha = smooth((elapsedMs - launchMs) / 65) *
        (1 - smooth((elapsedMs - contactMs) / fadeMs)) * 0.94;
      particles.push({id: palm * 12 + i, palm, launchMs, contactMs, x, y, angle,
        alpha, width: width * (0.64 + 0.36 * smooth(u * 4))});
    }
  }
  return particles;
}

export async function loadEffect(baseURL = import.meta.url) {
  const sprite = new Image();
  sprite.src = new URL('./assets/thorn-shard-native-v1.png', baseURL).href;
  await sprite.decode();
  return {
    durationMs,
    draw(ctx, options) {
      const particles = sampleParticles(options);
      if (!particles.length) return;
      ctx.save();
      try {
        for (const p of particles) {
          if (p.alpha <= 0) continue;
          ctx.save();
          try {
            ctx.translate(p.x, p.y);
            ctx.rotate(p.angle);
            ctx.scale(p.width / nativeWidth, p.width / nativeWidth);
            ctx.globalAlpha *= p.alpha;
            ctx.drawImage(sprite, -tip[0], -tip[1]);
          } finally { ctx.restore(); }
        }
      } finally { ctx.restore(); }
    }
  };
}
