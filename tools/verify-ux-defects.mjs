// The web app defects D-1 to D-10 (docs/specs/web-ux/issues/01-defects.md): one probe file per defect in
// tools/ux-defects/, named d<N>-<slug>.mjs, run in number order.
// Run: npm run check:browser ux-defects (it builds and serves the app; the settings are in tools/lib/checks.mjs).
// A probe exports `default async function (ctx)`; ctx is { browser, base, open, trapErrors, shot } (see open.mjs).
import { readdirSync } from 'node:fs';
import { assertNoErrors, env, launch, shot, trapErrors } from './lib/checks.mjs';
import { opener } from './ux-defects/open.mjs';

const base = env('PLAYABLE_URL');
const dir = new URL('./ux-defects/', import.meta.url);
const probes = readdirSync(dir)
  .filter(name => /^d\d+-[\w-]+\.mjs$/.test(name))
  .sort((a, b) => parseInt(a.slice(1), 10) - parseInt(b.slice(1), 10));
if (!probes.length) throw new Error('ux-defects: no probe in tools/ux-defects/');

const browser = await launch();
try {
  const ctx = { browser, base, open: opener(browser, base, trapErrors), trapErrors, shot };
  for (const name of probes) {
    const { default: probe } = await import(new URL(name, dir).href);
    await probe(ctx);
    console.log(`ux-defects: ${name} passed`);
  }
  assertNoErrors();
} finally {
  await browser.close();
}
