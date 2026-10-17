import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { consentConfig, renderConsent } from './consent-config';
const env = { SUPABASE_URL: 'https://project.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_example', KINGDOWN_PLUGIN_OAUTH_CLIENT_IDS: '11111111-1111-4111-8111-111111111111' };
const jwt = (role: string) => `header.${Buffer.from(JSON.stringify({ role })).toString('base64url')}.signature`;
describe('public consent configuration', () => {
  it('shows the approved permissions without raw scopes or token text (B4)', () => {
    const html = renderConsent(readFileSync(new URL('./consent.html', import.meta.url), 'utf8'), consentConfig(env));
    expect(html).toContain('<h2>Let ChatGPT use your King Down account?</h2>');
    expect(html).toContain('<p>ChatGPT can:</p>');
    expect([...html.matchAll(/<li>([^<]+)<\/li>/g)].map(match => match[1])).toEqual([
      'play and continue games against the computer or people',
      'make and join friend games, and find a random player',
      'send game messages, offer draws, resign and ask for rematches',
      'show your rating, badges and past games',
      'change your player name, online status, sounds and other settings',
      'report a player',
    ]);
    expect(html).not.toMatch(/cannot read the chat|see your email address/);
    expect(html).not.toMatch(/id="scopes"|Requested information|access tokens|data permissions/);
    for (const id of ['client-name', 'account', 'redirect', 'approve', 'deny', 'password-form', 'password-email', 'password-value']) expect(html).toContain(`id="${id}"`);
  });
  it('keeps the privacy policy link before the decision buttons and opens it in a new tab', () => {
    const html = renderConsent(readFileSync(new URL('./consent.html', import.meta.url), 'utf8'), consentConfig(env));
    const link = '<a href="https://kingdown.dev/privacy.html" target="_blank" rel="noopener">Privacy policy</a>';
    expect(html).toContain(link);
    expect(html.indexOf(link)).toBeLessThan(html.indexOf('id="approve"'));
  });
  it('offers only the approved Google and GitHub providers', () => {
    const html=readFileSync(new URL('./consent.html',import.meta.url),'utf8');
    expect([...html.matchAll(/data-provider="([^"]+)"/g)].map(m=>m[1])).toEqual(['google','github']);
  });
  it('keeps the review password form closed under the two providers (approval D8 a)', () => {
    const html=readFileSync(new URL('./consent.html',import.meta.url),'utf8');
    expect(html.indexOf('<details id="password-signin">')).toBeGreaterThan(html.indexOf('data-provider="github"'));
    expect(html).toContain('<input id="password-value" type="password" autocomplete="current-password" required>');
    expect(html).not.toContain('<details id="password-signin" open');
  });
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
