/**
 * Cloud sessions only (claude.ai/code): Playwright's pinned Chromium cannot be downloaded there,
 * but an older build is preinstalled under /opt/pw-browsers and drives these tools fine. When a
 * pinned browser is missing, link the path Playwright expects to the newest preinstalled build:
 * the headless shell (the default `chromium.launch()`) and the full browser (`channel:
 * 'chromium'`, which the verify tools use with `PLAYABLE_BROWSER=chromium`; their default channel
 * is the system Chrome of the owner's Mac). A machine that already has the pinned browsers is left
 * alone. Run by .claude/hooks/cloud-setup.sh; safe to run again.
 */
import { chromium } from 'playwright';
import { existsSync, mkdirSync, readdirSync, symlinkSync } from 'node:fs';
import { dirname } from 'node:path';

const ROOT = '/opt/pw-browsers';
const newest = (prefix, exe) => {
  const build = existsSync(ROOT) && readdirSync(ROOT).filter(d => d.startsWith(prefix)).sort().pop();
  const path = build && `${ROOT}/${build}/chrome-linux/${exe}`;
  return path && existsSync(path) ? path : null;
};

for (const [label, opts, have] of [
  ['headless shell', {}, newest('chromium_headless_shell-', 'headless_shell')],
  ['chromium channel', { channel: 'chromium' }, newest('chromium-', 'chrome')],
]) {
  try {
    const b = await chromium.launch(opts);
    await b.close();
    console.log(`[pw-cloud-link] ${label}: works; nothing to do`);
  } catch (e) {
    const want = /Executable doesn't exist at (\S+)/.exec(String(e))?.[1];
    if (!want) throw e;
    if (!have) throw new Error(`[pw-cloud-link] ${label}: Playwright wants ${want} and nothing is preinstalled under ${ROOT}`);
    mkdirSync(dirname(want), { recursive: true });
    symlinkSync(have, want);
    const b = await chromium.launch(opts);
    console.log(`[pw-cloud-link] ${label}: linked ${want} -> ${have} (Chromium ${b.version()})`);
    await b.close();
  }
}
