/** Only public Supabase configuration may cross into the authorization page. */
import { ACTOR_UUID } from './auth';
export interface ConsentConfig { supabaseUrl: string; publishableKey: string; clientIds: string[] }
export function consentConfig(env: Record<string, string | undefined>): ConsentConfig {
  const supabaseUrl = new URL(env.SUPABASE_URL ?? '');
  if (supabaseUrl.protocol !== 'https:' || supabaseUrl.username || supabaseUrl.password || supabaseUrl.pathname !== '/' || supabaseUrl.search || supabaseUrl.hash) throw new Error('A fixed HTTPS Supabase origin is required');
  const publishableKey = env.SUPABASE_PUBLISHABLE_KEY ?? '';
  let publicKey = /^sb_publishable_[A-Za-z0-9_-]+$/.test(publishableKey);
  if (!publicKey && /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(publishableKey)) {
    try { publicKey = JSON.parse(Buffer.from(publishableKey.split('.')[1], 'base64url').toString()).role === 'anon'; } catch { /* Not a public legacy key. */ }
  }
  if (!publicKey) throw new Error('SUPABASE_PUBLISHABLE_KEY must be a publishable or legacy anon key; secret/service-role keys are forbidden');
  const clientIds = [...new Set((env.KINGDOWN_PLUGIN_OAUTH_CLIENT_IDS ?? '').split(',').map(id => id.trim().toLowerCase()).filter(Boolean))];
  if (!clientIds.length || clientIds.some(id => !ACTOR_UUID.test(id))) throw new Error('KINGDOWN_PLUGIN_OAUTH_CLIENT_IDS must list approved Supabase OAuth client UUIDs');
  return { supabaseUrl: supabaseUrl.origin, publishableKey, clientIds };
}
export function renderConsent(html: string, config: ConsentConfig): string {
  if (!html.includes('__KINGDOWN_CONSENT_CONFIG__')) throw new Error('Consent page is missing its configuration marker');
  return html.replace('__KINGDOWN_CONSENT_CONFIG__', JSON.stringify(config).replace(/</g, '\\u003c'));
}
