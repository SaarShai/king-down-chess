// D-8: Piece letters stay on after a reload and a look change (painted and clay), also when they are
// ticked in a lesson, where the saved game stays as it was. An old save with no letters field still
// loads, and ?labels=1 still turns the letters on. With the letters off, an old save keeps its
// settings as they were, so the account sync sees no change at start-up.
import assert from 'node:assert/strict';
import { startLesson, boardHelp, lanMoves, openExtra } from '../app-ui.mjs';

/** Records each view.setLabels() value in window.letters (main.ts sets window.view before its first setLabels). */
const recordLetters = () => {
  let view;
  Object.defineProperty(window, 'view', {
    configurable: true,
    get: () => view,
    set(v) { const set = v.setLabels.bind(v); v.setLabels = on => { window.letters = on; set(on); }; view = v; },
  });
};

const OLD_SAVE = { back: 'RNBQKBNR', fen: '', moves: ['e2-e4'], white: 'human', black: 'ai', sound: false, skill: 'club' };

/** The page's letters (box and board), its saved game and its settings. */
const probe = async ({ page, ready }) => {
  await page.context().addInitScript(recordLetters);
  const state = async () => ({ ...await page.evaluate(() => ({ box: document.getElementById('labels').checked, view: window.letters })), moves: (await lanMoves(page)).join(' ') });
  const letters = () => state().then(s => [s.box, s.view]);
  const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem('kingdown.save')));
  const settings = act => boardHelp(page, act);
  const reload = async () => { await page.reload(); await ready(); };
  const changeLook = async look => {
    await openExtra(page);
    await Promise.all([page.waitForURL(u => u.searchParams.get('look') === look), page.selectOption('#look', look)]);
    await ready();
  };
  const learn = async () => { await startLesson(page); await page.waitForFunction(() => /^Lesson 1 /.test(document.getElementById('turn').textContent)); };
  return { state, letters, saved, settings, reload, changeLook, learn };
};

export default async function ({ open }) {
  const plain = await open({ save: OLD_SAVE });
  const p = await probe(plain);
  assert.equal((await p.state()).box, false, 'an old save with no letters field: the letters stay off');
  assert.match((await p.state()).moves, /e4/, 'an old save with no letters field: its game loads');
  await p.settings(() => plain.page.check('#labels'));
  await p.reload();
  assert.deepEqual(await p.letters(), [true, true], 'the letters stay on after a reload');
  for (const look of ['clay', 'painted']) {
    await p.changeLook(look);
    assert.deepEqual(await p.letters(), [true, true], `the letters stay on after the look changes to ${look}`);
  }
  await p.settings(() => plain.page.uncheck('#labels'));
  await p.reload();
  assert.deepEqual(await p.letters(), [false, false], 'the letters stay off after a reload');
  await plain.close();

  // A lesson (Guide > Learn) never replaces the saved game, but a setting changed in it stays.
  const lesson = await open({ save: OLD_SAVE });
  const l = await probe(lesson);
  const game = ({ moves, back, white, black }) => ({ moves, back, white, black });
  const before = game(await l.saved());
  await l.learn();
  await l.settings(() => lesson.page.check('#labels'));
  assert.deepEqual(game(await l.saved()), before, 'letters ticked in a lesson: the saved game does not change');
  await l.reload();
  assert.deepEqual(await l.letters(), [true, true], 'letters ticked in a lesson stay on after a reload');
  assert.match((await l.state()).moves, /e4/, 'after a reload from a lesson, the saved game opens');
  await l.learn();
  await l.settings(() => lesson.page.uncheck('#labels'));
  await l.changeLook('clay');
  assert.deepEqual(await l.letters(), [false, false], 'letters unticked in a lesson stay off after a look change to clay');
  await l.learn();
  await l.settings(() => lesson.page.check('#labels'));
  await l.changeLook('painted');
  assert.deepEqual(await l.letters(), [true, true], 'letters ticked in a lesson stay on after a look change to painted');
  assert.deepEqual(game(await l.saved()), before, 'after the lessons, the saved game is as it was');
  await lesson.close();

  // A first visit on a phone: the title leads to Learn; letters ticked in the lesson stay on.
  const first = await open({ size: 'phone', title: true });
  const f = await probe(first);
  await first.page.locator('#title-learn').tap();
  await first.ready();
  await first.page.waitForFunction(() => /^Lesson 1 /.test(document.getElementById('turn').textContent));
  await boardHelp(first.page, () => first.page.locator('#labels').tap(), { tap: true });
  await f.reload();
  assert.deepEqual(await f.letters(), [true, true], 'first visit, phone: letters ticked in the first lesson stay on after a reload');
  await first.close();

  // An old save, stamped by the account sync before the letters existed: with the letters off, the
  // start-up save keeps its settings, so their time stays and newer settings in the account still win.
  const SETTINGS = { think: 800, skill: 'club', coords: true, sound: false, queen: false, pace: 'off', threats: false };
  const stamped = await open({ save: { ...OLD_SAVE, ...SETTINGS } });
  const s = await probe(stamped);
  const json = JSON.stringify(Object.fromEntries(Object.entries(SETTINGS).sort())); // account/sync.ts canon()
  await stamped.page.evaluate(json => localStorage.setItem('kingdown.sync', JSON.stringify({ settings: { at: 5, json } })), json);
  const settingsAt = async () => {
    await stamped.page.waitForFunction(() => !document.getElementById('account').hidden); // account.changed() has stamped
    return stamped.page.evaluate(() => JSON.parse(localStorage.getItem('kingdown.sync')).settings.at);
  };
  await s.reload();
  assert.equal('labels' in await s.saved(), false, 'letters off: the save has no letters field');
  assert.equal(await settingsAt(), 5, 'letters off: the start-up save does not count as a settings change');
  await s.settings(() => stamped.page.check('#labels'));
  assert.equal((await s.saved()).labels, true, 'letters on: the save holds them');
  assert.ok(await settingsAt() > 5, 'a real change of the letters gets a new time');
  await stamped.close();

  const url = await open({ save: { ...OLD_SAVE, labels: false }, query: '?labels=1' });
  assert.equal(await url.page.evaluate(() => document.getElementById('labels').checked), true, '?labels=1 turns the letters on over a saved off');
  await url.close();
}
