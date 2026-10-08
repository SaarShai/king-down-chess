/** Resource-bound Supabase OAuth access tokens; regular website sessions are not MCP tokens. */
import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose';

export const ACTOR_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isLoopback(host: string): boolean { return ['localhost', '127.0.0.1', '[::1]', '::1', '::ffff:127.0.0.1'].includes(host); }
export function pluginOrigin(value: string): string {
  const url = new URL(value);
  if (url.username || url.password || url.search || url.hash || url.pathname !== '/' || (url.protocol !== 'https:' && !(url.protocol === 'http:' && isLoopback(url.hostname)))) throw new Error('Expected an HTTPS plugin origin (HTTP only on loopback)');
  return url.origin;
}
export class AuthenticationError extends Error { constructor() { super('A valid King Down OAuth access token is required'); } }
export interface PluginAuth {
  issuer: string;
  resource: string;
  metadata: { resource: string; authorization_servers: string[]; scopes_supported: string[]; bearer_methods_supported: string[]; resource_name: string };
  verify(token: string): Promise<string>;
}
export function createTokenVerifier({ supabaseUrl, publicOrigin, clientIds, publishableKey }: { supabaseUrl: string; publicOrigin: string; clientIds?: string[]; publishableKey: string }, keys?: JWTVerifyGetKey, request: typeof fetch = fetch): PluginAuth {
  if (!publishableKey) throw new Error('Supabase publishable key is required');
  const base = new URL(supabaseUrl);
  if (base.protocol !== 'https:' || base.username || base.password || base.search || base.hash || base.pathname !== '/') throw new Error('Expected a fixed HTTPS Supabase origin');
  const issuer = `${base.origin}/auth/v1`, resource = `${pluginOrigin(publicOrigin)}/mcp`;
  const jwks = keys ?? createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`), { timeoutDuration: 5000 });
  return {
    issuer, resource,
    metadata: { resource, authorization_servers: [issuer], scopes_supported: ['openid'], bearer_methods_supported: ['header'], resource_name: 'King Down Chess' },
    async verify(token) {
      try {
        if (typeof token !== 'string' || token.length > 16384) throw new AuthenticationError();
        const { payload } = await jwtVerify(token, jwks, { issuer, audience: resource, algorithms: ['ES256', 'RS256'], requiredClaims: ['iss', 'aud', 'sub', 'exp', 'role', 'client_id'] });
        // Supabase defaults to aud=authenticated. Its OAuth access-token hook must set this
        // exact resource audience; never accept a broad or mixed audience as a fallback.
        if (payload.aud !== resource || !payload.sub || !ACTOR_UUID.test(payload.sub) || payload.role !== 'authenticated' || typeof payload.client_id !== 'string' || !payload.client_id.length || payload.client_id.length > 200) throw new AuthenticationError();
        if (clientIds && !clientIds.includes(payload.client_id)) throw new AuthenticationError();
        // Supabase supports standard scopes only; older token examples omit the scope claim.
        if (payload.scope !== undefined && (typeof payload.scope !== 'string' || !payload.scope.split(/\s+/).includes('openid'))) throw new AuthenticationError();
        // A valid signature does not prove that the provider session still exists.
        const response = await request(`${issuer}/user`, {
          headers: { apikey: publishableKey, Authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(5000), redirect: 'error',
        });
        // VERIFY-revocation: temporary evidence for the dedicated second test account only.
        if (payload.sub === 'e0d952a0-147a-42c1-8382-153692908d6d') console.info('VERIFY-revocation', { jwtValid: true, remainingSeconds: payload.exp! - Math.floor(Date.now()/1000), providerStatus: response.status });
        if (!response.ok) throw new AuthenticationError();
        const user = await response.json();
        if (typeof user?.id !== 'string' || user.id.toLowerCase() !== payload.sub.toLowerCase()) throw new AuthenticationError();
        return payload.sub.toLowerCase();
      } catch { throw new AuthenticationError(); }
    },
  };
}
