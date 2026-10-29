// Board tests, part 3: the W7-04 draft journeys and the specs after them. They run apart from tools/plugin-board.test.ts and
// tools/plugin-board-input.test.ts, so that each CI WebKit runner ends its share in the step limit (ticket 77, items 14 and 17).
import { expect, it } from 'vitest';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { STEP } from './lib/checks.mjs';
import { pauseClock } from './lib/page-clock.mjs';
import { startHarness, waitForSourceApp } from './plugin-ui-harness';
import { fromFen, toFen, toLan } from '../src/rules/setup';
import { P, R, N, L, inCheck, legalMoves, makeMove, setRules, type Move, type Rules } from '../src/rules/engine';
import type { View } from '../src/match/protocol';
import { applyLan } from '../src/plugin/screens/board-model';
import { DEFAULT_OPTIONS } from '../src/match/setup';
import { momentKind } from '../src/moment';
import { soundsFor } from '../src/screen/moments';
import { folder, harness, browser, view, open, marks, clickButton, squareTap, settleBoardReads, turnBoard, chooseTurnMove, moveCalls, boardFen, getCalls, savedDraft, remountBoard } from './lib/plugin-board-fixture';

it.each([[1280, 800], [390, 844]])('F-107: Main menu keeps the game and its staged turn at %i × %i', async (width, height) => {
  const {page, frame, base} = await turnBoard('4k3/7p/8/8/8/8/4P3/4K3 w - - 0 1');
  try {
    await page.setViewportSize({width, height});
    await chooseTurnMove(page, 'e2-e4', 12);
    const draft = await savedDraft(page), fen = await boardFen(page);
    const menu = frame.locator('#board-menu'), sheet = frame.locator('#board-sheet');
    await menu.focus(); await page.keyboard.press('Enter');
    expect(await sheet.locator('.sheet-body > button').first().textContent()).toBe('Main menu');
    expect(await frame.locator('#page-back:visible, #game-table .table-back:visible').count()).toBe(0);
    await page.keyboard.press('Tab');
    const home = sheet.getByRole('button', {name: 'Main menu', exact: true});
    expect(await home.evaluate(b => b === document.activeElement && b.matches(':focus-visible'))).toBe(true);
    await page.keyboard.press('Tab');
    expect(await sheet.getByRole('button', {name: 'Moves', exact: true}).evaluate(b => b === document.activeElement)).toBe(true);
    await page.keyboard.press('Escape');
    expect(await menu.evaluate(b => b === document.activeElement && b.matches(':focus-visible'))).toBe(true);
    await page.keyboard.press('Enter'); await sheet.getByRole('button', {name: 'Close', exact: true}).click();
    expect(await menu.evaluate(b => b === document.activeElement)).toBe(true);
    await menu.focus(); await page.keyboard.press('Enter'); await page.keyboard.press('Tab'); await page.keyboard.press('Enter');
    await frame.locator('[data-screen="play"]:not([hidden])').waitFor();
    await sheet.waitFor({state: 'hidden'});
    expect(await savedDraft(page)).toEqual(draft);
    await frame.locator(`#games-list [data-game-id="${base.game_id}"]`).click();
    await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    await settleBoardReads(page);
    expect(await frame.locator('html').evaluate(() => {
      const view = (window as any).harnessApp.memory.view;
      return {game_id: view.game_id, revision: view.revision, fen: view.fen, status: view.status, draw_offer: view.draw_offer};
    })).toEqual({game_id: base.game_id, revision: base.revision, fen: base.fen, status: 'playing', draw_offer: null});
    expect(await savedDraft(page)).toEqual(draft);
    expect(await boardFen(page)).toBe(fen);
    expect(await frame.locator('#end-turn').getAttribute('aria-disabled')).toBe('false');
    expect(await page.evaluate(() => ((window as any).harnessCalls ?? []).filter((c: any) => ['kingdown_move', 'kingdown_resign', 'kingdown_abort', 'kingdown_draw'].includes(c.name)))).toEqual([]);
  } finally { await page.close(); }
});

// W7 ticket 04 browser journeys (design §7.4 D9 to D13): the draft in widget state, its restore and its keep-or-drop.
it('W7-04: restores a saved draft after a remount only when the game, the base FEN and the replay agree (D9)', async () => {
  for (const change of ['same', 'fen', 'lan'] as const) {
    const {page,frame,base} = await turnBoard('4k3/7p/8/8/8/8/4P3/4K3 w - - 0 1');
    try {
      await chooseTurnMove(page,'e2-e4',12);
      expect((await savedDraft(page)).lans).toEqual(['e2-e4']);
      if (change !== 'same') await page.evaluate(change => {
        const host = window as any, state = structuredClone(host.harnessWidgetState), draft = state.privateContent.draft;
        if (change === 'fen') draft.fen = '7k/8/8/8/8/8/8/7K w - - 0 1'; else draft.lans = ['e2-e5'];
        host.harnessWidgetState = state;
      }, change);
      await remountBoard(page);
      await settleBoardReads(page);
      if (change === 'same') {
        const draft = await savedDraft(page);
        expect(draft.lans).toEqual(['e2-e4']);
        expect(await frame.locator('#last-move').innerText()).toBe('White pawn e2 to e4.');
        expect(await frame.locator('#short-move-words').innerText()).toBe('White pawn e2 → e4');
        expect(await frame.locator('#status').textContent()).toBe('Your turn is ready. Select End turn.');
        expect(await frame.locator('#undo').getAttribute('aria-disabled')).toBe('false');
        expect(await boardFen(page)).toBe(toFen(applyLan(fromFen(base.fen),'e2-e4',base.rules!)!.pos));
      } else {
        expect(await savedDraft(page)).toBeNull();
        expect(await frame.locator('#undo').getAttribute('aria-disabled')).toBe('true');
        expect(await boardFen(page)).toBe(base.fen);
      }
    } finally { await page.close(); }
  }
});

it('W7-04: a refused press after a real draw offer keeps T6 and the note, then saves the turn (D10)', async () => {
  const page = await open(view('')), frame = page.frameLocator('iframe');
  const tool = async (name: string, args: Record<string, unknown> = {}, friend = false) => {
    const result = await (await page.request.post(new URL(friend ? '/fixture-friend-tool' : '/fixture-tool', harness.url).href, {data:{name,arguments:args}})).json();
    expect(result.isError, JSON.stringify(result.content)).not.toBe(true); return result;
  };
  try {
    const created = await tool('kingdown_create', {kind:'friend', colour:'white', options:{...DEFAULT_OPTIONS, fairy:false, pool:[], classic:true, arrangement:false}});
    const game_id = created._meta.view.game_id;
    const invite = await tool('kingdown_invite', {game_id});
    await tool('kingdown_join', {code:invite.structuredContent.code}, true);
    const result = await tool('kingdown_open', {game_id});
    await page.evaluate(result => (window as any).harnessShow(result), result);
    await frame.locator('#status').filter({hasText:'Your move'}).waitFor();
    const base = result._meta.view as View;
    await chooseTurnMove(page,'e2-e4',12);
    const offered = (await tool('kingdown_draw', {game_id, choice:'offer'}, true))._meta.view as View;
    expect(offered.revision).toBeGreaterThan(base.revision);
    // The page still has the revision from before the offer. The server refuses that first press.
    await clickButton(page, frame.locator('#end-turn'));
    await frame.locator('#status').filter({hasText:'The game changed. Check it, then tap Send your turn.'}).waitFor();
    await frame.locator('#board[aria-busy="false"][data-animating="false"]').waitFor();
    await settleBoardReads(page);
    expect(await frame.locator('#context-note').innerText()).toContain('Your opponent offers a draw.');
    await frame.locator('#undo[aria-disabled="false"]').waitFor();
    expect((await savedDraft(page)).lans).toEqual(['e2-e4']);
    expect(await frame.locator('#last-move').innerText()).toBe('White pawn e2 to e4.');
    expect(await frame.locator('#short-move-words').innerText()).toBe('White pawn e2 → e4');
    await clickButton(page, frame.locator('#end-turn'));
    await expect.poll(() => frame.locator('html').evaluate(() => (window as any).harnessApp.client.state.pending ?? null)).toBeNull();
    const saved = (await tool('kingdown_get', {game_id}))._meta.view as View;
    expect(saved.revision).toBe(offered.revision + 1);
    setRules(base.rules!);
    expect(saved.fen).toBe(toFen(applyLan(fromFen(base.fen),'e2-e4',base.rules!)!.pos));
    expect(saved.draw_offer).toBeNull();
    expect(saved.history!.actions).toEqual(['e2-e4']);
    // The host saves iframe state through postMessage. Wait for its draft clear.
    await expect.poll(() => savedDraft(page)).toBeNull();
    expect((await moveCalls(page)).map((c: any) => c.arguments.actions)).toEqual([['e2-e4'], ['e2-e4']]);
  } finally { await page.close(); }
});

it('W7-04: a press refused with INVALID_MOVE drops the draft and reads once (D11)', async () => {
  const {page,frame,base} = await turnBoard('4k3/7p/8/8/8/8/4P3/4K3 w - - 0 1', true);
  try {
    await chooseTurnMove(page,'e2-e4',12);
    // The solo board reads every 5 s (src/plugin/poll.ts). Stop the page clock, so no poll read falls between the count
    // and the rollback read.
    await pauseClock(page);
    await settleBoardReads(page);
    const reads = await getCalls(page);
    await page.evaluate(() => { (window as any).rejectNextMove = 'INVALID_MOVE'; });
    await frame.locator('#end-turn:not(:disabled):not([aria-disabled="true"])').waitFor();
    await clickButton(page, frame.locator('#end-turn'));
    await frame.locator('#error').filter({hasText:'Harness definitive rejection'}).waitFor();
    // The draft drops, the board returns to the base FEN, and the rollback reads the board once.
    await expect.poll(() => savedDraft(page)).toBeNull();
    expect(await frame.locator('#undo').getAttribute('aria-disabled')).toBe('true');
    await expect.poll(() => getCalls(page)).toBe(reads + 1);
    await page.clock.resume();
    await frame.locator('#board[aria-busy="false"][data-animating="false"]').waitFor();
    expect(await boardFen(page)).toBe(base.fen);
    expect((await moveCalls(page)).length).toBe(1);
  } finally { await page.close(); }
});

it('W7-04: a lost send keeps the ID, revision and actions for Retry, and drops the draft when the FEN moves (D12)', async () => {
  const {page,frame} = await turnBoard('4k3/7p/8/8/8/8/4P3/4K3 w - - 0 1');
  try {
    await chooseTurnMove(page,'e2-e4',12);
    await page.evaluate(() => { (window as any).dropNextMoveReply=true; });
    await frame.locator('#end-turn:not(:disabled):not([aria-disabled="true"])').waitFor();
    await clickButton(page, frame.locator('#end-turn'));
    await frame.locator('#retry').waitFor();
    const first = (await moveCalls(page))[0].arguments;
    // Undo is off while the send waits; the draft stays in widget state.
    expect(await frame.locator('#undo').getAttribute('aria-disabled')).toBe('true');
    expect((await savedDraft(page)).lans).toEqual(['e2-e4']);
    await frame.locator('#retry').click();
    await frame.locator('#retry').waitFor({state:'hidden'});
    const calls = await moveCalls(page);
    expect(calls.length).toBe(2);
    expect(calls.map((c: any) => [c.arguments.command_id, c.arguments.expected_revision, c.arguments.actions]))
      .toEqual([[first.command_id, first.expected_revision, first.actions],[first.command_id, first.expected_revision, first.actions]]);
    // The retry's read shows the sent position, so the base FEN moved and the draft drops.
    await expect.poll(() => savedDraft(page)).toBeNull();
  } finally { await page.close(); }
});

it.each(['playing', 'setup', 'waiting'] as const)('W7-04: keeps the draft through sheets and an equal-revision poll, and drops it for another %s game (D13)', async status => {
  const {page,frame,base} = await turnBoard('4k3/7p/8/8/8/8/4P3/4K3 w - - 0 1');
  try {
    await chooseTurnMove(page,'e2-e4',12);
    // A sheet.
    await frame.locator('#board-menu').click(); await frame.locator('#board-sheet').getByRole('button',{name:'Moves',exact:true}).click();
    await page.keyboard.press('Escape');
    expect((await savedDraft(page)).lans).toEqual(['e2-e4']);
    // Settings, then back to the game.
    await frame.locator('#board-menu').click(); await frame.locator('#board-sheet').getByRole('button',{name:'Settings',exact:true}).click();
    await frame.locator('[data-screen="settings"]:not([hidden])').waitFor();
    await frame.locator('html').evaluate((_, next) => { (window as any).harnessApp.navigate('play'); (window as any).harnessApp.routeView(next); }, base);
    await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    await expect.poll(() => savedDraft(page)).toMatchObject({lans: ['e2-e4']});
    expect(await frame.locator('#undo').getAttribute('aria-disabled')).toBe('false');
    expect(await frame.locator('#last-move').innerText()).toBe('White pawn e2 to e4.');
    expect(await frame.locator('#short-move-words').innerText()).toBe('White pawn e2 → e4');
    // An equal-revision poll keeps it.
    await frame.locator('html').evaluate((_, next) => (window as any).harnessApp.routeView(next), {...base, opponent: {...base.opponent, last_seen_ms: 1234}});
    expect((await savedDraft(page)).lans).toEqual(['e2-e4']);
    // Another game drops it.
    const other = view('4k3/7p/8/8/8/8/4P3/4K3 w - - 0 1', {}, { status, ...(status !== 'playing' && { fen: '', kind: 'friend' }) });
    await frame.locator('html').evaluate((_, next) => (window as any).harnessApp.routeView(next), other);
    await expect.poll(() => savedDraft(page)).toBeNull();
    await frame.locator('html').evaluate((_, next) => (window as any).harnessApp.routeView(next), base);
    expect(await savedDraft(page)).toBeNull();
    expect(await frame.locator('#undo').getAttribute('aria-disabled')).toBe('true');
  } finally { await page.close(); }
});

it.each(['teardown', 'close'] as const)('keeps the player strips fixed when a profile reply follows %s', async lifecycle => {
  const page = await browser.newPage(); page.setDefaultTimeout(3000 * STEP);
  const frame = page.frameLocator('iframe');
  try {
    await page.goto(harness.url); await waitForSourceApp(page); await frame.locator('#home-play:not(:disabled)').waitFor();
    await page.evaluate(() => { (window as any).holdNext = 'kingdown_profile'; });
    await page.route('**/fixture-tool', route => route.request().postDataJSON()?.name === 'kingdown_profile'
      ? route.fulfill({ json: { content: [], _meta: { record: { rating: { rating: 1900, provisional: false } } } } }) : route.continue());
    await page.evaluate(() => (window as any).harnessSetContext({ displayMode: 'fullscreen' }));
    await frame.locator('html').evaluate((_, next) => (window as any).harnessApp.routeView(next), view('4k3/7p/8/8/8/8/4P3/4K3 w - - 0 1', {}, { kind: 'friend' }));
    await page.waitForFunction(() => typeof (window as any).releaseHeld === 'function');
    await frame.locator('#board[aria-busy="false"]').waitFor();
    if (lifecycle === 'teardown') await page.evaluate(() => (window as any).harnessTeardown());
    else await frame.locator('html').evaluate('(async () => { (await import("/src/account-game/host.ts")).runtimeHost().onClose?.(); })()');
    await frame.locator('html').evaluate(() => {
      const w = window as any;
      w.closedStrips = [...document.querySelectorAll('#strip-me, #strip-them')].map(node => ({ node: node.firstChild, text: node.textContent }));
    });
    await page.evaluate(() => (window as any).releaseHeld());
    await expect.poll(() => frame.locator('html').evaluate(() => (window as any).harnessApp.client.inflight)).toBe(0);
    await frame.locator('html').evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
    expect(await frame.locator('html').evaluate(() => [...document.querySelectorAll('#strip-me, #strip-them')].every((node, i) => {
      const before = (window as any).closedStrips[i]; return node.firstChild === before.node && node.textContent === before.text;
    }))).toBe(true);
  } finally { await page.evaluate(() => (window as any).releaseHeld?.()).catch(() => {}); await page.close(); }
});

it('F05: draws one keyboard cursor at the tile and clears it on Escape or blur', async () => {
  const page = await open(view('7k/8/8/8/8/8/P7/K7 w - - 0 1'), 390, 844), frame = page.frameLocator('iframe');
  const proof = join(tmpdir(), 'kingdown-gui-board-proof'); await import('node:fs/promises').then(fs => fs.mkdir(proof, { recursive: true }));
  try {
    await frame.locator('html').evaluate(async () => { await (window as any).testBoard.ready(); });
    await frame.locator('#board').focus();
    await frame.locator('#board').press('ArrowRight');
    async function cursorBox() {
      return frame.locator('#board .mk-cursor').evaluate(mark => {
        const at = (window as any).testBoard.screenOf(1), next = (window as any).testBoard.screenOf(2), width = Math.hypot(at.x - next.x, at.y - next.y), box = mark.getBoundingClientRect(), style = getComputedStyle(mark);
        return { dx: Math.abs(box.x - at.x + width / 2), dy: Math.abs(box.y - at.y + width / 2), dw: Math.abs(box.width - width), border: style.borderTopWidth, color: style.borderTopColor };
      });
    }
    expect(await frame.locator('#board-marks[aria-hidden="true"]').count()).toBe(1);
    expect(await frame.locator('#board .mk-cursor').count()).toBe(1);
    const box = await cursorBox(); expect(box.dx).toBeLessThanOrEqual(1); expect(box.dy).toBeLessThanOrEqual(1); expect(box.dw).toBeLessThanOrEqual(1);
    expect(box.border).toBe('2px'); expect(box.color).toBe('rgb(43, 38, 33)');
    await frame.locator('#board .mk-cursor').evaluate(e => { (e as HTMLElement).style.visibility = 'hidden'; });
    await frame.locator('#board').screenshot({ path: join(proof, 'f05-before.png') });
    await frame.locator('#board .mk-cursor').evaluate(e => { (e as HTMLElement).style.visibility = ''; });
    await frame.locator('#board').screenshot({ path: join(proof, 'f05-after.png') });
    await page.setViewportSize({ width: 430, height: 844 });
    await expect.poll(async () => (await cursorBox()).dx).toBeLessThanOrEqual(1);
    await frame.locator('#board').press('Escape'); expect(await frame.locator('.mk-cursor').count()).toBe(0);
    await frame.locator('#board').press('ArrowLeft'); expect(await frame.locator('.mk-cursor').count()).toBe(1);
    await frame.locator('#board-menu').focus(); expect(await frame.locator('.mk-cursor').count()).toBe(0);
  } finally { await page.close(); }
});

it('N10: keeps the board name and Enter hint with the short cursor words', async () => {
  const page = await open(view('7k/8/8/8/8/8/P7/K7 w - - 0 1')), frame = page.frameLocator('iframe');
  try {
    const board = frame.locator('#board'), live = frame.locator('#cursor-say');
    expect(await frame.locator('#cursor-say[aria-live="polite"]').count()).toBe(1);
    for (const [key, words] of [
      ['ArrowUp', 'a2, white pawn'], ['Enter', 'a2, white pawn, selected'],
      ['ArrowUp', 'a3, empty, can go here'], ['ArrowRight', 'b3, empty'],
    ]) {
      await board.press(key);
      expect(await board.getAttribute('aria-label')).toBe(`Chess board, ${words}. Enter selects a square.`);
      expect(await live.textContent()).toBe(words);
    }
  } finally { await page.close(); }
});

it('N10: says "can go here" on the squares that an armed power can use', async () => {
  const page = await open(view('4k3/1p6/8/8/8/8/4P3/4K3 w - - 0 1', { kings: [{ king: 'Frost', power: 'Freeze' }, null] })), frame = page.frameLocator('iframe');
  try {
    await frame.locator('#power-w').click();
    await frame.locator('#board-sheet').getByRole('button', { name: 'Use', exact: true }).click();
    const board = frame.locator('#board'), live = frame.locator('#cursor-say');
    await board.press('ArrowRight'); for (let i = 0; i < 5; i++) await board.press('ArrowUp');
    expect(await live.textContent()).toBe('b6, empty');
    await board.press('ArrowUp');
    expect(await live.textContent()).toBe('b7, black pawn, can go here');
  } finally { await page.close(); }
});

it.each(['Escape', 'blur'] as const)('N10: clears the cursor text when %s hides a selected cursor', async input => {
  const page = await open(view('7k/8/8/8/8/8/P7/K7 w - - 0 1')), frame = page.frameLocator('iframe');
  try {
    const board = frame.locator('#board'), live = frame.locator('#cursor-say');
    await board.press('ArrowUp'); await board.press('Enter');
    expect(await live.textContent()).toBe('a2, white pawn, selected');
    if (input === 'Escape') await board.press('Escape');
    else await frame.locator('#board-menu').focus();
    expect(await board.getAttribute('aria-label')).toBe('Chess board');
    expect(await live.textContent()).toBe('');
    expect(await frame.locator('.mk-cursor').count()).toBe(0);
    if (input === 'Escape') {
      expect((await marks(page)).selected).toBeUndefined();
      await board.press('ArrowUp');
      expect(await live.textContent()).toBe('a3, empty');
    }
  } finally { await page.close(); }
});

it('F06: marks only the armed usable card and shows the gold band', async () => {
  const rules: Partial<Rules> = { hands: [['Strike', 'Freeze', 'IceWall', 'Vault'], ['Strike']] };
  const page = await open(view('7k/8/8/8/8/8/P7/R6K w - - 0 1', rules), 390, 844), frame = page.frameLocator('iframe');
  const proof = join(tmpdir(), 'kingdown-gui-board-proof'); await import('node:fs/promises').then(fs => fs.mkdir(proof, { recursive: true }));
  try {
    await page.evaluate(() => (window as any).harnessSetContext({ theme: 'dark' }));
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await frame.locator('#card-w-0').click(); await frame.locator('#board-sheet').getByRole('button', { name: 'Use', exact: true }).click();
    const coin = frame.locator('#card-w-0');
    expect(await coin.getAttribute('data-state')).toBe('armed'); expect(await coin.getAttribute('aria-pressed')).toBe('true');
    expect(await frame.locator('#strip-me .card-coin[aria-pressed="false"]').count()).toBe(3);
    expect(await frame.locator('#strip-them .card-coin[aria-pressed]').count()).toBe(0);
    const pixels = await coin.screenshot({ path: join(proof, 'f06-coin.png') });
    const sharp = (await import('sharp')).default, image = await sharp(pixels).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const x = Math.floor(image.info.width / 2), at = (3 * image.info.width + x) * 4;
    expect(await coin.evaluate(e => getComputedStyle(e.querySelector('.coin-paint')!).boxShadow)).toMatch(/rgb\(233, 192, 113\)[^,]*\b5px\b/);
    // Linux rasters put this pixel up to 14 levels off gold-bright; the ink ring and the card art are more than 80 away.
    for (const [i, value] of [233, 192, 113].entries()) expect(Math.abs(image.data[at + i] - value)).toBeLessThanOrEqual(24);
    await page.screenshot({ path: join(proof, 'plugin-card-targets-390x844-dark.png') });
    await frame.locator('#context-actions').getByRole('button', { name: 'Cancel', exact: true }).click();
    expect(await coin.getAttribute('data-state')).toBe('always'); expect(await coin.getAttribute('aria-pressed')).toBe('false');
    expect(await coin.evaluate(e => e.querySelector('img')!.getBoundingClientRect().width)).toBe(await coin.evaluate(e => e.clientWidth - 6));
  } finally { await page.close(); }
});

it.each(['contact', 'reduced', 'off', 'skip', 'superseded'] as const)('F10: sounds the local capture once at contact or fallback (%s)', async path => {
  const base = view('7k/8/8/8/8/8/7p/K6R w - - 0 1'), page = await open(base), frame = page.frameLocator('iframe');
  try {
    if (path === 'reduced') await page.emulateMedia({ reducedMotion: 'reduce' });
    await frame.locator('html').evaluate(`(async () => {
      const { snd, setSound } = await import('/src/render/sfx.ts'); setSound(true);
      window.sounds = []; for (const name of ['capture', 'move', 'check']) snd[name] = () => window.sounds.push({ name, at: performance.now() });
      const b = window.testBoard; window.realAnimate = b.animateMove.bind(b);
      b.animateMove = (pre, move, contact) => {
        if (${JSON.stringify(path)} === 'off') { b.setPace('off'); return window.realAnimate(pre, move, contact).then(() => { window.restAt = performance.now(); }); }
        if (${JSON.stringify(path)} === 'reduced') { window.restAt = performance.now(); return Promise.resolve(); }
        window.contact = contact; return new Promise(resolve => { window.finishMove = () => { window.restAt = performance.now(); resolve(); }; });
      };
    })()`);
    await squareTap(page, 7); await squareTap(page, 15);
    if (['contact', 'skip', 'superseded'].includes(path)) {
      expect(await frame.locator('#board').getAttribute('data-animating')).toBe('true');
      if (path === 'contact') {
        await frame.locator('html').evaluate(() => { (window as any).contact(); (window as any).contact(); });
        expect(await frame.locator('html').evaluate(() => (window as any).sounds.map((s: any) => s.name))).toEqual(['capture']);
      }
      if (path === 'superseded') {
        await frame.locator('html').evaluate((_, next) => (window as any).harnessApp.routeView(next), { ...base, game_id: crypto.randomUUID() });
        await frame.locator('html').evaluate(() => { (window as any).contact(); (window as any).finishMove(); });
        expect(await frame.locator('html').evaluate(() => (window as any).sounds)).toEqual([]); return;
      }
      if (path === 'skip') await frame.locator('html').evaluate(() => { (window as any).testBoard.skip = () => (window as any).finishMove(); (window as any).testBoard.skip(); });
      else await frame.locator('html').evaluate(() => (window as any).finishMove());
    }
    await frame.locator('#board[data-animating="false"]').waitFor();
    const result = await frame.locator('html').evaluate(() => ({ sounds: (window as any).sounds, rest: (window as any).restAt }));
    expect(result.sounds.map((s: any) => s.name)).toEqual(['capture', 'check']);
    if (path === 'contact') expect(result.sounds[0].at).toBeLessThanOrEqual(result.rest);
    else expect(result.sounds[0].at).toBeGreaterThanOrEqual(result.rest);
    expect(result.sounds[1].at).toBeGreaterThanOrEqual(result.rest);
  } finally { await page.close(); }
});

it('F10: sounds a replay capture at contact and check after rest', async () => {
  const base = view('7k/8/8/8/8/8/7p/K6R w - - 0 1', {}, { kind: 'friend' }), page = await open(base), frame = page.frameLocator('iframe');
  const step = applyLan(fromFen(base.fen), 'Rh1xh2', base.rules!)!; expect(step).toBeDefined();
  try {
    await frame.locator('html').evaluate(`(async () => {
      const { snd, setSound } = await import('/src/render/sfx.ts'); setSound(true); window.sounds = [];
      for (const name of ['capture', 'move', 'check']) snd[name] = () => window.sounds.push({ name, at: performance.now() });
      window.testBoard.animateMove = (pre, move, hit) => { hit(); hit(); return new Promise(resolve => { window.finishMove = () => { window.restAt = performance.now(); resolve(); }; }); };
    })()`);
    await frame.locator('html').evaluate((_, next) => (window as any).harnessApp.routeView(next), { ...base, revision: 1, fen: toFen(step.pos), turn: 1, action: 'waiting', legal: [], last_commands: [{ seq: 1, seat: 0, at: base.server_now, action: { type: 'turn', actions: [step.lan] } }] });
    expect(await frame.locator('html').evaluate(() => (window as any).sounds.map((s: any) => s.name))).toEqual(['capture']);
    await frame.locator('html').evaluate(() => (window as any).finishMove());
    await frame.locator('#board[data-animating="false"]').waitFor();
    const result = await frame.locator('html').evaluate(() => ({ sounds: (window as any).sounds, rest: (window as any).restAt }));
    expect(result.sounds.map((s: any) => s.name)).toEqual(['capture', 'check']);
    expect(result.sounds[0].at).toBeLessThanOrEqual(result.rest); expect(result.sounds[1].at).toBeGreaterThanOrEqual(result.rest);
  } finally { await page.close(); }
});

it.each(['tap', 'Escape', 'drag', 'Menu Escape', 'Moves Escape'] as const)('F11: %s skips the whole reply and keeps the server position', async input => {
  const rules: Partial<Rules> = { kings: [null, { king: 'Flame', power: 'Haste' }] }, fen = '4k3/p7/8/8/8/8/4P3/K7 b - - 0 1';
  setRules(rules); let pos = fromFen(fen); const actions: string[] = [], positions: string[] = [];
  for (const pick of [(m: Move) => m.power === 'haste' && m.from === 48 && m.to === 40, (m: Move) => !m.pass && m.from === 40 && m.to === 32]) {
    const move = legalMoves(pos).find(pick)!; expect(move).toBeDefined(); actions.push(toLan(pos, move)); pos = makeMove(pos, move); positions.push(toFen(pos));
  }
  const base = view(fen, rules, { kind: 'friend', seat: 0, action: 'waiting' }), page = await open(base), frame = page.frameLocator('iframe');
  try {
    await frame.locator('html').evaluate(`(async () => {
      const { snd } = await import('/src/render/sfx.ts'), { toFen } = await import('/src/rules/setup.ts'); window.hits = 0; snd.move = () => window.hits++;
      const b = window.testBoard, sync = b.sync.bind(b), timeout = window.setTimeout; window.syncs = []; window.animationCalls = 0; window.zeroTimers = 0;
      window.setTimeout = (fn, ms, ...args) => { if (ms === 0) window.zeroTimers++; return timeout(fn, ms, ...args); };
      b.sync = pos => { window.syncs.push(toFen(pos)); sync(pos); };
      b.animateMove = () => { window.animationCalls++; return new Promise(resolve => { window.finishMove = resolve; }); };
      b.skip = () => { window.finishMove?.(); };
    })()`);
    await frame.locator('html').evaluate((_, next) => (window as any).harnessApp.routeView(next), { ...base, revision: 1, fen: toFen(pos), turn: 0, action: 'ready', legal: legalMoves(pos).map(m => toLan(pos, m)), last_commands: [{ seq: 1, seat: 1, at: base.server_now, action: { type: 'turn', actions } }] });
    expect(await frame.locator('#board').getAttribute('data-animating')).toBe('true');
    const timers = await frame.locator('html').evaluate(() => (window as any).zeroTimers);
    if (input === 'Escape') { await frame.locator('#board').press('ArrowLeft'); expect(await frame.locator('#board .mk-cursor').count()).toBe(1); }
    const sheetEscape = input === 'Menu Escape' || input === 'Moves Escape';
    if (sheetEscape) {
      await frame.locator('#board-menu').click();
      if (input === 'Moves Escape') await frame.locator('#board-sheet').getByRole('button', { name: 'Moves', exact: true }).click();
      const close = frame.locator('#board-sheet [aria-label="Close"]');
      expect(await close.evaluate(button => button === document.activeElement)).toBe(true);
      await close.press('Escape');
      expect(await frame.locator('#board-sheet[open]').count()).toBe(0);
      expect(await frame.locator('.page-sheet').evaluate(page => (page as HTMLElement).inert)).toBe(false);
      expect(await frame.locator('#board-menu').evaluate(button => button === document.activeElement)).toBe(true);
    }
    const result = await frame.locator('html').evaluate(async (_, input) => {
      const b = (window as any).testBoard, board = document.getElementById('board')!;
      if (input === 'Escape') board.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      else if (input === 'drag') b.onDragSelect(12);
      else if (input === 'tap') b.onSquareClick(12);
      await new Promise(resolve => requestAnimationFrame(resolve));
      return { animating: board.dataset.animating, calls: (window as any).animationCalls, syncs: (window as any).syncs, hits: (window as any).hits, timers: (window as any).zeroTimers };
    }, input);
    expect(result.animating).toBe('false'); expect(result.calls).toBe(1); expect(result.hits).toBe(2);
    expect(result.syncs).toEqual([...positions, toFen(pos)]); expect(result.timers).toBeGreaterThan(timers);
    expect(await boardFen(page)).toBe(toFen(pos)); expect((await marks(page)).selected).toBeUndefined();
    // Escape during motion also ends the keyboard cursor, as it does at rest.
    if (input === 'Escape') {
      expect(await frame.locator('#board .mk-cursor').count()).toBe(0);
      expect(await frame.locator('#board').getAttribute('aria-label')).toBe('Chess board'); expect(await frame.locator('#cursor-say').textContent()).toBe('');
    }
    await squareTap(page, 12); expect((await marks(page)).selected).toBe(12);
  } finally { await page.close(); }
});

it('F11: a tap skips a local move without selecting a piece', async () => {
  const base = view('7k/8/8/8/8/8/P7/K7 w - - 0 1'), page = await open(base), frame = page.frameLocator('iframe');
  try {
    await frame.locator('html').evaluate(() => {
      const b = (window as any).testBoard;
      b.animateMove = () => new Promise(resolve => { b.skip = resolve; });
    });
    await squareTap(page, 8); await squareTap(page, 16);
    expect(await frame.locator('#board').getAttribute('data-animating')).toBe('true');
    await squareTap(page, 0); await frame.locator('#board[data-animating="false"]').waitFor();
    expect((await marks(page)).selected).toBeUndefined();
    expect(await boardFen(page)).toBe(toFen(applyLan(fromFen(base.fen), 'a2-a3', base.rules!)!.pos));
  } finally { await page.close(); }
});

it.each(['mouse', 'touch'] as const)('A8: real %s input skips both Haste moves', async input => {
  const rules: Partial<Rules> = { kings: [null, { king: 'Flame', power: 'Haste' }] };
  const base = view('4k3/p7/8/8/8/8/4P3/K7 b - - 0 1', rules, { kind: 'friend', seat: 0, action: 'waiting' });
  let pos = fromFen(base.fen);
  const actions: string[] = [];
  for (const pick of [(m: Move) => m.power === 'haste' && m.from === 48 && m.to === 40, (m: Move) => !m.pass && m.from === 40 && m.to === 32]) {
    const move = legalMoves(pos).find(pick)!;
    expect(move).toBeDefined(); actions.push(toLan(pos, move)); pos = makeMove(pos, move);
  }
  const page = await open(base, 393, 852, true), frame = page.frameLocator('iframe');
  try {
    await frame.locator('html').evaluate(async () => { await (window as any).testBoard.ready(); });
    await page.clock.pauseAt(new Date(Date.now() + 1000));
    await frame.locator('html').evaluate(() => {
      const w = window as any, b = w.testBoard, animate = b.animateMove.bind(b);
      w.animationCalls = 0;
      b.animateMove = (...args: unknown[]) => { w.animationCalls++; return animate(...args); };
    });
    await frame.locator('html').evaluate((_, next) => (window as any).harnessApp.routeView(next), {
      ...base, revision: 1, fen: toFen(pos), turn: 0, action: 'ready', legal: legalMoves(pos).map(m => toLan(pos, m)),
      last_commands: [{ seq: 1, seat: 1, at: base.server_now, action: { type: 'turn', actions } }],
    });
    expect(await frame.locator('html').evaluate(() => (window as any).testBoard.scene.animating)).toBe(true);
    const pane = (await page.locator('iframe').boundingBox())!;
    const point = await frame.locator('html').evaluate(() => (window as any).testBoard.screenOf(12));
    if (input === 'touch') await page.touchscreen.tap(pane.x + point.x, pane.y + point.y);
    else await page.mouse.click(pane.x + point.x, pane.y + point.y);
    await expect.poll(() => frame.locator('#board').getAttribute('data-animating')).toBe('false');
    expect(await frame.locator('html').evaluate(() => (window as any).animationCalls)).toBe(1);
    expect(await frame.locator('html').evaluate(() => (window as any).testBoard.scene.animating)).toBe(false);
    expect(await boardFen(page)).toBe(toFen(pos));
    expect((await marks(page)).selected).toBeUndefined();
    expect(await frame.locator('html').evaluate(() => {
      const b = (window as any).testBoard.scene.position.board;
      return [b[48], b[40], b[32]];
    })).toEqual([0, 0, pos.board[32]]);
  } finally { await page.close(); }
});

it.each(['mouse', 'touch'] as const)('A8: real %s input ends the web final blow and its timers', async input => {
  const page = await open(view('7k/8/6K1/8/8/8/8/Q7 w - - 0 1'), 393, 852, true), frame = page.frameLocator('iframe');
  try {
    await frame.locator('html').evaluate(async () => { await (window as any).testBoard.ready(); });
    await page.clock.pauseAt(new Date(Date.now() + 1000));
    await frame.locator('html').evaluate(`(async () => {
      const { startCeremony } = await import('/src/ceremony.ts'), { Game } = await import('/src/game.ts');
      const { fromFen, toFen } = await import('/src/rules/setup.ts');
      const game = new Game(); game.load(fromFen('7k/8/6K1/8/8/8/8/Q7 w - - 0 1'));
      game.play(game.legal.find(move => move.from === 0 && move.to === 56));
      const b = window.testBoard, board = document.getElementById('board');
      window.previousSkip = b.onSkipAnimation; window.ceremonyDone = false; window.finalFen = toFen(game.pos);
      const captionHost = document.createElement('div'), moments = document.createElement('div');
      board.append(captionHost, moments);
      window.ceremony = startCeremony({ view: b, board, captionHost, moments, history: game.history,
        final: game.pos, king: 63, showPly() {}, motion: true, live: () => true });
      window.ceremony.done.then(done => { window.ceremonyDone = done; });
    })()`);
    await page.clock.runFor(130);
    expect(await frame.locator('html').evaluate(() => (window as any).testBoard.scene.animating)).toBe(true);
    const pane = (await page.locator('iframe').boundingBox())!;
    const point = await frame.locator('html').evaluate(() => (window as any).testBoard.screenOf(46));
    if (input === 'touch') await page.touchscreen.tap(pane.x + point.x, pane.y + point.y);
    else await page.mouse.click(pane.x + point.x, pane.y + point.y);
    await expect.poll(() => frame.locator('html').evaluate(() => (window as any).ceremonyDone)).toBe(true);
    expect(await frame.locator('.ceremony-caption').count()).toBe(0);
    expect(await frame.locator('.ceremony-tile').count()).toBe(1);
    expect(await frame.locator('html').evaluate(() => {
      const w = window as any, b = w.testBoard;
      return { animating: b.scene.animating, falling: b.scene.falling, king: b.fallen?.sq, restored: b.onSkipAnimation === w.previousSkip };
    })).toEqual({ animating: false, falling: false, king: 63, restored: true });
    expect(await boardFen(page)).toBe(await frame.locator('html').evaluate(() => (window as any).finalFen));
    expect((await marks(page)).selected).toBeUndefined();
    await page.clock.runFor(1700);
    expect(await frame.locator('.kd-words.is-in, .ceremony-caption').count()).toBe(0);
    expect(await frame.locator('html').evaluate(() => (window as any).testBoard.scene.falling)).toBe(false);
  } finally { await page.close(); }
});

it.each(['dark', 'light'])('F13: centers both sheet close marks in 44 by 48 px tablets (%s)', async theme => {
  const base = view('7k/8/8/8/8/8/P7/K7 w - - 0 1'), page = await open(base, 390, 844), frame = page.frameLocator('iframe');
  const proof = join(tmpdir(), 'kingdown-gui-board-proof'); await import('node:fs/promises').then(fs => fs.mkdir(proof, { recursive: true }));
  async function centered(selector: string) {
    await frame.locator(selector).evaluate(async button => { await Promise.all(button.closest('dialog')!.getAnimations({ subtree: true }).map(a => a.finished.catch(() => {}))); });
    const box = await frame.locator(selector).evaluate(button => {
      const range = document.createRange(); range.selectNodeContents(button);
      const glyph = range.getBoundingClientRect(), box = button.getBoundingClientRect();
      return { width: box.width, height: box.height, dx: Math.abs(glyph.x + glyph.width / 2 - box.x - box.width / 2), dy: Math.abs(glyph.y + glyph.height / 2 - box.y - box.height / 2), text: button.textContent };
    });
    expect(box.width).toBe(44); expect(box.height).toBe(48); expect(box.dx).toBeLessThanOrEqual(1); expect(box.dy).toBeLessThanOrEqual(1); expect(box.text).toBe('×');
  }
  try {
    await page.evaluate(theme => (window as any).harnessSetContext({ theme }), theme);
    await frame.locator('#board-menu').click(); await centered('#board-sheet .sheet-head button[aria-label="Close"]');
    await page.screenshot({ path: join(proof, `plugin-board-menu-390x844-${theme}.png`) });
    await frame.locator('#board-sheet .sheet-head button[aria-label="Close"]').click();
    await frame.locator('html').evaluate((_, next) => (window as any).harnessApp.routeView(next), {
      ...base, game_id: crypto.randomUUID(), status: 'setup', fen: '', options: { ...DEFAULT_OPTIONS, fairy: false, arrangement: true, cards: false, kingPowers: false }, draw: 'RNBQKBNR', choices: [{ order: 'RNBQKBNR', king: null }, null], ready: [false, false],
    });
    await frame.locator('#seat-menu').click(); await centered('#seat-menu-close');
    await page.screenshot({ path: join(proof, `plugin-seat-menu-390x844-${theme}.png`) });
  } finally { await page.close(); }
});

// The Collection screen is parked (docs/PARKED.md): the board sheet still shows the card face, not its back.
it.each(['Strike', 'MorphP'] as const)('shows the card face in the %s board sheet', async card => {
  const page = await open(view('7k/8/8/8/8/8/P7/K7 w - - 0 1', { hands: [[card], []] })), frame = page.frameLocator('iframe');
  const picture = (el: Element) => ({ image: el.querySelector('img')?.getAttribute('src'), diagram: el.querySelector('svg')?.getAttribute('data-card-picture'), text: el.textContent?.trim() });
  try {
    await frame.locator('#card-w-0').click();
    const face = await frame.locator('#board-sheet .cf-art').evaluate(picture);
    expect(await frame.locator('#board-sheet .cf-art img[src*="back"]').count()).toBe(0);
    expect(face.image ?? face.diagram, JSON.stringify(face)).toBeTruthy();
  } finally { await page.close(); }
});

it('explains why a card sheet has no Use button', async () => {
  const page = await open(view('7k/8/8/8/8/8/P7/K7 w - - 0 1', { hands: [['MirrorB'], ['Freeze']] })), frame = page.frameLocator('iframe');
  try {
    await frame.locator('#card-w-0').click();
    expect(await frame.locator('#board-sheet .card-reason').textContent()).toBe('This card has no move now.');
    expect(await frame.locator('#board-sheet').getByRole('button', { name: 'Use', exact: true }).count()).toBe(0);
    await frame.locator('#board-sheet [aria-label="Close"]').click();
    await frame.locator('#card-b-0').click();
    expect(await frame.locator('#board-sheet .card-reason').textContent()).toBe("This is your opponent's card.");
    expect(await frame.locator('#board-sheet').getByRole('button', { name: 'Use', exact: true }).count()).toBe(0);
  } finally { await page.close(); }
});

it('A35: an unused card names Retry after Send your turn fails', async () => {
  const base = view('7k/p7/8/8/8/8/8/R5K1 w - - 0 1', { hands: [['Haste'], []] }, { kind: 'friend' });
  const page = await open(base), frame = page.frameLocator('iframe');
  try {
    await chooseTurnMove(page, 'Ra1-a2', 0);
    await page.evaluate(() => { (window as any).failNextAction = true; });
    await frame.locator('#end-turn').click();
    await frame.locator('#retry:not(:disabled)').waitFor();
    expect((await moveCalls(page)).length).toBe(1);
    await frame.locator('#card-w-0').click();
    expect(await frame.locator('#board-sheet .card-reason').textContent()).toBe('Close this sheet and select Retry.');
    expect(await frame.locator('#board-sheet').getByRole('button', { name: 'Use', exact: true }).count()).toBe(0);
  } finally { await page.close(); }
});

it.each([true, false])('A35: the card sheet follows failed polls and same-revision recovery with openBefore=%s', async openBefore => {
  const base = view('7k/p7/8/8/8/8/8/R5K1 w - - 0 1', { hands: [['Haste'], []] }, { kind: 'friend' });
  const page = await open(base, 393, 852, true), frame = page.frameLocator('iframe'), sheet = frame.locator('#board-sheet');
  try {
    let failRead = true;
    await page.route('**/fixture-tool', async route => {
      if (route.request().postDataJSON().name === 'kingdown_get') {
        if (failRead) await route.abort('failed');
        else await route.fulfill({ json: { content: [], _meta: { view: base } } });
      }
      else await route.continue();
    });
    const read = () => frame.locator('html').evaluate((_, game_id) => (window as any).harnessApp.send('kingdown_get', { game_id }, { quiet: true }), base.game_id);
    if (openBefore) {
      await frame.locator('#card-w-0').click();
      expect(await sheet.getByRole('button', { name: 'Use', exact: true }).isVisible()).toBe(true);
      await sheet.getByRole('button', { name: 'Use', exact: true }).focus();
    }
    for (let i = 0; i < 3; i++) {
      expect((await read()).status).toBe('failed');
      if (openBefore && i < 2) expect(await sheet.getByRole('button', { name: 'Use', exact: true }).isVisible()).toBe(true);
    }
    if (!openBefore) await frame.locator('#card-w-0').click();
    await sheet.evaluate(el => { (window as any).openCardFace = el.querySelector('.cf-art'); });
    expect(await sheet.locator('.card-reason').textContent()).toBe('Close this sheet and select Try again.');
    expect(await sheet.getByRole('button', { name: 'Use', exact: true }).count()).toBe(0);
    if (openBefore) expect(await sheet.locator('[aria-label="Close"]').evaluate(el => el === document.activeElement)).toBe(true);
    failRead = false;
    expect((await read()).status).toBe('done');
    expect(await sheet.getByRole('button', { name: 'Use', exact: true }).isVisible()).toBe(true);
    expect(await sheet.locator('.card-reason').count()).toBe(0);
    expect(await sheet.evaluate(el => (el as HTMLDialogElement).open && el.querySelector('.cf-art') === (window as any).openCardFace)).toBe(true);
    await sheet.getByRole('button', { name: 'Use', exact: true }).click();
    expect(await frame.locator('#card-w-0').getAttribute('aria-pressed')).toBe('true');
  } finally { await page.close(); }
});
const soundCases = [
  { kind: 'move', fen: '7k/8/8/8/8/8/P7/K7 w - - 0 1', now: 'move', hit: null },
  { kind: 'capture', fen: '7k/8/8/8/8/8/7p/K6R w - - 0 1', now: null, hit: 'capture' },
  { kind: 'shot', fen: '7k/8/8/2p5/8/2A5/8/K7 w - - 0 1', now: 'shot', hit: 'capture' },
  { kind: 'shove', fen: 'k7/8/8/8/8/2p5/3pP3/4O2K w - - 0 1', now: null, hit: 'shove' },
  { kind: 'chain', fen: '7k/8/8/2pp4/2S5/8/8/K7 w - - 0 1', now: null, hit: 'chain' },
  { kind: 'swap', fen: '7k/8/8/8/2RM4/8/8/K7 w - - 0 1', now: 'swap', hit: null },
] as const;
it.each(soundCases.flatMap(test => ['local', 'replay'].map(path => ({ ...test, path }))))(
  'N11: the $path $kind uses the web sounds at start, contact and rest', async ({ kind, fen, now, hit, path }) => {
    const base = view(fen, {}, { kind: 'friend' }), page = await open(base), frame = page.frameLocator('iframe');
    try {
      setRules(base.rules!); const pre = fromFen(fen);
      const move = legalMoves(pre).find(m => kind === 'capture' ? m.captures.length === 1 && m.to !== m.from
        : kind === 'move' ? momentKind(pre, m) === null && !m.captures.length : momentKind(pre, m) === kind)!;
      expect(move).toBeDefined();
      const post = makeMove(pre, move), lan = toLan(pre, move), web = soundsFor(momentKind(pre, move), move);
      expect(web).toEqual({ now, hit });
      await frame.locator('html').evaluate(`(async () => {
        const { snd, setSound } = await import('/src/render/sfx.ts'); setSound(true); window.soundEvents = [];
        for (const name of ['move', 'capture', 'shot', 'shove', 'chain', 'swap', 'check']) snd[name] = () => window.soundEvents.push('sound:' + name);
        window.testBoard.animateMove = (pre, move, contact) => {
          window.soundEvents.push('animate');
          window.soundContact = () => { window.soundEvents.push('contact'); contact(); };
          return new Promise(resolve => { window.finishSoundMove = () => { window.soundEvents.push('rest'); resolve(); }; });
        };
      })()`);
      if (path === 'local') {
        await squareTap(page, move.from); await frame.locator('#board-menu').click();
        await frame.locator('#board-sheet').getByRole('button', { name: 'Choose a move', exact: true }).click();
        await frame.locator(`#choices button[title="${lan}"]`).click();
      } else {
        await frame.locator('html').evaluate((_, next) => (window as any).harnessApp.routeView(next), {
          ...base, revision: 1, fen: toFen(post), turn: post.turn, action: 'waiting', legal: [],
          last_commands: [{ seq: 1, seat: 0, at: base.server_now, action: { type: 'turn', actions: [lan] } }],
        });
      }
      const events = () => frame.locator('html').evaluate<string[], undefined>(() => (window as any).soundEvents);
      expect(await events()).toEqual([...(now ? [`sound:${now}`] : []), 'animate']);
      await frame.locator('html').evaluate(() => { (window as any).soundContact(); (window as any).soundContact(); });
      expect((await events()).filter(event => event.startsWith('sound:'))).toEqual([now, hit].filter(Boolean).map(name => `sound:${name}`));
      await frame.locator('html').evaluate(() => (window as any).finishSoundMove());
      await frame.locator('#board[data-animating="false"]').waitFor();
      const result = await events(), check = inCheck(post);
      expect(result.filter(event => event.startsWith('sound:'))).toEqual([web.now, web.hit, check ? 'check' : null].filter(Boolean).map(name => `sound:${name}`));
      if (hit) expect(result.indexOf(`sound:${hit}`)).toBeLessThan(result.indexOf('rest'));
      if (check) expect(result.indexOf('sound:check')).toBeGreaterThan(result.indexOf('rest'));
    } finally { await page.close(); }
  });


it.each(['mouse', 'touch'] as const)('A8: a %s skip keeps the capture and does not open Menu', async input => {
  const page = await open(view('7k/8/8/8/8/8/p7/R6K w - - 0 1'), 393, 852, true), frame = page.frameLocator('iframe');
  try {
    await frame.locator('#board[aria-busy="false"]').waitFor();
    await page.clock.pauseAt(new Date(Date.now() + 1000));
    await frame.locator('html').evaluate(() => {
      const board = (window as any).testBoard;
      board.onSquareClick(0, false); board.onSquareClick(8, false);
    });
    expect(await frame.locator('html').evaluate(() => (window as any).testBoard.scene.animating)).toBe(true);
    const box = (await frame.locator('#board-menu').boundingBox())!;
    if (input === 'touch') await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
    else await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    expect(await frame.locator('html').evaluate(() => (window as any).testBoard.scene.animating)).toBe(false);
    expect(await frame.locator('#board-sheet[open]').count()).toBe(0);
    await expect.poll(() => frame.locator('#end-turn').getAttribute('aria-disabled')).toBe('false');
    expect(await frame.locator('html').evaluate(() => {
      const board = (window as any).testBoard;
      return [board.scene.position.board[0], board.scene.position.board[8], board.marks.selected ?? null];
    })).toEqual([0, 4, null]);
    expect((await savedDraft(page)).lans).toEqual(['Ra1xa2']);
    await frame.locator('#board-menu').dispatchEvent('click');
    expect(await frame.locator('#board-sheet[open]').count()).toBe(1);
  } finally { await page.close(); }
});


it.each([390, 1280])('A18: keeps an empty named moves list with no words at %i px', async width => {
  const page = await open(view('7k/8/8/8/8/8/P7/K7 w - - 0 1'), width, width === 390 ? 844 : 800), frame = page.frameLocator('iframe');
  try {
    const recent = frame.locator('#recent-moves');
    expect(await recent.textContent()).toBe('');
    expect(await recent.getAttribute('aria-label')).toBe('Moves');
    if (width === 390) expect(await recent.isHidden()).toBe(true);
    await frame.locator('#board-menu').click();
    await frame.getByRole('button', { name: 'Moves', exact: true }).click();
    expect(await frame.locator('#board-sheet .sheet-body').textContent()).toBe('');
    expect(await frame.getByRole('dialog', { name: 'Moves', exact: true }).isVisible()).toBe(true);
  } finally { await page.close(); }
});


it.each([390, 1280])('live Moves: keeps reading position and focus across a remote turn at %i px', async width => {
  const initial_fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  const actions = 'a2-a3 a7-a6 b2-b3 b7-b6 c2-c3 c7-c6 d2-d3 d7-d6 e2-e3 e7-e6 f2-f3 f7-f6 g2-g3 g7-g6 h2-h3 h7-h6 a3-a4 a6-a5 b3-b4 b6-b5'.split(' ');
  for (let i = 0; i < 5; i++) actions.push('Nb1-a3', 'Nb8-a6', 'Na3-b1', 'Na6-b8');
  const game = view(initial_fen, {}, { kind: 'friend', seat: 0 });
  let pos = fromFen(initial_fen);
  for (const lan of actions) { const step = applyLan(pos, lan, game.rules!); expect(step).toBeDefined(); pos = step!.pos; }
  const current = view(toFen(pos), game.rules!, { ...game, fen: toFen(pos), revision: actions.length, history: { initial_fen, actions } });
  const page = await open(current, width, width === 390 ? 844 : 800), frame = page.frameLocator('iframe');
  try {
    const sheet = frame.locator('#board-sheet');
    const show = async () => { await frame.locator('#board-menu').click(); await frame.getByRole('button', { name: 'Moves', exact: true }).click(); };
    const closed = async () => {
      expect(await sheet.evaluate(e => (e as HTMLDialogElement).open)).toBe(false);
      expect(await frame.locator('.page-sheet').evaluate(e => (e as HTMLElement).inert)).toBe(false);
      await sheet.waitFor({ state: 'hidden' });
    };
    const route = (next: View) => frame.locator('html').evaluate((_, next) => (window as any).harnessApp.routeView(next), next);
    await show();
    const close = await sheet.getByRole('button', { name: 'Close', exact: true }).elementHandle();
    expect(close).not.toBeNull(); await close!.focus();
    await frame.locator('html').evaluate('(async () => { const { applyLocks } = await import("/src/account-game/state.ts"); applyLocks({ ...window.harnessApp.store.page(), writing: true }); })()');
    expect(await close!.isEnabled()).toBe(true);
    expect(await close!.evaluate(el => el === document.activeElement)).toBe(true);
    await frame.locator('html').evaluate(() => (window as any).harnessApp.actions());
    const scroll = await sheet.locator('.sheet-body').evaluate(el => { el.scrollTop = 100; return el.scrollTop; });
    expect(scroll).toBeGreaterThan(0);
    const step = applyLan(pos, 'c3-c4', game.rules!); expect(step).toBeDefined();
    const next = { ...current, revision: current.revision + 1, fen: toFen(step!.pos), turn: step!.pos.turn, history: { initial_fen, actions: [...actions, 'c3-c4'] } };
    await route(next);
    expect(await frame.getByRole('dialog', { name: 'Moves', exact: true }).isVisible()).toBe(true);
    expect(await sheet.locator('.sheet-body p').count()).toBe(actions.length + 1);
    expect(await sheet.locator('.sheet-body p').allTextContents()).toEqual(await frame.locator('#recent-moves p').allTextContents());
    expect(await close!.evaluate(el => el.isConnected && el === document.activeElement)).toBe(true);
    expect(await sheet.locator('.sheet-body').evaluate(el => el.scrollTop)).toBe(scroll);
    await close!.click(); await close!.dispose(); await closed();
    await frame.locator('#board[aria-busy="false"]').waitFor();
    await frame.locator('#board-menu').click();
    await route({ ...next, revision: next.revision + 1 });
    await closed();
    await show();
    const other = { ...next, game_id: crypto.randomUUID() };
    await route(other);
    await closed();
    await show();
    await route({ ...other, revision: other.revision + 1, status: 'finished', result: { winner: 1, reason: 'resignation' } });
    await closed();
  } finally { await page.close(); }
});

it.each([false, true])('Y3: shows only the king and power in the seat strip (ready %s)', async ready => {
  const page = await open(view('', {}, { status: 'setup', options: { ...DEFAULT_OPTIONS, arrangement: false, kingPowers: true, cards: false },
    draw: 'RNBQKBNR', deal: [], ready: [ready, false], choices: [{ king: { king: 'Spirit', power: 'Mercy' }, order: 'RNBQKBNR' }, null] })), frame = page.frameLocator('iframe');
  try {
    expect(await frame.locator('#seat-me-line').textContent()).toBe('Spirit · Mercy');
    expect(await frame.locator('#seat-context').textContent()).toBe(ready ? 'Waiting for the other player.' : 'Choose your king, then press Ready.');
    expect(await frame.locator('#seat-king').isVisible()).toBe(true);
  } finally { await page.close(); }
});


it('A8: keeps the full main gait at Normal and Fast for every quiet move type', async () => {
  const page = await open(view('7k/8/8/8/8/8/P7/K7 w - - 0 1'), 393, 852, true), frame = page.frameLocator('iframe');
  try {
    await frame.locator('#board[aria-busy="false"]').waitFor();
    await page.clock.pauseAt(new Date(Date.now() + 1000));
    for (const pace of ['normal', 'fast']) for (const [piece, duration] of [[P,420],[R,480],[N,1350],[L,1450]]) {
      await frame.locator('html').evaluate((_, {piece, pace}) => {
        const host = window as any, board = host.testBoard, pos = { ...board.pos, board: new Uint8Array(board.pos.board) };
        pos.board[8] = piece; board.setPace(pace); host.quietDone = false;
        void board.animateMove(pos, {from:8,to:48,captures:[]}).then(() => { host.quietDone = true; });
      }, {piece, pace});
      await page.clock.fastForward(duration * (pace === 'fast' ? .5 : 1) - 40);
      expect(await frame.locator('html').evaluate(() => (window as any).quietDone)).toBe(false);
      await page.clock.fastForward(80);
      expect(await frame.locator('html').evaluate(() => (window as any).quietDone)).toBe(true);
    }
  } finally { await page.close(); }
});


it('A8: Off ends the active marker draw timer', async () => {
  const page = await open(view('7k/8/8/8/8/8/A7/K7 w - - 0 1'), 393, 852, true), frame = page.frameLocator('iframe');
  try {
    await frame.locator('#board[aria-busy="false"]').waitFor();
    await page.clock.pauseAt(new Date(Date.now() + 1000));
    await frame.locator('html').evaluate(() => {
      const board = (window as any).testBoard;
      board.setPace('normal'); board.highlight({ selected:8, moves:[9,16] }); board.setPace('off');
    });
    await page.clock.runFor(100);
    const frames = await frame.locator('html').evaluate(() => (window as any).testBoard.scene.frames);
    await page.clock.runFor(500);
    expect(await frame.locator('html').evaluate(() => (window as any).testBoard.scene.frames)).toBe(frames);
  } finally { await page.close(); }
});

it('keeps a stored-engine draft through undo, remount and a late preview when the page calculator differs', async () => {
  const { LocalMatch } = await import('../src/match');
  const { GameService } = await import('../src/match/service');
  const { pathToFileURL } = await import('node:url');
  const { resolve } = await import('node:path');
  const actor = '11111111-1111-4111-8111-111111111111', engine = 'sha256:bab22e94d4df81591374763a7f3abe703c30534f80ce771ee3fe7e095dcec7da';
  const match = new LocalMatch(pathToFileURL(resolve('engines', engine.slice(7) + '.mjs')));
  const page = await browser.newPage({viewport:{width:393,height:852}}); page.setDefaultTimeout(10_000);
  const errors:string[] = []; page.on('pageerror', error=>errors.push(error.message));
  let release: (()=>void) | undefined, hold = false, commit:string[]|undefined, applied:Promise<void>|undefined, previews=0, returned=0, boardId:string|undefined, committedFen:string|undefined;
  try {
    await match.initialize({fen:'7k/p7/8/8/8/8/8/R5K1 w - - 0 1',kings:'Flame:Haste,none'});
    const snapshot = await match.snapshot(), state = await match.exportSave();
    const base = view(snapshot.fen,snapshot.rules,{engine_fingerprint:engine,kind:'friend',history:{initial_fen:snapshot.fen,actions:[]}});
    const game = {id:base.game_id,revision:0,engine_fingerprint:engine,status:'playing',turn:0,state,snapshot,players:[{seat:0,user_id:actor},{seat:1,user_id:null}]};
    const service = new GameService({load:async()=>game} as unknown as import('../src/match/store').PostgresMatchStore);
    await page.route('**/board-resource', async route=>{
      const response=await route.fetch(), source=await response.text();
      const entry='<script type="module">await window.harnessBoot;';
      expect(source).toContain(entry);
      const divergent=`const {GameRules}=await import('/src/game-rules.ts');
        GameRules.prototype.legalMoves=()=>[];
        GameRules.prototype.makeMove=()=>{throw new Error('Divergent page must not enforce this draft');};
        GameRules.prototype.status=()=>{throw new Error('Divergent page must not decide this result');};
        window.testBoard=(await import('/src/plugin/board-view.ts')).board;`;
      await route.fulfill({response,body:source.replace(entry,entry+divergent)});
    });
    await page.route('**/fixture-tool', async route=>{
      const request = route.request().postDataJSON();
      if (request.name === 'kingdown_preview') {
        previews++;
        const {game_id:_,...input}=request.arguments;
        const result = await service.previewDraft(actor,base.game_id,input);
        if (hold) { hold=false; await new Promise<void>(done=>{release=done;}); }
        await route.fulfill({json:{content:[],_meta:{draft:result}}}); returned++;
      } else if (request.name === 'kingdown_get') await route.fulfill({json:{content:[],structuredContent:{screen:'board'},_meta:{board_id:boardId,view:base}}});
      else if (request.name === 'kingdown_move') {
        commit=request.arguments.actions;
        // The test sees commit before the match applies it; it waits for applied before it reads the match or committedFen.
        applied=(async()=>{ for (const [index,lan] of commit!.entries()) await match.apply({id:`commit-${index}`,expectedRevision:index,lan}); committedFen=(await match.snapshot()).fen; })();
        await applied;
        const after = await match.snapshot();
        await route.fulfill({json:{content:[],_meta:{view:{...base,revision:1,fen:after.fen,turn:after.turn,action:'waiting',legal:[],history:{initial_fen:snapshot.fen,actions:commit},last_commands:[{seq:1,seat:0,at:'2026-10-20T00:00:00Z',action:{type:'turn',actions:commit}}]}}}});
      } else await route.continue();
    });
    await page.goto(harness.url); await waitForSourceApp(page);
    const frame=page.frameLocator('iframe');
    await frame.locator('#home-play:not(:disabled)').waitFor();
    boardId=await page.evaluate(()=>(window as any).harnessWidgetState.privateContent.board_id);
    await page.evaluate(async ()=>(window as any).harnessSetContext({displayMode:'fullscreen'}));
    await frame.locator('html').evaluate((_,base)=>(window as any).harnessApp.routeView(base),base);
    await frame.locator('#board').waitFor({state:'visible'});
    await expect.poll(()=>previews).toBe(1);
    const move = async (lan:string) => {
      await frame.locator('#board').focus();
      await frame.locator('#power-w').click();
      await frame.getByRole('button',{name:'Use',exact:true}).click();
      await squareTap(page,0);
      await frame.locator('#board-menu').click();
      await frame.locator('#board-sheet').getByRole('button',{name:'Choose a move',exact:true}).click();
      await frame.locator(`#choices button[title="${lan}"]`).click();
      await expect.poll(()=>frame.locator('#end-turn').getAttribute('aria-disabled')).toBe('false');
      await expect.poll(()=>frame.locator('#board').getAttribute('data-animating')).toBe('false');
    };
    await move('Ra1-a4!H');
    await expect.poll(()=>frame.locator('#end-turn').getAttribute('aria-disabled')).toBe('false');
    expect(await boardFen(page)).toBe('7k/p7/8/8/R7/8/8/6K1 w - - 1 1 u1.0/ha4');
    await frame.locator('#undo').click();
    await expect.poll(()=>frame.locator('#end-turn').getAttribute('aria-disabled')).toBe('true');
    expect(await boardFen(page)).toBe(base.fen);
    await move('Ra1-a4!H');
    expect((await savedDraft(page)).lans).toEqual(['Ra1-a4!H']);
    const boots=await page.evaluate(()=>(window as any).harnessBoots);
    await page.locator('#remount').click();
    await expect.poll(()=>page.evaluate(()=>(window as any).harnessBoots)).toBe(boots+1);
    await page.frameLocator('iframe').locator('#board[aria-busy="false"]').waitFor({state:'visible'});
    await expect.poll(()=>page.frameLocator('iframe').locator('#end-turn').getAttribute('aria-disabled')).toBe('false');
    expect(await page.evaluate(()=>(window as any).harnessWidgetState.privateContent.draft.lans)).toEqual(['Ra1-a4!H']);
    await page.frameLocator('iframe').locator('#end-turn').click();
    await expect.poll(()=>commit).toEqual(['Ra1-a4!H','--']);
    await applied;
    expect((await match.snapshot()).turn).toBe(1);
    await expect.poll(()=>boardFen(page)).toBe(committedFen);
    expect(await page.frameLocator('iframe').locator('#recent-moves').textContent()).toContain('White rook');
    expect(errors).toEqual([]);
    // A held read belongs to its old view, not a newly selected board.
    const settled=returned;
    hold=true; game.revision=2;
    await page.frameLocator('iframe').locator('html').evaluate((_,base)=>(window as any).harnessApp.routeView({...base,revision:2}),base);
    await expect.poll(()=>!!release).toBe(true);
    const other={...base,game_id:crypto.randomUUID(),revision:3,fen:'7k/8/8/8/8/8/P7/K7 b - - 0 1',action:'waiting',turn:1} as View;
    await page.frameLocator('iframe').locator('html').evaluate((_,other)=>(window as any).harnessApp.routeView(other),other);
    release!(); release=undefined;
    await expect.poll(()=>page.frameLocator('iframe').locator('html').evaluate(()=>(window as any).harnessApp.memory.view?.game_id)).toBe(other.game_id);
    await expect.poll(()=>returned).toBe(settled+1);
    expect(await boardFen(page)).toBe(other.fen);
    expect(await savedDraft(page)).toBeNull();
    expect(errors).toEqual([]);
  } catch (error) { throw new Error(`${String(error)}; page errors: ${JSON.stringify(errors)}`,{cause:error}); }
  finally {release?.();await page.close();await match.close();}
});

it('keeps source pages without an engine stamp on server preview', async () => {
  const unstamped = await startHarness({ boardPath: join(folder, 'board.html'), sourcePage: true });
  const page = await browser.newPage(); page.setDefaultTimeout(5000);
  try {
    await page.goto(unstamped.url); await waitForSourceApp(page);
    const frame = page.frameLocator('iframe');
    await frame.locator('#home-play:not(:disabled)').waitFor();
    expect(await frame.locator('html').evaluate('(async () => (await import("/src/account-game/engine-identity.ts")).PAGE_ENGINE)()')).toBeUndefined();
    const result = await (await page.request.post(new URL(`/fixture-position?fen=${encodeURIComponent('7k/8/8/8/8/8/P7/K7 w - - 0 1')}`, unstamped.url).href)).json();
    await page.evaluate(async result => {
      await (window as any).harnessSetContext({ displayMode: 'fullscreen' });
      await (window as any).harnessShow(result);
    }, result);
    await frame.locator('#board').waitFor({ state: 'visible' });
    await expect.poll(() => page.evaluate(() => (window as any).harnessCalls.filter((call: any) => call.name === 'kingdown_preview').length)).toBe(1);
    await expect.poll(() => frame.locator('html').evaluate(() => (window as any).harnessApp.client.inflight)).toBe(0);
    expect(await frame.locator('html').evaluate(() => (window as any).harnessApp.store.page().notice)).toBeUndefined();
  } finally { await page.close(); await unstamped.close(); }
});

