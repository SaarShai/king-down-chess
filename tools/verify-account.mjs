// Settings → Account and the cloud save in a real browser, against a fake Supabase (every request to
// the project is answered here; nothing reaches the real server). Signed out, the sign-in redirect,
// the return from it, the cloud save (newer copy comes down, a move goes up after 2 s), sign-out,
// account deletion, a newer game arriving during a lesson or under the title, a newer game another
// device sent while this one was behind, a server that cannot be reached, and signing out offline.
// Run: npm run check:browser account (it builds and serves the app; the settings are in tools/lib/checks.mjs).
import assert from 'node:assert/strict';
import { closeMenu, contextText, lanMoves, openAccount, pressMenu, waitForUi } from './app-ui.mjs';
import { assertNoErrors, env, launch, trapErrors } from './lib/checks.mjs';

const base = env('PLAYABLE_URL');
const SUPABASE = 'https://utqzovjmclfyojedmwok.supabase.co';
const browser = await launch();
const ok = msg => console.log(`ok ${msg}`);
const UID = '0a7c1d2e-3f40-4b5c-8d6e-7f8091a2b3c4';
const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url');
const exp = () => Math.floor(Date.now() / 1000) + 3600;
const session = () => ({
  access_token: `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: UID, role: 'authenticated', aud: 'authenticated', exp: exp() })}.sig`,
  token_type: 'bearer', expires_in: 3600, expires_at: exp(), refresh_token: 'fake-refresh',
  user: {
    id: UID, aud: 'authenticated', role: 'authenticated', email: 'ada@example.com', created_at: '2026-10-03T00:00:00Z',
    app_metadata: { provider: 'google', providers: ['google'] },
    user_metadata: { full_name: 'Ada Lovelace', avatar_url: 'https://avatars.example/ada.png' },
  },
});
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
/** The errors that a page with `down` expects; each other page or console error fails the check. */
const offline = [{
  pattern: /^Failed to load resource: net::ERR_INTERNET_DISCONNECTED$/,
  reason: 'the fake server refuses each request on purpose (down), and the browser logs each refused request',
}];

/** A page with the fake server. `row` is the player's user_data row; `down` makes every request fail. */
async function open({ query = '', stored = null, row = null, down = false, phone = false, verifier = false, delay = 0, title = false } = {}) {
  const ctx = await browser.newContext(phone ? { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true } : { viewport: { width: 1280, height: 900 } });
  await ctx.addInitScript(([s, v, t]) => {
    if (!t) sessionStorage.setItem('kingdown.title-seen', '1');
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    if (s) localStorage.setItem('kingdown.auth', JSON.stringify(s));
    if (v) localStorage.setItem('kingdown.auth-code-verifier', JSON.stringify('the-verifier'));
  }, [stored, verifier, title]);
  const server = { row, requests: [], errors: null, scripts: [], phone };
  await ctx.route('https://avatars.example/**', r => r.fulfill({ contentType: 'image/png', body: PNG }));
  await ctx.route(`${SUPABASE}/**`, async r => {
    const req = r.request(), url = new URL(req.url());
    server.requests.push({ method: req.method(), path: url.pathname, url, headers: req.headers(), body: req.postData(), t: Date.now() });
    if (down) return r.abort('internetdisconnected');
    const json = (status, body) => r.fulfill({ status, contentType: 'application/json', body: body === undefined ? '' : JSON.stringify(body) });
    if (req.method() === 'OPTIONS') return r.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } });
    if (url.pathname === '/auth/v1/authorize') return r.fulfill({ contentType: 'text/html', body: '<p>sign-in page</p>' });
    if (url.pathname === '/auth/v1/token') return json(200, session());
    if (url.pathname === '/auth/v1/logout') return json(204);
    if (url.pathname === '/rest/v1/rpc/delete_my_account') return json(204);
    if (url.pathname === '/rest/v1/user_data' && req.method() === 'GET') {
      await new Promise(res => setTimeout(res, delay));
      return json(200, server.row ? [server.row] : []);
    }
    if (url.pathname === '/rest/v1/user_data' && req.method() === 'POST') {
      // Like the database (0001_accounts.sql): a section is kept only when the one sent is newer; the reply is the row as kept.
      const sent = JSON.parse(req.postData()), next = { ...server.row };
      for (const s of ['settings', 'lessons', 'saved_game']) if (sent[s] && !(next[s]?.at >= sent[s].at)) next[s] = sent[s];
      server.row = next;
      return json(201, { settings: next.settings ?? null, lessons: next.lessons ?? null, saved_game: next.saved_game ?? null });
    }
    return json(404, { message: 'not in the fake server' });
  });
  const page = await ctx.newPage();
  await page.clock.install();
  server.errors = trapErrors(page, down ? offline : []);
  page.on('request', r => { if (/assets\/client-/.test(r.url())) server.scripts.push(r.url()); });
  page.on('dialog', d => d.accept());
  await page.goto(base + query);
  await page.waitForFunction(() => window.view?.ready);
  await page.evaluate(() => window.view.ready());
  return { page, server, close: () => ctx.close() };
}
const tap = async ({ page, server }, sq) => {
  const p = await page.evaluate(s => window.view.screenOf(s), sq);
  if (server.phone) await page.touchscreen.tap(p.x, p.y); else await page.mouse.click(p.x, p.y);
};
/** Waits up to 5 s for the fake server to have seen `n` requests that pass `test`. */
const seen = async (server, test, n = 1) => {
  for (let i = 0; i < 50; i++) { const r = server.requests.filter(test); if (r.length >= n) return r; await new Promise(res => setTimeout(res, 100)); }
  return server.requests.filter(test);
};
const accountButtons = page => page.locator('#account-body button').allInnerTexts();
const settings = async page => { await openAccount(page); await page.locator('#account:not([hidden])').waitFor(); };
const small = page => page.$$eval('#account button, #account a', els => els.filter(e => e.offsetParent)
  .map(e => ({ t: e.textContent.trim(), r: e.getBoundingClientRect() })).filter(({ r }) => r.height < 44 || r.width < 44).map(({ t }) => t));
const moves = page => lanMoves(page);
const save = page => page.evaluate(() => JSON.parse(localStorage.getItem('kingdown.save')));

try {
  // 1. Signed out: no request to the server, no client code loaded, Google and GitHub only.
  for (const phone of [false, true]) {
    const { page, server, close } = await open({ phone });
    await settings(page);
    assert.deepEqual(await accountButtons(page), ['Continue with Google', 'Continue with GitHub']);
    assert.match(await page.locator('#account-body').innerText(), /Sign in to save your games on every device/);
    assert.deepEqual(await page.locator('#account a').evaluateAll(as => as.map(a => a.getAttribute('href'))), ['./privacy.html', './terms.html']);
    if (phone) assert.deepEqual(await small(page), [], 'account controls are at least 44 px');
    assert.equal(server.requests.length, 0, 'signed out, nothing goes to the server');
    assert.deepEqual(server.scripts, [], 'the Supabase client is not loaded for a signed-out player');
    assert.deepEqual(server.errors, []);
    await close();
  }
  {
    const { page, close } = await open({ query: '?facebook=1' });
    await settings(page);
    assert.deepEqual(await accountButtons(page), ['Continue with Google', 'Continue with GitHub', 'Continue with Facebook']);
    await close();
  }
  ok('signed out: Google and GitHub (Facebook only with ?facebook=1), privacy and terms links, 44 px on a phone; no request and no client code');

  // 2. Continue with Google goes to Supabase's authorize page with a PKCE challenge and comes back here.
  {
    const { page, server, close } = await open();
    await settings(page);
    await page.click('text=Continue with Google');
    await page.waitForURL(/\/auth\/v1\/authorize/);
    const auth = server.requests.find(r => r.path === '/auth/v1/authorize').url.searchParams;
    assert.equal(auth.get('provider'), 'google');
    assert.equal(auth.get('redirect_to'), base);
    assert.ok(auth.get('code_challenge')?.length >= 43);
    assert.equal(auth.get('code_challenge_method')?.toLowerCase(), 's256');
    await close();
  }
  ok('Continue with Google: authorize?provider=google, redirect_to this page, an S256 code challenge');

  // 3. Back from the sign-in page: the code is exchanged, the address cleaned, the player signed in,
  // and an empty account gets this device's game.
  {
    const { page, server, close } = await open({ query: '?code=the-code', verifier: true });
    await page.locator('#account-body b').waitFor({ state: 'attached' });
    await page.waitForFunction(() => !location.search.includes('code='));
    const token = server.requests.find(r => r.path === '/auth/v1/token');
    assert.equal(token.url.searchParams.get('grant_type'), 'pkce');
    assert.deepEqual(JSON.parse(token.body), { auth_code: 'the-code', code_verifier: 'the-verifier' });
    const [up] = await seen(server, r => r.method === 'POST' && r.path === '/rest/v1/user_data');
    assert.ok(up, 'the local data went up');
    const body = JSON.parse(up.body);
    assert.equal(body.user_id, UID);
    assert.deepEqual(Object.keys(body).sort(), ['saved_game', 'settings', 'user_id']);
    assert.match(up.headers.prefer, /resolution=merge-duplicates/);
    assert.match(up.headers.prefer, /return=representation/, 'asks for the row as kept');
    assert.equal(up.url.searchParams.get('select'), 'settings,lessons,saved_game');
    assert.equal(up.headers.apikey, 'sb_publishable_8jB5OXiSB56JSJBfPjLvbQ_cKIemhX9');
    await close();
  }
  {
    const { page, server, close } = await open({ query: '?error=access_denied&error_description=The+user+denied' });
    await settings(page);
    assert.equal(await page.locator('#account-note').innerText(), 'Sign-in did not finish. Please try again.');
    assert.equal(await page.evaluate(() => location.search), '');
    assert.equal(server.requests.length, 0);
    await close();
  }
  ok('return: the code is exchanged (PKCE), the address cleaned, the empty account gets this device\'s game; a refused sign-in says so quietly');

  // 4. Signed in, the account newer: its settings and game come down; a move goes up 2 s later.
  const now = Date.now() + 60_000;
  const row = {
    settings: { at: now, v: { think: 800, skill: 'club', coords: false, sound: false, queen: true, pace: 'off', threats: true, labels: true } },
    saved_game: { at: now, v: { back: 'RNBQKBNR', fen: '', moves: ['e2-e4', 'e7-e5'], white: 'human', black: 'human', link: null, daily: null, resigned: null } },
  };
  for (const phone of [false, true]) {
    const p = await open({ stored: session(), row: structuredClone(row), phone }), { page, server, close } = p;
    await waitForUi(page, ui => ui.lan.length === 2);
    assert.deepEqual(await moves(page), ['e2-e4', 'e7-e5']);
    assert.match(await contextText(page), /^Loaded your newer saved game from your account\.$/m);
    assert.deepEqual(await page.evaluate(() => ['coords', 'queen', 'threats', 'sound'].map(id => document.getElementById(id).checked)), [false, true, true, false]);
    assert.equal(await page.evaluate(() => document.getElementById('labels').checked), true, 'the account\'s Piece letters come down');
    assert.equal(await page.inputValue('#pace'), 'off');
    await settings(page);
    assert.match(await page.locator('#account-body').innerText(), /Ada Lovelace\s+Signed in with Google/);
    assert.deepEqual(await accountButtons(page), ['Sign out', 'Delete my account']);
    assert.ok(await page.locator('#account-body img').evaluate(i => i.complete && i.naturalWidth > 0), 'the picture shows');
    if (phone) assert.deepEqual(await small(page), []);
    await closeMenu(page);
    const before = server.requests.filter(r => r.method === 'POST').length;
    await tap(p, 6); await tap(p, 21); // g1-f3
    await waitForUi(page, ui => ui.lan.length === 3);
    const moved = Date.now();
    const push = (await seen(server, r => r.method === 'POST', before + 1)).slice(before).at(-1);
    assert.ok(push && push.t - moved >= 1500, `the move goes up after the quiet moment (${push && push.t - moved} ms)`);
    const body = JSON.parse(push.body);
    assert.deepEqual(Object.keys(body).sort(), ['saved_game', 'user_id'], 'only the changed section goes up');
    assert.deepEqual(body.saved_game.v.moves, ['e2-e4', 'e7-e5', 'Ng1-f3']);
    assert.equal(body.saved_game.at, now + 1, 'newer than the copy it changed, though that came from a clock 60 s ahead');
    assert.deepEqual(server.errors, []);
    await close();
  }
  ok('signed in: the account\'s newer settings and game come down on load; name, picture, Sign out, Delete; a move goes up alone, 2 s later');

  // 5. Delete my account: a confirm that says what goes, the server call, signed out, play goes on.
  {
    const p = await open({ stored: session(), row: structuredClone(row) }), { page, server, close } = p;
    await waitForUi(page, ui => ui.lan.length === 2);
    await settings(page);
    await page.click('#account-body >> text=Delete my account');
    const dlg = page.locator('#delete-account');
    await dlg.waitFor();
    assert.match(await dlg.innerText(), /name, picture and rating, and the settings, lessons\s+and game saved with it/);
    await dlg.locator('button[value=cancel]').click();
    assert.equal(server.requests.some(r => r.path.includes('delete_my_account')), false, 'Keep my account deletes nothing');
    await settings(page);
    await page.click('#account-body >> text=Delete my account');
    await dlg.locator('button[value=delete]').click();
    await page.waitForFunction(() => document.getElementById('account-note').textContent.startsWith('Your account is deleted.'));
    await settings(page);
    assert.equal(await page.locator('#account-note').innerText(), 'Your account is deleted. Your games stay on this device.');
    assert.ok(server.requests.some(r => r.method === 'POST' && r.path === '/rest/v1/rpc/delete_my_account'));
    assert.ok(server.requests.some(r => r.path === '/auth/v1/logout' && r.url.searchParams.get('scope') === 'local'));
    assert.equal(await page.evaluate(() => localStorage.getItem('kingdown.auth')), null);
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'menu-title', 'Account opens in the Menu after deletion');
    await closeMenu(page);
    const posts = server.requests.filter(r => r.method === 'POST' && r.path === '/rest/v1/user_data').length;
    await tap(p, 6); await tap(p, 21); // g1-f3
    await waitForUi(page, ui => ui.lan.length === 3);
    await new Promise(r => setTimeout(r, 2600));
    assert.equal(server.requests.filter(r => r.method === 'POST' && r.path === '/rest/v1/user_data').length, posts, 'nothing goes up after deletion');
    assert.deepEqual((await save(page)).moves, ['e2-e4', 'e7-e5', 'Ng1-f3'], 'the game stays saved on this device');
    assert.deepEqual(server.errors, []);
    await close();
  }
  {
    const { page, server, close } = await open({ stored: session(), row: structuredClone(row) });
    await settings(page);
    await page.locator('#account-body >> text=Sign out').click();
    await page.locator('#account-body >> text=Continue with Google').waitFor();
    assert.equal(await page.locator('#account-note').innerText(), 'Signed out. Your games stay on this device.');
    assert.ok(server.requests.some(r => r.path === '/auth/v1/logout'));
    assert.equal(await page.evaluate(() => localStorage.getItem('kingdown.auth')), null);
    await close();
  }
  ok('Delete my account: the confirm names what goes, Keep deletes nothing, delete_my_account then sign-out; the game plays on, saved here only; Sign out works');

  // 6. The newer game arrives during a lesson: the lesson goes on; Return to game opens the newer game.
  //    Under the title, the title offers it and the computer waits until the player chooses.
  {
    const p = await open({ stored: session(), row: structuredClone(row), delay: 1500 }), { page, server, close } = p;
    await pressMenu(page, 'Guide'); await page.click('#learn');
    await seen(server, r => r.method === 'GET' && r.path === '/rest/v1/user_data');
    await new Promise(r => setTimeout(r, 2000));
    assert.match(await page.textContent('#turn'), /Lesson 1 of 6/, 'the lesson goes on');
    await page.click('#return-game');
    assert.deepEqual(await moves(page), ['e2-e4', 'e7-e5']);
    assert.match(await contextText(page), /^Loaded your newer saved game from your account\.$/m);
    await close();
  }
  {
    const aiToMove = structuredClone(row);
    aiToMove.saved_game.v = { ...aiToMove.saved_game.v, moves: ['e2-e4'], black: 'ai' };
    const p = await open({ stored: session(), row: aiToMove, delay: 300, title: true }), { page, close } = p;
    await page.locator('#title-continue:not([hidden])').waitFor();
    await page.waitForFunction(() => document.querySelector('#title-continue .label').textContent === 'Continue · move 1');
    await new Promise(r => setTimeout(r, 1500));
    assert.deepEqual(await moves(page), ['e2-e4'], 'the computer waits behind the title');
    await page.click('#title-continue');
    await waitForUi(page, ui => ui.lan.length === 2, null, { timeout: 15_000 });
    await close();
  }
  ok('the newer game during a lesson waits for Return to game; under the title, Continue offers it and the computer waits');

  // 7. The server cannot be reached: the game loads and plays, nothing on screen, quiet retries.
  {
    const p = await open({ stored: session(), down: true }), { page, server, close } = p;
    await tap(p, 12); await tap(p, 28); // e2-e4
    await waitForUi(page, ui => ui.lan.length >= 1);
    await new Promise(r => setTimeout(r, 6500));
    const pulls = server.requests.filter(r => r.method === 'GET' && r.path === '/rest/v1/user_data').length;
    assert.ok(pulls >= 2, `retried quietly (${pulls} tries)`);
    assert.equal(await page.locator('#account-note').innerText(), '');
    assert.deepEqual(server.errors, []);
    assert.equal((await save(page)).moves[0], 'e2-e4');
    await close();
  }
  ok('server unreachable: the game loads, plays and saves here; retries quietly with nothing on screen');

  // 8. Another device sent a newer game while this one sat idle: this device's next move does not
  //    replace it in the account, and the newer game comes down here instead.
  {
    const p = await open({ stored: session(), row: structuredClone(row) }), { page, server, close } = p;
    await waitForUi(page, ui => ui.lan.length === 2);
    const elsewhere = { at: now + 3_600_000, v: { ...row.saved_game.v, moves: ['d2-d4', 'd7-d5', 'c2-c4'] } };
    server.row = { ...server.row, saved_game: elsewhere };
    await tap(p, 6); await tap(p, 21); // g1-f3 on the older game
    await waitForUi(page, ui => ui.lan.length === 3);
    await waitForUi(page, ui => ui.lan[0]?.includes('d2-d4'), null, { timeout: 8000 });
    assert.deepEqual(await moves(page), ['d2-d4', 'd7-d5', 'c2-c4']);
    assert.match(await contextText(page), /^Loaded your newer saved game from your account\.$/m);
    assert.deepEqual(server.row.saved_game, elsewhere, 'the account keeps the newer game');
    assert.deepEqual((await save(page)).moves, ['d2-d4', 'd7-d5', 'c2-c4']);
    assert.deepEqual(server.errors, []);
    await close();
  }
  ok('a newer game from another device is never replaced by an older one: the move here goes up, the account keeps the newer game, and it comes down');

  // 9. Sign out with no connection after the session ran out: still signed out here, also after a reload.
  {
    const { page, close } = await open({ stored: session(), down: true });
    await page.clock.fastForward('02:00:00'); // the hour-long session runs out; it cannot be renewed offline
    await settings(page);
    await page.locator('#account-body >> text=Sign out').click();
    await page.locator('#account-body >> text=Continue with Google').waitFor();
    assert.equal(await page.evaluate(() => localStorage.getItem('kingdown.auth')), null);
    await page.reload();
    await page.waitForFunction(() => window.view?.ready);
    await settings(page);
    assert.deepEqual(await accountButtons(page), ['Continue with Google', 'Continue with GitHub']);
    await close();
  }
  ok('signing out offline with a session that ran out signs out on this device, and a reload stays signed out');
  assertNoErrors();
  ok('no unexpected page or console error on any page');
} finally { await browser.close(); }
