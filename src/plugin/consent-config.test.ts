import { describe, expect, it } from 'vitest';
import { consentConfig, renderConsent } from './consent-config';
const env = { SUPABASE_URL: 'https://project.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_example', KINGDOWN_PLUGIN_OAUTH_CLIENT_IDS: '11111111-1111-4111-8111-111111111111' };
const jwt = (role: string) => `header.${Buffer.from(JSON.stringify({ role })).toString('base64url')}.signature`;
describe('public consent configuration', () => {
  it('exports only the public project key and approved client IDs', () => {
    expect(consentConfig({ ...env, DATABASE_URL: 'private' })).toEqual({ supabaseUrl: env.SUPABASE_URL, publishableKey: env.SUPABASE_PUBLISHABLE_KEY, clientIds: [env.KINGDOWN_PLUGIN_OAUTH_CLIENT_IDS] });
    expect(consentConfig({ ...env, SUPABASE_PUBLISHABLE_KEY: jwt('anon') }).publishableKey).toBe(jwt('anon'));
  });
  it('rejects secrets, service-role keys, missing clients and insecure projects', () => {
    // Match the account scanner's split-string convention for synthetic forbidden credentials.
    for (const key of ['sb_' + 'secret_private', jwt('service' + '_role'), 'unknown']) expect(() => consentConfig({ ...env, SUPABASE_PUBLISHABLE_KEY: key })).toThrow('forbidden');
    expect(() => consentConfig({ ...env, KINGDOWN_PLUGIN_OAUTH_CLIENT_IDS: '' })).toThrow('UUIDs');
    expect(() => consentConfig({ ...env, SUPABASE_URL: 'http://project.supabase.co' })).toThrow('HTTPS');
  });
  it('escapes embedded JSON and requires its explicit injection marker', () => {
    const config = { ...consentConfig(env), supabaseUrl: '</script><script>bad</script>' };
    const html = renderConsent('<script type="application/json">__KINGDOWN_CONSENT_CONFIG__</script>', config);
    expect(html).not.toContain('<script>bad'); expect(html).toContain('\\u003c');
    expect(() => renderConsent('<html>', config)).toThrow('marker');
  });
});
