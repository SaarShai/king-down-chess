import { beforeAll, describe, expect, it } from 'vitest';
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT, type JWTPayload } from 'jose';
import { createTokenVerifier, pluginOrigin, type PluginAuth } from './auth';
const actor = '11111111-1111-4111-8111-111111111111', publicOrigin = 'https://plugin.kingdown.example', supabaseUrl = 'https://project.supabase.co';
let auth: PluginAuth, privateKey: CryptoKey, keys: ReturnType<typeof createLocalJWKSet>;
beforeAll(async () => {
  const pair = await generateKeyPair('ES256'); privateKey = pair.privateKey;
  keys = createLocalJWKSet({ keys: [{ ...await exportJWK(pair.publicKey), kid: 'test', alg: 'ES256' }] });
  auth = createTokenVerifier({ supabaseUrl, publicOrigin }, keys);
});
async function signed(overrides: JWTPayload = {}) {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({ iss: auth.issuer, aud: auth.resource, sub: actor, exp: now + 300, iat: now, role: 'authenticated', client_id: 'oauth-client', scope: 'openid email', ...overrides }).setProtectedHeader({ alg: 'ES256', kid: 'test' }).sign(privateKey);
}
describe('resource-bound Supabase OAuth', () => {
  it('verifies the issuer signature and binds canonical actors to the MCP resource', async () => {
    expect(await auth.verify(await signed({ sub: actor.toUpperCase() }))).toBe(actor);
    expect(auth.metadata.authorization_servers).toEqual(['https://project.supabase.co/auth/v1']);
    expect(auth.metadata.resource).toBe(`${publicOrigin}/mcp`);
    expect(auth.metadata.scopes_supported).toEqual(['openid']);
  });
  it.each([
    ['website audience', { aud: 'authenticated' }],
    ['another resource', { aud: 'https://other.example/mcp' }],
    ['mixed audience', { aud: ['authenticated', `${publicOrigin}/mcp`] }],
    ['expired', { exp: 1 }],
    ['missing expiry', { exp: undefined }],
    ['wrong issuer', { iss: 'https://evil.example/auth/v1' }],
    ['bad subject', { sub: 'not-a-user' }],
    ['missing subject', { sub: undefined }],
    ['service role', { role: 'service' + '_role' }],
    ['missing OAuth client', { client_id: undefined }],
    ['empty OAuth client', { client_id: '' }],
    ['wrong scope', { scope: 'email' }],
    ['malformed scope', { scope: ['openid'] }],
    ['not yet valid', { nbf: Math.floor(Date.now() / 1000) + 3600 }],
  ])('rejects %s access tokens', async (_name, claims) => {
    await expect(auth.verify(await signed(claims))).rejects.toThrow('OAuth access token');
  });
  it('accepts documented tokens without a scope claim but requires openid when provided', async () => {
    expect(await auth.verify(await signed({ scope: undefined }))).toBe(actor);
  });
  it('enforces an explicit OAuth client allowlist in production configuration', async () => {
    const scoped = createTokenVerifier({ supabaseUrl, publicOrigin, clientIds: ['approved-client'] }, keys);
    await expect(scoped.verify(await signed())).rejects.toThrow('OAuth access token');
    expect(await scoped.verify(await signed({ client_id: 'approved-client' }))).toBe(actor);
  });
  it('rejects altered signatures, unknown keys and oversized tokens', async () => {
    const token = await signed();
    const parts = token.split('.'); parts[2] = (parts[2][0] === 'a' ? 'b' : 'a') + parts[2].slice(1);
    await expect(auth.verify(parts.join('.'))).rejects.toThrow('OAuth access token');
    const unrelated = await generateKeyPair('ES256');
    const forged = await new SignJWT({}).setProtectedHeader({ alg: 'ES256', kid: 'other' }).sign(unrelated.privateKey);
    await expect(auth.verify(forged)).rejects.toThrow('OAuth access token');
    await expect(auth.verify('x'.repeat(16385))).rejects.toThrow('OAuth access token');
  });
  it('rejects credentials, paths and insecure production configuration', () => {
    for (const origin of ['http://public.example', 'https://user:pass@public.example', 'https://public.example/mcp', 'https://public.example?secret=x']) expect(() => pluginOrigin(origin)).toThrow();
    expect(pluginOrigin('http://127.0.0.1:3999')).toBe('http://127.0.0.1:3999');
    expect(() => createTokenVerifier({ supabaseUrl: 'http://project.supabase.co', publicOrigin })).toThrow();
  });
});
