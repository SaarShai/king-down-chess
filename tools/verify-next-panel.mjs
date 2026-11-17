// S1 panel proof. Set PLAYABLE_URL and PLAYABLE_OUT; all account calls use local stand-ins.
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const { chromium } = await import(process.env.PLAYWRIGHT_PATH || 'playwright');
const browser = await chromium.launch({ headless: true });
const base = process.env.PLAYABLE_URL, out = process.env.PLAYABLE_OUT;
assert(base && out, 'Set PLAYABLE_URL and PLAYABLE_OUT.'); mkdirSync(out, { recursive: true });
const results = [], sizes = ['390x844', '360x640', '844x390', '1440x900'];
const next = new URL('next.html', base).href;
const panel = page => page.locator('dialog.new-game-panel[open]');
const toggle = (page, name) => page.getByRole('checkbox', { name, exact: true });
const section = (page, name) => panel(page).locator(`[data-section="${name}"]`);
async function settled(page) {
  await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.querySelectorAll('dialog[open] img')].map(img => img.decode().catch(() => {}))); });
  await page.waitForTimeout(150);
}
async function shot(page, name) { await settled(page); await page.screenshot({ path: join(out, `${page.viewportSize().width}x${page.viewportSize().height}-${name}.png`) }); }
async function open(page) { await page.goto(next); await page.locator('.home-hero button').click(); await panel(page).waitFor(); await settled(page); }
function authData() {
  const now = Math.floor(Date.now() / 1000);
  return { access_token: 'local-check', token_type: 'bearer', expires_in: 86400, expires_at: now + 86400, refresh_token: 'local-check', user: { id: 'u-tester', aud: 'authenticated', role: 'authenticated', email: 'tester@example.test', app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' } };
}
async function standIn(context) {
  await context.route(/supabase\.co/, route => {
    const path = new URL(route.request().url()).pathname;
    const body = path.endsWith('/settings') ? { external: { email: true } } : path.endsWith('/verify') || path.endsWith('/token') ? authData() : path.endsWith('/user') ? authData().user : {};
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });
  await context.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname;
    const body = path === '/api/me/settings' ? { settings: {}, me: { handle: 'tester', icon: null } } : path === '/api/me/games' ? { games: [], invitations: [] } : path === '/api/me/record' ? { handle: 'tester', record: {}, blocks: [], history: [] } : path === '/api/me/friends' ? { friends: [{ handle: 'ada', icon: null }] } : {};
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });
}
async function run(name, size, task) {
  const [width, height] = size.split('x').map(Number), context = await browser.newContext({ viewport: { width, height }, reducedMotion: name === 'slider-motion' ? 'no-preference' : 'reduce', hasTouch: width < 900, serviceWorkers: 'block' });
  await standIn(context); const page = await context.newPage(); page.setDefaultTimeout(15000);
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  try { await task(page, context); assert.deepEqual(errors, []); results.push({ name, size, pass: true }); console.log(`PASS ${size} ${name}`); }
  catch (error) { results.push({ name, size, pass: false, error: String(error) }); console.log(`FAIL ${size} ${name}: ${error}`); await shot(page, `${name}-fault`).catch(() => {}); }
  finally { await context.close(); }
}
try {
  for (const size of sizes) await run('panel-options', size, async page => {
    await open(page);
    assert.equal(await page.getByRole('radio', { name: 'Computer', exact: true }).isChecked(), true);
    assert.equal(await toggle(page, 'With powers').isChecked(), false); assert.equal(await toggle(page, 'With cards').isChecked(), false);
    assert.equal(await section(page, 'powers').isDisabled(), true);
    assert.equal(await page.locator('.play-home .home-person').count(), 0);
    assert.equal(await page.locator('.panel-body > .panel-army-block').count(), 0);
    await shot(page, 'computer-closed');
    assert.equal(await page.locator('.level-labels button').evaluateAll(nodes => nodes.every(n => { const r = n.getBoundingClientRect(); return r.width >= 44 && r.height >= 44; })), true);
    const range = page.getByRole('slider', { name: 'Computer level' }); await range.focus();
    await range.press('End'); assert.equal(await range.getAttribute('aria-valuetext'), 'Fierce');
    await range.press('ArrowLeft'); assert.equal(await range.getAttribute('aria-valuetext'), 'Focused');
    await range.press('Home'); assert.equal(await range.getAttribute('aria-valuetext'), 'Friendly');
    if (page.viewportSize().width < 900) await page.getByRole('button', { name: 'Focused', exact: true }).tap(); else await page.getByRole('button', { name: 'Focused', exact: true }).click(); assert.equal(await range.inputValue(), '1');
    const rect = await range.boundingBox(); await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2); await page.mouse.down(); await page.mouse.move(rect.x + rect.width - 5, rect.y + rect.height / 2, { steps: 8 }); await page.mouse.up(); assert.equal(await range.inputValue(), '2');
    await section(page, 'pieces').click(); await section(page, 'pieces').scrollIntoViewIfNeeded(); await shot(page, 'pieces-open');
    for (const name of ['Queen', 'Ogre', 'Paladin', 'Archer', 'Maester', 'Beast']) await toggle(page, `Use ${name}`).uncheck();
    assert.equal(await toggle(page, 'Use Guard').isDisabled(), true);
    assert.match(await page.locator('#pool-lock').innerText(), /7 pieces/);
    await page.getByRole('radio', { name: 'Manual', exact: true }).click(); await page.locator('.panel-army-block').scrollIntoViewIfNeeded(); await shot(page, 'pieces-arrangement');
    await toggle(page, 'With powers').check(); assert.equal(await page.locator('#options-pieces').count(), 1, 'a checkbox does not open its section');
    await section(page, 'powers').click(); assert.equal(await page.locator('#options-pieces').count(), 0); await section(page, 'powers').scrollIntoViewIfNeeded(); await shot(page, 'powers-open');
    await page.getByRole('button', { name: 'Frost', exact: true }).click(); await toggle(page, 'With cards').check();
    assert.equal(await page.locator('[data-king=Frost]').getAttribute('aria-disabled'), 'true'); assert.match(await page.locator('.king-change').innerText(), /Spirit · Mercy replaces Frost · Freeze/);
    await section(page, 'powers').click(); assert.equal(await page.locator('.king-change').isVisible(), true); await section(page, 'powers').click();
    await toggle(page, 'With cards').uncheck(); assert.equal(await page.locator('[data-king=Frost]').getAttribute('aria-pressed'), 'true');
    await toggle(page, 'With cards').check(); await section(page, 'cards').click(); await page.getByRole('radio', { name: 'Pick four', exact: true }).click();
    await toggle(page, 'Use Freeze').check(); await toggle(page, 'Use Haste').check();
    assert.equal(await page.locator('.card-count').innerText(), '2 of 4'); assert.equal(await page.getByRole('button', { name: /^Start game/ }).getAttribute('aria-disabled'), 'true');
    await page.locator('.card-count').scrollIntoViewIfNeeded(); await shot(page, 'cards-open');
    await page.getByRole('button', { name: 'Freeze Rule', exact: true }).click(); assert.match(await page.locator('.card-rule').innerText(), /Freeze an enemy/);
    await page.getByRole('button', { name: 'Back', exact: true }).click();
    await toggle(page, 'Use Flight').check(); await toggle(page, 'Use Strike').check(); assert.equal(await toggle(page, 'Use March').isDisabled(), true);
    await section(page, 'cards').click(); await page.getByRole('radio', { name: 'Person', exact: true }).click();
    assert.equal(await page.getByRole('slider').count(), 0); assert.equal(await page.getByRole('radio', { name: 'Dark', exact: true }).count(), 0);
    await shot(page, 'person');
    const foot = await page.locator('.panel-foot').boundingBox(); assert(foot.y >= 0 && foot.y + foot.height <= page.viewportSize().height + 1);
    await page.keyboard.press('Escape'); await page.waitForFunction(() => !history.state?.layer);
    assert.equal(await panel(page).count(), 0); assert.equal(await page.evaluate(() => !!document.activeElement?.closest('.play-home')), true);
  });
  for (const type of ['pieces', 'powers', 'cards', 'both']) await run(`start-${type}`, '390x844', async page => {
    await open(page); if (type === 'powers' || type === 'both') await toggle(page, 'With powers').check(); if (type === 'cards' || type === 'both') await toggle(page, 'With cards').check();
    await page.getByRole('button', { name: 'Start game', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('.play-game')?.dataset.state === 'ready' && localStorage.getItem('kingdown.save'));
    const save = await page.evaluate(() => JSON.parse(localStorage.getItem('kingdown.save')));
    assert.equal(save.rules.kings.some(Boolean), type === 'powers' || type === 'both'); assert.equal(save.rules.hands[0].length, type === 'cards' || type === 'both' ? 4 : 0); assert.deepEqual(save.rules.hands[0], save.rules.hands[1]);
    await shot(page, `started-${type}`);
  });
  await run('sign-in-return', '390x844', async (page, context) => {
    await open(page); await page.getByRole('radio', { name: 'Dark', exact: true }).click(); await page.getByRole('button', { name: 'Fierce', exact: true }).click();
    await section(page, 'pieces').click(); await page.getByRole('radio', { name: 'Manual', exact: true }).click(); await toggle(page, 'Use Queen').uncheck();
    await toggle(page, 'With powers').check(); await section(page, 'powers').click(); await page.getByRole('button', { name: 'Frost', exact: true }).click();
    await page.getByRole('radio', { name: 'Person', exact: true }).click(); await page.getByRole('button', { name: 'Send link', exact: true }).click();
    await page.getByRole('button', { name: 'Continue with email', exact: true }).click();
    const before = await page.evaluate(() => JSON.parse(sessionStorage.getItem('kingdown.new-game-return')));
    await page.getByRole('textbox', { name: 'Email', exact: true }).fill('tester@example.test'); await page.getByRole('button', { name: 'Send code', exact: true }).click();
    await page.getByRole('textbox', { name: /code/i }).fill('123456'); await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await page.getByRole('radio', { name: 'Person', exact: true }).waitFor();
    assert.equal(await section(page, 'pieces').innerText(), 'Pieces\n14 pieces · Manual');
    assert.match(await section(page, 'powers').innerText(), /Frost · Freeze/); assert.equal(await panel(page).count(), 1);
    assert.deepEqual(await page.evaluate(() => JSON.parse(sessionStorage.getItem('kingdown.new-game-return'))), before);
    await page.goto(`${next}?return=fixture#person`); await panel(page).waitFor(); assert.match(await section(page, 'powers').innerText(), /Frost · Freeze/); assert.match(await section(page, 'pieces').innerText(), /Manual/);
    await page.getByRole('button', { name: 'Invite by name', exact: true }).click(); await page.getByRole('textbox', { name: 'Game name', exact: true }).waitFor();
    assert.equal(await page.locator('dialog[open]').count(), 1); await page.getByRole('button', { name: 'Back', exact: true }).click(); await shot(page, 'sign-in-return');
    assert.equal(await page.getByRole('radio', { name: 'Person', exact: true }).isChecked(), true);
  });
  await run('slider-motion', '390x844', async page => {
    await open(page);
    for (const [level, motion] of [['Friendly', 'level-glow'], ['Focused', 'level-sweep'], ['Fierce', 'level-lava']]) {
      await page.getByRole('button', { name: level, exact: true }).tap();
      assert.equal(await page.locator('.level-flow').evaluate(n => getComputedStyle(n, '::after').animationName), motion);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      assert.equal(await page.locator('.level-flow').evaluate(n => getComputedStyle(n, '::after').animationName), 'none');
      await shot(page, `slider-${level.toLowerCase()}-reduce`); await page.emulateMedia({ reducedMotion: 'no-preference' }); await page.waitForFunction(() => document.documentElement.dataset.motion !== 'reduce');
      await page.evaluate(() => document.documentElement.dataset.motion = 'reduce'); assert.equal(await page.locator('.level-flow').evaluate(n => getComputedStyle(n, '::after').animationName), 'none'); await page.evaluate(() => document.documentElement.dataset.motion = 'full');
    }
  });
  await run('provider-return', '390x844', async page => {
    await open(page); await toggle(page, 'With powers').check(); await toggle(page, 'With cards').check();
    await page.getByRole('radio', { name: 'Person', exact: true }).click(); await page.getByRole('button', { name: 'Send link', exact: true }).click();
    await page.getByRole('button', { name: 'Continue with email', exact: true }).waitFor();
    const before = await page.evaluate(() => JSON.parse(sessionStorage.getItem('kingdown.new-game-return')));
    await page.evaluate(() => {
      sessionStorage.setItem('kingdown.account-signin', JSON.stringify({ flow: 'fixture-flow', target: '/play/friend', created: Date.now() }));
      localStorage.setItem('kingdown.auth-flow-fixture-flow-code-verifier', JSON.stringify('fixture-verifier'));
    });
    await page.goto(`${next}?code=fixture-code&sb_flow_id=fixture-flow`);
    await panel(page).getByRole('radio', { name: 'Person', exact: true }).waitFor();
    assert.equal(await toggle(page, 'With powers').isChecked(), true); assert.equal(await toggle(page, 'With cards').isChecked(), true);
    assert.deepEqual(await page.evaluate(() => JSON.parse(sessionStorage.getItem('kingdown.new-game-return'))), before);
    assert.equal(await page.locator('dialog[open]').count(), 1); await shot(page, 'provider-return');
  });
  if (process.env.LEVEL_LAB) await run('level-lab', '1440x900', async (page, context) => {
    await context.route('**/level-slider-lab', route => route.fulfill({ contentType: 'text/html', body: readFileSync(process.env.LEVEL_LAB, 'utf8').replaceAll('../../game/public/fonts/', '/fonts/') }));
    await page.goto(new URL('level-slider-lab', base).href); await page.getByRole('checkbox', { name: 'Reduce Motion' }).uncheck(); assert.equal(await page.getByRole('slider').count(), 9);
    await shot(page, 'level-lab'); await page.getByRole('checkbox', { name: 'Reduce Motion' }).check();
    assert.equal(await page.locator('.level-flow').evaluateAll(nodes => nodes.every(n => getComputedStyle(n, '::after').animationName === 'none')), true); await shot(page, 'level-lab-reduce');
  });
} finally { await browser.close(); writeFileSync(join(out, 'panel-results.json'), JSON.stringify(results, null, 2)); }
process.exitCode = results.some(r => !r.pass) ? 1 : 0;
