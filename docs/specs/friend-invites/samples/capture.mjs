// Render static samples and check their local resources and layout.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { chromium } from 'playwright';

const out = resolve(process.argv[2] || '/tmp/kingdown-friend-invites');
await mkdir(join(out, 'shots'), { recursive: true });
const origin = 'http://127.0.0.1:4322';
const sample = `${origin}/docs/specs/friend-invites/samples/index.html`;
const screens = [
  ['new-game', 'New game', 'A friend opens online setup. The local computer controls stay.'],
  ['friend-setup', 'A friend', 'Set the game rules before you choose a friend.'],
  ['friend-picker', 'Choose a friend', 'Recent opponents, follows and exact handle lookup. Pick: keep Share a link.'],
  ['picker-named-only', 'Choose a friend: named invites only', 'Alternative: the friend needs an account. There is no open link.'],
  ['sender-games', 'Your games: sender', 'mira sends an invitation to rowan. Share and Cancel invitation act on this invite.'],
  ['recipient-games', 'Your games: friend', 'rowan sees an invitation from mira. Accept and Decline appear on the row.'],
  ['game-limit-send', 'Five games: sender notice', 'The send fails. The setup stays. View your games gives a next step.'],
  ['game-limit-accept', 'Five games: acceptance notice', 'The accept fails. The invitation stays open.'],
  ['invite-limit', 'Two invitations: notice', 'The third named invitation fails. The two current invitations stay open.'],
  ['open-link-limit', 'Two open links: notice', 'The sender must close one open link or wait.'],
  ['link-share', 'Share an open link', 'A fake code shows the open-invite rule and expiry. No share sheet opens.'],
  ['named-share', 'Share with rowan', 'The same named invitation opens from the link. Only rowan can accept.'],
  ['sign-in', 'Sign-in entry', 'Static entry only. It does not start sign-in. The existing sign-in method stays.'],
];
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const faults = [];
const manifest = [];
const checks = [];
try {
  const context = await browser.newContext({ deviceScaleFactor: 1, locale: 'en-US', timezoneId: 'America/Los_Angeles', serviceWorkers: 'block', reducedMotion: 'reduce' });
  await context.route('**/*', route => {
    if (new URL(route.request().url()).origin === origin) return route.continue();
    faults.push(`Non-local request: ${route.request().url()}`);
    return route.abort();
  });
  const page = await context.newPage();
  page.on('pageerror', error => faults.push(error.message));
  page.on('response', response => { if (response.status() >= 400) faults.push(`${response.status()} ${response.url()}`); });
  for (const [id, title, note] of screens) {
    const entry = { id, title, note, shots: [] };
    const sizes = [[375, 812], [1280, 800]];
    if (id === 'friend-picker' || id === 'picker-named-only') sizes.push([320, 568]);
    for (const [width, height] of sizes) {
      await page.setViewportSize({ width, height });
      await page.goto(`${sample}?screen=${id}`, { waitUntil: 'networkidle' });
      await page.locator('.new-game-body').waitFor({ timeout: 5000 });
      assert.deepEqual(faults, []);
      await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(img => img.decode())); });
      const layout = await page.evaluate(() => {
        const body = document.querySelector('.new-game-body');
        const footer = document.querySelector('.new-game-foot')?.getBoundingClientRect();
        const back = document.querySelector('.new-game-head > button').getBoundingClientRect();
        return {
          backWidth: back.width,
          pageWidth: document.documentElement.scrollWidth,
          bodyWidth: body.clientWidth,
          scrollWidth: body.scrollWidth,
          footerBottom: footer?.bottom,
          footerTop: footer?.top,
          images: [...document.images].every(img => img.complete && img.naturalWidth > 0),
          fonts: document.fonts.check('16px "Alegreya Sans"') && document.fonts.check('23px Cinzel'),
        };
      });
      assert(layout.images && layout.fonts, `${id}: assets`);
      assert.equal(layout.backWidth, 48, `${id}: Back control width`);
      assert(layout.pageWidth <= width && layout.scrollWidth <= layout.bodyWidth + 1, `${id}: horizontal overflow ${JSON.stringify(layout)}`);
      if (layout.footerBottom) assert(layout.footerBottom <= height + 1 && layout.footerTop >= 0, `${id}: action outside screen`);
      const file = `shots/${id}-${width}x${height}.png`;
      await page.screenshot({ path: join(out, file), animations: 'disabled' });
      entry.shots.push({ size: `${width}x${height}`, file });
      checks.push(`${id} ${width}x${height}: fonts, images, width and action bounds pass`);
      if (width === 320) {
        await page.locator('.new-game-body').evaluate(el => { el.scrollTop = el.scrollHeight; });
        const bottom = `shots/${id}-scrolled-${width}x${height}.png`;
        await page.screenshot({ path: join(out, bottom), animations: 'disabled' });
        entry.shots.push({ size: `${width}x${height}`, file: bottom });
      }
    }
    manifest.push(entry);
  }
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto(`${sample}?screen=friend-picker`);
  await page.locator('#handle').fill('finch');
  await page.getByRole('button', { name: 'Find player', exact: true }).click();
  await page.locator('[data-handle="finch"]').click();
  assert.match(await page.locator('#selected-name').innerText(), /To finch/);
  assert.equal(await page.locator('[data-handle][aria-pressed="true"]').count(), 1);
  await page.locator('#handle').fill('<img src=x>');
  await page.getByRole('button', { name: 'Find player', exact: true }).click();
  assert.match(await page.locator('#lookup-result').innerText(), /Player not found/);
  await page.goto(`${sample}?screen=new-game`);
  await page.getByRole('button', { name: 'A friend Online', exact: true }).click();
  assert.match(page.url(), /screen=friend-setup/);
  await page.getByRole('button', { name: 'Choose a friend', exact: true }).click();
  assert.match(page.url(), /screen=friend-picker/);
  assert.deepEqual(faults, []);
  checks.push('Picker selection, exact fake lookup, no input HTML, and New game route pass.');
  checks.push('No page error, failed resource or non-local request.');
  await writeFile(join(out, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  await writeFile(join(out, 'sample-checks.txt'), checks.join('\n') + '\n');
  console.log(`${manifest.length} screens; ${manifest.reduce((n, e) => n + e.shots.length, 0)} PNGs. All sample checks pass.`);
} finally {
  await browser.close();
}
