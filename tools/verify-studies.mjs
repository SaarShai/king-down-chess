// Real study actions, declared results, local versions and atomic imports at desktop and phone sizes.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { pressMenu } from './app-ui.mjs';
import { assertNoErrors, env, insideViewport, launch, noSidewaysScroll, shot, trapErrors } from './lib/checks.mjs';

const browser = await launch();
const panel = '.study-panel[open]';
const comparable = doc => { const copy = structuredClone(doc), s = studyOf(copy); delete s.id; delete s.version; delete s.parentVersion; return copy; };
const studyOf = doc => doc.schema === 'kingdown-research/1' ? studyOf(doc.document) : doc.schema === 'kingdown-test/1' ? doc.study : doc;
const state = p => p.locator('#study .study-state').textContent();
const saved = p => p.evaluate(() => localStorage.getItem('kingdown.studies'));
async function idle(p) { await p.waitForFunction(() => !document.querySelector('#study').hasAttribute('aria-busy')); }
async function closePanel(p) { await p.locator(`${panel} header button`).click(); }
async function more(p, act) {
  await p.click('#study > .study-strip [data-study="more"]');
  await p.click(`${panel} [data-study="${act}"]`);
}
async function openStudy(p) {
  await pressMenu(p, 'Workshop');
  await p.click('#workshop [data-act="more"]');
  await p.click('#workshop [data-act="studies"]');
  await p.waitForSelector('#study[data-ready="true"]');
  await idle(p);
}
async function exportDoc(p) {
  const download = p.waitForEvent('download');
  await more(p, 'export');
  const doc = JSON.parse(readFileSync(await (await download).path(), 'utf8'));
  await closePanel(p);
  return doc;
}
async function save(p, title) {
  await p.click('#study [data-study="save"]');
  await p.locator(`${panel} [name="title"]`).fill(title);
  await p.locator(`${panel} button[type="submit"]`).click();
  await idle(p);
}
async function importDoc(p, doc) {
  await p.locator('#study .study-import').setInputFiles({ name: 'study.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(doc)) });
  await idle(p);
}
async function square(p, file, rank, touch = false) {
  const b = await p.locator('#study .study-board canvas').boundingBox();
  const x = b.x + (32 + (file + .5) * 112) / 960 * b.width;
  const y = b.y + (64 + 32 + (7 - rank + .5) * 112) / 1024 * b.height;
  await (touch ? p.touchscreen.tap(x, y) : p.mouse.click(x, y));
  await idle(p);
}
async function runChecks(p) {
  await p.click('#study [data-study="test"]');
  await p.click(`${panel} [data-run]`);
  await idle(p);
}
function linkedRecord(control) {
  const dir = mkdtempSync(join(tmpdir(), 'study-evidence-check-'));
  try {
    const input = join(dir, 'input.json'), request = join(dir, 'request.json'), plan = join(dir, 'plan.json'), linked = join(dir, 'linked.json');
    writeFileSync(input, JSON.stringify(control));
    writeFileSync(request, JSON.stringify({ recipe: 'activity', start: 'population', seed: 17, pairs: 2, depth: 1, pool: 'TTTTTTT' }));
    for (const args of [['plan', input, request, '--out', plan], ['evidence', plan, 'docs/balance/measurements.json', '--run', 'ab-2021.var', '--element', 'run', '--out', linked]]) {
      const run = spawnSync(process.execPath, ['--import', 'tsx', 'tools/study.ts', ...args], { encoding: 'utf8', timeout: 30000 });
      assert.equal(run.status, 0, run.stderr || 'Study CLI failed');
    }
    return JSON.parse(readFileSync(linked, 'utf8'));
  } finally { rmSync(dir, { recursive: true, force: true }); }
}
async function measurementIdle(p) {
  await p.waitForFunction(() => document.querySelector('.study-panel[open] .pg-sheet-body')?.getAttribute('aria-busy') !== 'true');
}
async function openMeasurement(p, action = 'plan') {
  await p.click('#study [data-study="results"]');
  await p.click(`${panel} [data-study="${action}"]`);
  await measurementIdle(p);
}
async function measurementLayout(p, width) {
  const bounds = await p.locator(panel).boundingBox();
  assert(bounds.width <= width - 20 && (width < 760 || bounds.width >= 740), 'measurement sheet keeps the approved width');
  for (const button of await p.locator(`${panel} button:visible`).all()) {
    assert((await button.boundingBox()).height >= 43.5, `measurement button keeps a 44-pixel target: ${await button.textContent()}`);
  }
  for (const field of await p.locator(`${panel} label > input[name]:visible,${panel} label > select:visible`).all()) {
    const sizes = await field.evaluate(el => [el.getBoundingClientRect().width, el.parentElement.getBoundingClientRect().width]);
    assert(Math.abs(sizes[0] - sizes[1]) < 2, 'measurement fields fill their grid column');
  }
}
async function measurementControls(p, control, linked, width, height) {
  await importDoc(p, control);
  const initialStore = await saved(p);
  await openMeasurement(p);
  await p.locator(`${panel} [name="pairs"]`).fill('2');
  await p.locator(`${panel} [name="depth"]`).fill('1');
  await p.locator(`${panel} summary`).filter({ hasText: 'More settings' }).click();
  await p.locator(`${panel} [name="seed"]`).fill('17');
  await measurementLayout(p, width);
  await noSidewaysScroll(p); await shot(p, `measurements-form-${width}x${height}`);
  await p.click(`${panel} [data-measurement="preview"]`); await measurementIdle(p);
  assert.match(await p.locator('.measurement-cost').textContent(), /4 games.*2 paired blocks/);
  assert.match(await p.locator('.measurement-preview').textContent(), /No measured estimate/);
  if (width === 1440) {
    for (const [recipe, games] of [['worth', 16], ['field', 4], ['cross-play', 4]]) {
      await p.click(`${panel} [data-measurement="edit"]`);
      await p.locator(`${panel} [name="recipe"]`).selectOption(recipe);
      await p.click(`${panel} [data-measurement="preview"]`); await measurementIdle(p);
      assert.match(await p.locator('.measurement-cost').textContent(), new RegExp(`${games} games`), `${recipe} uses the shared planner`);
    }
    await p.click(`${panel} [data-measurement="edit"]`);
    await p.locator(`${panel} [name="recipe"]`).selectOption('four-cell');
    await p.locator(`${panel} [name="poolPreset"]`).selectOption('QORRBBNNAAGMMSS');
    await p.click(`${panel} [data-measurement="preview"]`); await measurementIdle(p);
    assert.match(await p.locator(`${panel} .study-panel-alert`).textContent(), /custom T/);
    assert.equal(await p.locator(`${panel} [data-measurement="save"]`).isVisible(), false, 'unsupported study cannot save a plan');
    await p.locator(`${panel} [name="recipe"]`).selectOption('activity');
    await p.locator(`${panel} [name="poolPreset"]`).selectOption('TTTTTTT');
    await p.click(`${panel} [data-measurement="preview"]`); await measurementIdle(p);
  }
  await p.click(`${panel} [data-measurement="edit"]`);
  assert.equal(await p.locator(`${panel} [data-measurement="save"]`).isVisible(), false, 'editing invalidates the checked preview');
  await p.locator(`${panel} [name="pairs"]`).fill('3');
  await p.click(`${panel} [data-measurement="preview"]`); await measurementIdle(p);
  assert.match(await p.locator('.measurement-cost').textContent(), /6 games.*3 paired blocks/);
  await measurementLayout(p, width);
  await noSidewaysScroll(p); await shot(p, `measurements-preview-${width}x${height}`);
  if (width === 1440) {
    await p.evaluate(() => {
      const original = Storage.prototype.setItem;
      window.restoreMeasurementStorage = () => { Storage.prototype.setItem = original; };
      Storage.prototype.setItem = function(key, value) { if (key === 'kingdown.studies') throw new DOMException('Quota exceeded', 'QuotaExceededError'); return original.call(this, key, value); };
    });
    await p.click(`${panel} [data-measurement="save"]`); await measurementIdle(p);
    assert(await p.locator(`${panel} .study-panel-alert`).isVisible());
    assert.equal(await saved(p), initialStore, 'failed plan save preserves all stored versions');
    assert(await p.locator('.measurement-cost').isVisible(), 'failed save keeps the checked preview');
    await p.evaluate(() => window.restoreMeasurementStorage());
  }
  await p.click(`${panel} [data-measurement="save"]`);
  await p.waitForSelector(panel, { state: 'detached' });
  const planned = await exportDoc(p);
  assert.equal(planned.schema, 'kingdown-research/1');
  assert.equal(planned.plan.games, 6); assert.equal(planned.plan.definition.request.seed, 17);
  assert.equal(planned.plan.definition.request.pool, 'TTTTTTT');
  const plannedStore = await saved(p);
  await openMeasurement(p); // Saved plans regenerate through the worker before display.
  assert.match(await p.locator('.measurement-cost').textContent(), /6 games/);
  await p.click(`${panel} [data-measurement="cancel"]`);
  assert.equal(await saved(p), plannedStore, 'Cancel does not add a version');
  await p.click('#study [data-study="actions"]');
  await p.locator(`${panel} [data-move]`).filter({ hasText: /^Td4-e4$/ }).click(); await idle(p);
  await openMeasurement(p);
  assert.match(await p.locator(panel).textContent(), /Study changed.*Preview a new plan/);
  assert.equal(await p.locator(`${panel} [data-measurement="save"]`).isVisible(), false, 'stale plan is not presented as a checked current preview');
  await p.click(`${panel} [data-measurement="preview"]`); await measurementIdle(p);
  await p.click(`${panel} [data-measurement="save"]`); await p.waitForSelector(panel, { state: 'detached' });
  assert.deepEqual(studyOf((await exportDoc(p)).plan.definition.input).actions, ['Td4-e4'], 'new preview binds the current study actions');
  await p.click('#study [data-study="undo"]'); await idle(p);

  if (width === 1440) {
    await openMeasurement(p);
    await p.evaluate(() => {
      const original = Worker.prototype.postMessage;
      Worker.prototype.postMessage = function(message, ...rest) {
        if (message.request?.type !== 'plan') return original.call(this, message, ...rest);
        Worker.prototype.postMessage = original;
        this.addEventListener('message', event => { if (event.data.id === message.id) window.cancelledMeasurementFinished = true; });
        window.releaseMeasurement = () => original.call(this, message, ...rest);
      };
    });
    await p.click(`${panel} [data-measurement="preview"]`);
    await p.waitForFunction(() => typeof window.releaseMeasurement === 'function');
    const beforeCancel = await saved(p);
    await p.keyboard.press('Escape'); await p.waitForSelector(panel, { state: 'detached' });
    await p.evaluate(() => window.releaseMeasurement());
    await p.waitForFunction(() => window.cancelledMeasurementFinished);
    assert.equal(await p.locator(panel).count(), 0, 'late preview does not reopen its closed sheet');
    assert.equal(await saved(p), beforeCancel, 'late preview does not save');
  }

  const rows = linked.evidence[0].measurements.map((m, i) => ({ ...m, id: `browser-${width}-${i}` }));
  const raw = JSON.stringify({ schemaVersion: 1, measurements: rows });
  const file = { name: 'browser-results.json', mimeType: 'application/json', buffer: Buffer.from(raw) };
  await openMeasurement(p, 'link-results');
  const beforeLink = await saved(p);
  await p.locator(`${panel} .study-result-file`).setInputFiles(file); await measurementIdle(p);
  assert.equal(await p.locator(`${panel} [data-result-id]`).count(), rows.length);
  await p.locator(`${panel} [data-result-id]`).first().check();
  await measurementLayout(p, width);
  await p.locator(`${panel} .study-result-file`).setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{bad') }); await measurementIdle(p);
  assert(await p.locator(`${panel} .study-panel-alert`).isVisible());
  assert(await p.locator(`${panel} [data-result-id]`).first().isChecked(), 'bad replacement file preserves selection');
  assert.equal(await saved(p), beforeLink);
  await p.click(`${panel} [data-results="cancel"]`);
  assert.equal(await saved(p), beforeLink, 'cancelled linking saves nothing');
  await openMeasurement(p, 'link-results');
  await p.locator(`${panel} .study-result-file`).setInputFiles(file); await measurementIdle(p);
  await p.locator(`${panel} [data-result-id]`).first().check();
  await noSidewaysScroll(p); await shot(p, `measurements-link-${width}x${height}`);
  await p.click(`${panel} [data-results="link"]`); await p.waitForSelector(panel, { state: 'detached' });
  const imported = await exportDoc(p), evidence = imported.evidence.at(-1);
  assert.deepEqual(evidence.measurements, [rows[0]], 'browser linking preserves all selected measurement fields');
  assert.equal(evidence.source.sha256, createHash('sha256').update(raw).digest('hex'), 'source hash covers exact uploaded bytes');
  assert.equal(evidence.approval, 'not-reviewed');
  assert.equal(studyOf(imported).version, studyOf(JSON.parse(beforeLink).documents.at(-1)).version + 1, 'linking adds a saved version');
  await openMeasurement(p, 'link-results');
  await p.locator(`${panel} .study-result-file`).setInputFiles(file); await measurementIdle(p);
  assert(await p.locator(`${panel} [data-result-id]`).first().isDisabled(), 'already linked rows cannot be linked twice');
  await p.click(`${panel} [data-results="cancel"]`);
  if (width === 1440) {
    const paged = [
      ...Array.from({ length: 101 }, (_, i) => ({ ...rows[0], id: `page-row-${i}`, run: 'page-run-0' })),
      ...Array.from({ length: 100 }, (_, i) => ({ ...rows[0], id: `page-run-row-${i + 1}`, run: `page-run-${i + 1}` })),
    ];
    const beforePages = await saved(p);
    await openMeasurement(p, 'link-results');
    await p.locator(`${panel} .study-result-file`).setInputFiles({ name: 'paged.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ schemaVersion: 1, measurements: paged })) }); await measurementIdle(p);
    assert.equal(await p.locator(`${panel} [data-result-id]`).count(), 100);
    await p.locator(`${panel} [data-result-id]`).first().check();
    await p.click(`${panel} [data-results="next-rows"]`); await measurementIdle(p);
    assert.equal(await p.locator(`${panel} [data-result-id]`).count(), 1);
    assert.equal(await p.evaluate(() => document.activeElement?.getAttribute('data-results')), 'previous-rows', 'page navigation preserves keyboard focus');
    await p.locator(`${panel} [data-result-id]`).first().check();
    await p.click(`${panel} [data-results="next-runs"]`); await measurementIdle(p);
    assert.equal(await p.locator(`${panel} [name="run"]`).inputValue(), 'page-run-100');
    await p.locator(`${panel} [data-result-id]`).first().check();
    assert.match(await p.locator(`${panel} [role="status"]`).textContent(), /3 selected/);
    await p.click(`${panel} [data-results="previous-runs"]`); await measurementIdle(p);
    assert(await p.locator(`${panel} [data-result-id]`).first().isChecked(), 'selection remains across run and row pages');
    await p.locator(`${panel} [name="element"]`).fill('missing-element'); await p.locator(`${panel} [name="element"]`).press('Tab'); await measurementIdle(p);
    assert.equal(await p.locator(`${panel} [data-result-id]`).count(), 0);
    assert.match(await p.locator(`${panel} [role="status"]`).textContent(), /3 selected/);
    await p.click(`${panel} [data-results="cancel"]`);
    assert.equal(await saved(p), beforePages, 'paging and filtering do not save a record');

    const realPath = join(process.cwd(), 'docs/balance/measurements.json');
    const realBytes = readFileSync(realPath), realRows = JSON.parse(realBytes).measurements;
    const realRuns = [...new Set(realRows.map(m => m.run))];
    const wantedRun = linked.evidence[0].measurements[0].run;
    const wantedPage = Math.floor(realRuns.indexOf(wantedRun) / 100);
    assert(wantedPage >= 0);
    await openMeasurement(p, 'link-results');
    await p.locator(`${panel} .study-result-file`).setInputFiles(realPath); await measurementIdle(p);
    assert.match(await p.locator(`${panel} .study-result-note`).first().textContent(), new RegExp(`${realRows.length} measurements.*${realRuns.length} runs`));
    for (let i = 0; i < wantedPage; i++) { await p.click(`${panel} [data-results="next-runs"]`); await measurementIdle(p); }
    await p.locator(`${panel} [name="run"]`).selectOption(wantedRun); await measurementIdle(p);
    await p.locator(`${panel} [name="element"]`).fill('run'); await p.locator(`${panel} [name="element"]`).press('Tab'); await measurementIdle(p);
    const expectedRow = realRows.find(m => m.run === wantedRun && m.element === 'run');
    await p.locator(`${panel} [data-result-id]`).first().check();
    await p.click(`${panel} [data-results="link"]`); await p.waitForSelector(panel, { state: 'detached' });
    const realEvidence = (await exportDoc(p)).evidence.at(-1);
    assert.deepEqual(realEvidence.measurements, [expectedRow], 'full real export links its original row through the browser');
    assert.equal(realEvidence.source.sha256, createHash('sha256').update(realBytes).digest('hex'));
  }
}
async function runControls(p, linked, width, height) {
  await importDoc(p, linked); await save(p, studyOf(linked).title);
  const original = await exportDoc(p), actions = [];
  const measurements = linked.evidence[0].measurements.map((row, i) => ({ ...row, id: `service-${width}-${i}` }));
  const raw = JSON.stringify({ schemaVersion: 1, measurements });
  const summary = {
    id: 'fixture-run', studioId: 'fixture-studio', createdAt: '2026-10-14T10:00:00Z',
    study: { id: studyOf(original).id, title: studyOf(original).title, version: studyOf(original).version, engine: 'fixture' },
    planFingerprint: 'fixture-plan', bundleHash: 'fixture-bundle', source: 'fixture-source', commit: 'fixture-commit',
    recipe: 'activity', games: 4, blocks: 2, target: 'both', approvalText: 'I approve exactly 4 fixture games on M1 and Kaggle.',
    approvedAt: null, phase: 'prepared', parts: [
      { id: 'm1-part', machine: 'm1', workers: 2, games: 2, blocks: 1, state: 'pending', completedGames: 0, checkedAt: null, nextCheckAt: null, deadline: null, error: null },
      { id: 'kaggle-part', machine: 'kaggle', workers: 2, games: 2, blocks: 1, state: 'pending', completedGames: null, checkedAt: null, nextCheckAt: null, deadline: null, error: null },
    ],
    validation: { state: 'pending', games: 0, legalReplays: 0, illegalControls: 0, message: 'Not checked' },
    backup: { state: 'pending', message: 'Not copied' }, result: null, error: null,
  };
  let exists = false;
  await p.route('**/api/study-runs', async route => {
    const request = route.request().postDataJSON(); actions.push(request.action);
    assert.equal(route.request().method(), 'POST');
    if (request.action !== 'connect') assert.equal(route.request().headers()['x-king-down-studio'], 'fixture-token');
    let body;
    switch (request.action) {
      case 'connect': body = { studioId: 'fixture-studio', token: 'fixture-token', transportVerification: 'unverified' }; break;
      case 'list': body = exists ? [summary] : []; break;
      case 'prepare': assert.deepEqual(request.document, original); assert.equal(request.target, 'both'); exists = true; body = summary; break;
      case 'approve': assert.equal(summary.phase, 'prepared'); assert.match(request.key, /^[0-9a-f-]{36}$/); summary.phase = 'running'; summary.approvedAt = '2026-10-14T10:01:00Z'; body = summary; break;
      case 'status': body = summary; break;
      case 'result': await route.fulfill({ contentType: 'application/json', body: raw }); return;
      case 'document': body = original; break;
      default: throw new Error(`Unexpected run action ${request.action}`);
    }
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify(body) });
  });
  await openMeasurement(p, 'runs');
  assert(await p.locator(`${panel} [data-runs="prepare"]`).isEnabled());
  await p.locator(`${panel} [name="run-target"]`).selectOption('both');
  await p.click(`${panel} [data-runs="prepare"]`); await measurementIdle(p);
  assert.match(await p.locator(panel).textContent(), /I approve exactly 4 fixture games/);
  await measurementLayout(p, width); await noSidewaysScroll(p); await shot(p, `runs-approve-${width}x${height}`);
  await p.click(`${panel} [data-runs="approve"]`); await measurementIdle(p);
  assert.equal(actions.filter(action => action === 'approve').length, 1);
  assert.match(await p.locator(panel).textContent(), /Game count unknown/);
  await p.click(`${panel} [data-runs="refresh"]`); await measurementIdle(p);
  assert.equal(actions.filter(action => action === 'approve').length, 1, 'refresh never approves or dispatches');
  summary.phase = 'complete'; summary.validation = { state: 'passed', games: 4, legalReplays: 1, illegalControls: 1, message: 'Fixture checks pass' };
  summary.backup = { state: 'verified', message: 'Fixture copy checked' };
  summary.result = { bytes: Buffer.byteLength(raw), sha256: createHash('sha256').update(raw).digest('hex'), filename: 'fixture-results.json' };
  await p.click(`${panel} [data-runs="refresh"]`); await measurementIdle(p);
  await p.click(`${panel} [data-runs="review"]`); await measurementIdle(p);
  await p.waitForSelector(`${panel} [data-result-id]`);
  await p.locator(`${panel} [data-result-id]`).first().check();
  await p.click(`${panel} [data-results="link"]`); await p.waitForSelector(panel, { state: 'detached' });
  assert.deepEqual((await exportDoc(p)).evidence.at(-1).measurements, [measurements[0]], 'service export uses the normal evidence save');
  await openMeasurement(p, 'runs');
  assert.match(await p.locator(panel).textContent(), new RegExp(`plan v${summary.study.version}`), 'old plan run remains in the list');
  const current = await p.locator('#study > .study-strip .study-label').textContent();
  const beforeRecovery = await saved(p);
  await p.evaluate(identity => {
    const box = JSON.parse(localStorage.getItem('kingdown.studies'));
    const study = doc => doc.schema === 'kingdown-research/1' ? study(doc.document) : doc.schema === 'kingdown-test/1' ? doc.study : doc;
    box.documents = box.documents.filter(doc => study(doc).id !== identity.id || study(doc).version !== identity.version);
    localStorage.setItem('kingdown.studies', JSON.stringify(box));
    const original = Storage.prototype.setItem;
    window.restoreStudyStorage = () => { Storage.prototype.setItem = original; };
    Storage.prototype.setItem = function(key, value) { if (key === 'kingdown.studies') throw new DOMException('Quota exceeded', 'QuotaExceededError'); return original.call(this, key, value); };
  }, studyOf(original));
  const withoutOriginal = await saved(p);
  await p.click(`${panel} [data-runs="open"]`); await measurementIdle(p);
  assert(await p.locator(panel).isVisible(), 'failed recovery keeps the run panel open');
  assert.match(await p.locator(`${panel} .study-panel-alert`).textContent(), /Original study not restored/);
  assert.equal(await saved(p), withoutOriginal, 'failed recovery preserves the library');
  assert.equal(await p.locator('#study > .study-strip .study-label').textContent(), current, 'failed recovery preserves the current study');
  await p.evaluate(() => window.restoreStudyStorage());
  await p.click(`${panel} [data-runs="open"]`); await p.waitForSelector(panel, { state: 'detached' });
  assert.deepEqual(await exportDoc(p), original, 'recovery restores exact original identity and saved version');
  assert.deepEqual(JSON.parse(await saved(p)).documents.find(doc => studyOf(doc).id === studyOf(original).id && studyOf(doc).version === studyOf(original).version), original, 'recovery saves the exact missing original');
  assert.equal(JSON.parse(await saved(p)).documents.length, JSON.parse(beforeRecovery).documents.length, 'recovery restores one missing version');
  await openMeasurement(p, 'runs');
  assert(await p.locator(`${panel} [data-runs="prepare"]`).isEnabled(), 'the recovered saved original has its current plan');
  await closePanel(p);
  await p.unroute('**/api/study-runs');
}

async function discoveryControls(p, control, width, height) {
  const doc=structuredClone(control);studyOf(doc).id=`browser-discovery-${width}`;
  await importDoc(p,doc);
  await more(p,'discovery');
  const discoveryIdle=()=>p.waitForFunction(()=>!document.querySelector('.discovery-panel')?.hasAttribute('aria-busy'));
  await discoveryIdle();
  assert.match(await p.locator('[data-discovery-counts]').textContent(),/22 obligations.*19 unsupported.*3 missing/);
  await p.locator('[data-review]').first().click();await discoveryIdle();
  assert.equal(await p.locator('[data-discovery="save-regression"]').isEnabled(),false);
  await p.locator('[data-expected="1"]').fill('1');
  await p.locator('[data-fact="0"]').uncheck();
  await p.locator('[data-add-fact] [name="expected"]').fill('1');
  await p.locator('[data-add-fact] button').click();await discoveryIdle();
  assert.equal(await p.locator('[data-expected="1"]').inputValue(),'1','adding a fact retains edited expectations');
  assert.equal(await p.locator('[data-fact="0"]').isChecked(),false,'adding a fact retains deselection');
  await p.locator('[data-basis]').fill('Browser negative control. Require the opposite actor to verify a saved failure; not an adopted rule.');
  await p.locator('[data-confirm]').check();
  const before=await saved(p);
  await p.evaluate(()=>{const original=Storage.prototype.setItem;window.restoreDiscoveryStorage=()=>Storage.prototype.setItem=original;Storage.prototype.setItem=function(k,v){if(k==='kingdown.studies')throw new Error('Quota');return original.call(this,k,v);};});
  await p.locator('[data-discovery="save-regression"]').click();await discoveryIdle();
  assert.equal(await saved(p),before,'quota failure saves neither regression nor provenance');
  await p.evaluate(()=>window.restoreDiscoveryStorage());
  await p.locator('[data-discovery="save-regression"]').click();await discoveryIdle();
  assert.match(await p.locator('.discovery-content').textContent(),/1 reviewed regressions.*failed/s);
  const download=p.waitForEvent('download');await p.locator('[data-discovery="export"]').click();
  const exported=JSON.parse(readFileSync(await(await download).path(),'utf8'));
  assert.equal(exported.entries.length,1);assert.equal(exported.entries[0].confirmed,true);
  await p.locator('[data-discovery-import]').setInputFiles({name:'discovery.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(exported))});await discoveryIdle();
  assert.equal(JSON.parse(await saved(p)).discoveries.flatMap(d=>d.entries).length,1,'repeat import is idempotent');
  await p.locator('[data-discovery="coverage"]').click();await discoveryIdle();
  assert.match(await p.locator('[data-discovery-counts]').textContent(),/22 obligations/);
  assert.match(await p.locator('[data-discovery-counts]').textContent(),/1 failed/);
  await p.locator('[data-filter]').selectOption('failed');
  assert.equal(await p.locator('.discovery-content article').count(),1);
  await noSidewaysScroll(p);await shot(p,`studies-discovery-${width}x${height}`);
  await closePanel(p);await more(p,'discovery');await discoveryIdle();
  await p.locator('[data-discovery="saved"]').click();await discoveryIdle();
  await p.locator('[data-open-regression]').click();await idle(p);
  await runChecks(p);assert.match(await p.locator(panel).textContent(),/failed/);await closePanel(p);
  await more(p,'discovery');await discoveryIdle();
  await p.locator('[data-discovery="sequences"]').click();await discoveryIdle();
  await p.locator('[data-discovery="scan-study"]').click();await discoveryIdle();
  assert((await p.locator('[data-candidate]').count())>0,'full replay yields extra-action candidates');
  await p.locator('[data-candidate]').first().click();await discoveryIdle();
  assert.match(await p.locator('.discovery-content').textContent(),/Extra action/);
  await closePanel(p);
}

try {
  for (const [width, height] of [[1440, 900], [390, 844], [375, 667]]) {
    const context = await browser.newContext({ viewport: { width, height }, hasTouch: width < 721 });
    await context.addInitScript(() => sessionStorage.setItem('kingdown.title-seen', '1'));
    const p = await context.newPage(); trapErrors(p);
    await p.goto(env('PLAYABLE_URL'));
    await p.waitForFunction(() => window.view?.ready);
    await p.evaluate(() => window.view.ready());
    await p.waitForFunction(() => localStorage.getItem('kingdown.sync') !== null);
    const live = await p.evaluate(() => ({ board: JSON.stringify(window.view.pos), storage: Object.fromEntries(Object.entries(localStorage)) }));
    await openStudy(p);
    const tryBoard = await p.locator('#workshop .pg-board').innerHTML();
    assert.match(await state(p), /White to act.*0 recorded actions/, 'default control starts before all actions');
    await insideViewport(p, '#study .study-board canvas');
    await insideViewport(p, '#study .study-strip');
    await noSidewaysScroll(p);
    await shot(p, `studies-${width}x${height}`);
    const control = await exportDoc(p);
    assert.equal(control.checks.length, 6, 'default control keeps its six before-action assertions');
    assert.deepEqual(studyOf(control).actions, []);
    await runChecks(p);
    assert.match(await p.locator(panel).textContent(), /passed · 6 of 6 checks pass/, 'real declared assertions pass');
    await closePanel(p);
    if (width === 1440) {
      await p.locator('#study .study-board').focus();
      await p.keyboard.press('ArrowRight'); await p.keyboard.press('Enter'); await idle(p);
    } else await square(p, 4, 3, true);
    assert.match(await state(p), /Black to act.*1 recorded actions/, 'keyboard or touch plays a full action');
    let played = await exportDoc(p);
    assert.deepEqual(studyOf(played).actions, ['Td4-e4']);
    await p.click('#study [data-study="undo"]'); await idle(p);
    assert.match(await state(p), /White to act.*0 recorded actions/, 'Undo restores turn and action history');
    await p.click('#study [data-study="actions"]');
    const actions = await p.locator(`${panel} [data-move]`).allTextContents();
    assert(actions.includes('Td4xf4') && actions.includes('Td4-e4'), 'all legal actions include capture and quiet movement');
    assert(!actions.includes('Td4-g4'), 'blocked action is absent');
    await p.locator(`${panel} [data-move]`).filter({ hasText: /^Td4xf4$/ }).click(); await idle(p);
    assert.deepEqual(studyOf(await exportDoc(p)).actions, ['Td4xf4'], 'chooser plays the complete capture');
    await p.click('#study [data-study="undo"]'); await idle(p);
    await save(p, `Saved control ${width}`);
    const box = JSON.parse(await saved(p));
    assert.equal(box.version, 1); assert.equal(box.documents.length, 1);
    assert.equal(studyOf(box.documents[0]).title, `Saved control ${width}`);
    await save(p, `Saved control ${width}`);
    assert.equal(JSON.parse(await saved(p)).documents.length, 1, 'unchanged Save does not add a version');
    await p.reload(); await p.waitForFunction(() => window.view?.ready); await openStudy(p);
    await more(p, 'open');
    await p.locator(`${panel} [data-open]`).filter({ hasText: `Saved · Saved control ${width} · version 1` }).click(); await idle(p);
    assert.match(await p.locator('.study-label').textContent(), new RegExp(`Saved control ${width} · saved`), 'saved version survives reload and opens');
    await p.click('#study [data-study="test"]');
    await p.locator(`${panel} [name="lan"]`).fill('Td4-e4');
    await p.locator(`${panel} [name="expected"]`).selectOption('no');
    await p.locator(`${panel} button[type="submit"]`).click(); await idle(p);
    await p.click(`${panel} [data-run]`); await idle(p);
    assert.match(await p.locator(panel).textContent(), /failed · 6 of 7 checks pass/, 'a false declaration yields a real failed result');
    await closePanel(p);
    await save(p, `Saved control ${width}`);
    assert.deepEqual(JSON.parse(await saved(p)).documents.filter(d => studyOf(d).id === studyOf(box.documents[0]).id).map(d => studyOf(d).version), [1, 2], 'edit saves a new version');
    const before = await exportDoc(p), beforeStore = await saved(p), beforeState = await state(p);
    const chooser = p.waitForEvent('filechooser');
    await more(p, 'import');
    await (await chooser).setFiles({ name: 'study.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(before)) });
    await idle(p);
    assert.deepEqual(comparable(await exportDoc(p)), comparable(before), 'valid export imports without changed content');
    for (const corrupt of [ { ...before, schema: 'bad' }, (() => { const d = structuredClone(before); studyOf(d).engine = 'wrong-source'; return d; })(), (() => { const d = structuredClone(before); studyOf(d).actions = ['Td4-g4']; return d; })() ]) {
      await p.click('#study > .study-strip [data-study="more"]');
      await importDoc(p, corrupt);
      assert(await p.locator(`${panel} .study-panel-alert`).isVisible(), 'invalid import reveals its error inside the active panel');
      await closePanel(p);
      assert(await p.locator('#study > .study-alert').isVisible(), 'invalid import reports its error');
      assert.equal(await state(p), beforeState, 'invalid import leaves position intact');
      assert.equal(await saved(p), beforeStore, 'invalid import leaves saved versions intact');
      assert.deepEqual(comparable(await exportDoc(p)), comparable(before), 'invalid import leaves current document intact');
    }
    await p.evaluate(() => {
      const original = Storage.prototype.setItem;
      window.restoreStudyStorage = () => { Storage.prototype.setItem = original; };
      Storage.prototype.setItem = function(key, value) { if (key === 'kingdown.studies') throw new DOMException('Quota exceeded', 'QuotaExceededError'); return original.call(this, key, value); };
    });
    await save(p, 'Quota draft');
    assert.match(await p.locator('#study > .study-alert').textContent(), /not saved.*Export a copy/);
    await insideViewport(p, '#study > .study-alert');
    await shot(p, `studies-save-alert-${width}x${height}`);
    assert.equal(await saved(p), beforeStore, 'quota failure preserves the saved versions');
    assert.equal(studyOf(await exportDoc(p)).title, 'Quota draft', 'export still works after storage fails');
    await p.evaluate(() => window.restoreStudyStorage());
    await more(p, 'open');
    await p.locator(`${panel} [data-open]`).filter({ hasText: 'Example · rook-haste · version 1' }).click(); await idle(p);
    const haste = studyOf(await exportDoc(p)); haste.actions = [];
    await importDoc(p, haste);
    await p.click('#study [data-study="actions"]');
    await p.locator(`${panel} [data-move]`).filter({ hasText: /^Td4-d5!H$/ }).click(); await idle(p);
    assert.match(await state(p), /White to act.*1 recorded actions/, 'Haste keeps the same side after its complete action');
    await p.click('#study [data-study="actions"]');
    await p.locator(`${panel} [data-move]`).filter({ hasText: /^--$/ }).click(); await idle(p);
    assert.match(await state(p), /Black to act.*2 recorded actions/, 'Finish ends the held turn');
    assert.deepEqual(studyOf(await exportDoc(p)).actions, ['Td4-d5!H', '--']);
    const healthyStore = await saved(p);
    await p.evaluate(() => localStorage.setItem('kingdown.studies', '{bad'));
    await more(p, 'open');
    assert(await p.locator(`${panel} .study-panel-alert`).isVisible(), 'corrupt library reports its error inside the library');
    await closePanel(p);
    await p.evaluate(raw => localStorage.setItem('kingdown.studies', raw), healthyStore);
    const linked = linkedRecord(control);
    await importDoc(p, linked);
    await save(p, studyOf(linked).title);
    await p.click('#study [data-study="results"]');
    assert.match(await p.locator(panel).textContent(), /Measurement plan: current.*activity.*4 games.*2 blocks/s);
    assert.match(await p.locator(panel).textContent(), /Balance evidence.*approval not reviewed/s);
    assert.match(await p.locator(panel).textContent(), /Historical evidence.*source or settings do not match/s);
    await p.locator(`${panel} details summary`).first().click();
    await noSidewaysScroll(p); await shot(p, `studies-evidence-${width}x${height}`);
    await closePanel(p);
    assert.deepEqual((await exportDoc(p)).evidence, linked.evidence, 'export keeps the original context, validity and source hash');
    await runChecks(p);
    assert.match(await p.locator(panel).textContent(), /passed · 6 of 6 checks pass.*Balance evidence/s, 'interaction checks and balance evidence stay separate');
    await closePanel(p);
    await p.click('#study [data-study="actions"]');
    await p.locator(`${panel} [data-move]`).filter({ hasText: /^Td4-e4$/ }).click(); await idle(p);
    await p.click('#study [data-study="results"]');
    assert.match(await p.locator(panel).textContent(), /Measurement plan: stale/, 'a changed study does not retain a current plan');
    await closePanel(p);
    await p.click('#study [data-study="undo"]'); await idle(p);
    const badEvidence = structuredClone(linked); badEvidence.evidence[0].source.sha256 = 'bad';
    const beforeEvidence = await exportDoc(p);
    await importDoc(p, badEvidence);
    assert(await p.locator('#study > .study-alert').isVisible());
    assert.deepEqual(comparable(await exportDoc(p)), comparable(beforeEvidence), 'malformed evidence import preserves the document');
    await measurementControls(p, control, linked, width, height);
    await runControls(p, linked, width, height);
    await discoveryControls(p, control, width, height);
    await p.keyboard.press('Escape');
    assert.equal(await p.locator('#study').getAttribute('open'), null, 'Escape closes only the study');
    assert.notEqual(await p.locator('#workshop').getAttribute('open'), null, 'Workshop remains open');
    assert.equal(await p.evaluate(() => document.activeElement?.classList.contains('pg-more')), true, 'focus returns to Workshop More');
    assert.equal(await p.evaluate(() => JSON.stringify(window.view.pos)), live.board, 'studies leave the live position intact');
    assert.equal(await p.locator('#workshop .pg-board').innerHTML(), tryBoard, 'studies leave the Workshop Try board intact');
    const now = await p.evaluate(() => Object.fromEntries(Object.entries(localStorage).filter(([k]) => k !== 'kingdown.studies')));
    assert.deepEqual(now, Object.fromEntries(Object.entries(live.storage).filter(([k]) => k !== 'kingdown.studies')), 'studies do not change live game storage');
    await context.close();
  }
  assertNoErrors();
  console.log('studies: desktop, phone, actions, results, saved versions, measurement plans, historical evidence and atomic failures pass');
} finally { await browser.close(); }
