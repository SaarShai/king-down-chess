import { expect, it } from 'vitest';
import { publicAccountConfig, stagingTestEmail } from './public-config';
const config = { VITE_SUPABASE_URL: 'https://puhspsyjyzaghmgtkzqd.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test', VITE_KINGDOWN_STAGE: 'staging' };
it('exposes the fixed test account only for the isolated staging build', () => {
  expect(stagingTestEmail(config)).toBe('privacy-check@kingdown.example');
  for (const VITE_KINGDOWN_STAGE of [undefined, '', 'production', 'preview']) expect(stagingTestEmail({ ...config, VITE_KINGDOWN_STAGE })).toBeNull();
  for (const VITE_SUPABASE_URL of [undefined, '', 'https://other.supabase.co', 'https://utqzovjmclfyojedmwok.supabase.co']) expect(stagingTestEmail({ ...config, VITE_SUPABASE_URL })).toBeNull();
});
it('uses only explicit public settings for staging', () => {
  expect(publicAccountConfig(config)).toEqual({ url: config.VITE_SUPABASE_URL, publishableKey: config.VITE_SUPABASE_PUBLISHABLE_KEY });
});
it.each([undefined, '', 'http://project.supabase.co', 'https://project.supabase.co/path', 'https://user@project.supabase.co', 'https://project.supabase.co?key=1', 'https://project.supabase.co#key', 'https://example.com'])('refuses invalid account origin %s', VITE_SUPABASE_URL => {
  expect(() => publicAccountConfig({ ...config, VITE_SUPABASE_URL })).toThrow('VITE_SUPABASE_URL');
});
it.each([undefined, '', 'sb_' + 'secret_private', 'a.b.c'])('refuses missing or private key %s', VITE_SUPABASE_PUBLISHABLE_KEY => {
  expect(() => publicAccountConfig({ ...config, VITE_SUPABASE_PUBLISHABLE_KEY })).toThrow('publishable key');
});
it('rejects the production project and another project in staging', () => {
  expect(() => publicAccountConfig({ ...config, VITE_SUPABASE_URL: 'https://utqzovjmclfyojedmwok.supabase.co' })).toThrow('production');
  expect(() => publicAccountConfig({ ...config, VITE_SUPABASE_URL: 'https://another.supabase.co' })).toThrow('isolated');
});
