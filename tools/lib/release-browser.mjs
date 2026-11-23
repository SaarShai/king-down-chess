import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { chromium, webkit } from 'playwright';
import { answerCheckHost, CHECK_SITE_ENV } from './checks.mjs';
import previewOrigin from '../release/preview-host.json' with { type: 'json' };

const repo = fileURLToPath(new URL('../../', import.meta.url));
// Load the real copy tables. Node needs Vite's extensionless imports and SVG assets bundled first.
const { outputFiles: [copy] } = await build({
  stdin: {
    resolveDir: repo,
    contents: `
      export { text, panelText, guideTabLabels, squareLabel } from './src/interface/play/texts.ts';
      export { summaryLine, homeText } from './src/interface/play/home.ts';
      export { stateText } from './src/interface/play/mini-board.ts';
      export { kingDisplayName } from './src/king-label.ts';
      export { signInText, WAYS } from './src/interface/people/screens/copy.ts';
      export { P, R, parseSq } from './src/rules/engine.ts';`,
  },
  bundle: true, platform: 'node', format: 'esm', write: false, loader: { '.svg': 'text' },
});
const { text, panelText, guideTabLabels, squareLabel, summaryLine, homeText, stateText, kingDisplayName, signInText, WAYS, P, R, parseSq } =
  await import('data:text/javascript;base64,' + Buffer.from(copy.contents).toString('base64'));

export { previewOrigin };
export { text, panelText, squareLabel, stateText, kingDisplayName, P, R, parseSq };
export const releaseEngines = [chromium, webkit];

export async function withReleaseSite(url, check) {
  if (url) {
    if (new URL(url).origin === previewOrigin) {
      const home = await fetch(previewOrigin, { credentials: 'omit', redirect: 'manual', signal: AbortSignal.timeout(15_000) });
      const target = new URL(home.headers.get('location') ?? '/', previewOrigin);
      await home.body?.cancel();
      if (home.status >= 300 && home.status < 400 && (target.hostname === 'vercel.com' || target.hostname.endsWith('.vercel.com'))) {
        throw new Error('Preview redirects to Vercel sign-in. The preview address must open signed out.');
      }
      assert.equal(home.status, 200, 'The preview home must answer HTTP 200');
    }
    return check(url);
  }
  const built = process.env.KINGDOWN_RELEASE_SITE_ROOT;
  const root = built || repo;
  // A combined run keeps serving the shared build while the release check uses its own build.
  const outDir = built ? undefined : await mkdtemp(join(tmpdir(), 'kingdown-release-site-'));
  try {
    if (outDir) {
      const profile = fileURLToPath(new URL('../release/profile.sh', import.meta.url));
      execFileSync('bash', ['-c', '. "$1"; exec npm run build -- --outDir "$2"', 'release-site', profile, outDir], {
        cwd: root, stdio: 'inherit', env: { ...process.env, ...CHECK_SITE_ENV },
      });
    }
    const { preview } = await import('vite');
    const server = await preview({ root, ...(outDir ? { build: { outDir } } : {}), logLevel: 'silent', preview: { host: '127.0.0.1', port: 0, strictPort: true, open: false } });
    try { await check(server.resolvedUrls.local[0]); }
    finally { await server.close(); }
  } finally {
    if (outDir) await rm(outDir, { recursive: true, force: true });
  }
}

export async function releaseContext(browser, url, options) {
  const origin = new URL(url).origin;
  const context = await browser.newContext({ ...options, serviceWorkers: 'block' });
  await context.route('**/*', async route => {
    const request = route.request(), address = new URL(request.url());
    if (address.origin === origin && address.pathname === '/api/client-errors' && request.method() === 'POST') {
      return route.fulfill({ status: 204 });
    }
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method()) ||
        request.isNavigationRequest() && address.origin !== origin) return route.abort();
    await route.continue();
  });
  await answerCheckHost(context);
  await context.addInitScript(() => localStorage.setItem('kingdown.solo-launch-seen', '1'));
  return context;
}

const button = (scope, name) => scope.getByRole('button', { name, exact: true });
const dialog = (page, name) => page.getByRole('dialog', { name, exact: true });

export function releaseDriver(page, url, touch = false) {
  const action = locator => touch ? locator.tap() : locator.click();
  const play = button(page, new RegExp(`^${text.play}$`, 'i'));
  const summary = button(page, summaryLine({ level: 'casual', setup: 'pieces', sideChoice: 'light' }));
  const setup = dialog(page, text.newGame);
  const moreOptions = dialog(page, panelText.more);
  const pool = moreOptions.getByText(panelText.poolLock, { exact: true });
  const signInChoices = dialog(page, text.signIn);
  const friendSignIn = dialog(page, signInText.person);
  const menu = dialog(page, text.menu);
  const grid = page.getByRole('grid', { name: text.title, exact: true });
  const square = name => grid.getByRole('gridcell', { name });
  const tab = (name, selected) => page.getByRole('tab', { name, exact: true, selected });
  const settingsSheet = dialog(page, text.settings);
  const waitHome = () => button(page, text.friend).waitFor();

  return {
    async openHome() { await page.goto(url); await waitHome(); },
    async redesignedHome() {
      await play.waitFor();
      return !await page.locator('.shell-nav').count() &&
        await button(page, text.guide).isVisible() && await button(page, text.settingsLabel).isVisible();
    },
    async openSignIn() {
      await action(button(page, text.signIn));
      const choices = WAYS.filter(way => way !== 'apple').map(way => button(signInChoices, signInText.way(way)));
      await choices.reduce((a, b) => a.or(b)).first().waitFor();
      return true;
    },
    async hasFacebook() { return button(signInChoices, signInText.way('facebook')).isVisible(); },
    async closeSignIn() {
      await action(button(page, signInText.notNow));
      await signInChoices.waitFor({ state: 'hidden' });
      return !await signInChoices.isVisible();
    },
    async openSettings() {
      await action(button(page, text.settingsLabel));
      await settingsSheet.waitFor();
      return await settingsSheet.getByText(text.coordinates, { exact: true }).isVisible() &&
        await settingsSheet.getByText(text.sound, { exact: true }).isVisible();
    },
    async closeSettings() {
      await page.keyboard.press('Escape');
      await settingsSheet.waitFor({ state: 'hidden' });
      await waitHome();
    },
    async openGuide() {
      await action(button(page, text.guide));
      const tabs = page.getByRole('tab');
      await tabs.first().waitFor();
      return (await tabs.allInnerTexts()).map(label => label.trim().toUpperCase()).join() === guideTabLabels.map(label => label.toUpperCase()).join();
    },
    guideTabs: guideTabLabels.slice(1),
    async selectGuideTab(name) { await action(tab(name)); await tab(name, true).waitFor(); return true; },
    async backToHome() { await action(button(page, text.backTo(text.homeLabel))); await waitHome(); },
    async openFriendSetup() {
      await action(button(page, text.friend));
      await setup.waitFor();
      return await button(setup, panelText.inviteLink).isVisible() && await button(setup, panelText.byName).isVisible() &&
        !/Choose cards|shared cards|No powers|In pool/i.test(await setup.innerText());
    },
    async openMoreOptions() { await action(button(setup, panelText.more)); await moreOptions.waitFor(); },
    async sendInviteLink() { await action(button(moreOptions, panelText.inviteLink)); await friendSignIn.waitFor(); return true; },
    async closeFriendSignIn() {
      await action(button(friendSignIn, signInText.notNow));
      await friendSignIn.waitFor({ state: 'hidden' });
      await setup.or(moreOptions).waitFor();
      return await page.getByRole('dialog').count() === 1;
    },
    async startGame() {
      await action(play);
      const squares = grid.getByRole('gridcell');
      await squares.nth(63).waitFor();
      return await squares.count() === 64;
    },
    async openSoloSetup() { await action(summary); await setup.waitFor(); },
    async startFromSetup() {
      await action(button(setup, homeText.startGame));
      await setup.waitFor({ state: 'hidden' });
    },
    async continueGame() { await action(button(page, text.resume)); },
    async movePawn() {
      await action(square(/^e2 /));
      await action(square(/^e4 /));
      const e4 = parseSq('e4');
      await square(squareLabel({ board: { [e4]: P } }, e4)).waitFor();
      return true;
    },
    async openMenu() {
      await action(button(page, text.menu));
      await menu.waitFor();
      return (await Promise.all([text.homeLabel, text.guide, text.resign].map(name => button(menu, name).isVisible()))).every(Boolean);
    },
    async openHistorySetup() {
      await page.goto(new URL('/privacy.html', url).href);
      await page.goto(new URL('/', url).href);
      await summary.waitFor();
      await action(summary);
      await setup.waitFor();
    },
    async openPiecePool() {
      await action(moreOptions.getByRole('radio', { name: panelText.pool, exact: true }));
      await page.waitForFunction(() => history.state?.layerDepth === 2);
      await pool.waitFor();
    },
    async goBack(depth) {
      await page.evaluate(() => history.back());
      await page.waitForFunction(want => (history.state?.layer ? history.state.layerDepth : -1) === want, depth);
      if (depth === 1) await pool.waitFor({ state: 'hidden' });
      if (depth === 0) await setup.waitFor();
      if (depth === -1) await setup.waitFor({ state: 'hidden' });
      return true;
    },
    homeVisible: () => summary.isVisible(),
    async backToPrivacy() {
      await page.evaluate(() => history.back());
      await page.waitForURL('**/privacy.html');
      return true;
    },
    async forwardToHome() { await page.goForward(); await summary.waitFor(); return true; },
  };
}
