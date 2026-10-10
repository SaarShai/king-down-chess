#!/usr/bin/env node
import { powerButtonText, usePower, endTurn } from './app-ui.mjs';
/**
 * Browser QA for the takeover changes. The runner builds the app, serves the build and runs this check:
 *
 *   npm run check:browser qa                 # QA_ONLY=<part of a case id> runs the matching cases only
 *
 * The settings (PLAYABLE_URL, PLAYABLE_BROWSER) come from the shared module tools/lib/checks.mjs.
 *
 * Cases: the paladin rule through the UI (default / 2017), the lab pieces' selection, shove and lob
 * targeting, animation state, undo, save/restore of the active rules, and an AI reply in a lab
 * position. Real mouse clicks; the hover probe works around the camera angle (LESSONS.md 2026-09-14).
 *
 * Verdicts: PASS, FAIL, XFAIL (a known-red case fails) and XPASS (a known-red case passes). FAIL and
 * XPASS fail the run; the last line counts each verdict.
 *
 * To add a known-red case: open a ticket in docs/specs/<feature>/issues/ that names the case and its
 * fault, then add "<case id>": "<ticket path>" to tools/qa-known-red.json. When the fault is fixed, the
 * case gives XPASS: remove the entry and resolve the ticket. The ticket lint in npm test fails on an
 * entry whose ticket file is missing, resolved or wontfix.
 */
import { readFileSync } from 'node:fs';
import { lanMoves } from './app-ui.mjs';
import { startGame } from './new-game-ui.mjs';
import { assertNoErrors, env, launch, trapErrors } from './lib/checks.mjs';
import { classify, verdict } from './lib/known-red.mjs';

const BASE = env('PLAYABLE_URL');
/** The known-red list: a case id to the path of its open ticket. */
const KNOWN_RED = JSON.parse(readFileSync(new URL('./qa-known-red.json', import.meta.url), 'utf8'));
/** `QA_ONLY=substring` runs the matching cases only (quick regression checks). */
const ONLY = process.env.QA_ONLY;
const PAWN_FEN = '7k/7p/8/3p4/3L4/8/8/K6R w - - 0 1';
const OGRE_FRIEND_FEN = '7k/8/8/8/3PO3/8/8/7K w - - 0 1';   // Ogre e4, own pawn d4
const OGRE_ENEMY_FEN = '7k/8/8/8/3pO3/8/8/7K w - - 0 1';    // Ogre e4, black pawn d4
const CATAPULT_FEN = '7k/8/2n5/8/2p5/8/8/2C4K w - - 0 1';  // C c1, screen p c4, knight c6

const sqOf = n => (('abcdefgh'.indexOf(n[0])) | ((+n[1] - 1) << 3));
const results = [];
const pass = (id, ok, detail) => {
  results.push({ id, ok, detail });
  const ticket = KNOWN_RED[id];
  console.log(`${verdict(ok, ticket)} ${id} — ${detail}${ticket ? ` (known-red: ${ticket})` : ''}`);
};
const CODE = { L: 8, l: 24, p: 17, n: 18, O: 12, C: 13, k: 22, P: 1, N: 2, Q: 5, A: 7 }; // type | colour<<4

const browser = await launch();

async function newPage() {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.addInitScript(() => sessionStorage.setItem('kingdown.title-seen', '1')); // skip the title screen (main.ts)
  await ctx.addInitScript(() => localStorage.setItem('kingdown.look', 'clay')); // painted is the default look
  const page = await ctx.newPage();
  const errors = trapErrors(page);
  return { ctx, page, errors };
}

/** `players`: who plays White and Black (`?players=`, main.ts); two people unless a case says otherwise. */
async function boot(page, query, { players = 'human,human' } = {}) {
  await page.goto(BASE + query + (query ? '&' : '?') + `players=${players}`);
  await page.waitForFunction(() => window.view && document.getElementById('setup').title.length > 5, null, { timeout: 40000 });
}

/** Hover first and read `#hover`; a tall mesh covers the tile centre behind it at this camera. */
async function clickSq(page, name, shift = false) {
  const pt = await page.evaluate(s => window.view.screenOf(s), sqOf(name));
  for (const dy of [0, -18, -34, -8, -26]) {
    await page.mouse.move(pt.x, pt.y + dy);
    await page.waitForTimeout(60);
    if (await page.evaluate(() => document.getElementById('hover').textContent) === name) {
      if (shift) await page.keyboard.down('Shift');
      await page.mouse.click(pt.x, pt.y + dy);
      if (shift) await page.keyboard.up('Shift');
      return;
    }
  }
  throw new Error(`no pixel over ${name} picks it`);
}

const snap = async page => ({
  ...await page.evaluate(() => ({
    fen: document.getElementById('setup').title,
    info: document.getElementById('context-text').textContent,
    scene: Object.fromEntries([...window.view.pieces].map(([sq, g]) => [sq, g.userData.code])),
  })),
  moves: (await lanMoves(page)).join(' '),
});
const waitPly = (page, n) => page.waitForFunction(n => {
  try { return (JSON.parse(localStorage.getItem('kingdown.save') || '{}').moves || []).length === n; } catch { return false; }
}, n, { timeout: 40000 });

async function caseFn(id, query, fn, opts = {}) {
  if (ONLY && !id.includes(ONLY)) return;
  const { ctx, page, errors } = await newPage();
  try {
    await boot(page, query, opts);
    const out = await fn(page, errors);
    const ok = out && typeof out === 'object' && 'ok' in out ? out.ok : !out || out === true;
    if (ok) assertNoErrors(errors); // a page error that the case did not check fails it too
    pass(id, ok, out && typeof out === 'object' ? out.detail ?? '' : typeof out === 'string' ? out : 'ok');
  } catch (e) {
    pass(id, false, (e && e.message) || String(e));
  } finally { await ctx.close(); }
}

// ---------------------------------------------------------------------------------------------
// Rule identity through the UI: the paladin default, 2017, and a save restored without its URL.

const paladinCase = (id, query, survives) => caseFn(id, query, async (page, errors) => {
  await clickSq(page, 'd4');
  await page.waitForTimeout(200);
  await clickSq(page, 'd5');
  await waitPly(page, 1);
  await page.waitForTimeout(800);
  const s = await snap(page);
  const d5 = sqOf('d5'), d4 = sqOf('d4');
  const ok = s.moves.includes('Ld4xd5')
    && (s.scene[d5] === CODE.L) === survives
    && s.scene[d4] === undefined
    && errors.length === 0;
  return ok ? true : `moves="${s.moves}" d5=${s.scene[d5] ?? 'empty'} d4=${s.scene[d4] ?? 'empty'} errors=${errors.join(' | ')}`;
});

await paladinCase('paladin default: survives the pawn capture', `?fen=${encodeURIComponent(PAWN_FEN)}`, true);
await paladinCase('paladin ?rules=2017: dies on the pawn capture', `?rules=2017&fen=${encodeURIComponent(PAWN_FEN)}`, false);

// The 2021 preset through the real UI: its archer may not step diagonally (`archerMove='fwdBack'`),
// where the shipped archer may. One position, two clicks, opposite results.
const ARCHER_FEN = '7k/8/8/8/3A4/8/8/K7 w - - 0 1';
await caseFn('default archer steps diagonally', `?fen=${encodeURIComponent(ARCHER_FEN)}`, async (page, errors) => {
  await clickSq(page, 'd4');
  await clickSq(page, 'e5');
  await waitPly(page, 1);
  await page.waitForTimeout(400);
  const s = await snap(page);
  const ok = s.moves.includes('Ad4-e5') && s.scene[sqOf('e5')] === CODE.A && errors.length === 0;
  return ok ? true : `moves="${s.moves}" e5=${s.scene[sqOf('e5')] ?? 'empty'} errors=${errors.join(' | ')}`;
});
await caseFn('?rules=2021 archer has no diagonal step', `?rules=2021&fen=${encodeURIComponent(ARCHER_FEN)}`, async (page, errors) => {
  await clickSq(page, 'd4');
  await clickSq(page, 'e5');
  await page.waitForTimeout(600);
  const s = await snap(page);
  const ok = s.moves === '' && s.scene[sqOf('d4')] === CODE.A && s.scene[sqOf('e5')] === undefined && errors.length === 0;
  return ok ? true : `moves="${s.moves}" d4=${s.scene[sqOf('d4')] ?? 'empty'} e5=${s.scene[sqOf('e5')] ?? 'empty'} errors=${errors.join(' | ')}`;
});

// Save/restore: play under 2017, reload with no query at all, and the paladin must still be gone.
await caseFn('save/restore keeps the active rules', `?rules=2017&fen=${encodeURIComponent(PAWN_FEN)}`, async (page, errors) => {
  await clickSq(page, 'd4');
  await clickSq(page, 'd5');
  await waitPly(page, 1);
  await page.goto(BASE); // no ?rules, no ?fen: the autosave is the only source
  await page.waitForFunction(() => window.view && document.getElementById('setup').title.length > 5, null, { timeout: 40000 });
  await waitPly(page, 1); // the restored move list is the signal that replay finished
  await page.waitForTimeout(400);
  const s = await snap(page);
  const d5 = sqOf('d5');
  const ok = s.moves.includes('Ld4xd5') && s.scene[d5] === undefined && errors.length === 0;
  return ok ? true : `restored moves="${s.moves}" d5=${s.scene[d5] ?? 'empty'} errors=${errors.join(' | ')}`;
});

// ---------------------------------------------------------------------------------------------
// Lab pieces: selection, shove/lob targeting, animation state and undo.

await caseFn('ogre shoves a friend (plain click) and undo', `?fen=${encodeURIComponent(OGRE_FRIEND_FEN)}`, async (page, errors) => {
  await clickSq(page, 'e4');
  await clickSq(page, 'd4'); // a friend can only be shoved, so no modifier is needed
  await waitPly(page, 1);
  await page.waitForTimeout(900);
  let s = await snap(page);
  const bad = [];
  if (!s.moves.includes('Oe4>d4-c4')) bad.push(`moves="${s.moves}"`);
  // Default ogreMode 'push': the Ogre follows onto the square it shoved from.
  if (s.scene[sqOf('d4')] !== CODE.O) bad.push(`ogre d4=${s.scene[sqOf('d4')] ?? 'empty'}`);
  if (s.scene[sqOf('c4')] !== CODE.P) bad.push(`pawn c4=${s.scene[sqOf('c4')] ?? 'empty'}`);
  if (s.scene[sqOf('e4')] !== undefined) bad.push(`e4=${s.scene[sqOf('e4')] ?? 'empty'}`);
  await page.click('#undo');
  await waitPly(page, 0);
  await page.waitForTimeout(500);
  s = await snap(page);
  if (s.fen !== OGRE_FRIEND_FEN) bad.push(`undo fen ${s.fen}`);
  if (s.scene[sqOf('d4')] !== CODE.P) bad.push(`undo d4=${s.scene[sqOf('d4')] ?? 'empty'}`);
  if (errors.length) bad.push(errors.join(' | '));
  return bad.length ? bad.join('; ') : true;
});

await caseFn('ogre capture by the choice dialog, shove by shift-click', `?fen=${encodeURIComponent(OGRE_ENEMY_FEN)}`, async (page, errors) => {
  await clickSq(page, 'e4');
  await clickSq(page, 'd4'); // plain click on an enemy asks: capture or push
  await page.click('#choose-capture');
  await waitPly(page, 1);
  await page.waitForTimeout(700);
  let s = await snap(page);
  const bad = [];
  if (!s.moves.includes('Oe4xd4')) bad.push(`plain click gave "${s.moves}"`);
  if (s.scene[sqOf('d4')] !== CODE.O) bad.push(`after capture d4=${s.scene[sqOf('d4')] ?? 'empty'}`);
  await page.click('#undo');
  await waitPly(page, 0);
  await page.waitForTimeout(400);
  await clickSq(page, 'e4');
  await clickSq(page, 'd4', true); // shift-click: the shove
  await waitPly(page, 1);
  await page.waitForTimeout(900);
  s = await snap(page);
  if (!s.moves.includes('Oe4>d4-c4')) bad.push(`shift-click gave "${s.moves}"`);
  if (s.scene[sqOf('d4')] !== CODE.O) bad.push(`after shove d4=${s.scene[sqOf('d4')] ?? 'empty'}`); // 'push' mode
  if (s.scene[sqOf('c4')] !== CODE.p) bad.push(`shoved pawn c4=${s.scene[sqOf('c4')] ?? 'empty'}`);
  if (s.scene[sqOf('e4')] !== undefined) bad.push(`after shove e4=${s.scene[sqOf('e4')] ?? 'empty'}`);
  if (errors.length) bad.push(errors.join(' | '));
  return bad.length ? bad.join('; ') : true;
});

await caseFn('catapult lobs over a screen and stays put', `?fen=${encodeURIComponent(CATAPULT_FEN)}`, async (page, errors) => {
  await clickSq(page, 'c1');
  await clickSq(page, 'c6');
  await waitPly(page, 1);
  await page.waitForTimeout(700);
  const s = await snap(page);
  const bad = [];
  if (!s.moves.includes('Cc1*c6')) bad.push(`moves="${s.moves}"`);
  if (s.scene[sqOf('c1')] !== CODE.C) bad.push(`catapult c1=${s.scene[sqOf('c1')] ?? 'empty'}`);
  if (s.scene[sqOf('c6')] !== undefined) bad.push(`target c6=${s.scene[sqOf('c6')] ?? 'empty'}`);
  if (errors.length) bad.push(errors.join(' | '));
  return bad.length ? bad.join('; ') : true;
});

// ---------------------------------------------------------------------------------------------
// The AI in a lab position, and the king choices after a restore.

await caseFn('AI answers in an ogre position', `?fen=${encodeURIComponent(OGRE_ENEMY_FEN)}&think=200`, async (page, errors) => {
  await clickSq(page, 'e4');
  await clickSq(page, 'd4');
  await page.click('#choose-push');
  await endTurn(page);
  await waitPly(page, 2); // human shove + the AI's reply
  await page.waitForTimeout(800);
  const s = await snap(page);
  const ok = s.moves.split(/\s+/).length >= 2 && errors.length === 0;
  return ok ? true : `moves="${s.moves}" errors=${errors.join(' | ')}`;
}, { players: 'human,ai' });

await caseFn('kings choice survives save/restore', '?kings=mud:march', async (page, errors) => {
  await page.goto(BASE); // no query
  await page.waitForFunction(() => window.view && document.getElementById('setup').title.length > 5, null, { timeout: 40000 });
  await page.waitForFunction(() => document.querySelector('#strip-me img').src.includes('/mud.webp') && document.querySelector('#strip-them img').src.includes('/mud-b.webp'));
  const kings = await page.evaluate(() => JSON.parse(localStorage.getItem('kingdown.save')).rules.kings);
  const ok = kings.length === 2 && kings.every(k => k.king === 'Mud' && k.power === 'March') && errors.length === 0;
  return ok ? true : `kings=${JSON.stringify(kings)} errors=${errors.join(' | ')}`;
});

// Death Touch through the real worker: the AI's only good move is the shot a plain king cannot play.
await caseFn('AI uses Death Touch in the worker', `?kings=shadow:deathtouch&fen=${encodeURIComponent('7k/8/4p3/3r4/3K4/8/8/8 w - - 0 1')}`, async (page, errors) => {
  await waitPly(page, 1);
  await page.waitForTimeout(600);
  const s = await snap(page);
  const ok = s.moves.includes('Kd4*d5') && errors.length === 0;
  return ok ? true : `moves="${s.moves}" errors=${errors.join(' | ')}`;
}, { players: 'ai,human' });

// Darkness: a pawn captures straight ahead — illegal under the default rules, so the restored game
// only replays if the active rules came back with the save.
await caseFn('Darkness pawn capture survives save/restore', `?kings=shadow:darkness&fen=${encodeURIComponent('7k/8/8/3p4/3P4/8/8/K7 w - - 0 1')}`, async (page, errors) => {
  await clickSq(page, 'd4');
  await clickSq(page, 'd5');
  await waitPly(page, 1);
  await page.waitForTimeout(400);
  await page.goto(BASE); // no query
  await page.waitForFunction(() => window.view && document.getElementById('setup').title.length > 5, null, { timeout: 40000 });
  await waitPly(page, 1);
  await page.waitForTimeout(400);
  const s = await snap(page);
  const bad = [];
  if (!s.moves.includes('d4xd5')) bad.push(`moves="${s.moves}"`);
  if (s.scene[sqOf('d5')] !== CODE.P) bad.push(`d5=${s.scene[sqOf('d5')] ?? 'empty'}`);
  if (errors.length) bad.push(errors.join(' | '));
  return bad.length ? bad.join('; ') : true;
});

// ---------------------------------------------------------------------------------------------
// Release cases: a full AI game, cancellation mid-search, promotion, and the mobile layout.

await caseFn('full AI vs AI game reaches a result', '?think=200', async (page, errors) => {
  // A fresh page's random army, the computer on both sides (`?players=ai,ai`), 200 ms a move (`?think=200`).
  const t0 = Date.now();
  let last = -1, stalls = 0;
  for (;;) {
    await page.waitForTimeout(3000);
    const st = await page.evaluate(() => ({
      open: document.getElementById('over').open,
      title: document.getElementById('over-title').textContent,
      plies: (JSON.parse(localStorage.getItem('kingdown.save') || '{}').moves || []).length,
    }));
    if (st.open) return { ok: errors.length === 0, detail: `result: ${st.title} · ${st.plies} plies · ${((Date.now() - t0) / 1000).toFixed(0)}s${errors.length ? ' · errors: ' + errors.join(' | ') : ''}` };
    stalls = st.plies === last ? stalls + 1 : 0;
    last = st.plies;
    if (stalls >= 40 || Date.now() - t0 > 1500000) return { ok: false, detail: `stalled at ${st.plies} plies after ${((Date.now() - t0) / 1000).toFixed(0)}s` };
  }
}, { players: 'ai,ai' });

await caseFn('cancelling mid-search starts a clean game', '', async (page, errors) => {
  await clickSq(page, 'e2');
  await clickSq(page, 'e4');
  await page.waitForTimeout(150); // the AI is thinking now
  await startGame(page); // New game's first choice: you play White against the computer
  await page.waitForTimeout(2500); // any stale answer would land here
  const s = await snap(page);
  const ok = s.moves === '' && /PPPPPPPP/.test(s.fen) && errors.length === 0;
  return ok ? true : `moves="${s.moves}" fen="${s.fen}" errors=${errors.join(' | ')}`;
}, { players: 'human,ai' });

await caseFn('promotion picker promotes to a queen', `?fen=${encodeURIComponent('7k/P7/8/8/8/8/8/K7 w - - 0 1')}`, async (page, errors) => {
  await clickSq(page, 'a7');
  await clickSq(page, 'a8');
  await page.waitForSelector('#promo button', { state: 'visible', timeout: 10000 });
  await page.locator('#promo button').first().click(); // Q is first in the promotion set
  await waitPly(page, 1);
  await page.waitForTimeout(400);
  const s = await snap(page);
  const ok = s.moves.includes('a7-a8=Q') && s.scene[sqOf('a8')] === CODE.Q && errors.length === 0;
  return ok ? true : `moves="${s.moves}" a8=${s.scene[sqOf('a8')] ?? 'empty'} errors=${errors.join(' | ')}`;
});

await caseFn('mobile layout has no horizontal overflow', '', async (page, errors) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(800);
  const m = await page.evaluate(() => ({
    scrollW: document.documentElement.scrollWidth, innerW: window.innerWidth,
    canvas: (() => { const c = document.querySelector('#board canvas'); return c ? c.getBoundingClientRect().width : 0; })(),
  }));
  const ok = m.scrollW <= m.innerW + 1 && m.canvas > 100 && errors.length === 0;
  return ok ? true : `scrollW=${m.scrollW} innerW=${m.innerW} canvas=${m.canvas} errors=${errors.join(' | ')}`;
});

// Strike (Flame A) as a powers game plays it (POWERS_BALANCED): a piece, not a pawn or the king,
// moves once as a queen to an empty square, and only after the power button arms it. The knight on
// d2 reaches d8 only through the power: the arming, the click path, the LAN suffix and the live rule
// all have to line up.
await caseFn('strike: an armed knight moves as a queen once (flame:strike)', `?kings=flame:strike&fen=${encodeURIComponent('4k3/8/8/8/7p/8/3N4/4K3 w - - 0 1')}`, async (page, errors) => {
  const info = await powerButtonText(page);
  await clickSq(page, 'd2');
  await clickSq(page, 'd8'); // unarmed: not a knight's move, so nothing happens
  await page.waitForTimeout(400);
  const unarmed = (await snap(page)).moves;
  await usePower(page);
  await clickSq(page, 'd2');
  await clickSq(page, 'd8');
  await waitPly(page, 1);
  await page.waitForTimeout(400);
  const s = await snap(page);
  const spent = s.fen.split(' ')[6]?.split('/').includes('u1.0') === true;
  const ok = info.includes('Strike') && unarmed === '' && s.moves.includes('Nd2-d8!') && s.scene[sqOf('d8')] === CODE.N && spent && errors.length === 0;
  return ok ? true : `info=${info.includes('Strike')} unarmed="${unarmed}" moves="${s.moves}" d8=${s.scene[sqOf('d8')] ?? 'empty'} spent=${spent} errors=${errors.join(' | ')}`;
});

await browser.close();
const run = classify(results, KNOWN_RED);
console.log('\n' + run.cases.map(c => `${c.verdict} ${c.id}${c.ticket ? ` (${c.ticket})` : ''}`).join('\n'));
console.log(run.summary);
process.exit(run.ok ? 0 : 1);
