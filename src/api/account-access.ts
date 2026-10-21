import type { Pool } from 'pg';

export const WEB_ACCOUNT_ACCESS_TTL_MS = 5000;

export function createWebAccountAccess(pool: Pool): (fresh?: boolean) => Promise<{ enabled: boolean; expiresAt: number }> {
 let cached = { enabled: false, expiresAt: 0 };
 let refresh: Promise<typeof cached> | undefined;
 return async (fresh = false) => {
  const start = performance.now();
  if (!fresh && start < cached.expiresAt) return { ...cached };
  if (!refresh) {
   const expiresAt = start + WEB_ACCOUNT_ACCESS_TTL_MS;
   refresh = (async () => {
    try {
     const { rows } = await pool.query('select singleton, enabled from public.web_account_access where singleton = true');
     const valid = rows.length === 1 && rows[0]?.singleton === true && typeof rows[0].enabled === 'boolean';
     cached = valid && performance.now() < expiresAt ? { enabled: rows[0].enabled, expiresAt } : { enabled: false, expiresAt: 0 };
    } catch {
     cached = { enabled: false, expiresAt: 0 };
    }
    return cached;
   })().finally(() => { refresh = undefined; });
  }
  const result = await refresh;
  return performance.now() < result.expiresAt ? { ...result } : { enabled: false, expiresAt: 0 };
 };
}
