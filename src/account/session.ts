/** The website session uses the same storage key in each entry. */
export const AUTH_KEY = 'kingdown.auth';

export type AccountSession = { userId: string; accessToken: string };

// A token refresh keeps the session ID. Opaque test tokens compare by their bytes.
export function sessionKey(value: AccountSession): string {
  try {
    const key = JSON.parse(atob(value.accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).session_id;
    if (typeof key === 'string' && key) return key;
  } catch { /* Opaque tokens compare by their exact bytes. */ }
  return value.accessToken;
}
