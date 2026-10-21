import { it } from 'vitest';
import { checkCacheRegistration } from './cache-registration-check.mjs';

it.each([250, 12_000])('continues through a real native registration fetch held for %i ms', async holdMs => {
  await checkCacheRegistration({ holdMs });
}, 25_000);
