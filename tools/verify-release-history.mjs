import { assertNoErrors, env, trapErrors } from './lib/checks.mjs';
import { releaseContext, releaseDriver, releaseEngines, withReleaseSite } from './lib/release-browser.mjs';

const origin = process.argv[2] || (process.env.PLAYABLE_URL && env('PLAYABLE_URL'));
let failed = false;
await withReleaseSite(origin, async url => {
  for (const engine of releaseEngines) {
    const browser = await engine.launch();
    const check = (pass, label) => {
      console.log(pass ? 'PASS' : 'FAIL', engine.name(), label);
      failed ||= !pass;
    };
    try {
      const context = await releaseContext(browser, url, { viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      page.setDefaultTimeout(8_000);
      const errors = trapErrors(page), driver = releaseDriver(page, url);
      await driver.openHistorySetup();
      await driver.openMoreOptions();
      await driver.openPiecePool();
      check(await driver.goBack(1), 'Back 1 closes Piece pool');
      check(await driver.goBack(0), 'Back 2 closes More options');
      check(await driver.goBack(-1), 'Back 3 closes setup');
      check(await driver.homeVisible(), 'Home is visible');
      check(await driver.backToPrivacy(), 'Back 4 leaves to the first page');
      check(await driver.forwardToHome(), 'Forward returns to Home');
      check(await driver.startGame(), 'PLAY opens a game');
      assertNoErrors(errors.filter(message => message.startsWith('pageerror:')));
      check(true, 'no page errors');
    } catch (error) { check(false, error.message); }
    finally { await browser.close(); }
  }
});
process.exitCode = failed ? 1 : 0;
