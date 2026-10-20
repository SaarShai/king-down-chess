import { withPrivateCachePolicy } from './cache-policy';

export type WebAccountStatus =
 | { account_access: 'open'; valid_for_ms: number }
 | { account_access: 'closed'; valid_for_ms: 0 };

export type CheckedWebAccountAccess = { enabled: boolean; expiresAt: number };

export function parseWebAccountStatus(value: unknown): WebAccountStatus {
 if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new TypeError('Invalid account status');
 const status = value as Record<string, unknown>, lease = status.valid_for_ms;
 if (Object.keys(status).length !== 2 || typeof lease !== 'number' || !Number.isInteger(lease)
  || !(status.account_access === 'closed' && lease === 0 || status.account_access === 'open' && lease >= 1 && lease <= 5000)) throw new TypeError('Invalid account status');
 return value as WebAccountStatus;
}

export async function readWebAccountAccess(): Promise<CheckedWebAccountAccess> {
 try {
  let start = 0;
  const response = await withPrivateCachePolicy(() => {
   start = performance.now();
   return fetch('/api/status', { cache: 'no-store', credentials: 'omit', referrer: '', referrerPolicy: 'no-referrer', redirect: 'error' });
  });
  if (!response.ok || !/^application\/json(?:\s*;|$)/i.test(response.headers.get('Content-Type') ?? '')) throw new TypeError('Account status is unavailable');
  const status = parseWebAccountStatus(await response.json()), expiresAt = start + status.valid_for_ms;
  if (status.account_access === 'open' && performance.now() < expiresAt) return { enabled: true, expiresAt };
 } catch { /* Failed proof or status closes access. */ }
 return { enabled: false, expiresAt: 0 };
}
