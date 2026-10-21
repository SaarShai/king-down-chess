export type Provider = 'google' | 'github' | 'facebook';

/** Public auth settings are the source of enabled providers, not a second build-time list. */
export async function availableProviders(url: string, publishableKey: string): Promise<Provider[]> {
  try {
    const response = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: publishableKey },
      credentials: 'omit', cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error();
    const settings = await response.json(), external: unknown = settings?.external;
    if (!external || typeof external !== 'object' || Array.isArray(external)) throw new Error();
    return (['google', 'github', 'facebook'] as const).filter(provider => (external as Record<string, unknown>)[provider] === true);
  } catch { throw new Error('Sign-in options could not load. Check your connection and try again.'); }
}
