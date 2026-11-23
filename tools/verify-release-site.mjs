import { env, shot, trapErrors, assertNoErrors } from './lib/checks.mjs';
import { releaseContext, releaseDriver, releaseEngines, releaseRequestFailures, withReleaseSite } from './lib/release-browser.mjs';

const [address, pictures] = process.argv.slice(2);
if (pictures) process.env.PLAYABLE_OUT = pictures;
const origin = address || (process.env.PLAYABLE_URL && env('PLAYABLE_URL'));
const results = [];
const check = (label, pass, detail = '') => results.push(`${pass ? 'PASS' : 'FAIL'} ${label}${pass || !detail ? '' : ' :: ' + detail}`);

await withReleaseSite(origin, async url => {
  for (const [i, engine] of releaseEngines.entries()) {
    const touch = i === 1, device = touch ? 'phone' : 'desktop';
    const browser = await engine.launch();
    try {
      const context = await releaseContext(browser, url, touch ?
        { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true } :
        { viewport: { width: 1280, height: 800 } });
      const page = await context.newPage();
      page.setDefaultTimeout(10_000);
      page.setDefaultNavigationTimeout(20_000);
      const errors = trapErrors(page);
      const { bad, leaveHome } = releaseRequestFailures(page);
      const driver = releaseDriver(page, url, touch);
      const ok = (point, pass, detail) => check(`${device} ${point}`, pass, detail);
      const picture = name => shot(page, `${device}-${name}`, { animations: 'disabled', timeout: 20_000 });
      try {
        await driver.openHome();
        ok('Home is the redesign', await driver.redesignedHome());
        await picture('1-home');
        ok('Home Sign in opens the sign-in choices', await driver.openSignIn());
        ok('no Facebook without ?facebook=1', !await driver.hasFacebook());
        await picture('2-signin');
        ok('Not now closes the choices', await driver.closeSignIn());
        ok('Account & settings opens', await driver.openSettings());
        await picture('3-settings');
        await driver.closeSettings();
        // Guide removes Home and cancels its pending film requests.
        ok('Guide has four tabs', await leaveHome(driver.openGuide));
        for (const tab of driver.guideTabs) ok(`Guide tab ${tab}`, await driver.selectGuideTab(tab));
        await picture('4-guide');
        await driver.backToHome();
        ok('Friend setup has both invite actions', await driver.openFriendSetup());
        await driver.openMoreOptions();
        ok('Send invite link opens sign-in choices from More options', await driver.sendInviteLink());
        await picture('5-friend-signin');
        ok('setup stays after Not now', await driver.closeFriendSignIn());
        // The reload cancels the old Home document's pending film requests.
        await leaveHome(driver.openHome);
        // PLAY removes Home and cancels its pending film requests.
        ok('PLAY opens a board of 64 squares', await leaveHome(driver.startGame));
        ok('e2 to e4 moves the pawn', await driver.movePawn());
        await picture('6-game');
        ok('Menu has Home, Guide, Resign', await driver.openMenu());
        await picture('7-menu');
        const pageErrors = errors.filter(message => message.startsWith('pageerror:'));
        assertNoErrors(pageErrors);
        ok('no page errors', true);
        ok('no failed requests', bad.length === 0, bad.join(' | '));
      } catch (error) {
        ok('run', false, error.message);
        await picture('fail').catch(() => {});
      }
    } finally { await browser.close(); }
  }
});
console.log(results.join('\n'));
process.exitCode = results.some(result => result.startsWith('FAIL')) ? 1 : 0;
