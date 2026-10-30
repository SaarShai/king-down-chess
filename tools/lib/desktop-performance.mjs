/** Compiled desktop loopback baseline. These are observed timings, not pass thresholds. */
import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { cpus, platform, release, totalmem } from 'node:os';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { assertNoErrors, env, trapErrors } from './checks.mjs';

const count = 30;
const quantiles = values => {
  const sorted = [...values].sort((a, b) => a - b);
  assert(sorted.length && sorted.every(value => Number.isFinite(value) && value >= 0), 'Finite non-negative timings');
  return { n: sorted.length, p50: sorted[Math.ceil(sorted.length * .5) - 1], p95: sorted[Math.ceil(sorted.length * .95) - 1] };
};
assert.deepEqual(quantiles([30, 10, 20]), { n: 3, p50: 20, p95: 30 }, 'Nearest-rank summary control');

export async function measureDesktop({ browser, root, origin, actors, pool, tool, tokens }) {
  const { SHARED_MECHANICS } = await import('../fixtures/shared-mechanics.ts');
  const fixture = SHARED_MECHANICS.find(row => row.id === 'fairy-guard-wall');
  assert(fixture && fixture.actions.length === 1, 'Reuse one ordinary complete-turn fixture');
  const runtime = await import(pathToFileURL(join(root, 'functions/mcp.func/runtime/index.mjs')).href);
  const artifacts = Object.fromEntries(await Promise.all(['static/index.html', 'functions/mcp.func/runtime/worker.mjs'].map(async path => [path,
    createHash('sha256').update(await readFile(join(root, path))).digest('hex')])));
  const report = {
    scope: 'Compiled desktop; loopback HTTP; synthetic signed authentication; local disposable PostgreSQL. No hosted, phone, or physical input-to-display claim.',
    started: new Date().toISOString(), commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), artifacts,
    device: { model: platform() === 'darwin' ? execFileSync('sysctl', ['-n', 'hw.model'], { encoding: 'utf8' }).trim() : 'not recorded',
      cpu: cpus()[0]?.model, logicalCpus: cpus().length, memoryBytes: totalmem(), os: platform(), release: release() },
    browser: browser.version(), viewport: { width: 1100, height: 1000 }, network: '127.0.0.1; no emulation', region: 'not applicable',
    cpuThrottle: 'none', motion: 'normal; existing board readiness excludes active animation',
    fixture: fixture.id, actions: fixture.actions, requestedSamples: count, quantile: 'nearest rank; ceil(p*n), 1-based',
    definitions: {
      entryMs: 'Navigation start to selected-game legal read plus board screen, artwork, status and controls ready, then two animation frames. Includes observer scheduling and a cloned legal-read parse; excludes sign-in and fixture creation. Current engine uses local preview.',
      inputFeedbackFrameMs: 'Trusted Menu click event timestamp to visible Menu DOM, then two animation frames. Render-opportunity proxy, not physical input latency.',
      commandHttpMs: 'Matched accepted non-AI turn request timing.responseEnd - timing.requestStart. Loopback HTTP only; no auth/DB/engine split.',
      cache: 'Cold = fresh context, empty HTTP/SW cache, auth seeded only. Warm = same-context reload with a warm HTTP cache; neither visit installs a SW. No request routing; HTTP cache remains enabled.',
    },
    rows: [], summary: {}, complete: false,
  };
  await mkdir(env('PLAYABLE_OUT'), { recursive: true });
  const save = () => writeFile(join(env('PLAYABLE_OUT'), 'desktop-performance.json'), JSON.stringify(report, null, 2) + '\n');
  try {
    for (let sample = 1; sample <= count; sample++) {
      const row = { sample, phase: 'fixture' }; report.rows.push(row);
      let context, match;
      try {
        match = await runtime.createMatch(fixture.setup);
        const snapshot = await match.snapshot(), saved = await match.exportSave(), engine = JSON.parse(saved).engine, id = randomUUID();
        report.engine ??= engine; assert.equal(engine, report.engine);
        await pool.query(`insert into public.games(id,kind,speed,category,colour_rule,engine_fingerprint,setup,rules,status,turn,revision,state,snapshot,created_by,started_at)
          values($1,'friend','live','check','white',$2,$3,$4,'playing',$5,0,$6,$7,$8,now())`,
        [id, engine, fixture.setup, snapshot.rules, snapshot.turn, saved, snapshot, actors[0]]);
        await pool.query(`insert into public.game_players(game_id,seat,user_id,computer,action) values($1,0,$2,false,'ready'),($1,1,$3,false,'waiting')`, [id, actors[0], actors[1]]);
        context = await browser.newContext({ viewport: report.viewport, serviceWorkers: 'allow' });
        // Routing disables the browser HTTP cache. Use passive failure collection here instead.
        await context.addInitScript(({ origin, actor, token, id, engine, lan }) => {
          if (location.origin !== origin) return;
          if (!localStorage.getItem('kingdown.auth')) localStorage.setItem('kingdown.auth', JSON.stringify({
            access_token: token, refresh_token: 'local-test-refresh', token_type: 'bearer', expires_in: 600,
            expires_at: Math.floor(Date.now() / 1000) + 600,
            user: { id: actor, aud: 'authenticated', role: 'authenticated', is_anonymous: false, email: 'desktop@example.invalid', app_metadata: { provider: 'google' }, user_metadata: {}, created_at: new Date().toISOString() },
          }));
          const times = window.__desktopTimes = {};
          const frame = done => requestAnimationFrame(() => requestAnimationFrame(() => done(performance.now())));
          const check = () => {
            const board = document.querySelector('[data-screen="board"]:not([hidden]) #board[aria-busy="false"]:not([data-animating="true"])');
            if (times.entryMs === undefined && times.readReady && board && document.getElementById('status')?.textContent.trim()
              && document.getElementById('board-menu')?.disabled === false) {
              times.entryMs = null; frame(now => { times.entryMs = now; });
            }
            const sheet = document.getElementById('board-sheet');
            if (times.menuEvent !== undefined && times.inputFeedbackFrameMs === undefined && sheet?.open
              && document.getElementById('board-sheet-title')?.textContent === 'Menu' && sheet.getBoundingClientRect().height > 0) {
              times.inputFeedbackFrameMs = null; frame(now => { times.inputFeedbackFrameMs = now - times.menuEvent; });
            }
          };
          const fetch = window.fetch;
          window.fetch = function(...args) {
            return fetch.apply(this, args).then(response => {
              if (response.ok && new URL(response.url).pathname === `/api/games/${id}`) {
                // Do not delay the product read. Observe its clone and keep no private payload.
                void response.clone().json().then(view => {
                  times.readReady = view.game_id === id && view.engine_fingerprint === engine && view.action === 'ready'
                    && view.revision === 0 && view.legal?.includes(lan);
                  check();
                }).catch(() => {});
              }
              return response;
            });
          };
          const observer = new MutationObserver(check);
          observer.observe(document, { subtree: true, childList: true, attributes: true, characterData: true });
          document.addEventListener('click', event => {
            if (!event.isTrusted) return;
            const button = event.target instanceof Element ? event.target.closest('button') : undefined;
            if (button?.id === 'board-menu') times.menuEvent = event.timeStamp;
          }, true);
        }, { origin, actor: actors[0], token: tokens[0], id, engine, lan: fixture.actions[0] });
        const page = await context.newPage(); page.setDefaultTimeout(15_000);
        const errors = trapErrors(page), networkErrors = [];
        page.on('request', request => { const url = new URL(request.url()); if (/^https?:$/.test(url.protocol) && url.origin !== origin) networkErrors.push('External request'); });
        page.on('response', response => { if (response.status() >= 400) networkErrors.push(`${response.status()} ${new URL(response.url()).pathname}`); });
        page.on('requestfailed', request => networkErrors.push(`${request.failure()?.errorText} ${new URL(request.url()).pathname}`));
        for (const visit of ['cold', 'warm']) {
          row.phase = visit;
          const read = page.waitForResponse(response => response.request().method() === 'GET' && new URL(response.url()).pathname === `/api/games/${id}`);
          void read.catch(() => {});
          if (visit === 'cold') await page.goto(`${origin}/g/${id}`, { waitUntil: 'commit' });
          else await page.reload({ waitUntil: 'commit' });
          const response = await read; assert.equal(response.status(), 200);
          const view = await response.json(); assert.equal(view.game_id, id); assert.equal(view.engine_fingerprint, engine); assert.equal(view.action, 'ready');
          assert(view.legal.includes(fixture.actions[0]), 'Initial authoritative legal read contains the ordinary turn');
          await page.waitForFunction(() => Number.isFinite(window.__desktopTimes?.entryMs));
          row[visit] = await page.evaluate(() => ({ entryMs: window.__desktopTimes.entryMs, controlled: !!navigator.serviceWorker.controller,
            navigationTransferBytes: performance.getEntriesByType('navigation')[0]?.transferSize,
            publicResources: performance.getEntriesByType('resource').filter(resource => !new URL(resource.name).pathname.startsWith('/api/')).slice(0, 80).map(resource => ({ path: new URL(resource.name).pathname, transferBytes: resource.transferSize })) }));
          assert.equal(row[visit].controlled, false, 'A direct private board visit stays uncontrolled');
          assert.equal(await page.evaluate(() => navigator.serviceWorker.getRegistration('/').then(Boolean)), false, 'Cold and warm private visits do not install the offline game');
          assert.deepEqual(networkErrors, []); assertNoErrors(errors);
        }
        row.phase = 'input';
        await page.locator('#board-menu').click();
        await page.waitForFunction(() => Number.isFinite(window.__desktopTimes?.inputFeedbackFrameMs));
        row.inputFeedbackFrameMs = await page.evaluate(() => window.__desktopTimes.inputFeedbackFrameMs);
        await page.locator('#board-sheet').getByRole('button', { name: 'Choose a move', exact: true }).click();
        await page.locator(`#choices button[title=${JSON.stringify(fixture.actions[0])}]`).click();
        await page.locator('#board-sheet[open]').waitFor({ state: 'hidden' });
        await page.locator('#end-turn[aria-disabled="false"]').waitFor();
        row.phase = 'command';
        const accepted = page.waitForResponse(response => response.request().method() === 'POST' && new URL(response.url()).pathname === `/api/games/${id}/commands`);
        void accepted.catch(() => {});
        await page.locator('#end-turn').click();
        const response = await accepted, ack = await response.json(); await response.finished();
        assert.equal(response.status(), 200); assert.equal(ack.type, 'ack'); assert.equal(ack.view.game_id, id); assert.equal(ack.view.revision, 1);
        const input = response.request().postDataJSON(); assert.deepEqual(input.action, { type: 'turn', actions: fixture.actions });
        const timing = response.request().timing();
        assert(timing.requestStart >= 0 && timing.responseEnd >= timing.requestStart, 'Completed HTTP request timing');
        row.commandHttpMs = timing.responseEnd - timing.requestStart;
        const stored = (await tool(0, 'kingdown_get', { game_id: id }))._meta.view;
        assert.equal(stored.revision, 1); assert.deepEqual(stored.history.actions, fixture.actions); assert.equal(stored.fen, ack.view.fen);
        assert.equal((await pool.query('select count(*)::int n from public.game_commands where game_id=$1 and kind=\'turn\'', [id])).rows[0].n, 1);
        assert.deepEqual(networkErrors, []); assertNoErrors(errors);
        row.phase = 'complete';
        console.log(`desktop-performance sample ${sample}/${count}`);
      } catch (error) { row.error = String(error.message ?? error); throw error; }
      finally { await context?.close(); await match?.close(); await save(); }
    }
    for (const field of ['inputFeedbackFrameMs', 'commandHttpMs']) report.summary[field] = quantiles(report.rows.map(row => row[field]));
    for (const visit of ['cold', 'warm']) report.summary[`${visit}EntryMs`] = quantiles(report.rows.map(row => row[visit].entryMs));
    assert.equal(report.rows.filter(row => row.phase === 'complete').length, count, 'All first attempts complete without retry');
    report.complete = true;
    console.log(`PASS desktop-performance: ${count} paired visits and accepted non-AI turns; loopback only; ${JSON.stringify(report.summary)}`);
  } finally { await save(); }
}
