import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.resetModules(); });
// platform.ts reads the page and the stage once, when it loads.
const load = async (href: string, stage: string) => {
  vi.stubGlobal('location', new URL(href)); vi.stubEnv('VITE_KINGDOWN_STAGE', stage); vi.resetModules();
  return { ...await import('./platform') };
};

it('keeps the website on relative /api calls', async () => {
  expect(await load('https://kingdown.dev/play/', 'staging')).toEqual({ inApp: false, apiOrigin: '' });
});
it.each([['staging', 'https://kingdown-staging.vercel.app'], ['', 'https://kingdown.dev']])('sends iOS app calls in stage "%s" to %s', async (stage, origin) => {
  expect(await load('capacitor://localhost/', stage)).toEqual({ inApp: true, apiOrigin: origin });
});
