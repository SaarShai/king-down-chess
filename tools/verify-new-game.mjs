// The New game dialog in a real browser: its defaults, the game each of the three modes starts
// (players, computer level, kings and powers), the king picker's power texts, Cancel, memory, an
// older save, a custom army, the keyboard, and the phone layout. Screenshots: docs/visual-design/new-game/.
// Needs a running build: PLAYABLE_URL=http://127.0.0.1:5189/ node tools/verify-new-game.mjs
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { setUpGame, startGame } from './new-game-ui.mjs';

const base = process.env.PLAYABLE_URL || 'http://127.0.0.1:5189/';
const out = 'docs/visual-design/new-game';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ headless: true, channel: process.env.PLAYABLE_BROWSER || 'chrome' });
const errors = [];
const ok = msg => console.log(`ok ${msg}`);

async function open({ viewport = { width: 1280, height: 900 }, touch = false, save = null } = {}) {
  const ctx = await browser.newContext({ viewport, hasTouch: touch, isMobile: touch });
  await ctx.addInitScript(s => {
    sessionStorage.setItem('kingdown.title-seen', '1'); // skip the title screen (main.ts)
    if (s && !sessionStorage.getItem('seeded')) { localStorage.setItem('kingdown.save', JSON.stringify(s)); sessionStorage.setItem('seeded', '1'); }
  }, save);
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(base);
  await page.waitForFunction(() => window.view?.ready);
  await page.evaluate(() => window.view.ready());
  return page;
}
const saved = page => page.evaluate(() => JSON.parse(localStorage.getItem('kingdown.save')));
const checked = (page, name) => page.evaluate(n => document.querySelector(`#new-game input[name="${n}"]:checked`)?.value, name);
const pressed = (page, c) => page.evaluate(c => [...document.querySelectorAll(`#pick-${c} [aria-pressed="true"]`)].map(b => b.dataset.king ?? b.dataset.power), c);
const powerLine = (page, c) => page.textContent(`#pick-${c} .power-text`);
const shown = (page, id) => page.isVisible(`#${id}`);
const info = (page, re) => page.waitForFunction(r => new RegExp(r, 's').test(document.getElementById('info').textContent), re.source, { timeout: 10000 });

try {
  // 1. Defaults on a first visit: Play the computer, Club, White, a random army; Spirit and Shadow.
  let page = await open();
  await page.click('#new-game-btn');
  assert.deepEqual([await checked(page, 'mode'), await checked(page, 'level'), await checked(page, 'side')], ['computer', 'club', '0']);
  assert.equal(await page.inputValue('#army'), 'random');
  assert.equal(await page.evaluate(() => document.getElementById('more-options').open), false, 'More options starts folded');
  assert.equal(await shown(page, 'king-picker'), false, 'no king picker without powers');
  assert.equal(await page.locator('#modes input[type="radio"]').count(), 3);
  assert.equal(await page.getByRole('radio', { name: /Play the computer/ }).isChecked(), true);
  await page.screenshot({ path: `${out}/desktop-computer.jpg`, type: 'jpeg', quality: 86 });
  ok('defaults: Play the computer, Club, you play White, Random King Down army, no picker');

  // Kings' powers: each side's six emblems in the KINGS order, Spirit and Shadow chosen, first powers.
  await page.click('label:has(#mode-powers)');
  assert.equal(await shown(page, 'king-picker'), true);
  for (const c of [0, 1]) {
    assert.deepEqual(await page.$$eval(`#pick-${c} .emblem`, bs => bs.map(b => b.textContent)), ['Frost', 'Flame', 'Stratus', 'Mud', 'Spirit', 'Shadow']);
    assert.ok(await page.$$eval(`#pick-${c} .emblem img`, imgs => Promise.all(imgs.map(i => i.decode().then(() => i.naturalWidth > 0, () => false))).then(r => r.every(Boolean))), 'every emblem loads');
  }
  assert.deepEqual(await pressed(page, 0), ['Spirit', 'HolyLight']);
  assert.deepEqual(await pressed(page, 1), ['Shadow', 'DeathTouch']);
  assert.equal(await page.getByRole('group', { name: "White's king" }).getByRole('button', { name: 'Spirit', pressed: true }).count(), 1);
  assert.equal(await powerLine(page, 0), 'Holy Light (always on) — enemy pawns cannot take your king; your pieces beside, in front of or behind it cannot be taken.');
  assert.equal(await powerLine(page, 1), 'Death Touch (always on) — your king takes an enemy next to it, or two squares away straight forward, back or sideways over an empty square, without moving — it can only take this way.');
  assert.match(await page.textContent('#pick-0 h3'), /you/);
  assert.match(await page.textContent('#pick-1 h3'), /computer/);
  await page.screenshot({ path: `${out}/desktop-powers.jpg`, type: 'jpeg', quality: 86 });
  // Every king's two powers, with the official count and line; No power names a plain king.
  const lines = [];
  for (const king of ['Frost', 'Flame', 'Stratus', 'Mud', 'Spirit', 'Shadow']) {
    await page.click(`#pick-0 .emblem[data-king="${king}"]`);
    const [first, second] = await page.$$eval('#pick-0 .power-choice button', bs => bs.slice(0, 2).map(b => b.dataset.power));
    assert.deepEqual(await pressed(page, 0), [king, first], `${king}: its first power`);
    lines.push(await powerLine(page, 0));
    await page.click(`#pick-0 .power-choice button[data-power="${second}"]`);
    lines.push(await powerLine(page, 0));
  }
  assert.equal(new Set(lines).size, 12, 'twelve different power lines');
  assert.ok(lines.every(l => /^[A-Z][a-zA-Z ]+ \((\d per game|always on)\) — [a-z].+\.$/.test(l)), lines.join('\n'));
  assert.equal(lines[0], 'Freeze (1 per game) — freeze an enemy piece (not the king), then make your move: the frozen piece cannot move on its next turn.');
  await page.click('#pick-0 .power-choice button[data-power=""]');
  assert.deepEqual(await pressed(page, 0), ['Shadow', '']);
  assert.equal(await powerLine(page, 0), 'No power: a plain chess king.');
  ok(`picker: six emblems a side in KINGS order, Spirit and Shadow first, ${lines.length} official power lines, No power`);

  // Cancel drops the changes: the dialog opens again on the last game's setup.
  await page.keyboard.press('Escape');
  await page.click('#new-game-btn');
  assert.equal(await checked(page, 'mode'), 'computer', 'Cancel keeps the last setup');
  await page.keyboard.press('Escape');
  ok('Cancel: the changes are dropped');

  // 2. Play the computer (the default) starts White against the Club computer with no powers.
  await startGame(page);
  let s = await saved(page);
  assert.deepEqual([s.white, s.black, s.skill, s.rules.kings], ['human', 'ai', 'club', [null, null]]);
  assert.match(s.back, /^[A-Z]{8}$/);
  assert.equal(await page.isHidden('#powers'), true, 'no power bar');
  ok('Play the computer: White against the Club computer, kings without powers');

  // As Black against the beginner: the computer opens and the board turns round.
  await startGame(page, { mode: 'computer', level: 'beginner', side: 'black', army: 'classic' });
  s = await saved(page);
  assert.deepEqual([s.white, s.black, s.skill, s.back], ['ai', 'human', 'beginner', 'RNBQKBNR']);
  await page.waitForFunction(() => document.querySelectorAll('#moves [data-ply]').length >= 1, null, { timeout: 20000 });
  const [a1, a8] = await page.evaluate(() => [window.view.screenOf(0), window.view.screenOf(56)]);
  assert.ok(a8.y > a1.y, 'Black at the bottom');
  ok('Play the computer as Black: the beginner computer moves first, the board turns round');

  // 3. Kings' powers: the default kings play their first powers against the computer.
  await startGame(page, { mode: 'powers', side: 'white', level: 'club', army: 'classic' });
  s = await saved(page);
  assert.deepEqual([s.white, s.black, s.skill], ['human', 'ai', 'club']);
  assert.deepEqual(s.rules.kings, [{ king: 'Spirit', power: 'HolyLight' }, { king: 'Shadow', power: 'DeathTouch' }]);
  await info(page, /White's king: Holy Light — .*Black's king: Death Touch — /);
  // Other kings, and No power for one side.
  await startGame(page, { mode: 'powers', kings: ['Mud:March', 'Frost:none'], army: 'classic' });
  s = await saved(page);
  assert.deepEqual(s.rules.kings, [{ king: 'Mud', power: 'March' }, null]);
  await info(page, /White's king: March — .*Black's king: no power/);
  ok("Kings' powers: Spirit Holy Light and Shadow Death Touch by default; Mud March against a king with no power");

  // 4. Two players: both sides on this device; the Kings' powers box adds the picker.
  await startGame(page, { mode: 'two' });
  s = await saved(page);
  assert.deepEqual([s.white, s.black, s.rules.kings], ['human', 'human', [null, null]]);
  await setUpGame(page, { mode: 'two', powers: true });
  assert.equal(await shown(page, 'king-picker'), true);
  assert.equal(await shown(page, 'level'), false, 'no computer level for two people');
  assert.equal(await shown(page, 'side-choice'), false);
  assert.deepEqual(await pressed(page, 0), ['Mud', 'March'], 'the picker keeps the last kings');
  assert.deepEqual(await pressed(page, 1), ['Frost', 'Freeze'], 'turning powers on gives a king with no power its first power');
  await startGame(page, { kings: ['Flame:Haste', 'Stratus:Flight'], army: 'classic' });
  s = await saved(page);
  assert.deepEqual([s.white, s.black], ['human', 'human']);
  assert.deepEqual(s.rules.kings, [{ king: 'Flame', power: 'Haste' }, { king: 'Stratus', power: 'Flight' }]);
  ok("Two players: two people; with the Kings' powers box, Flame Haste against Stratus Flight");

  // 5. The dialog remembers the last game's setup across a reload.
  await page.reload(); await page.waitForFunction(() => window.view?.ready);
  await page.click('#new-game-btn');
  assert.equal(await checked(page, 'mode'), 'two');
  assert.equal(await page.isChecked('#two-powers'), true);
  assert.deepEqual(await pressed(page, 0), ['Flame', 'Haste']);
  await page.keyboard.press('Escape');
  ok('memory: a reload opens New game on the last setup');

  // 6. A custom army asks for the back rank; Cancel there keeps the dialog open.
  page.once('dialog', d => d.dismiss());
  await setUpGame(page, { army: 'custom' }); await page.click('#start-game');
  assert.equal(await page.evaluate(() => document.getElementById('new-game').open), true, 'a cancelled custom army starts nothing');
  page.once('dialog', d => d.accept('rmbqkbnr'));
  await page.click('#start-game');
  await page.waitForFunction(() => !document.getElementById('new-game').open);
  assert.equal((await saved(page)).back, 'RMBQKBNR');
  ok('Custom army: the back rank prompt starts that army; Cancel keeps the dialog open');

  // 7. Keyboard: the modes are one radio group; arrows move through it.
  await page.click('#new-game-btn');
  await page.focus('#mode-two');
  await page.keyboard.press('ArrowUp');
  assert.equal(await checked(page, 'mode'), 'powers');
  assert.equal(await shown(page, 'level'), true);
  await page.keyboard.press('ArrowUp');
  assert.equal(await checked(page, 'mode'), 'computer');
  assert.equal(await shown(page, 'king-picker'), false);
  await page.keyboard.press('Escape');
  await page.context().close();
  ok('keyboard: the arrow keys step through the three modes');

  // 8. A save from before the dialog remembered its setup: New game opens on that game.
  page = await open({ save: { back: 'RNBQKBNR', fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1', moves: [], white: 'ai', black: 'human', skill: 'strong', rules: { kings: [{ king: 'Frost', power: 'Freeze' }, null] }, sound: false } });
  await page.click('#new-game-btn');
  assert.deepEqual([await checked(page, 'mode'), await checked(page, 'level'), await checked(page, 'side')], ['powers', 'strong', '1']);
  assert.deepEqual(await pressed(page, 0), ['Frost', 'Freeze']);
  assert.deepEqual(await pressed(page, 1), ['Shadow', '']);
  await page.context().close();
  ok("an older save: Kings' powers, Strong, you play Black, Frost Freeze against Shadow with no power");

  // 9. Phone 390×844: no sideways scroll in any mode, More options open; screenshots.
  page = await open({ viewport: { width: 390, height: 844 }, touch: true });
  await page.click('#new-game-btn');
  await page.screenshot({ path: `${out}/phone-computer.jpg`, type: 'jpeg', quality: 86 });
  await page.click('#more-options summary');
  for (const mode of ['computer', 'powers', 'two']) {
    await page.click(`label:has(#mode-${mode})`);
    if (mode === 'two') await page.check('#two-powers');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.getElementById('new-game').scrollWidth <= document.getElementById('new-game').clientWidth), mode);
    if (mode === 'powers') await page.screenshot({ path: `${out}/phone-powers.jpg`, type: 'jpeg', quality: 86 });
  }
  await page.context().close();
  ok('phone: no sideways scroll in the three modes with More options open');

  assert.deepEqual(errors, []);
  ok('no page errors');
} finally { await browser.close(); }
