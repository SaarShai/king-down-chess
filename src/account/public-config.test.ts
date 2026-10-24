import { expect, it } from 'vitest';
import { publicAccountConfig, stagingPasswordSignInEnabled } from './public-config';
const config = { VITE_SUPABASE_URL: 'https://puhspsyjyzaghmgtkzqd.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test', VITE_KINGDOWN_STAGE: 'staging' };
it('enables password sign-in only for the isolated staging build', () => {
  expect(stagingPasswordSignInEnabled(config)).toBe(true);
  for (const VITE_KINGDOWN_STAGE of [undefined, '', 'production', 'preview']) expect(stagingPasswordSignInEnabled({ ...config, VITE_KINGDOWN_STAGE })).toBe(false);
  for (const VITE_SUPABASE_URL of [undefined, '', 'https://other.supabase.co', 'https://utqzovjmclfyojedmwok.supabase.co']) expect(stagingPasswordSignInEnabled({ ...config, VITE_SUPABASE_URL })).toBe(false);
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
const production = { VITE_SUPABASE_URL: 'https://utqzovjmclfyojedmwok.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test' };
it.each([undefined, ''])('opens the production project when VITE_KINGDOWN_STAGE is %s', VITE_KINGDOWN_STAGE => {
  expect(publicAccountConfig({ ...production, VITE_KINGDOWN_STAGE })).toEqual({ url: production.VITE_SUPABASE_URL, publishableKey: 'sb_publishable_test' });
  expect(stagingPasswordSignInEnabled({ ...production, VITE_KINGDOWN_STAGE })).toBe(false);
});
it.each([undefined, ''])('production (stage %s) refuses the staging project', VITE_KINGDOWN_STAGE => {
  expect(() => publicAccountConfig({ ...config, VITE_KINGDOWN_STAGE })).toThrow('Production refuses the staging account project');
});
it('staging refuses the production project', () => {
  expect(() => publicAccountConfig({ ...production, VITE_KINGDOWN_STAGE: 'staging' })).toThrow('Staging refuses the production account project');
});
it.each(['production', 'preview', 'Staging'])('refuses unknown stage %s', VITE_KINGDOWN_STAGE => {
  expect(() => publicAccountConfig({ ...production, VITE_KINGDOWN_STAGE })).toThrow('VITE_KINGDOWN_STAGE');
});
