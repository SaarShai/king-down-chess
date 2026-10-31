const FLIGHT_MS = 220;
const FLASH_MS = 100;
const finitePoint = p => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite);

export async function loadEffect(baseURL = import.meta.url) {
  const [arrow, wisp, flash] = await Promise.all(
    ['golden-arrow', 'golden-wisp', 'contact-flash'].map(async name => {
      const image = new Image();
      image.src = new URL(`assets/${name}.png`, baseURL).href;
      await image.decode();
      return image;
    }),
  );
  return {
    durationMs: FLIGHT_MS + FLASH_MS,
    draw(ctx, { elapsedMs, origin, target, seed = 0, scale = 1 } = {}) {
      if (!Number.isFinite(elapsedMs) || elapsedMs < 0 || elapsedMs >= FLIGHT_MS + FLASH_MS ||
          !finitePoint(origin) || !finitePoint(target) || !Number.isFinite(scale) || scale <= 0) return;
      const dx = target[0] - origin[0], dy = target[1] - origin[1];
      const angle = Math.atan2(dy, dx);
      ctx.save();
      try {
        if (elapsedMs < FLIGHT_MS && Math.hypot(dx, dy) > 0) {
          const u = elapsedMs / FLIGHT_MS;
          for (let i = 1; i <= 4; i++) {
            const lag = i * 11;
            if (elapsedMs < lag) continue;
            const v = (elapsedMs - lag) / FLIGHT_MS;
            ctx.save();
            ctx.translate(origin[0] + dx * v, origin[1] + dy * v);
            ctx.rotate(angle - Math.PI / 2 + Math.sin((Number.isFinite(seed) ? seed : 0) + i) * 0.06);
            ctx.scale(0.025 * scale, 0.025 * scale);
            ctx.globalAlpha *= 0.09 * (1 - i / 5) * Math.min(1, (FLIGHT_MS - elapsedMs) / 24);
            ctx.drawImage(wisp, -630, -1105);
            ctx.restore();
          }
          ctx.translate(origin[0] + dx * u, origin[1] + dy * u);
          ctx.rotate(angle);
          ctx.scale(0.055 * scale, 0.055 * scale);
          ctx.drawImage(arrow, -1540, -440);
        } else if (elapsedMs >= FLIGHT_MS) {
          const u = (elapsedMs - FLIGHT_MS) / FLASH_MS;
          ctx.translate(target[0], target[1]);
          ctx.rotate(angle);
          ctx.scale((0.052 + 0.016 * u) * scale, (0.052 + 0.016 * u) * scale);
          ctx.globalAlpha *= (1 - u) ** 2;
          ctx.drawImage(flash, -885, -440);
        }
      } finally {
        ctx.restore();
      }
    },
  };
}
