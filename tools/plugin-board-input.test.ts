// Board tests, part 2: the board input journeys up to the W7-04 drafts. They run apart from tools/plugin-board.test.ts and
// tools/plugin-board-drafts.test.ts, so that each CI WebKit runner ends its share in the step limit (ticket 77, items 14 and 17).
import { expect, it } from 'vitest';
import type { Page } from 'playwright';
import { fromFen, toFen, toLan } from '../src/rules/setup';
import { legalMoves, makeMove, parseRule, setRules, type Rules } from '../src/rules/engine';
import { applyLan } from '../src/plugin/screens/board-model';
import { readText } from '../src/read';
import { describeMove } from '../src/move-text';
import { GameRules } from '../src/game-rules';
import { PRESETS, designCode, fromPreset } from '../src/workshop/model';
import { view, insets, edgeMisses, open, marks, closeHeld, clickButton, squarePoint, squareTap, settleBoardReads, turnBoard, chooseTurnMove, moveCalls, boardFen, savedDraft, remountBoard } from './lib/plugin-board-fixture';
import { pauseClock } from './lib/page-clock.mjs';

// Spec G3 a (J9 a): a shove or swap onto your own piece waits for a second tap; any other tap lets it go and never plays a move.
const cursorOf = (page: Page) => page.frameLocator('iframe').locator('html').evaluate(() => (window as any).testBoard.cursor);
it('G3: the ogre holds a shove onto its own pawn and plays it on the second tap', async () => {
  const fen = 'k7/8/8/8/8/2p5/3pP3/4O2K w - - 0 1', base = view(fen), page = await open(base), frame = page.frameLocator('iframe');
  setRules(base.rules!); const pre = fromFen(fen), shove = legalMoves(pre).find(m => m.from === 4 && m.shove?.from === 12)!;
  expect(shove).toBeDefined();
  try {
    await squareTap(page,4);
    expect((await marks(page)).shoves).toEqual([12]); expect((await marks(page)).moves.length).toBeGreaterThan(0); expect((await marks(page)).captures).toContain(11);
    await squareTap(page,12);
    expect(await frame.locator('#status').textContent()).toBe('Select again to shove.');
    expect(await frame.locator('#context-note').textContent()).toBe(describeMove(new GameRules(base.rules),pre,shove));
    expect(await marks(page)).toMatchObject({selected:4, moves:[], captures:[], swaps:[], shoves:[12], shoveTo:[{from:12,to:20}]});
    expect(await cursorOf(page)).toBe(12);
    expect(await boardFen(page)).toBe(fen);
    expect(await frame.locator('#undo').getAttribute('aria-disabled')).toBe('true');
    // An unmarked empty square that the ogre can reach lets the shove go and clears the selection, without moving.
    await squareTap(page,3);
    expect((await marks(page)).selected).toBeUndefined();
    expect(await frame.locator('#status').textContent()).toBe('Your move.');
    expect(await cursorOf(page)).toBe(null);
    expect(await boardFen(page)).toBe(fen);
    // An unmarked enemy piece that the ogre can take lets the shove go and reads that piece, without taking it.
    await squareTap(page,4); await squareTap(page,12);
    expect(await frame.locator('#status').textContent()).toBe('Select again to shove.');
    await squareTap(page,11);
    expect(await frame.locator('#status').textContent()).toBe('Black Pawn.');
    expect((await marks(page)).read).toBeDefined();
    expect(await boardFen(page)).toBe(fen);
    // Holding the shove again clears the enemy read, so All rules opens the ogre's rules.
    await squareTap(page,12);
    expect(await frame.locator('#status').textContent()).toBe('Select again to shove.');
    expect((await marks(page)).read).toBeUndefined();
    await frame.locator('#all-rules').click();
    expect(await frame.locator('#board-sheet').innerText()).toContain(readText(new GameRules(base.rules),pre,4));
    await frame.locator('#board-sheet button[aria-label="Close"]').click();
    expect(await frame.locator('#status').textContent()).toBe('Select again to shove.');
    // Escape lets the held shove go and clears the selection.
    await page.keyboard.press('Escape');
    expect((await marks(page)).selected).toBeUndefined();
    expect(await frame.locator('#status').textContent()).toBe('Your move.');
    expect(await cursorOf(page)).toBe(null);
    // Another own piece: the shove goes, and that piece is selected.
    await squareTap(page,4); await squareTap(page,12);
    await squareTap(page,7);
    expect((await marks(page)).selected).toBe(7);
    expect(await frame.locator('#status').textContent()).not.toBe('Select again to shove.');
    expect(await cursorOf(page)).toBe(null);
    // The let-go shove does not play on the next tap of the pawn: that tap holds it again.
    await squareTap(page,4); await squareTap(page,12);
    expect(await frame.locator('#status').textContent()).toBe('Select again to shove.');
    expect(await boardFen(page)).toBe(fen);
    await squareTap(page,12); await frame.locator('#board[data-animating="false"]').waitFor();
    expect(await boardFen(page)).toBe(toFen(makeMove(pre,shove)));
    expect(await frame.locator('#status').textContent()).toBe('Your turn is ready. Select End turn.');
    expect(await frame.locator('#undo').getAttribute('aria-disabled')).toBe('false');
    expect(await moveCalls(page)).toEqual([]);
  } finally { await page.close(); }
});

it('G3: the maester holds a swap with its own rook, by tap and by keyboard', async () => {
  const fen = '7k/8/8/8/2RM4/8/8/K7 w - - 0 1', base = view(fen), page = await open(base), frame = page.frameLocator('iframe');
  setRules(base.rules!); const pre = fromFen(fen), swap = legalMoves(pre).find(m => m.from === 27 && m.to === 26 && m.swap)!;
  expect(swap).toBeDefined();
  try {
    await squareTap(page,27); await squareTap(page,26);
    expect(await frame.locator('#status').textContent()).toBe('Select again to swap.');
    expect(await frame.locator('#context-note').textContent()).toBe(describeMove(new GameRules(base.rules),pre,swap));
    expect(await marks(page)).toMatchObject({selected:27, moves:[], captures:[], shoves:[], swaps:[26]});
    expect(await boardFen(page)).toBe(fen);
    // A tap on the maester lets the swap go and clears the selection, as before.
    await squareTap(page,27);
    expect((await marks(page)).selected).toBeUndefined();
    expect(await frame.locator('#status').textContent()).toBe('Your move.');
    expect(await boardFen(page)).toBe(fen);
    // Keyboard: Enter on the rook holds the swap, and a second Enter plays it.
    await frame.locator('#board').focus();
    for (const key of ['ArrowRight','ArrowRight','ArrowRight','ArrowUp','ArrowUp','ArrowUp','Enter','ArrowLeft','Enter']) await page.keyboard.press(key);
    expect(await frame.locator('#status').textContent()).toBe('Select again to swap.');
    expect(await boardFen(page)).toBe(fen);
    await page.keyboard.press('Enter'); await frame.locator('#board[data-animating="false"]').waitFor();
    expect(await boardFen(page)).toBe(toFen(makeMove(pre,swap)));
    expect(await frame.locator('#undo').getAttribute('aria-disabled')).toBe('false');
    expect(await moveCalls(page)).toEqual([]);
  } finally { await page.close(); }
});

it('G3: an armed Sky Lift card holds a swap of two own pieces, and Cancel ends it', async () => {
  const fen = '7k/8/8/8/2RM4/8/8/K7 w - - 0 1', rules: Partial<Rules> = { hands: [['SkyLift'], []] };
  const base = view(fen, rules), page = await open(base), frame = page.frameLocator('iframe');
  setRules(rules); const pre = fromFen(fen), swap = legalMoves(pre).find(m => m.power === 'skylift')!;
  expect(swap).toBeDefined(); const use = async () => { await frame.locator('#card-w-0').click(); await frame.locator('#board-sheet').getByRole('button', { name: 'Use', exact: true }).click(); };
  try {
    await use(); await squareTap(page,swap.from); await squareTap(page,swap.to);
    expect(await frame.locator('#status').textContent()).toBe('Select again to swap.');
    expect(await frame.locator('#context-note').textContent()).toBe(describeMove(new GameRules(base.rules),pre,swap));
    expect(await frame.locator('#context-text').getAttribute('data-rank')).toBe('armed');
    expect(await marks(page)).toMatchObject({selected:swap.from, moves:[], captures:[], shoves:[], swaps:[swap.to]});
    expect(await boardFen(page)).toBe(fen);
    // Cancel ends the armed card and the held swap.
    await frame.locator('#context-actions').getByRole('button', { name: 'Cancel', exact: true }).click();
    expect(await frame.locator('#status').textContent()).not.toBe('Select again to swap.');
    expect(await cursorOf(page)).toBe(null);
    // The second tap on the target plays the swap as a draft step.
    await use(); await squareTap(page,swap.from); await squareTap(page,swap.to);
    expect(await frame.locator('#status').textContent()).toBe('Select again to swap.');
    await squareTap(page,swap.to); await frame.locator('#board[data-animating="false"]').waitFor();
    expect(await boardFen(page)).toBe(toFen(makeMove(pre,swap)));
    expect(await frame.locator('#status').textContent()).toBe('Your turn is ready. Select End turn.');
    expect(await moveCalls(page)).toEqual([]);
  } finally { await page.close(); }
});

it.each([
  ['shove', 'k7/8/8/8/8/8/4P3/4O2K w - - 0 1', 4, 12],
  ['swap', '7k/8/8/8/2RM4/8/8/K7 w - - 0 1', 27, 26],
] as const)('G3: a drag onto your own piece previews the %s', async (action, fen, from, target) => {
  const page = await open(view(fen)), frame = page.frameLocator('iframe');
  try {
    const a = await squarePoint(page, from), b = await squarePoint(page, target);
    await page.mouse.move(a.x, a.y); await page.mouse.down();
    await page.mouse.move(b.x, b.y, { steps: 8 }); await page.mouse.up();
    expect(await frame.locator('#status').textContent()).toBe(`Select again to ${action}.`);
    expect(await boardFen(page)).toBe(fen);
    expect(await frame.locator('#undo').getAttribute('aria-disabled')).toBe('true');
    await squareTap(page, target); await frame.locator('#board[data-animating="false"]').waitFor();
    expect(await boardFen(page)).not.toBe(fen);
    expect(await frame.locator('#undo').getAttribute('aria-disabled')).toBe('false');
    expect(await moveCalls(page)).toEqual([]);
  } finally { await page.close(); }
});

it('G3: Undo lets a held shove go in the second move of a Haste turn', async () => {
  const fen = 'k7/8/8/8/8/8/3P4/4O2K w - - 0 1', rules: Partial<Rules> = { kings: [{ king: 'Flame', power: 'Haste' }, null] };
  const base = view(fen, rules), page = await open(base), frame = page.frameLocator('iframe');
  setRules(rules); const pre = fromFen(fen), haste = legalMoves(pre).find(m => m.power === 'haste' && m.from === 4 && m.to === 12)!;
  expect(haste).toBeDefined(); const mid = makeMove(pre, haste);
  try {
    await frame.locator('#power-w').click(); await frame.locator('#board-sheet').getByRole('button', { name: 'Use', exact: true }).click();
    await squareTap(page,4); await squareTap(page,12); await frame.locator('#board[data-animating="false"]').waitFor();
    expect(await boardFen(page)).toBe(toFen(mid));
    await squareTap(page,12); await squareTap(page,11);
    expect(await frame.locator('#status').textContent()).toBe('Select again to shove.');
    expect(await frame.locator('#undo').getAttribute('aria-disabled')).toBe('false');
    await frame.locator('#undo').click();
    expect(await boardFen(page)).toBe(fen);
    expect((await marks(page)).selected).toBeUndefined();
    expect(await frame.locator('#status').textContent()).toBe('Your move.');
    expect(await cursorOf(page)).toBe(null);
    expect(await moveCalls(page)).toEqual([]);
  } finally { await page.close(); }
});

it.each(['Resign', 'Abort'])('W7: Menu %s drops the draft move from the end card and trail', async action => {
  const {page,frame,base} = await turnBoard('4k3/7p/8/8/8/8/4P3/4K3 w - - 0 1');
  try {
    await chooseTurnMove(page,'e2-e4',12);
    await frame.locator('#board-menu').click();
    await frame.locator('#board-sheet').getByRole('button',{name:action,exact:action === 'Resign'}).click();
    await frame.locator('#board-sheet').getByRole('button',{name:action,exact:true}).click();
    // od-end ticket 06: a computer abort opens the Play hall with its setup; a resign opens the end card.
    await frame.locator(action === 'Resign' ? '#over[open]' : '[data-screen="play"]:not([hidden])').waitFor();
    expect(await moveCalls(page)).toEqual([]);
    expect(await page.evaluate(() => (window as any).harnessView.fen)).toBe(base.fen);
    if (action === 'Resign') {
      expect(await frame.locator('#end-reason').innerText()).toBe('Casual · You resigned.');
      expect(await frame.locator('#last-move').innerText()).toBe('Move 1.');
    }
    expect((await marks(page)).last).toEqual([]);
  } finally { await page.close(); }
});

it('W7-04: an incremental draw reply keeps the draft and the draw note (D13)', async () => {
  const initial_fen = '4k3/7p/8/8/8/8/4P3/4K3 b - - 0 1';
  const prior = applyLan(fromFen(initial_fen),'h7-h5',{})!;
  const base = view(toFen(prior.pos), {}, {kind:'friend', revision:1, history:{initial_fen,actions:['h7-h5']}});
  const page = await open(base), frame = page.frameLocator('iframe');
  try {
    await chooseTurnMove(page,'e2-e4',12);
    // Ticket 04 (D13): a draw offer is a new revision with the same base FEN, so the draft stays.
    await frame.locator('html').evaluate((_, next) => (window as any).harnessApp.routeView(next), {...base, revision:2, history:undefined, draw_offer:1, last_commands:[{seq:2, seat:1, at:base.server_now, action:{type:'draw',choice:'offer'}}]});
    expect(await boardFen(page)).toBe(toFen(applyLan(fromFen(base.fen),'e2-e4',{})!.pos));
    expect((await savedDraft(page)).scope.revision).toBe(2);
    expect(await frame.locator('#undo').getAttribute('aria-disabled')).toBe('false');
    expect(await frame.locator('#last-move').innerText()).toBe('White pawn e2 to e4.');
    expect(await frame.locator('#context-note').innerText()).toContain('Your opponent offers a draw.');
    expect(await moveCalls(page)).toEqual([]);
  } finally { await page.close(); }
});

it('W7: Escape from the move sheet clears selection and keeps the Haste draft', async () => {
  const {page,frame,base} = await turnBoard();
  try {
    await chooseTurnMove(page,'e2-e4!H',12);
    const staged = applyLan(fromFen(base.fen),'e2-e4!H',base.rules!)!;
    await squareTap(page,28); await frame.locator('#board-menu').click();
    await frame.locator('#board-sheet').getByRole('button',{name:'Choose a move',exact:true}).click();
    expect(await frame.locator('#choices button[title="e4-e5"]').count()).toBe(1);
    await page.keyboard.press('Escape');
    expect(await frame.locator('#board-sheet[open]').count()).toBe(0);
    expect((await marks(page)).selected).toBeUndefined();
    expect(await frame.locator('#choices button').count()).toBe(0);
    await squareTap(page,36);
    expect(await frame.locator('#board').getAttribute('data-animating')).toBe('false');
    expect(await boardFen(page)).toBe(toFen(staged.pos));
    expect(await frame.locator('#undo').getAttribute('aria-disabled')).toBe('false');
    expect(await moveCalls(page)).toEqual([]);
  } finally { await page.close(); }
});

it.each(['power','card'] as const)('W7: Escape on the board and sheet clears %s arming', async kind => {
  const rules: Partial<Rules> = kind === 'power' ? {kings:[{king:'Flame',power:'Haste'},null]} : {hands:[['Haste'],[]]};
  const base = view('4k3/7p/8/8/8/8/4P3/4K3 w - - 0 1',rules), page = await open(base), frame = page.frameLocator('iframe');
  try {
    for (const sheet of [false,true]) {
      await frame.locator(kind === 'power' ? '#power-w' : '#card-w-0').click();
      await frame.locator('#board-sheet').getByRole('button',{name:'Use',exact:true}).click();
      await squareTap(page,12);
      if (sheet) { await frame.locator('#board-menu').click(); await frame.locator('#board-sheet').getByRole('button',{name:'Choose a move',exact:true}).click(); }
      else await frame.locator('#board').focus();
      await page.keyboard.press('Escape');
      expect(await frame.locator('#board-sheet[open]').count()).toBe(0);
      expect((await marks(page)).selected).toBeUndefined();
      expect((await marks(page)).powers).toEqual([]);
      expect(await frame.locator('#choices button').count()).toBe(0);
      await squareTap(page,28);
      expect(await boardFen(page)).toBe(base.fen);
    }
    await squareTap(page,12); await squareTap(page,28); await frame.locator('#board[data-animating="false"]').waitFor();
    expect(await boardFen(page)).toBe(toFen(applyLan(fromFen(base.fen),'e2-e4',rules)!.pos));
    expect(await moveCalls(page)).toEqual([]);
  } finally { await page.close(); }
});

it.each([['C',''], ['c',''], ['V',''], ['v',''], ['T','Y'], ['t','Y'], ['T',''], ['t','']])('shows a letter and opens rules when %s has no portrait (design letter %s)', async (letter, designLetter) => {
  const designed = !!designLetter;
  const rules = designed ? parseRule(`design=${designCode({ ...fromPreset(PRESETS.find(p => p.key === 'rook')!), name: 'Old Ward', letter: designLetter })}`) : {};
  const page = await open(view(`7k/8/8/8/3${letter}4/8/P7/K7 w - - 0 1`, rules), 320, 568), frame = page.frameLocator('iframe');
  try {
    await frame.locator('#board[aria-busy="false"]').waitFor();
    await frame.locator('#board').evaluate(async () => {
      await document.fonts.ready;
      await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    });
    await squareTap(page, 27);
    const info = frame.getByRole('button', {name:'All rules',exact:true});
    for (const [width, height] of [[320,568], [393,852]]) {
      await page.setViewportSize({width, height});
      expect(await info.isVisible()).toBe(true);
      expect(await info.locator('.portrait').textContent()).toBe(designLetter || letter.toUpperCase());
      expect(await info.locator('.portrait').evaluate(el => { const style = getComputedStyle(el); return style.fontSize === style.getPropertyValue('--fs-xl').trim(); })).toBe(true);
      expect(await info.locator('img').count()).toBe(0);
      expect(await info.evaluate(button => {
        const b = button.getBoundingClientRect(), r = button.parentElement!.getBoundingClientRect();
        return b.width >= 44 && b.height >= 44 && b.left >= r.left && b.right <= r.right && b.top >= r.top && b.bottom <= r.bottom;
      })).toBe(true);
      await info.click();
      expect(await frame.locator('#board-sheet').innerText()).toContain(designed ? 'Old Ward' : letter.toUpperCase() === 'C' ? 'catapult' : letter.toUpperCase() === 'V' ? 'reaver' : 'templar');
      await frame.locator('#board-sheet').getByRole('button', {name:'Close',exact:true}).click();
      expect(await info.evaluate(button => button === document.activeElement)).toBe(true);
    }
  } finally { await page.close(); }
});

it.each([[320,568],[360,640],[852,393]])('keeps draw offer board and row size with the pawn portrait and actions at %d×%d', async (width,height) => {
  const rules: Partial<Rules> = {kings:[{king:'Mud',power:'March'},{king:'Shadow',power:'Darkness'}],hands:[['Haste'],['Haste']],marchUses:0};
  const page = await open(view('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',rules,{kind:'friend',draw_offer:1}),width,height), frame = page.frameLocator('iframe');
  const sizes = () => frame.locator('#context-line').evaluate(async row => {
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    return {
      board: document.querySelector('#board canvas')!.getBoundingClientRect().width,
      row: row.getBoundingClientRect().height,
      text: document.getElementById('context-text')!.getBoundingClientRect().height,
      actions: document.getElementById('context-actions')!.getBoundingClientRect().height,
    };
  });
  try {
    await page.evaluate(safeAreaInsets => (window as any).harnessSetContext({safeAreaInsets}),{top:height>width?63:0,right:0,bottom:height>width?84:0,left:0});
    await frame.locator('#board').evaluate(() => document.fonts.ready.then(() => {}));
    const before = await sizes();
    await squareTap(page,12);
    expect(await frame.getByRole('button', {name:'All rules',exact:true}).isVisible()).toBe(true);
    expect(await frame.locator('#context-actions button').allTextContents()).toEqual(['Choose a move','Accept draw','Decline draw']);
    const after = await sizes();
    expect(Math.abs(before.board-after.board), JSON.stringify({before,after})).toBeLessThan(1);
    expect(Math.abs(before.row-after.row), JSON.stringify({before,after})).toBeLessThan(1);
    expect(await frame.locator('#context-actions').evaluate(edgeMisses)).toEqual([]);
  } finally { await page.close(); }
});

it.each([[320,568],[393,852]] as const)('Q3 b: a draw offer keeps the board size, and the screen scrolls to the replies at %d×%d', async (width,height) => {
  const rules: Partial<Rules> = {kings:[{king:'Mud',power:'March'},{king:'Shadow',power:'Darkness'}],hands:[['Haste'],['Haste']],marchUses:0};
  const base = view('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',rules,{kind:'friend'});
  const page = await open(base,width,height), frame = page.frameLocator('iframe');
  const boardWidth = () => frame.locator('#board canvas').evaluate(async canvas => { await document.fonts.ready; return canvas.getBoundingClientRect().width; });
  try {
    await page.evaluate(safeAreaInsets => (window as any).harnessSetContext({safeAreaInsets}),insets(width));
    const before = await boardWidth();
    await frame.locator('html').evaluate((_, next) => (window as any).harnessApp.routeView(next), {...base, revision:1, draw_offer:1});
    await frame.locator('#accept-draw').waitFor();
    const after = await boardWidth();
    expect(after, `board ${before} → ${after}`).toBeGreaterThanOrEqual(before - 1);
    // The replies stay reachable: the screen scrolls to them rather than shrinking the board.
    const screen = await frame.locator('[data-screen="board"]').evaluate(el => ({ overflow: getComputedStyle(el).overflowY, over: el.scrollWidth > el.clientWidth + 1 }));
    expect(screen.overflow).toBe('auto'); expect(screen.over).toBe(false);
    expect(await frame.locator('#accept-draw').evaluate(el => {
      el.scrollIntoView({block:'nearest'});
      const r = el.getBoundingClientRect(), box = document.querySelector('[data-screen="board"]')!.getBoundingClientRect();
      return r.top >= box.top - 1 && r.bottom <= box.bottom + 1 && r.left >= box.left - 1 && r.right <= box.right + 1;
    })).toBe(true);
    // No row shrinks under its content: each card coin stays inside its strip, so the status never covers it.
    expect(await frame.locator('#game-table .card-coin').evaluateAll(coins => coins.filter(coin => {
      const c = coin.getBoundingClientRect(), s = coin.closest('.player-strip')!.getBoundingClientRect();
      return c.top < s.top - 1 || c.bottom > s.bottom + 1;
    }).length)).toBe(0);
  } finally { await page.close(); }
});

it.each([[320,568],[393,852]] as const)('Q6 b: the narrow status text keeps 12 px at each side at %d×%d', async (width,height) => {
  const page = await open(view('4k3/7p/8/8/8/8/4P3/4K3 w - - 0 1'),width,height), frame = page.frameLocator('iframe');
  try {
    await page.evaluate(safeAreaInsets => (window as any).harnessSetContext({safeAreaInsets}),insets(width));
    await frame.locator('#status').filter({hasText:'Your move'}).waitFor();
    const margins = await frame.locator('#context-line').evaluate(line => { const r = line.getBoundingClientRect(), s = line.closest('[data-screen="board"]')!.getBoundingClientRect(); return [r.left - s.left, s.right - r.right]; });
    expect(margins[0], 'left margin').toBeGreaterThanOrEqual(11.5); expect(margins[1], 'right margin').toBeGreaterThanOrEqual(11.5);
  } finally { await page.close(); }
});

it('W7: a draw offer keeps piece rules readable at 320 px before and during Send', async () => {
  const base = view('4k3/7p/8/8/8/8/4P3/4K3 w - - 0 1',{}, {kind:'friend',draw_offer:1});
  const page = await open(base,320,568), frame = page.frameLocator('iframe');
  try {
    await chooseTurnMove(page,'e2-e4',12);
    const staged = applyLan(fromFen(base.fen),'e2-e4',base.rules!)!;
    const rule = readText(new GameRules(base.rules),staged.pos,28).split('\n')[0].split(' · ')[1];
    expect(rule).toBeTruthy();
    for (const sending of [false,true]) {
      if (sending) {
        await page.evaluate(() => { (window as any).holdBeforeNext='kingdown_move'; });
        await frame.locator('#end-turn:not(:disabled):not([aria-disabled="true"])').waitFor();
        await clickButton(page, frame.locator('#end-turn')); await page.waitForFunction(() => typeof (window as any).releaseBefore==='function');
      }
      await squareTap(page,28);
      expect(await frame.locator('#context-note').innerText()).toContain(rule);
      expect(await frame.locator('#context-note').innerText()).toContain('Your opponent offers a draw.');
      expect(await frame.locator('#all-rules').isEnabled()).toBe(true);
      expect(await frame.locator('#context-actions').evaluate(e => [...e.children].every(child => { const r=child.getBoundingClientRect(); return r.left>=0 && r.right<=innerWidth && r.bottom<=document.getElementById('table-bar')!.getBoundingClientRect().top; }))).toBe(true);
      expect(await frame.locator('#context-text').evaluate(e => e.getBoundingClientRect().bottom<=document.getElementById('context-actions')!.getBoundingClientRect().top)).toBe(true);
      await frame.locator('#all-rules').click();
      expect(await frame.locator('#board-sheet').innerText()).toContain(rule);
      await page.keyboard.press('Escape');
      expect(await boardFen(page)).toBe(toFen(staged.pos));
      expect((await moveCalls(page)).length).toBe(sending ? 1 : 0);
    }
  } finally { await closeHeld(page); }
});

it('W7: stages a move, sends once, and starts the computer only after the press', async () => {
  const {page,frame,base} = await turnBoard('4k3/7p/8/8/8/8/4P3/4K3 w - - 0 1');
  try {
    await squareTap(page,12); await squareTap(page,28);
    await expect.poll(async () => (await savedDraft(page))?.lans).toEqual(['e2-e4']);
    await frame.locator('#board[data-animating="false"]').waitFor();
    expect(await moveCalls(page)).toEqual([]);
    expect(await page.evaluate(() => (window as any).harnessView.revision)).toBe(base.revision);
    expect(await page.evaluate(() => (window as any).harnessCalls.some((c: any) => c.name==='kingdown_computer'))).toBe(false);
    expect(await frame.locator('#status').textContent()).toBe('Your turn is ready. Select End turn.');
    expect(await frame.locator('#end-turn').getAttribute('aria-label')).toBe('End turn');
    expect(await frame.locator('#end-turn').getAttribute('title')).toBe('End turn');
    expect(await frame.locator('#end-turn').innerText()).toBe('');
    expect(await frame.locator('#end-turn use').getAttribute('href')).toBe('#i-sword');
    await page.emulateMedia({reducedMotion:'reduce'});
    expect(await frame.locator('#end-turn').evaluate(e => getComputedStyle(e).animationName)).toBe('none');
    await page.evaluate(() => { (window as any).holdBeforeNext='kingdown_move'; });
    await frame.locator('#end-turn:not(:disabled):not([aria-disabled="true"])').waitFor();
    await clickButton(page, frame.locator('#end-turn'));
    await page.waitForFunction(() => typeof (window as any).releaseBefore==='function');
    await frame.locator('#end-turn').evaluate(e => { (e as HTMLButtonElement).click(); });
    expect((await moveCalls(page)).map((c: any) => c.arguments.actions)).toEqual([['e2-e4']]);
    expect(await frame.locator('#undo').getAttribute('aria-disabled')).toBe('true');
    expect(await frame.locator('#end-turn').getAttribute('aria-disabled')).toBe('true');
    expect(await frame.locator('#undo').evaluate(e => (e as HTMLButtonElement).disabled)).toBe(false); expect(await frame.locator('#end-turn').evaluate(e => (e as HTMLButtonElement).disabled)).toBe(false);
    // macOS WebKit uses Option+Tab for buttons (WebKit issue 199671).
    await frame.locator('#undo').focus(); await page.keyboard.press(process.platform === 'darwin' && process.env.PLAYABLE_BROWSER === 'webkit' ? 'Alt+Tab' : 'Tab');
    expect(await frame.locator('#end-turn').evaluate(e => e===document.activeElement)).toBe(true);
    await page.evaluate(() => { (window as any).holdBeforeNext='kingdown_computer'; (window as any).releaseBefore(); });
    await page.waitForFunction(() => (window as any).harnessCalls.some((c: any) => c.name==='kingdown_computer'));
    expect(await frame.locator('#status').textContent()).toBe('Their move.');
    await expect.poll(async () => (await moveCalls(page)).length).toBe(1);
  } finally { await closeHeld(page); }
});

it('W7: undoes both Haste steps and restores the power coin and trail', async () => {
  const {page,frame} = await turnBoard();
  try {
    await chooseTurnMove(page,'e2-e4!H',12);
    expect(await frame.locator('#status').textContent()).toBe('Move it again, or select End turn.');
    expect(await frame.locator('#board').evaluate(e => e===document.activeElement)).toBe(true);
    await chooseTurnMove(page,'e4-e5',28);
    expect((await marks(page)).last).toEqual([12,28,36]);
    await frame.locator('#undo').click();
    expect((await marks(page)).last).toEqual([12,28]);
    await frame.locator('#undo').click();
    expect(await frame.locator('#power-w').getAttribute('data-state')).toBe('ready');
    expect(await frame.locator('#last-move').innerText()).toBe('Move 1.');
    expect(await frame.locator('#undo').getAttribute('aria-disabled')).toBe('true');
    expect(await frame.locator('#undo').evaluate(e => e===document.activeElement)).toBe(true);
    expect(await moveCalls(page)).toEqual([]);
  } finally { await page.close(); }
});

it('W7: sends a mid-way Haste turn with a pass in the same command', async () => {
  const {page,frame} = await turnBoard();
  try {
    await chooseTurnMove(page,'e2-e4!H',12);
    expect(await frame.getByRole('button',{name:'Stop here',exact:true}).count()).toBe(0);
    await page.evaluate(() => { (window as any).holdBeforeNext='kingdown_computer'; });
    await frame.locator('#end-turn:not(:disabled):not([aria-disabled="true"])').waitFor();
    await clickButton(page, frame.locator('#end-turn'));
    await expect.poll(async () => (await moveCalls(page)).length).toBe(1);
    expect((await moveCalls(page))[0].arguments.actions).toEqual(['e2-e4!H','--']);
  } finally { await closeHeld(page); }
});

it('W7: keeps reads and blocks legal tap, keyboard and drag moves before and during Send', async () => {
  const {page,frame,base} = await turnBoard(undefined, true);
  try {
    await chooseTurnMove(page,'e2-e4',12);
    const staged = applyLan(fromFen(base.fen),'e2-e4',base.rules!)!;
    expect(applyLan(staged.pos,'e7-e5',base.rules!)).toBeDefined();
    await frame.locator('html').evaluate(() => {
      const host=window as any, drag=host.testBoard.onDragSelect;
      host.dragAttempts=[]; host.testBoard.onDragSelect=(square: number) => { host.dragAttempts.push(square); drag(square); };
    });
    for (const sending of [false,true]) {
      if (sending) {
        // Input checks can outlast the request limit. Keep the held reply inside that limit.
        // Pause ahead of now; the page can pass that time before the command reaches it.
        for (let tries = 0; ; tries++) {
          try { await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000)); break; }
          catch (error) { if (tries >= 2 || !String(error).includes('Cannot fast-forward to the past')) throw error; }
        }
        await page.evaluate(() => { (window as any).holdBeforeNext='kingdown_move'; });
        await frame.locator('#end-turn:not(:disabled):not([aria-disabled="true"])').waitFor();
        await clickButton(page, frame.locator('#end-turn')); await page.waitForFunction(() => typeof (window as any).releaseBefore==='function');
      }
      expect(await frame.locator('#status').textContent()).toBe(sending ? 'Sending…' : 'Your turn is ready. Select End turn.');
      const unchanged = async () => {
        expect(await frame.locator('#board').getAttribute('data-animating')).toBe('false');
        expect(await boardFen(page)).toBe(toFen(staged.pos));
        expect(await page.evaluate(() => (window as any).harnessView.fen)).toBe(base.fen);
        expect((await moveCalls(page)).length).toBe(sending ? 1 : 0);
      };
      await squareTap(page,28);
      expect(await frame.locator('#context-line').getByRole('button',{name:'All rules',exact:true}).isEnabled()).toBe(true);
      if (sending) expect(await frame.locator('#context-text').innerText()).not.toMatch(/End turn|Undo/);
      else expect(await frame.locator('#context-note').textContent()).toContain('Select End turn, or Undo.');
      await frame.locator('#context-line').getByRole('button',{name:'All rules',exact:true}).click();
      await frame.locator('#board-sheet[open]').waitFor(); await page.keyboard.press('Escape');
      expect(await frame.locator('#context-line').getByRole('button',{name:'All rules',exact:true}).evaluate(e => e===document.activeElement)).toBe(true);
      await frame.locator('#power-w').click();
      expect(await frame.locator('#board-sheet').getByRole('button',{name:'Use',exact:true}).count()).toBe(0);
      await page.keyboard.press('Escape');
      expect(await frame.locator('#power-w').evaluate(e => e===document.activeElement)).toBe(true);
      await squareTap(page,52); await squareTap(page,36); await unchanged();
      const board=frame.locator('#board'); await board.focus();
      for (let n=0;n<7;n++) { await board.press('ArrowLeft'); await board.press('ArrowDown'); }
      for (let n=0;n<4;n++) await board.press('ArrowRight');
      for (let n=0;n<6;n++) await board.press('ArrowUp');
      expect(await board.getAttribute('aria-label')).toContain('e7,'); await board.press('Enter');
      await board.press('ArrowDown'); await board.press('ArrowDown');
      expect(await board.getAttribute('aria-label')).toContain('e5,'); await board.press('Enter'); await unchanged();
      const source=await squarePoint(page,52), target=await squarePoint(page,36);
      await page.mouse.move(source.x,source.y); await page.mouse.down(); await page.mouse.move(target.x,target.y,{steps:5}); await page.mouse.up();
      expect(await frame.locator('html').evaluate(() => (window as any).dragAttempts)).toEqual([]);
      await unchanged();
      if (!sending) { await frame.locator('#board-menu').click(); await frame.locator('#board-sheet').getByRole('button',{name:'Choose a move',exact:true}).click(); }
      expect(await frame.locator('#choices button').count()).toBe(0); await page.keyboard.press('Escape');
      expect(await frame.locator('#last-move').innerText()).toContain('White pawn e2 to e4.');
      expect((await moveCalls(page)).length).toBe(sending?1:0);
    }
    await page.clock.resume();
    await page.evaluate(() => { (window as any).holdBeforeNext='kingdown_computer'; (window as any).releaseBefore(); });
    await page.waitForFunction(() => (window as any).harnessCalls.some((c: any) => c.name==='kingdown_computer'));
    await squareTap(page,28);
    expect(await frame.locator('#context-line').getByRole('button',{name:'All rules',exact:true}).isEnabled()).toBe(true);
    await frame.locator('#power-w').click();
    expect(await frame.locator('#board-sheet').getByRole('button',{name:'Use',exact:true}).count()).toBe(0);
    await page.keyboard.press('Escape'); await squareTap(page,36); await frame.locator('#board').press('Enter');
    expect(await frame.locator('#last-move').innerText()).toContain('White pawn e2 to e4.');
    await expect.poll(async () => (await moveCalls(page)).length).toBe(1);
  } finally { await closeHeld(page); }
});

it('W7: blocks a legal Haste follow-up while Send waits', async () => {
  const {page,frame,base} = await turnBoard();
  try {
    await chooseTurnMove(page,'e2-e4!H',12);
    const staged = applyLan(fromFen(base.fen),'e2-e4!H',base.rules!)!;
    expect(staged.pos.turn).toBe(base.seat);
    expect(applyLan(staged.pos,'e4-e5',base.rules!)).toBeDefined();
    await frame.locator('html').evaluate(() => {
      const host=window as any, drag=host.testBoard.onDragSelect;
      host.dragAttempts=[]; host.testBoard.onDragSelect=(square: number) => { host.dragAttempts.push(square); drag(square); };
    });
    await page.evaluate(() => { (window as any).holdBeforeNext='kingdown_move'; });
    await frame.locator('#end-turn:not(:disabled):not([aria-disabled="true"])').waitFor();
    await clickButton(page, frame.locator('#end-turn')); await page.waitForFunction(() => typeof (window as any).releaseBefore==='function');
    expect(await frame.locator('#status').innerText()).toBe('Sending…');
    const unchanged = async () => {
      expect(await frame.locator('#board').getAttribute('data-animating')).toBe('false');
      expect(await boardFen(page)).toBe(toFen(staged.pos));
      expect(await page.evaluate(() => (window as any).harnessView.fen)).toBe(base.fen);
      expect((await moveCalls(page)).map((call: any) => call.arguments.actions)).toEqual([['e2-e4!H','--']]);
    };
    await squareTap(page,28); await squareTap(page,36); await unchanged();
    const board=frame.locator('#board'); await board.focus();
    for (let n=0;n<4;n++) await board.press('ArrowRight');
    for (let n=0;n<3;n++) await board.press('ArrowUp');
    expect(await board.getAttribute('aria-label')).toContain('e4,'); await board.press('Enter');
    await board.press('ArrowUp'); expect(await board.getAttribute('aria-label')).toContain('e5,'); await board.press('Enter'); await unchanged();
    const source=await squarePoint(page,28), target=await squarePoint(page,36);
    await page.mouse.move(source.x,source.y); await page.mouse.down(); await page.mouse.move(target.x,target.y,{steps:5}); await page.mouse.up();
    expect(await frame.locator('html').evaluate(() => (window as any).dragAttempts)).toEqual([]);
    await unchanged();
  } finally { await closeHeld(page); }
});

it('W7: stages mate, permits Undo, and ends only on the press with no second move animation', async () => {
  const {page,frame} = await turnBoard('k7/8/1K6/8/8/8/8/7R w - - 0 1');
  try {
    await frame.locator('html').evaluate(() => { const host=window as any, animate=host.testBoard.animateMove.bind(host.testBoard); host.turnAnimations=0; host.testBoard.animateMove=(...args: any[]) => { host.turnAnimations++; return animate(...args); }; });
    await squareTap(page,7); await squareTap(page,63);
    await expect.poll(async () => (await savedDraft(page))?.lans).toEqual(['Rh1-h8']);
    await frame.locator('#board[data-animating="false"]').waitFor();
    expect(await frame.locator('#status').textContent()).toBe('Checkmate. Select End turn to finish.');
    expect(await frame.locator('#over[open]').count()).toBe(0); expect(await moveCalls(page)).toEqual([]);
    await clickButton(page, frame.locator('#undo'));
    await frame.locator('#status').filter({ hasText: 'Your move.' }).waitFor();
    expect(await frame.locator('#status').textContent()).toBe('Your move.');
    await squareTap(page,7); await squareTap(page,63);
    await expect.poll(async () => (await savedDraft(page))?.lans).toEqual(['Rh1-h8']);
    await frame.locator('#board[data-animating="false"]').waitFor();
    await frame.locator('#end-turn:not(:disabled):not([aria-disabled="true"])').waitFor();
    await clickButton(page, frame.locator('#end-turn')); await frame.locator('#over[open]').waitFor();
    expect(await frame.locator('html').evaluate(() => (window as any).turnAnimations)).toBe(2);
    expect((await moveCalls(page))[0].arguments.actions).toEqual(['Rh1-h8']);
  } finally { await page.close(); }
});

it('W7: moves keyboard focus to the turn button, sends with Enter, and undoes with Z', async () => {
  const {page,frame} = await turnBoard('4k3/7p/8/8/8/8/4P3/4K3 w - - 0 1');
  try {
    const board=frame.locator('#board'); await board.focus();
    for(let n=0;n<4;n++) await board.press('ArrowRight'); await board.press('ArrowUp'); await board.press('Enter');
    await board.press('ArrowUp'); await board.press('ArrowUp'); await board.press('Enter');
    // The preview starts after the key press; a false animation flag alone can still be the old board.
    await frame.locator('#end-turn[aria-disabled="false"]').waitFor();
    await expect.poll(() => frame.locator('#end-turn').evaluate(e => e===document.activeElement)).toBe(true);
    await frame.locator('#end-turn').press('z');
    expect(await frame.locator('#undo').getAttribute('aria-disabled')).toBe('true');
    await board.press('ArrowDown'); await board.press('ArrowDown'); await board.press('Enter');
    await board.press('ArrowUp'); await board.press('ArrowUp'); await board.press('Enter');
    await frame.locator('#end-turn[aria-disabled="false"]').waitFor(); await board.press('z');
    expect(await moveCalls(page)).toEqual([]);
    await board.press('ArrowDown'); await board.press('ArrowDown'); await board.press('Enter');
    await board.press('ArrowUp'); await board.press('ArrowUp'); await board.press('Enter');
    await frame.locator('#end-turn[aria-disabled="false"]').waitFor();
    await expect.poll(() => frame.locator('#end-turn').evaluate(e => e===document.activeElement)).toBe(true);
    await page.evaluate(() => { (window as any).holdBeforeNext='kingdown_move'; });
    await frame.locator('#end-turn').press('Enter');
    expect(await board.evaluate(e => e===document.activeElement)).toBe(true);
    await expect.poll(async () => (await moveCalls(page)).length).toBe(1);
  } finally { await closeHeld(page); }
});


it('W7: snaps to the draft if motion fails and keeps Undo available', async () => {
  const {page,frame,base} = await turnBoard();
  try {
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message.replace(/^Error: /, '')));
    await frame.locator('html').evaluate(() => { (window as any).testBoard.animateMove=() => Promise.reject(new Error('Move motion test failure')); });
    await chooseTurnMove(page,'e2-e4',12);
    await expect.poll(() => errors).toEqual(['Move motion test failure']);
    expect(await frame.locator('html').evaluate(() => Array.from((window as any).testBoard.pos.board))).toEqual([...applyLan(fromFen(base.fen),'e2-e4',base.rules!)!.pos.board]);
    expect(await frame.locator('#undo').getAttribute('aria-disabled')).toBe('false');
    await frame.locator('#undo').click();
    expect(await frame.locator('#last-move').innerText()).toBe('Move 1.');
    expect(await moveCalls(page)).toEqual([]);
  } finally { await page.close(); }
});


it('W7: keeps a lost-send error while pieces and coins remain readable', async () => {
  const {page,frame} = await turnBoard(undefined, true);
  try {
    await chooseTurnMove(page,'e2-e4',12);
    // The reply is lost after the server commits the move. A solo poll read (every 5 s, src/plugin/poll.ts) would then
    // show the committed move and clear the selection that the checks below read (CI run 39965072628). Stop the page
    // clock to the end; a read that started before the pause ends first.
    await pauseClock(page); await settleBoardReads(page);
    await page.evaluate(() => { (window as any).dropNextMoveReply=true; });
    await frame.locator('#end-turn:not(:disabled):not([aria-disabled="true"])').waitFor();
    await clickButton(page, frame.locator('#end-turn')); await frame.locator('#retry').waitFor();
    const message=await frame.locator('#error').innerText(); expect(message).not.toBe('');
    await squareTap(page,28);
    expect(await frame.locator('#error').innerText()).toBe(message);
    expect(await frame.locator('#context-line').getByRole('button',{name:'All rules',exact:true}).isEnabled()).toBe(true);
    await frame.locator('#power-w').click();
    expect(await frame.locator('#error').innerText()).toBe(message);
    expect(await frame.locator('#board-sheet').getByRole('button',{name:'Use',exact:true}).count()).toBe(0);
    expect(await frame.locator('#undo').getAttribute('aria-disabled')).toBe('true');
    await expect.poll(async () => (await moveCalls(page)).length).toBe(1);
  } finally { await page.close(); }
});

it('W7: a lost send shows the waiting words beside Retry, not Sending, also after a remount', async () => {
  const {page,frame} = await turnBoard('4k3/7p/8/8/8/8/4P3/4K3 w - - 0 1');
  try {
    await chooseTurnMove(page,'e2-e4',12);
    // The connection drops before the server gets the turn, so the restored draft and command stay after a remount.
    await page.route('**/fixture-tool', route => route.request().postDataJSON()?.name === 'kingdown_move' ? route.abort() : route.continue());
    await frame.locator('#end-turn:not(:disabled):not([aria-disabled="true"])').waitFor();
    await clickButton(page, frame.locator('#end-turn')); await frame.locator('#retry').waitFor();
    // Nothing is in flight now: send-turn 03 A3 shows Sending only while the turn waits for its reply.
    await expect.poll(() => frame.locator('html').evaluate(() => (window as any).harnessApp.client.inflight)).toBe(0);
    expect(await frame.locator('#status').textContent()).toBe('Your turn is ready. Select End turn.');
    await remountBoard(page);
    await frame.locator('#retry').waitFor();
    await expect.poll(() => frame.locator('html').evaluate(() => (window as any).harnessApp.client.inflight)).toBe(0);
    expect(await frame.locator('#status').textContent()).toBe('Your turn is ready. Select End turn.');
  } finally { await page.close(); }
});

// Playtest F-032 and F-038: a real touch tap on a target with more than one move opens Choose a move. The browser sends the
// tap's click after the touch ends, onto the scrim that the tap opened; that click must not close the sheet.
async function squareTouch(page: Page, square: number) {
  const point = await squarePoint(page, square);
  await page.touchscreen.tap(point.x, point.y);
}
const frames = (page: Page) => page.frameLocator('iframe').locator('html').evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
it.each([
  ['F-032 promotion', '7k/1P6/8/8/8/8/8/K7 w - - 0 1', 49, 57],
  ['F-038 Beast bite chain', '7k/8/8/8/2Sp4/2p5/8/K7 w - - 0 1', 26, 27],
] as const)('%s: a touch tap on a target with more than one move opens Choose a move', async (_, fen, from, to) => {
  const base = view(fen), page = await open(base, 390, 844), frame = page.frameLocator('iframe');
  setRules(base.rules!); const pre = fromFen(fen);
  const lans = legalMoves(pre).filter(m => m.from === from && (m.to === to || m.captures.includes(to))).map(m => toLan(pre, m)).sort();
  expect(lans.length).toBeGreaterThan(1);
  try {
    await frame.locator('#board[aria-busy="false"]').waitFor();
    await squareTouch(page, from);
    expect((await marks(page)).selected).toBe(from);
    await squareTouch(page, to);
    await frames(page);
    const sheet = frame.getByRole('dialog', { name: 'Choose a move', exact: true });
    expect(await sheet.isVisible()).toBe(true);
    expect((await frame.locator('#choices button').evaluateAll(buttons => buttons.map(b => (b as HTMLElement).title))).sort()).toEqual(lans);
    // The touch's mousedown on the scrim keeps focus in the sheet, so Escape still closes it.
    expect(await sheet.getByRole('button', { name: 'Close', exact: true }).evaluate(b => b === document.activeElement)).toBe(true);
    await page.keyboard.press('Escape');
    expect(await sheet.isVisible()).toBe(false);
    expect((await marks(page)).selected).toBeUndefined();
    await squareTouch(page, from);
    await squareTouch(page, to);
    await frames(page);
    expect(await sheet.isVisible()).toBe(true);
    // A tap on the scrim still closes the sheet, and keeps the piece selected.
    const scrim = (await frame.locator('.scrim.move-choice-scrim').boundingBox())!;
    await page.touchscreen.tap(scrim.x + scrim.width / 2, scrim.y + 8);
    await frames(page);
    expect(await sheet.isVisible()).toBe(false);
    expect((await marks(page)).selected).toBe(from);
    await squareTouch(page, to);
    await frames(page);
    const choice = (await frame.locator(`#choices button[title="${lans[0]}"]`).boundingBox())!;
    await page.touchscreen.tap(choice.x + choice.width / 2, choice.y + choice.height / 2);
    await expect.poll(async () => (await savedDraft(page))?.lans.at(-1)).toBe(lans[0]);
    expect(await sheet.isVisible()).toBe(false);
    await frame.locator('#board[data-animating="false"]').waitFor();
    expect(await frame.locator('#undo').getAttribute('aria-disabled')).toBe('false');
  } finally { await page.close(); }
});

// Playtest F-008: a long Moves sheet scrolls by keyboard. Tab reaches the scroll region; PageDown and End move it.
it('F-008: the keyboard scrolls a long Moves sheet', async () => {
  const initial_fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', actions: string[] = [];
  for (let i = 0; i < 10; i++) actions.push('Nb1-a3', 'Nb8-a6', 'Na3-b1', 'Na6-b8');
  const game = view(initial_fen, {}, { kind: 'friend', seat: 0 });
  let pos = fromFen(initial_fen);
  for (const lan of actions) { const step = applyLan(pos, lan, game.rules!); expect(step).toBeDefined(); pos = step!.pos; }
  const page = await open(view(toFen(pos), game.rules!, { ...game, fen: toFen(pos), revision: actions.length, history: { initial_fen, actions } }), 390, 844), frame = page.frameLocator('iframe');
  try {
    await frame.locator('#board-menu').focus(); await page.keyboard.press('Enter');
    await frame.getByRole('button', { name: 'Moves', exact: true }).focus(); await page.keyboard.press('Enter');
    const sheet = frame.getByRole('dialog', { name: 'Moves', exact: true }), body = sheet.locator('.sheet-body');
    expect(await sheet.getByRole('button', { name: 'Close', exact: true }).evaluate(b => b === document.activeElement)).toBe(true);
    expect(await body.evaluate(el => el.scrollHeight > el.clientHeight)).toBe(true);
    await page.keyboard.press('Tab');
    expect(await body.evaluate(el => el === document.activeElement && el.matches(':focus-visible'))).toBe(true);
    expect(await body.getAttribute('role')).toBe('region');
    expect(await body.getAttribute('aria-label')).toBe('Moves');
    await page.keyboard.press('PageDown');
    await expect.poll(() => body.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
    await page.keyboard.press('End');
    await expect.poll(() => body.evaluate(el => Math.ceil(el.scrollTop + el.clientHeight) >= el.scrollHeight)).toBe(true);
    await page.keyboard.press('Tab');
    expect(await sheet.getByRole('button', { name: 'Close', exact: true }).evaluate(b => b === document.activeElement)).toBe(true);
    await page.keyboard.press('Shift+Tab');
    expect(await body.evaluate(el => el === document.activeElement)).toBe(true);
  } finally { await page.close(); }
});

// A body that stops scrolling while it has focus leaves the Tab order when focus leaves it.
it('F-008: a Moves sheet body that stops scrolling leaves the Tab order on blur', async () => {
  const initial_fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', actions = ['Nb1-a3', 'Nb8-a6', 'Na3-b1', 'Na6-b8'];
  const game = view(initial_fen, {}, { kind: 'friend', seat: 0 });
  let pos = fromFen(initial_fen);
  for (const lan of actions) { const step = applyLan(pos, lan, game.rules!); expect(step).toBeDefined(); pos = step!.pos; }
  const page = await open(view(toFen(pos), game.rules!, { ...game, fen: toFen(pos), revision: actions.length, history: { initial_fen, actions } }), 390, 400), frame = page.frameLocator('iframe');
  try {
    await frame.locator('#board-menu').focus(); await page.keyboard.press('Enter');
    await frame.getByRole('button', { name: 'Moves', exact: true }).focus(); await page.keyboard.press('Enter');
    const body = frame.getByRole('dialog', { name: 'Moves', exact: true }).locator('.sheet-body');
    await page.keyboard.press('Tab');
    expect(await body.evaluate(el => el === document.activeElement && el.scrollHeight > el.clientHeight)).toBe(true);
    await page.setViewportSize({ width: 390, height: 844 });
    await frames(page);
    expect(await body.evaluate(el => el === document.activeElement && el.scrollHeight <= el.clientHeight)).toBe(true);
    expect(await body.getAttribute('tabindex')).toBe('0');
    await page.keyboard.press('Tab');
    await frames(page);
    expect(await body.evaluate(el => [el.getAttribute('tabindex'), el.getAttribute('role'), el.getAttribute('aria-label')])).toEqual([null, null, null]);
    await page.keyboard.press('Shift+Tab');
    expect(await frame.getByRole('button', { name: 'Close', exact: true }).evaluate(b => b === document.activeElement)).toBe(true);
  } finally { await page.close(); }
});

// A press that starts on the scrim and ends on the sheet sends no click to the scrim. A later press that starts on the
// sheet and ends on the scrim must not close the sheet with that old press. Chromium only: the test sends raw touches.
it.skipIf(!!process.env.PLAYABLE_BROWSER && process.env.PLAYABLE_BROWSER !== 'chromium')('F-032: an old scrim press does not close the sheet for a later press from the sheet', async () => {
  const page = await open(view('7k/8/8/8/8/8/P7/K7 w - - 0 1'), 390, 844), frame = page.frameLocator('iframe');
  try {
    await frame.locator('#board-menu').focus(); await page.keyboard.press('Enter');
    const sheet = frame.locator('#board-sheet'); await frame.locator('#board-sheet[open]').waitFor(); await frames(page);
    const box = (await sheet.boundingBox())!, x = box.x + 12, cdp = await page.context().newCDPSession(page);
    const drag = async (from: number, to: number) => {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: from, id: 1 }] });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: to, id: 1 }] });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await frames(page);
    };
    await drag(box.y - 2, box.y + 2);
    expect(await sheet.isVisible()).toBe(true);
    await drag(box.y + 2, box.y - 2);
    expect(await sheet.isVisible()).toBe(true);
    await cdp.detach();
  } finally { await page.close(); }
});

// Playtest F-009: Escape from a Menu item returns visible focus to Menu. Refresh the board leaves the sheet as the sheet closes.
it.each(['Close', 'Refresh the board'])('F-009: Escape from the Menu (%s) returns visible focus to Menu', async item => {
  const {page, frame} = await turnBoard('7k/8/8/8/8/8/P7/K7 w - - 0 1');
  try {
    await frame.locator('#reload:not(:disabled)').waitFor({ state: 'attached' });
    await frame.locator('#board-menu').focus(); await page.keyboard.press('Enter');
    const sheet = frame.getByRole('dialog', { name: 'Menu', exact: true });
    expect(await sheet.isVisible()).toBe(true);
    // From Close, Shift+Tab goes to the game-policy button in the header, then wraps to the last Menu item.
    if (item !== 'Close') for (let i = 0; i < 2; i++) await page.keyboard.press('Shift+Tab');
    expect(await frame.locator('html').evaluate(() => { const e = document.activeElement as HTMLElement; return e.getAttribute('aria-label') ?? e.textContent; })).toBe(item);
    await page.keyboard.press('Escape');
    expect(await sheet.isVisible()).toBe(false);
    expect(await frame.locator('#board-menu').evaluate(b => b === document.activeElement && b.matches(':focus-visible'))).toBe(true);
  } finally { await page.close(); }
});
