// Copy from a0956f012:src/online/account-access.ts. Keep the shipped parser unchanged.
export type WebAccountStatus =
 | { account_access: 'open'; valid_for_ms: number }
 | { account_access: 'closed'; valid_for_ms: 0 };

export function parseWebAccountStatus(value: unknown): WebAccountStatus {
 if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new TypeError('Invalid account status');
 const status = value as Record<string, unknown>, lease = status.valid_for_ms;
 if (Object.keys(status).length !== 2 || typeof lease !== 'number' || !Number.isInteger(lease)
  || !(status.account_access === 'closed' && lease === 0 || status.account_access === 'open' && lease >= 1 && lease <= 5000)) throw new TypeError('Invalid account status');
 return value as WebAccountStatus;
}
