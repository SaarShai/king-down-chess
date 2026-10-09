// The New game dialog in a real browser: its defaults, the game each of the three modes starts
// (players, computer level, kings and powers), the king picker's power texts, Cancel, memory, an
// older save, a custom army, the keyboard, the phone layout, and the picker's motion art.
// Screenshots in PLAYABLE_OUT: desktop-computer.jpg, desktop-powers.jpg, phone-computer.jpg, phone-powers.jpg.
// Run: npm run check:browser new-game (it builds and serves the app; the settings are in tools/lib/checks.mjs).
import assert from 'node:assert/strict';
import { endTurn, lanMoves, pressMenu, waitForUi } from './app-ui.mjs';
import { assertNoErrors, env, insideViewport, launch, shot, trapErrors } from './lib/checks.mjs';
import { setUpGame, startGame } from './new-game-ui.mjs';

const base = env('PLAYABLE_URL');
const browser = await launch();
const jpeg = { type: 'jpeg', quality: 86 };
const ok = msg => console.log(`ok ${msg}`);

async function open({ viewport = { width: 1280, height: 900 }, touch = false, save = null, query = '', reducedMotion = 'no-preference' } = {}) {
  const ctx = await browser.newContext({ viewport, hasTouch: touch, isMobile: touch, reducedMotion });
  await ctx.addInitScript(s => {
    sessionStorage.setItem('kingdown.title-seen', '1'); // skip the title screen (main.ts)
    if (s && !sessionStorage.getItem('seeded')) { localStorage.setItem('kingdown.save', JSON.stringify(s)); sessionStorage.setItem('seeded', '1'); }
  }, save);
  const page = await ctx.newPage();
  trapErrors(page);
  await page.goto(base + query);
  await page.waitForFunction(() => window.view?.ready);
  await page.evaluate(() => window.view.ready());
  return page;
}
const saved = page => page.evaluate(() => JSON.parse(localStorage.getItem('kingdown.save')));
const checked = (page, name) => page.evaluate(n => document.querySelector(`#new-game input[name="${n}"]:checked`)?.value, name);
const pressed = (page, c) => page.evaluate(c => [...document.querySelectorAll(`#pick-${c} [aria-pressed="true"]`)].map(b => b.dataset.king ?? b.dataset.power), c);
const powerLine = (page, c) => page.textContent(`#pick-${c} .power-text`);
const shown = (page, id) => page.isVisible(`#${id}`);
/** Running CSS animations (not the buttons' own transitions) inside `sel`, and the properties they change. */
const motion = (page, sel) => page.evaluate(sel => {
  const box = document.querySelector(sel), anims = document.getAnimations().filter(a => a instanceof CSSAnimation && box.contains(a.effect?.target));
  const props = new Set(anims.flatMap(a => a.effect.getKeyframes().flatMap(k => Object.keys(k))));
  ['offset', 'easing', 'composite', 'computedOffset'].forEach(k => props.delete(k));
  return { running: anims.filter(a => a.playState === 'running').length, props: [...props].sort() };
}, sel);
/** The painted board draws each side's King with that king's sheet: waits until both are drawn as `kings`. */
const kingsDrawn = (page, kings) => page.waitForFunction(k => {
  const v = window.view.kings; return v && [...v.set, ...v.drawn].join() === [...k, ...k].join();
}, kings, { timeout: 10000 });
const info = (page, re) => page.waitForFunction(r => new RegExp(r, 's').test(document.getElementById('info').textContent), re.source, { timeout: 10000 });

try {
  // 1. Defaults on a first visit: Play the computer, Club, White, a random army; Spirit and Shadow.
  let page = await open();
  await pressMenu(page, 'New game');
  assert.deepEqual([await checked(page, 'mode'), await checked(page, 'level'), await checked(page, 'side')], ['computer', 'club', '0']);
  assert.equal(await page.inputValue('#army'), 'random');
  assert.equal(await page.evaluate(() => document.getElementById('more-options').open), false, 'More options starts folded');
  assert.equal(await shown(page, 'king-picker'), false, 'no king picker without powers');
  assert.equal(await page.locator('#modes input[type="radio"]').count(), 3);
  assert.equal(await page.getByRole('radio', { name: /Play the computer/ }).isChecked(), true);
  await shot(page, 'desktop-computer.jpg', jpeg);
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
  await shot(page, 'desktop-powers.jpg', jpeg);
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
  assert.equal(lines[9], 'Mercy (always on) — your king steps 1–2 squares and jumps your pieces, but takes only a pawn or a guard; your pieces next to it cannot be taken except by pawns.');
  assert.ok(lines.includes('Darkness (always on) — your pawns may also step diagonally, and take only straight ahead; your king may also step two squares in a straight line, over an empty square.'), lines.join('\n'));
  await page.click('#pick-0 .power-choice button[data-power=""]');
  assert.deepEqual(await pressed(page, 0), ['Shadow', '']);
  assert.equal(await powerLine(page, 0), 'No power: a plain chess king.');
  ok(`picker: six emblems a side in KINGS order, Spirit and Shadow first, ${lines.length} official power lines, No power`);

  // Motion art (src/power-motion.ts): hidden from screen readers, names unchanged; only the chosen
  // power and the chosen king move, and only by transform, opacity and a stroke draw.
  await page.click('#pick-0 .emblem[data-king="Frost"]');
  await page.mouse.move(1, 1);
  for (const [name, power] of [['Freeze', 'Freeze'], ['Ice Wall', 'IceWall'], ['No power', '']]) {
    assert.equal(await page.getByRole('group', { name: "White's power" }).getByRole('button', { name, exact: true }).getAttribute('data-power'), power, name);
  }
  assert.equal(await page.$$eval('#king-picker .pm, #king-picker .kx', es => es.every(e => e.closest('[aria-hidden="true"]'))), true, 'art is aria-hidden');
  assert.equal(await page.$$eval('#pick-0 .kx', es => es.filter(e => getComputedStyle(e).display !== 'none').map(e => e.closest('.emblem').dataset.king).join()), 'Frost,Frost');
  assert.ok((await motion(page, '#pick-0 .emblem[data-king="Frost"]')).running > 5, 'the chosen emblem is live');
  assert.equal((await motion(page, '#pick-0 .emblem[data-king="Flame"]')).running, 0, 'other emblems are still');
  const chosen = await motion(page, '#pick-0 .power-choice [data-slot="0"]');
  assert.ok(chosen.running >= 3, 'the chosen power plays');
  assert.equal((await motion(page, '#pick-0 .power-choice [data-slot="1"]')).running, 0, 'an idle power is still');
  await page.hover('#pick-0 .power-choice [data-slot="1"]');
  assert.ok((await motion(page, '#pick-0 .power-choice [data-slot="1"]')).running >= 3, 'hover plays it');
  await page.mouse.move(1, 1);
  const props = new Set();
  for (const king of ['Frost', 'Flame', 'Stratus', 'Mud', 'Spirit', 'Shadow']) {
    await page.click(`#pick-0 .emblem[data-king="${king}"]`);
    for (const slot of ['0', '1']) {
      await page.click(`#pick-0 .power-choice [data-slot="${slot}"]`);
      (await motion(page, '#pick-0')).props.forEach(p => props.add(p));
    }
  }
  assert.deepEqual([...props].sort(), ['opacity', 'strokeDashoffset', 'transform'], 'compositor-friendly properties only');
  ok('motion art: names and pressed states unchanged, art hidden from screen readers; only the chosen power, a hovered one and the chosen emblem move, by transform, opacity and a stroke draw');

  // Cancel drops the changes: the dialog opens again on the last game's setup.
  await page.keyboard.press('Escape');
  await pressMenu(page, 'New game');
  assert.equal(await checked(page, 'mode'), 'computer', 'Cancel keeps the last setup');
  await page.keyboard.press('Escape');
  ok('Cancel: the changes are dropped');

  // 2. Play the computer (the default) starts White against the Club computer with no powers.
  await startGame(page);
  let s = await saved(page);
  assert.deepEqual([s.white, s.black, s.skill, s.rules.kings], ['human', 'ai', 'club', [null, null]]);
  assert.match(s.back, /^[A-Z]{8}$/);
  assert.equal(await page.isHidden('#powers'), true, 'no power bar');
  await kingsDrawn(page, ['spirit', 'shadow']);
  ok('Play the computer: White against the Club computer, kings without powers, drawn as Spirit and Shadow');

  // As Black against the beginner: the computer opens and the board turns round.
  await startGame(page, { mode: 'computer', level: 'beginner', side: 'black', army: 'classic' });
  s = await saved(page);
  assert.deepEqual([s.white, s.black, s.skill, s.back], ['ai', 'human', 'beginner', 'RNBQKBNR']);
  await waitForUi(page, ui => ui.lan.length >= 1, null, { timeout: 20000 });
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
  await kingsDrawn(page, ['mud', 'shadow']); // a king with no power is drawn as the plain king
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
  await kingsDrawn(page, ['flame', 'stratus']); // the chosen kings, each in its army's colour
  ok("Two players: two people; with the Kings' powers box, Flame Haste against Stratus Flight, drawn as Flame and Stratus");

  // 5. The dialog remembers the last game's setup across a reload.
  await page.reload(); await page.waitForFunction(() => window.view?.ready);
  await pressMenu(page, 'New game');
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
  await pressMenu(page, 'New game');
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
  await pressMenu(page, 'New game');
  assert.deepEqual([await checked(page, 'mode'), await checked(page, 'level'), await checked(page, 'side')], ['powers', 'strong', '1']);
  assert.deepEqual(await pressed(page, 0), ['Frost', 'Freeze']);
  assert.deepEqual(await pressed(page, 1), ['Shadow', '']);
  await page.context().close();
  ok("an older save: Kings' powers, Strong, you play Black, Frost Freeze against Shadow with no power");

  // 9. `?rules=2017` plays the powers as printed (the preset overrides the official readings, as newGame
  // sets them), so the picker shows them so, and the game it starts plays the line the picker showed.
  page = await open({ query: '?rules=2017' });
  await setUpGame(page, { mode: 'powers', kings: ['Frost:Freeze', 'Spirit:Mercy'] });
  const freeze2017 = 'Freeze (2 per game) — as your move, freeze an enemy piece (not the king): it cannot move on its next turn.';
  assert.equal(await powerLine(page, 0), freeze2017);
  assert.equal(await powerLine(page, 1), 'Mercy (always on) — your king steps 1–2 squares and jumps your pieces, but takes only a guard.');
  await page.click('#pick-1 .emblem[data-king="Shadow"]');
  await page.click('#pick-1 .power-choice button[data-power="Darkness"]');
  assert.equal(await powerLine(page, 1), 'Darkness (always on) — your pawns step diagonally and take straight ahead, with no double step.');
  await startGame(page, { army: 'classic' });
  await info(page, /White's king: Freeze, 2 left — as your move, freeze an enemy piece \(not the king\): it cannot move on its next turn/);
  await page.context().close();
  ok('?rules=2017: the picker shows the printed powers (Freeze twice, Mercy, Darkness), and the game plays them');

  // The sheet replaces the Start question with a warn line. Close keeps the game.
  page = await open({ save: { back: 'RNBQKBNR', fen: '', moves: ['e2-e4', 'e7-e5'], white: 'human', black: 'human', sound: false, skill: 'club' } });
  await pressMenu(page, 'New game');
  assert.equal(await page.textContent('#new-game-warn'), 'This ends your game at move 2.');
  assert.equal(await page.textContent('#start-game'), 'Start new game');
  await page.click('#new-game button[value="cancel"]');
  assert.deepEqual((await saved(page)).moves, ['e2-e4', 'e7-e5']);
  await startGame(page);
  assert.deepEqual((await saved(page)).moves, []);
  await page.context().close();
  ok('warn line: names the move; Close keeps the game; Start ends it without a question');
  page = await open();
  await startGame(page, { mode: 'two', army: 'MMSSNBNK' });
  assert.equal((await saved(page)).back, 'MMSSNBNK');
  await setUpGame(page, { army: null });
  assert.equal(await page.inputValue('#army'), 'MMSSNBNK');
  await page.click('#more-options summary');
  assert.equal(await page.evaluate(() => document.getElementById('other-armies').open), true);
  await page.context().close();
  ok('More: Start uses the example army and remembers it when the sheet opens again');

  // A staged mate is still a live game, also when a lesson keeps it.
  page = await open({ save: { back: 'RNBQKBNR', fen: '', moves: ['f2-f3', 'e7-e5', 'g2-g4'], white: 'human', black: 'human', sound: false, skill: 'club', pace: 'off' } });
  for (const sq of [59, 31]) {
    const p = await page.evaluate(s => window.view.screenOf(s), sq);
    await page.mouse.click(p.x, p.y);
  }
  await waitForUi(page, ui => ui.lan.length === 4);
  await page.waitForFunction(() => document.getElementById('end-turn').getAttribute('aria-disabled') === 'false');
  await pressMenu(page, 'New game');
  assert.equal(await page.textContent('#new-game-warn'), 'This ends your game at move 2.');
  assert.equal(await page.textContent('#start-game'), 'Start new game');
  await page.keyboard.press('Escape');
  assert.equal((await lanMoves(page)).length, 4, 'Close keeps the staged mate');
  await pressMenu(page, 'Guide'); await page.click('#learn');
  await pressMenu(page, 'New game');
  assert.equal(await page.textContent('#new-game-warn'), 'This ends your game at move 2.', 'the lesson keeps the staged game');
  await page.keyboard.press('Escape');
  await page.click('#return-game');
  await endTurn(page);
  await page.locator('#over').waitFor({ state: 'visible' });
  await page.keyboard.press('Escape');
  await pressMenu(page, 'New game');
  assert.equal(await page.isHidden('#new-game-warn'), true, 'a handed-over mate needs no warning');
  assert.equal(await page.textContent('#start-game'), 'Start game');
  await startGame(page, { mode: 'two', army: 'classic' });
  assert.deepEqual((await saved(page)).moves, []);
  assert.equal(await page.getAttribute('#end-turn', 'aria-disabled'), 'true', 'Start resets the turn boundary');
  await page.context().close();
  ok('staged mate: the live and kept games warn at the turn boundary; the press ends it; Start resets the turn');

  for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
    page = await open({ viewport, touch: true });
    for (const mode of ['computer', 'powers', 'two']) {
      await setUpGame(page, { mode, powers: mode === 'two' ? true : undefined, army: 'MMSSNBNK' });
      await insideViewport(page, '#start-game');
      assert.equal(await page.inputValue('#army'), 'MMSSNBNK');
      assert.equal(await page.evaluate(() => document.getElementById('other-armies').open), true);
    }
    await page.context().close();
  }
  ok('sheet: Start stays in view in all modes at 390×844 and 844×390; More keeps the example army');

  // 10. Phone 390×844: no sideways scroll in any mode, More options open; screenshots.
  page = await open({ viewport: { width: 390, height: 844 }, touch: true });
  await pressMenu(page, 'New game');
  await shot(page, 'phone-computer.jpg', jpeg);
  await page.click('#more-options summary');
  for (const mode of ['computer', 'powers', 'two']) {
    await page.click(`label:has(#mode-${mode})`);
    if (mode === 'two') await page.check('#two-powers');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.getElementById('new-game').scrollWidth <= document.getElementById('new-game').clientWidth), mode);
    if (mode === 'powers') await shot(page, 'phone-powers.jpg', jpeg);
  }
  // The power buttons with their pictures: 44 px targets or more, labels whole and at 14 px.
  for (const b of await page.$$eval('#king-picker .power-choice button', bs => bs.map(b => {
    const r = b.getBoundingClientRect(), l = b.querySelector('.pm-label');
    return { w: r.width, h: r.height, fs: parseFloat(getComputedStyle(l).fontSize), whole: l.scrollWidth <= l.clientWidth + 1 };
  }))) assert.ok(b.w >= 44 && b.h >= 44 && b.fs >= 14 && b.whole, JSON.stringify(b));
  await page.context().close();
  ok('phone: no sideways scroll in the three modes with More options open; power buttons 44 px or more with whole 14 px labels');

  // 11. Reduced motion: nothing in the picker moves; each picture keeps its still frame.
  page = await open({ reducedMotion: 'reduce' });
  await pressMenu(page, 'New game');
  await page.click('label:has(#mode-powers)');
  await page.click('#pick-0 .emblem[data-king="Frost"]');
  assert.equal((await motion(page, '#king-picker')).running, 0);
  assert.equal(await page.$eval('#pick-0 .fz-ice', e => getComputedStyle(e).opacity), '1', 'the Freeze still shows the ice');
  await page.context().close();
  ok('reduced motion: no animation in the picker; the still frames show the powers');

  // 12. Settings → Animations Off stills the picker too: no picture or emblem moves; the still frames show.
  page = await open();
  await page.evaluate(() => { const s = document.getElementById('pace'); s.value = 'off'; s.dispatchEvent(new Event('change')); });
  await pressMenu(page, 'New game');
  await page.click('label:has(#mode-powers)');
  await page.click('#pick-0 .emblem[data-king="Frost"]');
  await page.hover('#pick-0 .power-choice button[data-power="IceWall"]');
  assert.equal((await motion(page, '#king-picker')).running, 0);
  assert.equal(await page.$eval('#pick-0 .fz-ice', e => getComputedStyle(e).opacity), '1', 'the Freeze still shows the ice');
  await page.context().close();
  ok('Animations Off: no animation in the picker (chosen power, hovered power, live emblem); the still frames show the powers');

  assertNoErrors();
  ok('no page or console errors');
} finally { await browser.close(); }
