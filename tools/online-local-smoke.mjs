/**
 * End-to-end Playwright smoke check against the running `npm run online:local` stack:
 * signs in `test-a` and `test-b`, creates and joins a link invite, plays 3 moves each way,
 * reloads one side, resigns, verifies the result and verifies each side's games list.
 */
import { createWriteStream, existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PIDS_PATH = join(ROOT, '.local-online/pids.json');
const DEFAULT_OUT = join(ROOT, '.local-online/smoke');

function resolvePageOrigin() {
  if (process.env.KINGDOWN_LOCAL_PAGE_URL) return new URL(process.env.KINGDOWN_LOCAL_PAGE_URL).origin;
  if (!existsSync(PIDS_PATH)) {
    throw new Error('Local online stack is not running (.local-online/pids.json is missing). Start it with "npm run online:local".');
  }
  const state = JSON.parse(readFileSync(PIDS_PATH, 'utf8'));
  return new URL(state.pageUrl).origin;
}

function attachWatchers(page, label, logLine, errors) {
  page.on('pageerror', err => {
    const msg = `[${label} pageerror] ${err?.message ?? err}`;
    logLine(msg);
    errors.push(msg);
  });
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const line = `[${label} console.error] ${msg.text()}`;
      logLine(line);
      errors.push(line);
    }
  });
  page.on('response', res => {
    if (res.status() >= 500) {
      const line = `[${label} http ${res.status()}] ${res.request().method()} ${res.url()}`;
      logLine(line);
      errors.push(line);
    }
  });
}

async function waitTurnState(pageA, pageB, timeoutMs = 40000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    for (const [name, page, other] of [['A', pageA, pageB], ['B', pageB, pageA]]) {
      const state = await page.locator('.play-game').getAttribute('data-state').catch(() => null);
      const text = await page.locator('.play-state').textContent().catch(() => '');
      if (state === 'ready' && text && text.includes('Your turn')) {
        return { activeName: name, active: page, waiting: other };
      }
    }
    await new Promise(r => setTimeout(r, 150));
  }
  const stateA = await pageA.locator('.play-game').getAttribute('data-state').catch(() => null);
  const textA = await pageA.locator('.play-state').textContent().catch(() => '');
  const stateB = await pageB.locator('.play-game').getAttribute('data-state').catch(() => null);
  const textB = await pageB.locator('.play-state').textContent().catch(() => '');
  throw new Error(`No player reached ready turn within ${timeoutMs}ms (A=${stateA}:${textA}, B=${stateB}:${textB})`);
}

async function playOneMove(page, logLine, label, ply) {
  const color = ply % 2 === 1 ? 'Light' : 'Dark';
  const pieceSquares = page.locator(`.play-square[aria-label*=" ${color} "]`);
  const count = await pieceSquares.count();
  let chosen = false;
  for (let i = 0; i < count; i++) {
    const src = pieceSquares.nth(i);
    const srcLabel = (await src.getAttribute('aria-label')) ?? '';
    await src.click();
    const targets = page.locator('.play-square[aria-selected="false"][aria-description*="Possible"]');
    await page.waitForTimeout(50);
    const tCount = await targets.count();
    if (tCount === 0) continue;
    const dst = targets.first();
    const dstLabel = (await dst.getAttribute('aria-label')) ?? '';
    await dst.click();
    const canFinish = await page.locator('.play-game').getAttribute('data-can-finish');
    if (canFinish === 'true') {
      logLine(`[${label}] move ${srcLabel} -> ${dstLabel}`);
      chosen = true;
      break;
    }
    const cancel = page.getByRole('button', { name: 'Cancel', exact: true });
    if (await cancel.isVisible().catch(() => false)) await cancel.click();
  }
  if (!chosen) throw new Error(`${label} could not stage a legal move`);
  const sendBtn = page.getByRole('button', { name: 'Send', exact: true });
  await sendBtn.waitFor({ state: 'visible', timeout: 5000 });
  await sendBtn.click();
  await page.waitForFunction(
    () => {
      const s = document.querySelector('.play-game')?.getAttribute('data-state');
      return s === 'thinking' || s === 'result';
    },
    null,
    { timeout: 10000 },
  );
}

async function signInViaSheet(page, expectedTitle) {
  if (expectedTitle) {
    await page.locator('.people-sheet h1, .people-sheet h2').first().waitFor({ state: 'visible', timeout: 10000 });
  }
  await page.getByRole('button', { name: 'Continue with GitHub' }).click();
}

export async function runSmoke() {
  const pageOrigin = resolvePageOrigin();
  const outDir = process.env.KINGDOWN_SMOKE_DIR || DEFAULT_OUT;
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  const logStream = createWriteStream(join(outDir, 'smoke.log'), { flags: 'a' });
  const logLine = line => {
    const stamp = `[${new Date().toISOString()}] ${line}`;
    console.log(stamp);
    logStream.write(stamp + '\n');
  };

  logLine(`Starting smoke against ${pageOrigin}`);
  const browser = await chromium.launch();
  const errors = [];

  try {
    const ctxA = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
    const ctxB = await browser.newContext();
    const pageA = await ctxA.newPage();
    const pageB = await ctxB.newPage();
    attachWatchers(pageA, 'test-a', logLine, errors);
    attachWatchers(pageB, 'test-b', logLine, errors);

    // 1. Player A signs in as test-a and creates an invite link.
    await pageA.goto(`${pageOrigin}/next.html?as=test-a`, { waitUntil: 'domcontentloaded' });
    await pageA.getByRole('button', { name: /Play a person/ }).click();
    await signInViaSheet(pageA, 'Sign in');
    await pageA.getByRole('button', { name: 'Send a link', exact: true }).waitFor({ state: 'visible', timeout: 15000 });
    await pageA.getByRole('button', { name: 'Send a link', exact: true }).click();

    let inviteUrl = '';
    const deadline = Date.now() + 10000;
    while (Date.now() < deadline && !inviteUrl) {
      const fromClip = await pageA.evaluate(async () => {
        try { return await navigator.clipboard.readText(); } catch { return ''; }
      });
      if (fromClip && fromClip.includes('#join=')) {
        inviteUrl = fromClip.trim();
        break;
      }
      const field = pageA.locator('.people-sheet input[readonly]');
      if (await field.count()) {
        const val = (await field.first().inputValue()).trim();
        if (val.includes('#join=')) { inviteUrl = val; break; }
      }
      await pageA.waitForTimeout(150);
    }
    if (!inviteUrl) throw new Error('Did not obtain invite URL after clicking Send a link');
    const joinHash = new URL(inviteUrl).hash;
    logLine(`test-a created invite link ${inviteUrl}`);
    await pageA.screenshot({ path: join(outDir, '01-invite-created-a.png') });

    // 2. Player B signs in as test-b via the invite link and joins the game.
    await pageB.goto(`${pageOrigin}/next.html?as=test-b${joinHash}`, { waitUntil: 'domcontentloaded' });
    await pageB.getByRole('button', { name: 'Join the game', exact: true }).waitFor({ state: 'visible', timeout: 15000 });
    await pageB.getByRole('button', { name: 'Join the game', exact: true }).click();
    await signInViaSheet(pageB, 'Sign in');

    // Depending on timing after return, landing either joins automatically or waits for Join click.
    await Promise.race([
      pageB.waitForURL(/#online=[0-9a-f-]+/i, { timeout: 15000 }),
      (async () => {
        const btn = pageB.getByRole('button', { name: 'Join the game', exact: true });
        await btn.waitFor({ state: 'visible', timeout: 6000 }).catch(() => {});
        if (await btn.isVisible().catch(() => false)) await btn.click();
        await pageB.waitForURL(/#online=[0-9a-f-]+/i, { timeout: 15000 });
      })(),
    ]);
    const gameId = new URL(pageB.url()).hash.replace(/^#online=/, '');
    if (!/^[0-9a-f-]{36}$/i.test(gameId)) throw new Error(`Invalid gameId from URL: ${pageB.url()}`);
    logLine(`test-b joined game ${gameId}`);

    // Open the joined game in test-a (reload/open home row or hash).
    await pageA.goto(`${pageOrigin}/next.html#online=${gameId}`, { waitUntil: 'domcontentloaded' });
    await Promise.all([
      pageA.locator('.play-grid').waitFor({ state: 'visible', timeout: 15000 }),
      pageB.locator('.play-grid').waitFor({ state: 'visible', timeout: 15000 }),
    ]);

    // 3. Play 3 moves each way (6 plies total).
    let sentAt = 0;
    for (let ply = 1; ply <= 6; ply++) {
      const turn = await waitTurnState(pageA, pageB);
      if (sentAt) {
        const elapsed = Date.now() - sentAt;
        logLine(`Reply ${ply - 1} arrives after ${elapsed} ms`);
        if (elapsed > 7500) throw new Error(`Reply ${ply - 1} takes ${elapsed} ms (limit 7500 ms)`);
      }
      await playOneMove(turn.active, logLine, `ply ${ply} (${turn.activeName})`, ply);
      sentAt = Date.now();
    }

    // Wait for both clients to settle on turn 7 state before reload.
    const beforeReload = await waitTurnState(pageA, pageB);
    logLine(`6 plies synced cleanly; next turn belongs to ${beforeReload.activeName}`);

    // 4. Reload one side (pageB) and verify game state persists from PostgreSQL.
    await pageB.reload({ waitUntil: 'domcontentloaded' });
    await pageB.locator('.play-grid').waitFor({ state: 'visible', timeout: 15000 });
    const afterReload = await waitTurnState(pageA, pageB);
    if (afterReload.activeName !== beforeReload.activeName) {
      throw new Error(`Turn mismatch after reload: expected ${beforeReload.activeName}, got ${afterReload.activeName}`);
    }
    logLine(`pageB reload preserved active player ${afterReload.activeName}`);
    await pageB.waitForTimeout(550);
    await pageB.screenshot({ path: join(outDir, '02-after-reload-b.png') });

    // 5. Return to Home on both sides while active so each games list stably shows the game row, then reopen from it.
    for (const [label, page, shot] of [
      ['test-a', pageA, '03-home-a.png'],
      ['test-b', pageB, '04-home-b.png'],
    ]) {
      await page.getByRole('button', { name: 'Menu', exact: true }).click();
      await page.getByRole('button', { name: 'Back to home', exact: true }).click();
      await page.locator('.play-game').waitFor({ state: 'detached', timeout: 15000 }).catch(() => {});
      const row = page.locator(`.home-game-row[data-game="${gameId}"]`);
      await row.waitFor({ state: 'visible', timeout: 15000 });
      await page.waitForTimeout(500);
      await row.waitFor({ state: 'visible', timeout: 15000 });
      await row.evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
      await page.waitForTimeout(200);
      await page.screenshot({ path: join(outDir, shot) });
      const rowText = (await row.textContent())?.trim() ?? '';
      logLine(`${label} games list shows row for ${gameId}: "${rowText}"`);
      await row.click();
      await page.locator('.play-grid').waitFor({ state: 'visible', timeout: 15000 });
    }

    // 6. Resign from pageA and verify both sides show the result.
    await pageA.getByRole('button', { name: 'Menu', exact: true }).click();
    await pageA.getByRole('button', { name: 'Resign', exact: true }).click();
    await pageA.locator('.kd-dialog, [role="alertdialog"], [role="dialog"]').getByRole('button', { name: 'Resign', exact: true }).click();

    await Promise.all([
      pageA.waitForFunction(() => document.querySelector('.play-game')?.getAttribute('data-state') === 'result', null, { timeout: 15000 }),
      pageB.waitForFunction(() => document.querySelector('.play-game')?.getAttribute('data-state') === 'result', null, { timeout: 20000 }),
    ]);
    const resA = await pageA.locator('.play-result-body h3').textContent();
    const resB = await pageB.locator('.play-result-body h3').textContent();
    const causeA = await pageA.locator('.play-result-cause').textContent();
    const causeB = await pageB.locator('.play-result-cause').textContent();
    logLine(`Result A: "${resA}" (${causeA}) | Result B: "${resB}" (${causeB})`);
    if (!resB?.includes('You win') || !causeA?.includes('resignation') || !causeB?.includes('resignation')) {
      throw new Error(`Unexpected resign results: A="${resA}/${causeA}", B="${resB}/${causeB}"`);
    }
    await pageA.screenshot({ path: join(outDir, '05-result-a.png') });
    await pageB.screenshot({ path: join(outDir, '06-result-b.png') });

    // A result stays in Your games only until this player opens it.
    for (const [label, page] of [['test-a', pageA], ['test-b', pageB]]) {
      await page.getByRole('button', { name: 'Back to home', exact: true }).click();
      await page.waitForFunction(id => !document.querySelector(`.home-game-row[data-game="${id}"]`), gameId, { timeout: 15000 });
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.getByRole('button', { name: /Play a person/ }).waitFor();
      await page.waitForTimeout(1000);
      if (await page.locator(`.home-game-row[data-game="${gameId}"]`).count()) throw new Error('An opened result returns to Your games');
      logLine(`${label}: opened result leaves Your games and stays absent after reload`);
    }
    if (errors.length) throw new Error(`Browser errors observed:\n${errors.join('\n')}`);
    logLine('SMOKE PASSED');
  } finally {
    await browser.close();
    logStream.end();
  }
}

await runSmoke();
