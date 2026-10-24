import { expect, it } from 'vitest';
import { STEP } from './lib/checks.mjs';
import { fromFen, toFen, toLan } from '../src/rules/setup';
import { legalMoves, makeMove, RULES, setRules, type Move, type Rules } from '../src/rules/engine';
import { applyLan } from '../src/plugin/screens/board-model';
import { LESSONS } from '../src/lessons';
import { DEFAULT_OPTIONS } from '../src/match/setup';
import { checkTabletButtons, checkButtonContent } from './lib/plugin-tablet-check.mjs';
import { cardFaces } from './lib/plugin-card-faces.mjs';
import { checkCoinFocus } from './lib/plugin-coin-focus-check.mjs';
import { describeMove } from '../src/move-text';
import { GameRules } from '../src/game-rules';
import { cardText, powerText, ruleLine } from '../src/powers-ui';
import { harness, served, browser, view, insets, targetMisses, edgeMisses, open, marks, clickButton, squareTap } from './lib/plugin-board-fixture';

it.each(['See the board', 'New game'])('cancels a pending ceremony with %s during the final move', async action => {
  const before = view('7k/8/6K1/8/8/8/8/Q7 w - - 0 1'), pre = fromFen(before.fen);
  const move = legalMoves(pre).find(m => toLan(pre,m) === 'Qa1-a8')!, post = makeMove(pre,move);
  const page = await open(before, 393, 852, true), frame = page.frameLocator('iframe');
  try {
    // Artwork load is separate from the first visible frame; it can outlast an action wait on a cold load.
    await frame.locator('html').evaluate(async () => { await (window as any).testBoard.ready(); });
    await frame.locator('#board canvas').waitFor({ state: 'visible' });
    await frame.locator('html').evaluate(() => {
      const w = window as any; w.falls = []; const set = w.testBoard.setFallen.bind(w.testBoard);
      w.testBoard.setFallen = (sq: number|null, animate: boolean) => { if (sq !== null) w.falls.push(animate); set(sq,animate); };
      w.testBoard.animateMove = () => new Promise<void>(resolve => { w.endReplay = resolve; });
    });
    const next = { ...before, fen: toFen(post), revision: 1, status: 'finished', action: 'finished', turn: 1, legal: [], result: { winner: 0, reason: 'checkmate' }, last_commands: [{ seq: 1, seat: 0, at: before.server_now, action: { type: 'turn', actions: ['Qa1-a8'] } }] };
    await frame.locator('html').evaluate((_, next) => (window as any).harnessApp.routeView(next), next);
    await frame.locator('#over[open]').waitFor();
    expect(await frame.locator('#board[data-toppling]').count()).toBe(0);
    if (action === 'New game') await page.clock.fastForward(1000);
    // The CSS entry animation uses the browser timeline, not the test clock.
    await frame.locator('#over').evaluate(async e => { await Promise.all(e.getAnimations().map(a => a.finished)); });
    await clickButton(page, frame.locator('#over').getByRole('button', { name: action, exact: true }));
    await frame.locator('#over[open]').waitFor({ state: 'hidden' });
    if (action === 'New game') await frame.locator('[data-screen="play"]:not([hidden])').waitFor();
    else await frame.locator('#end-result').waitFor();
    await frame.locator('html').evaluate(() => (window as any).endReplay());
    await frame.locator('#board[data-animating="false"]').waitFor({ state: 'attached' });
    expect(await frame.locator('html').evaluate(() => (window as any).falls.includes(true))).toBe(false);
    expect(await frame.locator('#board[data-toppling], #board .kd-words').count()).toBe(0);
  } finally { await page.close(); }
});

it.each(['Skip mouse', 'Skip touch', 'Finish'])('keeps the king fall running when the result card opens, then %s clears it', async ending => {
  const before = view('7k/8/6K1/8/8/8/8/Q7 w - - 0 1'), pre = fromFen(before.fen);
  const move = legalMoves(pre).find(m => toLan(pre,m) === 'Qa1-a8')!, post = makeMove(pre,move);
  const page = await open(before, 360, 844, true), frame = page.frameLocator('iframe');
  try {
    await frame.locator('html').evaluate(() => {
      const w = window as any; w.falls = []; const set = w.testBoard.setFallen.bind(w.testBoard);
      w.testBoard.setFallen = (sq: number|null, animate: boolean) => { if (sq !== null) w.falls.push(animate); set(sq,animate); };
    });
    // Hold the short ceremony while browser calls read it and press Skip.
    await page.clock.setFixedTime(new Date()); await page.clock.pauseAt(await page.evaluate(() => Date.now()));
    await frame.locator('html').evaluate((_, next) => (window as any).harnessApp.routeView(next), { ...before, fen: toFen(post), revision: 1, status: 'finished', action: 'finished', turn: 1, legal: [], result: { winner: 0, reason: 'checkmate' }, last_commands: [] });
    // Open the result card through its queued timers and frame, then keep the ceremony paused.
    await page.clock.runFor(50);
    await frame.locator('#over[open]').waitFor(); await frame.locator('#board[data-toppling]').waitFor({ state: 'attached' });
    expect(await frame.locator('html').evaluate(() => (window as any).falls)).toEqual([true]);
    if (ending !== 'Finish') {
      expect(await frame.locator('html').evaluate(() => (window as any).testBoard.scene.falling)).toBe(true);
      await frame.locator('#over').evaluate(async el => { await Promise.all(el.getAnimations().map(a => a.finished)); });
      const box = (await frame.locator('#end-skip').boundingBox())!;
      if (ending === 'Skip touch') await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
      else await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await expect.poll(() => frame.locator('#end-skip').isHidden()).toBe(true);
    } else await page.clock.fastForward(1130);
    expect(await frame.locator('html').evaluate(() => (window as any).falls.at(-1))).toBe(false);
    expect(await frame.locator('#board[data-toppling], #board .kd-words').count()).toBe(0);
    await page.clock.runFor(1200);
    expect(await frame.locator('#board[data-toppling], #board .kd-words').count()).toBe(0);
    expect(await frame.locator('#game-table').evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  } finally { await page.close(); }
});

it.each(['move', 'vault', 'freeze', 'power'] as const)('marks the opponent %s on its source and targets after first-move entry', async kind => {
  const rules: Partial<Rules> = kind === 'power' ? { kings: [null, { king: 'Frost', power: 'Freeze' }] } : kind === 'move' ? {} : { hands: [[], [kind === 'vault' ? 'Vault' : 'Freeze']] };
  const fen = 'r6k/p7/8/8/8/8/4P3/K7 b - - 0 1'; setRules(rules); const pre = fromFen(fen);
  const move = legalMoves(pre).find(m => kind === 'move' ? !m.power && m.from === 48 && m.to === 40 : m.power === (kind === 'vault' ? 'vault' : 'freeze'))!;
  expect(move).toBeDefined(); const lan = toLan(pre, move), post = makeMove(pre, move);
  const next = view(toFen(post), rules, { revision: 1, seat: 0, history: { initial_fen: fen, actions: [lan] } });
  const page = await open(next);
  try { expect((await marks(page)).last).toEqual([...new Set([move.from, move.to, ...move.captures])]); }
  finally { await page.close(); }
});

it.each([['a stop', 'pass'], ['a second move', 'move']] as const)('marks each opponent Haste step when the turn ends with %s', async (_, end) => {
  const rules: Partial<Rules> = { kings: [null, { king: 'Flame', power: 'Haste' }] }, fen = '4k3/p7/8/8/8/8/4P3/K7 b - - 0 1';
  setRules(rules); let pos = fromFen(fen); const lans: string[] = [], squares: number[] = [];
  for (const pick of [(m: Move) => m.power === 'haste' && m.from === 48 && m.to === 40, (m: Move) => end === 'pass' ? !!m.pass : !m.pass && m.from === 40 && m.to === 32]) {
    const move = legalMoves(pos).find(pick)!; expect(move).toBeDefined();
    lans.push(toLan(pos, move)); if (!move.pass) squares.push(move.from, move.to); pos = makeMove(pos, move);
  }
  expect(pos.turn).toBe(0);
  const page = await open(view(toFen(pos), rules, { revision: 2, seat: 0, history: { initial_fen: fen, actions: lans } }));
  try { expect((await marks(page)).last).toEqual([...new Set(squares)]); }
  finally { await page.close(); }
});

it('keeps Their move through the opponent Haste turn', async () => {
  const rules: Partial<Rules> = { kings: [null, { king: 'Flame', power: 'Haste' }] }, fen = '4k3/p7/8/8/8/8/4P3/K7 b - - 0 1';
  setRules(rules); const pre = fromFen(fen), move = legalMoves(pre).find(m => m.power === 'haste' && m.from === 48 && m.to === 40)!;
  // A solo view asks the server to move the computer. This game has no server row, so that programmatic write comes
  // back refused. The refusal must not blank the words area (ticket 19 S2: a refusal belongs to a user command).
  const page = await open(view(toFen(makeMove(pre, move)), rules, { revision: 1, seat: 0, history: { initial_fen: fen, actions: [toLan(pre, move)] } })), frame = page.frameLocator('iframe');
  try {
    expect(await frame.locator('#status').textContent()).toBe('Their move.');
    expect(await frame.locator('#end-turn').getAttribute('aria-disabled')).toBe('true');
    // Wait for the board's four computer asks and their follow-up reads to finish, then check the words area.
    await page.waitForFunction(() => {
      const calls = (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_computer').length;
      return calls >= 4 && (window as any).harnessInflight === 0;
    });
    expect(await frame.locator('#error').textContent()).toBe('');
    expect(await frame.locator('#status').textContent()).toBe('Their move.');
    expect(await frame.locator('#retry').isHidden()).toBe(true);
  } finally { await page.close(); }
});

it('marks the pieces that can use Vault with the power target mark', async () => {
  const rules: Partial<Rules> = { hands: [['Vault'], []] }, next = view('7k/8/8/8/8/8/P7/R6K w - - 0 1', rules);
  const page = await open(next), frame = page.frameLocator('iframe');
  try {
    await frame.locator('#card-w-0').click(); await frame.getByRole('button', { name: 'Use', exact: true }).click();
    expect(await frame.locator('#status').textContent()).toBe('Vault.');
    setRules(rules); const sources = [...new Set(legalMoves(fromFen(next.fen)).filter(m => m.power === 'vault').map(m => m.from))];
    expect(sources.length).toBeGreaterThan(0); expect((await marks(page)).powers).toEqual(sources);
  } finally { await page.close(); }
});

// Use refreshes the board, and the refresh rebuilds the coins.
it.each([
  ['card-w-0', '7k/8/8/8/8/8/P7/R6K w - - 0 1', { hands: [['Vault'], []] }],
  ['power-w', '7k/8/8/8/8/8/p7/K7 w - - 0 1', { kings: [{ king: 'Frost', power: 'Freeze' }, null] }],
] as [string, string, Partial<Rules>][])('keeps focus on %s after its Use button', async (id, fen, rules) => {
  const page = await open(view(fen, rules)), frame = page.frameLocator('iframe');
  try {
    await frame.locator(`#${id}`).click(); await frame.getByRole('button', { name: 'Use', exact: true }).click();
    await frame.locator('#board-sheet:not([open])').waitFor({ state: 'attached' });
    expect(await frame.locator('html').evaluate(() => document.activeElement?.id || document.activeElement?.tagName)).toBe(id);
  } finally { await page.close(); }
});

it('names the card owner, feature icons and the computer once', async () => {
  const page = await open(view('7k/8/8/8/8/8/P7/K7 w - - 0 1', { hands: [['Freeze'], ['Freeze']] }, { level: 'beginner' })), frame = page.frameLocator('iframe');
  try {
    expect.soft(await frame.locator('#card-w-0').getAttribute('aria-label')).toBe('Your Freeze');
    expect.soft(await frame.locator('#card-b-0').getAttribute('aria-label')).toBe("Opponent's Freeze");
  } finally { await page.close(); }
});

// Spec W10 a: the board uses the card names of setup, the Cards sheet and the Collection.
it('names Mirror B and Morph P with the shared card names on the coins, the sheet and the armed line', async () => {
  const page = await open(view('7k/8/8/8/8/8/P7/K7 w - - 0 1', { hands: [['MorphP'], ['MirrorB']] })), frame = page.frameLocator('iframe');
  try {
    expect.soft(await frame.locator('#card-w-0').getAttribute('aria-label')).toBe('Your Morph');
    expect.soft(await frame.locator('#card-b-0').getAttribute('aria-label')).toBe("Opponent's Mirror");
    await frame.locator('#card-w-0').click();
    expect(await frame.locator('#board-sheet[open] h2').textContent()).toBe('Morph');
    await frame.getByRole('button', { name: 'Use', exact: true }).click();
    expect(await frame.locator('#status').textContent()).toBe('Morph.');
  } finally { await page.close(); }
});

it('keeps round coin faces while a command disables the buttons', async () => {
  const page = await open(view('7k/8/8/8/8/8/P7/K7 w - - 0 1', { hands: [['MorphP'], ['MirrorB']] })), frame = page.frameLocator('iframe');
  try {
    const coins = await frame.locator('#game-table').evaluate(table => [...table.querySelectorAll<HTMLButtonElement>('.coin')].map(coin => {
      coin.disabled = true;
      const style = getComputedStyle(coin.querySelector('.coin-paint')!);
      return { round: style.borderRadius === '50%', radial: style.backgroundImage.includes('radial-gradient'), cursor: getComputedStyle(coin).cursor };
    }));
    expect(coins.length).toBeGreaterThan(0);
    expect(coins.every(coin => coin.round && coin.radial && coin.cursor === 'default')).toBe(true);
  } finally { await page.close(); }
});

it.each([['light', 'cards'], ['dark', 'cards'], ['light', 'powers'], ['dark', 'powers']] as const)('keeps used coin focus above 3:1 in %s with %s at 390 × 844', async (theme, kind) => {
  const rules: Partial<Rules> = kind === 'cards' ? { hands: [['Freeze', 'Vault'], ['Freeze', 'Vault']] }
    : { kings: [{ king: 'Frost', power: 'Freeze' }, { king: 'Frost', power: 'Freeze' }] };
  const page = await open(view('7k/8/8/8/8/8/P7/R6K w - - 0 1 u3.3', rules), 390, 844), frame = page.frameLocator('iframe');
  try {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.evaluate(theme => (window as any).harnessSetContext({ theme }), theme);
    const ids = await frame.locator('#game-table .coin[data-state="used"]').evaluateAll(coins => coins.map(c => c.id));
    expect(ids).toHaveLength(kind === 'cards' ? 4 : 2);
    for (const id of ids) await checkCoinFocus(page, frame, `#${id}`);
    expect(await frame.locator('#game-table .coin-paint > .notches').count()).toBe(kind === 'powers' ? 2 : 0);
    expect(await frame.locator('#game-table').evaluate(table => [...table.querySelectorAll('.notches')].every(n => n.parentElement?.className === 'coin-paint'))).toBe(true);
  } finally { await page.close(); }
});

it('keeps spent coin contrast and clear symbols together', async () => {
  const page = await open(view('7k/8/8/8/8/8/P7/K7 w - - 0 1', { hands: [['MorphP'], ['MirrorB']] })), frame = page.frameLocator('iframe');
  try {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const coins = await frame.locator('#game-table').evaluate(table => [...table.querySelectorAll<HTMLButtonElement>('.card-coin')].map(coin => {
      coin.dataset.state = 'used'; coin.disabled = true;
      const style = getComputedStyle(coin.querySelector('.coin-paint')!), symbol = coin.querySelector('svg')!, face = symbol.getBoundingClientRect(), box = coin.getBoundingClientRect();
      return { opacity: style.opacity, buttonOpacity: getComputedStyle(coin).opacity, symbol: !!symbol, letters: coin.textContent, color: getComputedStyle(symbol).color, inset: box.width - face.width };
    }));
    expect(coins).toHaveLength(2);
    expect(coins[0].color).not.toBe(coins[1].color);
    expect(coins[1].color).toBe('rgb(255, 245, 218)');
    for (const coin of coins) { expect(coin.opacity).toBe('0.85'); expect(coin.buttonOpacity).toBe('1'); expect(coin.symbol).toBe(true); expect(coin.letters).toBe(''); expect(coin.inset).toBeCloseTo(12, 0); }
  } finally { await page.close(); }
});

it.each(['EarthQuake', 'SkyLift'] as const)('keeps the armed %s targets and rule before the block notice', async card => {
  const page = await open(view('7k/8/8/8/2RM4/8/P7/K7 w - - 0 1', { hands: [[card], []] })), frame = page.frameLocator('iframe');
  try {
    await frame.locator('html').evaluate(() => { (window as any).harnessApp.memory.blockNotice = 'Player blocked.'; });
    await frame.locator('#card-w-0').click();
    await frame.locator('#board-sheet').getByRole('button', { name: 'Use', exact: true }).click();
    const targets = card === 'EarthQuake' ? 'Select a marked square.' : 'Choose a marked piece, then a marked square.';
    expect(await frame.locator('#context-note').textContent()).toBe(`${targets} ${ruleLine(cardText(card))} Player blocked.`);
    expect(await frame.locator('#context-text').getAttribute('data-rank')).toBe('armed');
    expect(await frame.locator('#context-text').getAttribute('tabindex')).toBe('0');
    await frame.getByRole('button', { name: 'Cancel', exact: true }).click();
    expect(await frame.locator('#context-note').textContent()).toBe('Player blocked.');
    expect(await frame.locator('#context-text').getAttribute('tabindex')).toBe('-1');
  } finally { await page.close(); }
});

it.each([[320,568], [393,852]])('keeps the swap portrait and held note with the block notice at %d x %d', async (width,height) => {
  const fen = '7k/8/8/8/2RM4/8/8/K7 w - - 0 1', base = view(fen), page = await open(base,width,height), frame = page.frameLocator('iframe');
  setRules(base.rules!); const pre = fromFen(fen), swap = legalMoves(pre).find(m => m.from === 27 && m.to === 26 && m.swap)!;
  expect(swap).toBeDefined();
  try {
    await frame.locator('html').evaluate(() => { (window as any).harnessApp.memory.blockNotice = 'Player blocked.'; });
    await squareTap(page,27);
    expect(await frame.locator('#status').textContent()).toBe('White Maester.');
    await squareTap(page,26);
    expect(await frame.locator('#context-text').getAttribute('data-rank')).toBe('held');
    expect(await frame.locator('#context-note').textContent()).toBe(`${describeMove(new GameRules(base.rules),pre,swap)} Player blocked.`);
    expect(await frame.locator('#status').textContent()).toBe('Select again to swap.');
    const info = frame.getByRole('button', {name:'All rules',exact:true});
    await info.locator('img').evaluate(image => (image as HTMLImageElement).decode());
    expect(await info.evaluate(button => {
      const b = button.getBoundingClientRect(), row = button.parentElement!, r = row.getBoundingClientRect();
      return row.firstElementChild === button && b.width >= 44 && b.height >= 44 && b.left >= r.left && b.right <= r.right && b.top >= r.top && b.bottom <= r.bottom;
    })).toBe(true);
    await info.click();
    expect(await frame.locator('#board-sheet').innerText()).toContain('Swaps places with a friendly piece.');
    await frame.locator('#board-sheet').getByRole('button', {name:'Close',exact:true}).click();
    expect(await info.evaluate(button => button === document.activeElement)).toBe(true);
    expect(await frame.locator('#context-text').getAttribute('data-rank')).toBe('held');
    expect(await frame.locator('#context-note').textContent()).toBe(`${describeMove(new GameRules(base.rules),pre,swap)} Player blocked.`);
    await squareTap(page,27);
    expect(await frame.locator('#context-note').textContent()).toBe('Player blocked.');
  } finally { await page.close(); }
});

it.each(['EarthQuake', 'SkyLift'] as const)('G1: the armed %s note names its targets, then its rule', async card => {
  const rules: Partial<Rules> = { hands: [[card], []] };
  const page = await open(view('7k/8/8/8/2RM4/8/P7/K7 w - - 0 1', rules)), frame = page.frameLocator('iframe');
  try {
    await frame.locator('#card-w-0').click();
    await frame.locator('#board-sheet').getByRole('button', { name: 'Use', exact: true }).click();
    const targets = card === 'EarthQuake' ? 'Select a marked square.' : 'Choose a marked piece, then a marked square.';
    expect(await frame.locator('#context-note').textContent()).toBe(`${targets} ${ruleLine(cardText(card))}`);
  } finally { await page.close(); }
});

it.each([
  [1280,800,false,'card'], [1280,800,true,'card'],
  [852,393,false,'card'], [852,393,true,'card'],
  [1280,800,false,'power'], [1280,800,true,'power'],
  [852,393,false,'power'], [852,393,true,'power'],
] as const)('G1: the full armed rule shows at %d×%d, draw=%s, %s', async (width,height,draw,kind) => {
  const rules: Partial<Rules> = kind === 'card' ? {hands:[['Haste'],[]]} : {kings:[{king:'Frost',power:'Freeze'},null]};
  const page = await open(view('4k3/1p6/8/8/8/8/4P3/4K3 w - - 0 1', rules, {kind:'friend',draw_offer:draw?1:null}),width,height), frame = page.frameLocator('iframe');
  try {
    await page.evaluate(() => (window as any).harnessSetContext({ safeAreaInsets: { top: 0, right: 0, bottom: 0, left: 0 } }));
    await expect.poll(() => frame.locator('html').evaluate(el => getComputedStyle(el).getPropertyValue('--safe-top').trim())).toBe('0px');
    const board = await frame.locator('#board canvas').evaluate(async canvas => {
      await document.fonts.ready;
      await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      return canvas.getBoundingClientRect().width;
    });
    await frame.locator(kind === 'card' ? '#card-w-0' : '#power-w').click();
    await frame.locator('#board-sheet').getByRole('button', { name: 'Use', exact: true }).click();
    expect(await frame.locator('#context-text').getAttribute('data-rank')).toBe('armed');
    const text = await frame.locator('#context-text').evaluate(async el => {
      await document.fonts.ready;
      const style = getComputedStyle(el);
      return {maxHeight:style.maxHeight,overflow:style.overflowY,height:el.clientHeight,content:el.scrollHeight};
    });
    expect(text.maxHeight).toBe('none');
    expect(text.overflow).toBe('visible');
    expect(text.content).toBeLessThanOrEqual(text.height + 1);
    expect((await frame.locator('#board canvas').boundingBox())!.width).toBeCloseTo(board,0);
  } finally { await page.close(); }
});

it.each([[320,568,'card'],[393,852,'card'],[320,568,'power'],[393,852,'power']] as const)(
  'G1: keyboard scroll reads an armed rule at %d×%d, %s', async (width,height,kind) => {
    const rules: Partial<Rules> = kind === 'card' ? {hands:[['Haste'],[]]} : {kings:[{king:'Frost',power:'Freeze'},null]};
    const page = await open(view('4k3/1p6/8/8/8/8/4P3/4K3 w - - 0 1',rules),width,height), frame = page.frameLocator('iframe');
    try {
      await frame.locator(kind === 'card' ? '#card-w-0' : '#power-w').click();
      await frame.locator('#board-sheet').getByRole('button',{name:'Use',exact:true}).click();
      const text = frame.locator('#context-text'), cancel = frame.getByRole('button',{name:'Cancel',exact:true});
      expect(await text.getAttribute('tabindex')).toBe('0');
      expect(await text.evaluate(el => ({height:el.clientHeight,overflow:getComputedStyle(el).overflowY}))).toEqual({height:40,overflow:'auto'});
      await cancel.focus(); await page.keyboard.press('Shift+Tab');
      expect(await text.evaluate(el => el === document.activeElement)).toBe(true);
      await page.keyboard.press('End');
      await expect.poll(() => text.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
      await cancel.click();
      expect(await text.getAttribute('tabindex')).toBe('-1');
    } finally { await page.close(); }
  }
);

it.each(['card','power'] as const)('keeps the full armed %s rule and block notice at 197 x 426', async kind => {
  const rules: Partial<Rules> = kind === 'card' ? {hands:[['EarthQuake'],[]]} : {kings:[{king:'Frost',power:'Freeze'},null]};
  const base = view('4k3/1p6/8/8/8/8/4P3/4K3 w - - 0 1',rules);
  const page = await open(base,197,426), frame = page.frameLocator('iframe');
  try {
    await page.evaluate(() => (window as any).harnessSetContext({safeAreaInsets:{top:51,bottom:59,left:0,right:0}}));
    await expect.poll(() => frame.locator('html').evaluate(el => getComputedStyle(el).getPropertyValue('--safe-top').trim())).toBe('51px');
    await frame.locator('html').evaluate(() => { (window as any).harnessApp.memory.blockNotice = 'Player blocked.'; });
    await frame.locator(kind === 'card' ? '#card-w-0' : '#power-w').click();
    await frame.locator('#board-sheet').getByRole('button',{name:'Use',exact:true}).click();
    const rule = ruleLine(kind === 'card' ? cardText('EarthQuake') : powerText('Freeze',base.rules!));
    expect(await frame.locator('#context-note').textContent()).toContain(`${rule} Player blocked.`);
    expect(await frame.locator('#context-text').getAttribute('data-rank')).toBe('armed');
    const text = await frame.locator('#context-text').evaluate(async el => {
      await document.fonts.ready;
      return {maxHeight:getComputedStyle(el).maxHeight,height:el.clientHeight,content:el.scrollHeight};
    });
    expect(text.maxHeight).toBe('none');
    expect(text.content).toBeLessThanOrEqual(text.height + 1);
    expect((await frame.locator('#board canvas').boundingBox())!.width).toBeGreaterThanOrEqual(184);
    await frame.getByRole('button',{name:'Cancel',exact:true}).click();
    expect(await frame.locator('#context-note').textContent()).toBe('Player blocked.');
  } finally { await page.close(); }
});

// Spec G1 a: an armed power keeps its target words first and puts its rule second, in the same note.
it('G1: the armed power note names the target, then the rule', async () => {
  const rules: Partial<Rules> = { kings: [{ king: 'Frost', power: 'Freeze' }, null] };
  const page = await open(view('4k3/1p6/8/8/8/8/4P3/4K3 w - - 0 1', rules)), frame = page.frameLocator('iframe');
  try {
    await frame.locator('#power-w').click();
    await frame.locator('#board-sheet').getByRole('button', { name: 'Use', exact: true }).click();
    const target = 'Select an enemy piece.';
    expect(await frame.locator('#context-note').textContent()).toBe(`${target} ${ruleLine(powerText('Freeze', { ...RULES, ...rules } as Rules))}`);
  } finally { await page.close(); }
});

it('names the power coin owner when both kings have the same power', async () => {
  const page = await open(view('7k/8/8/8/8/8/P7/K7 w - - 0 1', { kings: [{ king: 'Frost', power: 'Freeze' }, { king: 'Frost', power: 'Freeze' }] })), frame = page.frameLocator('iframe');
  try {
    expect.soft(await frame.locator('#power-w').getAttribute('aria-label')).toMatch(/^Your Freeze, /);
    expect.soft(await frame.locator('#power-b').getAttribute('aria-label')).toMatch(/^Opponent's Freeze, /);
    expect.soft((await frame.locator('#strip-them').innerText()).match(/Computer/g)).toHaveLength(1);
    const names = await frame.locator('html').evaluate('(async () => { const { features } = await import("/src/account-game/features.ts"); return [...features({ fairy: true, arrangement: true, cards: true, kingPowers: true }).children].map(e => [e.getAttribute("role"), e.getAttribute("aria-label")]); })()');
    expect.soft(names).toEqual(['Fairy pieces', 'Arrangement', 'Cards', 'King powers'].map(name => ['img', name]));
  } finally { await page.close(); }
});

it.each([[true, 393, 852], [true, 320, 568], [false, 393, 852]] as const)('uses the correct seat line for computer=%s at %i × %i', async (computer, width, height) => {
  const page = await browser.newPage({ viewport: { width, height }, isMobile: true, hasTouch: true }), frame = page.frameLocator('iframe');
  page.setDefaultTimeout(3000 * STEP);
  const tool = async (path: string, name: string, args: Record<string, unknown>) => {
    const result = await (await page.request.post(new URL(path, served.url).href, { data: { name, arguments: args } })).json();
    expect(result.isError, JSON.stringify(result)).not.toBe(true); return result;
  };
  try {
    // The build writes the seat's table selectors. Test its rendered page.
    await page.goto(served.url); await frame.locator('#home-play:not(:disabled)').waitFor();
    await page.locator('#remount').evaluate(e => { e.style.display = 'none'; });
    await page.locator('iframe').evaluate(e => { e.style.setProperty('height', '100dvh', 'important'); });
    await page.evaluate(async safeAreaInsets => (window as any).harnessSetContext({ displayMode: 'fullscreen', safeAreaInsets, deviceCapabilities: { touch: true } }), insets(width));
    const game = await tool('/fixture-tool', 'kingdown_create', { kind: computer ? 'solo' : 'friend', colour: 'white', options: { ...DEFAULT_OPTIONS, arrangement: true, kingPowers: true } });
    const game_id = game._meta.view.game_id;
    if (!computer) {
      const invite = await tool('/fixture-tool', 'kingdown_invite', { game_id });
      await tool('/fixture-friend-tool', 'kingdown_join', { code: invite.structuredContent.code });
    }
    const opened = await tool('/fixture-tool', 'kingdown_open', { game_id });
    await page.evaluate(result => (window as any).harnessShow({ ...result, structuredContent: { ...result.structuredContent, screen: undefined } }, true), opened);
    await frame.locator('[data-screen="seat"]:not([hidden])').waitFor();
    await frame.locator('#board canvas').waitFor({ state: 'visible' });
    await frame.locator('#seat-veil-layer .veil').waitFor();
    expect(await frame.locator('#seat-veil-layer').innerText()).toBe(computer ? 'Their side stays hidden until you are ready.' : 'Their side stays hidden until both players are ready.');
  }
  finally { await page.close(); }
});

it.each([{ width: 393, height: 852, cards: true }, { width: 320, height: 568, cards: true }, { width: 360, height: 740, cards: true }, { width: 393, height: 852, cards: false }, { width: 320, height: 568, cards: false }, { width: 360, height: 740, cards: false }])('keeps 48 px control targets, art and rows at $width × $height with cards=$cards', async ({ width, height, cards }) => {
  const rules: Partial<Rules> = cards ? { hands: [['Freeze', 'Vault', 'March', 'IceWall'], ['Freeze']] } : { kings: [{ king: 'Frost', power: 'Freeze' }, { king: 'Flame', power: 'Haste' }] };
  const page = await open(view(cards ? '7k/8/8/8/8/8/P7/R6K w - - 0 1' : '7k/8/8/8/8/8/P7/K7 w - - 0 1', rules), width, height), frame = page.frameLocator('iframe');
  try {
    expect(await frame.locator('html').evaluate(() => matchMedia('(pointer: coarse)').matches)).toBe(true);
    expect(await frame.locator('#game-table').evaluate(targetMisses)).toEqual([]);
    expect(await frame.locator('#game-table').evaluate(edgeMisses)).toEqual([]);
    const clearance = await frame.locator('.table-back:visible').evaluate(back => {
      const board = (window as any).testBoard, top = board.screenOf(56), below = board.screenOf(48);
      return top.y - Math.abs(below.y - top.y) / 2 - back.getBoundingClientRect().bottom;
    });
    expect(clearance, 'Back stays above the board squares').toBeGreaterThanOrEqual(0);
    if (cards) {
      await frame.locator('#card-w-1').click(); await frame.getByRole('button', { name: 'Use', exact: true }).click();
      await frame.getByRole('button', { name: 'Cancel', exact: true }).waitFor();
      expect(await frame.locator('#game-table').evaluate(edgeMisses)).toEqual([]);
    }
    expect.soft(await frame.locator('#strip-me').evaluate(e => { const r = e.querySelector('.coin img')!.getBoundingClientRect(); return [r.width, r.height]; })).toEqual(cards ? [36, 36] : [30, 30]);
    // K1 a: the cards stay below the 36 px portrait row. Their targets stay 48 px.
    expect(await frame.locator('#strip-me').evaluate(e => e.getBoundingClientRect().height)).toBe(cards ? 80 : 44);
  } finally { await page.close(); }
});

it.each(['normal', 'fast'])('uses a slide, a 150 ms fade and no shake under reduced motion at %s pace', async pace => {
  // Install the clock before the scene queues frames, so a real frame cannot outlive the clock change.
  const page = await open(view('7k/8/8/8/8/8/p7/R6K w - - 0 1'), 393, 852, true), frame = page.frameLocator('iframe');
  try {
    await frame.locator('#board[aria-busy="false"]').waitFor();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect.poll(() => frame.locator('html').evaluate(() => (window as any).testBoard.motionQuery.matches)).toBe(true);
    await frame.locator('html').evaluate((_, pace) => (window as any).testBoard.setPace(pace), pace);
    // Let the reduced-motion setting draw its last frame before the clock pauses.
    await expect.poll(() => frame.locator('html').evaluate(async () => { const scene = (window as any).testBoard.scene, before = scene.frames; await new Promise(resolve => setTimeout(resolve, 100)); return scene.frames === before; })).toBe(true);
    await page.clock.pauseAt(new Date(Date.now() + 1000));
    const result = await frame.locator('html').evaluate(async () => {
      const board = (window as any).testBoard, scene = board.scene, pre = board.pos;
      const moves = [];
      for (let type = 1; type <= 12; type++) {
        const position = { ...pre, board: new Uint8Array(pre.board) }; position.board[0] = type;
        scene.setPosition(position); void scene.play({ from: 0, to: 8, captures: [8] }); moves.push(scene.playing); scene.cancel();
      }
      scene.setPosition(pre);
      return moves;
    });
    expect(result).toEqual(Array(12).fill('move'));
    await frame.locator('html').evaluate((_, pace) => {
      const board = (window as any).testBoard; board.setPace(pace);
      const canvas = document.querySelector<HTMLCanvasElement>('#board canvas')!, ctx = canvas.getContext('2d')!, original = CanvasRenderingContext2D.prototype.drawImage.bind(ctx);
      (window as any).victimFrames = []; (window as any).boardFrames = [];
      ctx.drawImage = (...args: any[]) => {
        const m = ctx.getTransform();
        if (args[0] instanceof HTMLCanvasElement && args[0].width === 1152 && m.a < 0 && m.e === 88 && m.f === 864) (window as any).victimFrames.push({ opacity: ctx.globalAlpha, at: performance.now() });
        if (args[0] instanceof HTMLImageElement && args[0].src.includes('stone-board')) (window as any).boardFrames.push([m.e, m.f]);
        return (original as any)(...args);
      };
      (window as any).captureDone = false; (window as any).captureStart = performance.now();
      void board.animateMove(board.pos, { from: 0, to: 8, captures: [8] }).then(() => { (window as any).captureDone = true; });
    }, pace);
    const slide = pace === 'fast' ? 210 : 420;
    await page.clock.fastForward(slide + 75);
    const middle = await frame.locator('html').evaluate(() => ({ done: (window as any).captureDone, start: (window as any).captureStart, frames: (window as any).victimFrames }));
    expect(middle.done).toBe(false);
    expect(middle.frames.length).toBeGreaterThan(0);
    const victim = middle.frames.at(-1);
    expect(victim.opacity).toBeGreaterThan(0); expect(victim.opacity).toBeLessThan(1);
    expect(victim.opacity).toBeCloseTo(1 - (victim.at - middle.start - slide) / 150, 5);
    await page.clock.fastForward(100);
    expect(await frame.locator('html').evaluate(() => (window as any).captureDone)).toBe(true);
    const frames = await frame.locator('html').evaluate(() => (window as any).boardFrames as number[][]);
    expect(frames.length).toBeGreaterThan(0); expect(frames.every(([x, y]) => x === 0 && y === 64)).toBe(true);
    await frame.locator('html').evaluate(() => { const board = (window as any).testBoard; board.skip(); board.sync(board.pos); });
  } finally { await page.close(); }
});

it.each([[197,426,51], [197,800,51], [201,357,31], [201,357,62], [206,395,27]])('keeps end reasons and actions readable at %i × %i with top %i', async (width, height, top) => {
  const page = await open(view('7k/8/8/8/8/8/P7/K7 w - - 0 1'), width, height), frame = page.frameLocator('iframe');
  try {
    await page.evaluate(async top => { await (window as any).harnessSetContext({ displayMode: 'fullscreen', safeAreaInsets: { top, bottom: 96, left: 0, right: 0 }, deviceCapabilities: { touch: true } }); }, top);
    await frame.locator('#app-frame').evaluate(e => { e.style.bottom = '96px'; });
    // Match the compiled zoom fixture's three solo actions; policy text is tested independently of creation admission.
    for (const rating_policy of ['legacy', 'casual', 'ranked-v1'] as const) for (const [reason, winner, words] of [
      ['checkmate', 0, 'You gave checkmate.'], ['resignation', 1, 'You resigned.'],
      ['timeout', 0, 'Your opponent ran out of time.'], ['drawMaterial', null, 'Neither side has enough pieces to give checkmate.'],
    ] as const) {
      const next = view('7k/8/8/8/8/8/P7/K7 w - - 0 1', {}, { rating_policy, status: 'finished', action: 'finished', result: { reason, winner } });
      await frame.locator('html').evaluate((_, next) => (window as any).harnessApp.routeView(next), next);
      await frame.locator('#over[open]').waitFor();
      await frame.locator('html').evaluate('(async () => { (await import("/src/plugin/screens/board.ts")).skipBoardCeremony(); await document.fonts.ready; await Promise.all(document.getAnimations().map(a => a.finished.catch(() => {}))); })()');
      await frame.locator('#end-skip').waitFor({ state: 'hidden' });
      await frame.locator('#over').evaluate(card => { card.scrollTop = 0; });
      const label = `${rating_policy} ${reason} ${width}×${height} top${top}`;
      expect(await frame.locator('#end-reason').textContent()).toBe(`${{ legacy: 'Legacy', casual: 'Casual', 'ranked-v1': 'Ranked' }[rating_policy]} · ${words}`);
      const geometry = await frame.locator('#over').evaluate(card => {
        const box = (e: Element) => { const r = e.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, width: r.width, height: r.height }; };
        const back = document.querySelector('#game-table .table-back')!, r = back.getBoundingClientRect();
        return { card: box(card), back: box(back), backHit: back.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)), reason: box(card.querySelector('#end-reason')!), buttons: [...card.querySelectorAll<HTMLButtonElement>('form button:not([hidden])')].map(box), scroll: card.scrollTop };
      });
      expect(geometry.card.top, label).toBeGreaterThanOrEqual(geometry.back.bottom);
      expect(geometry.backHit, label).toBe(true);
      expect(geometry.scroll, label).toBe(0);
      expect(geometry.buttons, label).toHaveLength(3);
      for (const button of geometry.buttons) { expect(button.width, label).toBeGreaterThanOrEqual(48); expect(button.height, label).toBeGreaterThanOrEqual(48); }
      // The short win/loss explanation and first action fit before scrolling, with the original 12 px next-action cue.
      if (reason === 'checkmate' || reason === 'resignation') {
        expect(geometry.reason.top, label).toBeGreaterThanOrEqual(geometry.card.top);
        expect(geometry.reason.bottom, label).toBeLessThanOrEqual(geometry.card.bottom);
        expect(geometry.buttons[0].top, label).toBeGreaterThanOrEqual(geometry.card.top);
        expect(geometry.buttons[0].bottom, label).toBeLessThanOrEqual(geometry.card.bottom);
        expect(geometry.card.bottom - geometry.buttons[1].top, label).toBeGreaterThanOrEqual(12);
      }
      // Longer explanations retain every word. Scroll the complete reason and each full target into view.
      for (const selector of ['#end-reason', 'form button:nth-child(1)', 'form button:nth-child(2)', 'form button:nth-child(3)']) {
        const visible = await frame.locator(`#over ${selector}`).evaluate(e => {
          const card = e.closest('dialog')!, before = e.getBoundingClientRect(), c = card.getBoundingClientRect();
          card.scrollTop += before.top + before.height / 2 - c.top - card.clientHeight / 2;
          const r = e.getBoundingClientRect();
          return { top: r.top, bottom: r.bottom, cardTop: c.top, cardBottom: c.bottom, hit: e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)) };
        });
        expect(visible.top, `${label} ${selector}`).toBeGreaterThanOrEqual(visible.cardTop);
        expect(visible.bottom, `${label} ${selector}`).toBeLessThanOrEqual(visible.cardBottom);
        expect(visible.hit, `${label} ${selector}`).toBe(true);
      }
    }
  } finally { await page.close(); }
});

it('keeps populated end status and failed-read recovery reachable in the shortest frame', async () => {
  const page = await open(view('7k/8/8/8/8/8/P7/K7 w - - 0 1'), 201, 357), frame = page.frameLocator('iframe');
  try {
    await page.evaluate(async () => { await (window as any).harnessSetContext({ displayMode: 'fullscreen', safeAreaInsets: { top: 62, bottom: 96, left: 0, right: 0 }, deviceCapabilities: { touch: true } }); });
    await frame.locator('#app-frame').evaluate(e => { e.style.bottom = '96px'; });
    await frame.locator('html').evaluate(async () => { await (window as any).harnessApp.call('kingdown_create', { kind: 'solo', colour: 'white', options: { fairy: false, pool: [], arrangement: false, classic: true, cards: false, cardPool: [], kingPowers: false } }); });
    await page.evaluate(() => { (window as any).rejectNextGet = true; });
    await frame.locator('html').evaluate(async () => {
      const app = (window as any).harnessApp, v = app.memory.view;
      await app.call('kingdown_resign', { game_id: v.game_id, expected_revision: v.revision, command_id: crypto.randomUUID() }, true);
    });
    await frame.locator('#over[open] #retry:not([hidden])').waitFor();
    expect(await frame.locator('#over #error').textContent()).toBe('Harness saved-game read failed');
    await frame.locator('html').evaluate('(async () => { window.harnessApp.memory.blockNotice = "Player blocked."; (await import("/src/plugin/screens/end.ts")).updateEnd(); })()');
    expect(await frame.locator('#end-block-status').textContent()).toBe('Player blocked.');
    for (const selector of ['#end-block-status', '#error', '#retry']) {
      const seen = await frame.locator(`#over ${selector}`).evaluate(e => {
        const card = e.closest('dialog')!, r = e.getBoundingClientRect(), c = card.getBoundingClientRect();
        card.scrollTop += r.top + r.height / 2 - c.top - card.clientHeight / 2;
        const now = e.getBoundingClientRect();
        return { top: now.top, bottom: now.bottom, cardTop: c.top, cardBottom: c.bottom, hit: e.contains(document.elementFromPoint(now.x+now.width/2,now.y+now.height/2)), height: now.height };
      });
      expect(seen.top, selector).toBeGreaterThanOrEqual(seen.cardTop);
      expect(seen.bottom, selector).toBeLessThanOrEqual(seen.cardBottom);
      expect(seen.hit, selector).toBe(true);
      if (selector === '#retry') expect(seen.height).toBeGreaterThanOrEqual(48);
    }
    await clickButton(page, frame.locator('#over #retry'));
    await frame.locator('#over #retry').waitFor({ state: 'hidden' });
    expect(await frame.locator('#over #error').textContent()).toBe('');
  } finally { await page.close(); }
});

it.each([[393, 852], [320, 568], [844, 390], [1440, 900]])('keeps the board box still behind the end card at %i × %i', async (width, height) => {
  const next = view('7k/8/8/8/8/8/P7/K7 w - - 0 1'), page = await open(next, width, height), frame = page.frameLocator('iframe');
  try {
    await frame.locator('#board[aria-busy="false"]').waitFor();
    await expect.poll(() => frame.locator('#board canvas').evaluate(e => e.getBoundingClientRect().width)).toBeGreaterThan(0);
    await frame.locator('#game-table').evaluate(async e => { await Promise.all(e.getAnimations().map(a => a.finished)); });
    // The render compare: the two boxes the canvas follows, in the page's pixels.
    const boxes = () => frame.locator('html').evaluate(() => ['#board', '#board canvas', '#table-bar'].map(sel => { const r = document.querySelector(sel)!.getBoundingClientRect(); return [r.x, r.y, r.width, r.height].map(v => Math.round(v * 100) / 100); }));
    const before = await boxes();
    // Record every board size while the card opens, so a transient resize (a hidden box) shows.
    await frame.locator('html').evaluate(() => {
      (window as any).endSizes = [];
      new ResizeObserver(entries => { for (const e of entries) (window as any).endSizes.push(Math.round(e.contentRect.width * 10) / 10); }).observe(document.getElementById('board')!);
    });
    await frame.locator('html').evaluate((_, next) => (window as any).harnessApp.routeView(next), { ...next, revision: 1, status: 'finished', action: 'finished', result: { reason: 'resign', winner: 0 } });
    await frame.locator('#over[open]').waitFor();
    await frame.locator('html').evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    const after = await boxes();
    // F14: the board and its canvas keep the same rect; the canvas does not redraw at a new size.
    expect(after.slice(0, 2)).toEqual(before.slice(0, 2));
    // The end card is an overlay over #game-table: the table bar keeps its box in the grid (no zero-height cell).
    expect(after[2][2]).toBeGreaterThan(0); expect(after[2][3]).toBeGreaterThan(0);
    // No resize of the board happens while the card opens: the board never takes a hidden (0 px) box.
    const sizes = await frame.locator('html').evaluate(() => (window as any).endSizes as number[]);
    expect(sizes.filter(w => w < 1)).toEqual([]);
  } finally { await page.close(); }
});

it('draws no fallback board before the stone loads', async () => {
  const page = await browser.newPage({ viewport: { width: 393, height: 852 } }), frame = page.frameLocator('iframe');
  let release!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/board-art/stone-board.webp', async route => { await held; await route.continue(); });
  try {
    await page.goto(harness.url, { waitUntil: 'domcontentloaded' }); await frame.locator('#home-play:not(:disabled)').waitFor();
    await page.evaluate(() => (window as any).harnessSetContext({ displayMode: 'fullscreen' }));
    await frame.locator('html').evaluate((_, next) => (window as any).harnessApp.routeView(next), view('7k/8/8/8/8/8/P7/K7 w - - 0 1'));
    const pixel = () => frame.locator('#board canvas').evaluate(e => [...(e as HTMLCanvasElement).getContext('2d')!.getImageData(200, 264, 1, 1).data]);
    expect(await frame.locator('#board').getAttribute('aria-busy')).toBe('true');
    expect(await pixel()).toEqual([0, 0, 0, 0]);
    release(); await frame.locator('#board[aria-busy="false"]').waitFor();
    await expect.poll(async () => (await pixel())[3]).toBe(255);
    expect((await pixel()).slice(0, 3)).not.toEqual([230, 184, 74]);
  } finally { release(); await page.close(); }
});

it.each([[393, 852], [360, 740], [320, 568]])('serves 48 px targets on Seat and Board at %i × %i', async (width, height) => {
  const page = await browser.newPage({ viewport: { width, height }, isMobile: true, hasTouch: true }), frame = page.frameLocator('iframe'); page.setDefaultTimeout(2000 * STEP);
  try {
    await page.goto(served.url); await frame.locator('#home-play:not(:disabled)').waitFor();
    await page.locator('#remount').evaluate(e => { e.style.display = 'none'; });
    await page.locator('iframe').evaluate(e => { e.style.setProperty('height', '100dvh', 'important'); });
    await page.evaluate(async safeAreaInsets => (window as any).harnessSetContext({ displayMode: 'fullscreen', safeAreaInsets, deviceCapabilities: { touch: true } }), insets(width));
    for (const cards of [false, true]) {
      await page.evaluate(async options => {
        const result = await (await fetch('/fixture-tool', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: 'kingdown_create', arguments: { kind: 'solo', colour: 'white', options } }) })).json();
        if (result.isError) throw new Error(JSON.stringify(result));
        await (window as any).harnessShow({ ...result, structuredContent: { ...result.structuredContent, screen: undefined, game_id: result._meta.view.game_id } }, true);
      }, { ...DEFAULT_OPTIONS, arrangement: !cards, cards, kingPowers: !cards, cardPool: cards ? ['Freeze', 'Vault', 'March', 'IceWall'] : [] });
      await frame.locator(`[data-screen="${cards ? 'board' : 'seat'}"]:not([hidden])`).waitFor();
      for (const screen of cards ? ['board'] : ['seat', 'board']) {
        if (screen === 'board' && !cards) {
          const ready = frame.locator('#seat-ready:not(:disabled)');
          await clickButton(page, ready);
          // Ready commits the choice, then reads the full rules before it opens the board.
          await page.waitForFunction(() => (window as any).harnessView.status === 'playing');
          await page.waitForFunction(() => !!(window as any).harnessView.rules);
          await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
        }
        const coin = `#${cards ? 'card-w-0' : screen === 'seat' ? 'seat-king' : 'power-w'}`;
        await frame.locator(`${coin}:visible`).waitFor();
        // Wait until no motion runs. A strip rebuild during the deal can cancel the old coin's animation (its finished
        // promise rejects) and starts it again on the new coin, so a single wait can reject or end too soon.
        await frame.locator('#game-table').evaluate(async e => {
          for (let run: Animation[]; (run = e.getAnimations({ subtree: true }).filter(a => a.playState !== 'finished')).length;) await Promise.all(run.map(a => a.finished.catch(() => {})));
          await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
        });
        // The coin shows at the first draw of the game; the screen draws again after the games-list read.
        const section = frame.locator(`[data-screen="${screen}"]`);
        expect(await section.evaluate(targetMisses)).toEqual([]);
        expect(await section.evaluate(edgeMisses)).toEqual([]);
        expect(await section.evaluate((e, coin) => { const r = e.querySelector(`${coin} img`)!.getBoundingClientRect(); return [r.width, r.height]; }, coin)).toEqual(cards ? [36, 36] : [30, 30]);
      }
    }
  } finally { await page.close(); }
});

// Ticket 22 review: the card-coin face measure holds a root that a redraw keeps.
// `locator.evaluateAll` finds the images in one page call and measures them in the next. The board replaces each
// strip's content on every refresh (`strips()` sets `strip.innerHTML`), so an image that a redraw removed is detached
// and measures 0 × 0. `cardFaces` holds `#game-table`, which a redraw keeps, and finds the images inside the one call.
it('measures the card coin face in one page call on a root a redraw keeps', async () => {
  const page = await browser.newPage({ viewport: { width: 393, height: 852 }, isMobile: true, hasTouch: true }), frame = page.frameLocator('iframe');
  try {
    await page.goto(served.url); await frame.locator('#home-play:not(:disabled)').waitFor();
    await page.locator('#remount').evaluate(e => { e.style.display = 'none'; });
    await page.locator('iframe').evaluate(e => { e.style.setProperty('height', '100dvh', 'important'); });
    await page.evaluate(async () => (window as any).harnessSetContext({ displayMode: 'fullscreen', deviceCapabilities: { touch: true } }));
    await page.evaluate(async options => {
      const result = await (await fetch('/fixture-tool', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: 'kingdown_create', arguments: { kind: 'solo', colour: 'white', options } }) })).json();
      if (result.isError) throw new Error(JSON.stringify(result));
      await (window as any).harnessShow({ ...result, structuredContent: { ...result.structuredContent, screen: undefined, game_id: result._meta.view.game_id } }, true);
    }, { ...DEFAULT_OPTIONS, arrangement: false, cards: true, kingPowers: false, cardPool: ['Freeze', 'Vault', 'March', 'IceWall'] });
    await frame.locator('#board[aria-busy="false"]:not([data-animating="true"])').waitFor();
    const settle = () => frame.locator('#game-table').evaluate(async e => {
      for (let run: Animation[]; (run = e.getAnimations({ subtree: true }).filter(a => a.playState !== 'finished')).length;) await Promise.all(run.map(a => a.finished.catch(() => {})));
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    });
    await settle();
    const faces: { coin: number; image: number; x: number; y: number }[] = await cardFaces(frame);
    expect(faces.length).toBe(8);
    expect(faces.every(face => face.coin === 44 && face.image === 36 && face.x === 0 && face.y === 0), JSON.stringify(faces)).toBe(true);
    // A measure that finds the images first and reads them later loses them to a redraw: hold that hazard here.
    const found = await frame.locator('#game-table .card-coin img').elementHandles();
    expect(found.length).toBe(8);
    await frame.locator('#game-table').evaluate(table => { for (const strip of table.querySelectorAll('.player-strip')) (strip as HTMLElement).innerHTML = (strip as HTMLElement).innerHTML; });
    expect(await Promise.all(found.map(handle => handle.evaluate(image => Math.round(image.getBoundingClientRect().width))))).toEqual(Array(8).fill(0));
    // `cardFaces` holds `#game-table` and finds the images in the same page call as the measure, so it reads them all.
    await settle();
    const after: { coin: number; image: number; x: number; y: number }[] = await cardFaces(frame);
    expect(after.length).toBe(8);
    expect(after.every(face => face.coin === 44 && face.image === 36 && face.x === 0 && face.y === 0), JSON.stringify(after)).toBe(true);
  } finally { await page.close(); }
});

it('stops passive drawing five seconds after changes and keeps move motion', async () => {
  const page = await open(view('7k/8/8/8/8/3p4/4P3/K7 w - - 0 1'), 393, 852, true), frame = page.frameLocator('iframe');
  try {
    await frame.locator('html').evaluate(async () => { await (window as any).testBoard.ready(); });
    // Optional king art can finish after ready() and start a new draw window.
    await page.waitForLoadState('networkidle');
    // Keep elapsed time under test control between frame-count reads.
    const now = new Date(); await page.clock.setFixedTime(now); await page.clock.pauseAt(now);
    await frame.locator('html').evaluate(() => (window as any).testBoard.scene.redraw());
    const frames = () => frame.locator('html').evaluate(() => (window as any).testBoard.scene.frames);
    const settle = async () => { await page.clock.fastForward(5_100); await page.clock.runFor(100); const count = await frames(); await page.clock.runFor(200); expect(await frames()).toBe(count); };
    await settle();
    const stopped = await frames();
    await frame.locator('html').evaluate(() => (window as any).testBoard.highlight({ selected: 12, moves: [20] }));
    await page.clock.runFor(100); expect(await frames()).toBeGreaterThan(stopped);
    await settle();
    const selected = await frames();
    const width = await frame.locator('#board canvas').evaluate(e => (e as HTMLElement).style.width);
    await page.setViewportSize({ width: 400, height: 900 });
    // The board's ResizeObserver needs a frame on the test clock before the width check.
    await page.clock.runFor(100);
    await expect.poll(() => frame.locator('#board canvas').evaluate(e => (e as HTMLElement).style.width)).not.toBe(width);
    await page.clock.runFor(100); expect(await frames()).toBeGreaterThan(selected);
    await settle();
    // A capture still draws to its contact and end after the passive window ends.
    await frame.locator('html').evaluate(() => {
      const host = window as any;
      host.testBoard.animateMove(host.testBoard.pos, { from: 12, to: 19, captures: [19] }, () => { host.contact = true; }).then(() => { host.motionDone = true; });
    });
    await page.clock.fastForward(100); const moving = await frames();
    await page.clock.fastForward(3_000);
    expect(await frames()).toBeGreaterThan(moving);
    expect(await frame.locator('html').evaluate(() => ({ done: (window as any).motionDone, contact: (window as any).contact }))).toEqual({ done: true, contact: true });
    await settle();
  } finally { await page.close(); }
});

it('lays the mated king down only after the mating move ends', async () => {
  const fen = 'k7/8/1K6/8/8/8/8/7R w - - 0 1'; setRules({}); const pre = fromFen(fen);
  const move = legalMoves(pre).find(m => m.from === 7 && m.to === 63)!; expect(move).toBeDefined();
  const lan = toLan(pre, move), post = toFen(makeMove(pre, move)), first = view(fen, {}, { seat: 1, action: 'waiting', legal: [] });
  const page = await open(first), frame = page.frameLocator('iframe');
  try {
    await frame.locator('#board[aria-busy="false"]').waitFor();
    await frame.locator('html').evaluate((_, next) => {
      const host = window as any, board = host.testBoard, setFallen = board.setFallen.bind(board); host.fallen = []; host.moving = 0;
      // Count the painted frames that show the move in motion (fault F35-1: a settings resync ended it at once).
      const sample = () => { if (board.scene.animating) host.moving++; requestAnimationFrame(sample); }; requestAnimationFrame(sample);
      board.setFallen = (sq: number | null, animate?: boolean) => { host.fallen.push({ sq, animating: document.getElementById('board')!.dataset.animating, moving: host.moving }); setFallen(sq, animate); };
      host.harnessApp.routeView(next);
    }, { ...first, revision: 1, fen: post, turn: 1, status: 'finished', action: 'finished', result: { reason: 'checkmate', winner: 0 }, last_commands: [{ seq: 1, seat: 0, action: { type: 'turn', actions: [lan] }, at: '2026-10-15T00:00:01Z' }] });
    await expect.poll(() => frame.locator('html').evaluate(() => (window as any).fallen.some((c: any) => c.sq !== null && c.animating === 'false')), { timeout: 3000 * STEP }).toBe(true);
    const calls = await frame.locator('html').evaluate(() => (window as any).fallen);
    expect(calls.filter((c: any) => c.sq !== null && c.animating === 'true')).toEqual([]);
    expect(calls.some((c: any) => c.animating === 'true')).toBe(true);
    expect(calls.find((c: any) => c.sq !== null).moving).toBeGreaterThan(0);
  } finally { await page.close(); }
});

it('moves the keyboard cursor while the opponent move animates', async () => {
  const fen = 'k7/8/1K6/8/8/8/8/7R w - - 0 1'; setRules({}); const pre = fromFen(fen);
  const move = legalMoves(pre).find(m => m.from === 7 && m.to === 15)!; expect(move).toBeDefined();
  const first = view(fen, {}, { seat: 1, action: 'waiting', legal: [] });
  const page = await open(first), frame = page.frameLocator('iframe');
  try {
    await frame.locator('#board[aria-busy="false"]').waitFor();
    await frame.locator('#board').press('ArrowLeft');
    expect(await frame.locator('#board').getAttribute('aria-label')).toBe('Chess board, b1, empty. Enter selects a square.');
    await frame.locator('html').evaluate((_, next) => {
      const host = window as any, board = document.getElementById('board')!;
      // Hold the replay until the real cursor key arrives, as in the ceremony test.
      host.testBoard.animateMove = () => new Promise<void>(resolve => { host.endReplay = resolve; });
      board.addEventListener('keydown', event => { if (event.key === 'ArrowRight') host.cursorKeyAnimating = board.dataset.animating; }, { once: true });
      host.harnessApp.routeView(next);
    },
      { ...first, revision: 1, fen: toFen(makeMove(pre, move)), turn: 1, last_commands: [{ seq: 1, seat: 0, action: { type: 'turn', actions: [toLan(pre, move)] }, at: '2026-10-15T00:00:01Z' }] });
    await frame.locator('#board[data-animating="true"]').waitFor();
    await frame.locator('#board').focus(); await page.keyboard.press('ArrowRight');
    expect(await frame.locator('html').evaluate(() => (window as any).cursorKeyAnimating)).toBe('true');
    expect(await frame.locator('#board').getAttribute('aria-label')).toBe('Chess board, a1, empty. Enter selects a square.');
    await frame.locator('html').evaluate(() => (window as any).endReplay());
    await frame.locator('#board[data-animating="false"]').waitFor();
  } finally { await page.close(); }
});

it('hides the edge labels on a small board and keeps them in the frame on a phone board (fault M10)', async () => {
  const page = await open(view('')), frame = page.frameLocator('iframe');
  try {
    const coords = await frame.locator('html').evaluate(() => {
      const board = (window as any).testBoard, calls: [boolean, number, number][] = [];
      board.scene.setCoords = (...args: [boolean, number, number]) => { calls.push(args); };
      return [158, 302].map(width => { board.width = width; board.setCoords(true); return calls.at(-1)!; });
    });
    expect(coords[0][0]).toBe(false);
    expect(coords[1][0]).toBe(true); expect(coords[1][1]).toBeLessThanOrEqual(40); expect(coords[1][2]).toBeLessThanOrEqual(16);
  } finally { await page.close(); }
});

it.each([[320, 568, 84], [320, 568, 180], [393, 852, 118], [820, 600, 34], [852, 393, 34], [667, 375, 34]] as const)('keeps Menu actions visible at %i × %i, with draw replies only on the board', async (width, height, bottom) => {
  const next = view('4k3/7p/8/8/8/8/P7/K7 w - - 0 1', {}, {kind:'friend',abort_open:true,opponent:{handle:'Bob',icon:null,computer:false,deleted:false,last_seen_ms:null,rating:{rating:1500,provisional:true}}});
  const page = await open(next, width, height), frame = page.frameLocator('iframe');
  try {
    expect(await frame.locator('#table-bar button').allTextContents()).toEqual(['Undo','','Menu']);
    expect(await frame.locator('#end-turn').getAttribute('aria-label')).toBe('Send your turn');
    expect(await frame.locator('#end-turn').getAttribute('title')).toBe('Send your turn');
    expect(await frame.locator('#context-actions #abort').count()).toBe(0);
    expect(await frame.locator('#context-note').textContent()).toBe('');
    expect(await frame.locator('#strip-them small').textContent()).toBe('New player · Black');
    await page.evaluate(({width,height,bottom}) => (window as any).harnessSetContext({safeAreaInsets:{top:width>height?59:width===320?63:102,bottom,left:0,right:0}}), {width,height,bottom});
    await frame.locator('#board-menu').click();
    expect(await frame.locator('#menu-resign').isVisible()).toBe(true);
    expect(await frame.locator('#menu-draw').isVisible()).toBe(true);
    expect(await frame.locator('#menu-abort small').textContent()).toBe('No result, until each side moves once.');
    expect(await frame.locator('#reload').textContent()).toBe('Refresh the board');
    expect(await frame.locator('#board-sheet').evaluate(sheet => {
      const body = sheet.querySelector('.sheet-body')!, box = sheet.getBoundingClientRect();
      return body.scrollHeight <= body.clientHeight + 1 && [...sheet.querySelectorAll<HTMLElement>('button')].filter(b => b.getClientRects().length).every(b => {const r=b.getBoundingClientRect();return r.top>=box.top && r.bottom<=box.bottom+1;});
    })).toBe(true);
    await page.keyboard.press('Escape');
    await frame.locator('html').evaluate((_, next) => (window as any).harnessApp.routeView({...next,draw_offer:1}), next);
    expect(await frame.locator('#context-actions #accept-draw').isVisible()).toBe(true);
    expect(await frame.locator('#context-actions #decline-draw').isVisible()).toBe(true);
    const clear = await frame.locator('#context-line').evaluate(row => row.getBoundingClientRect().bottom <= document.getElementById('table-bar')!.getBoundingClientRect().top + 1);
    expect(clear, 'The draw reply row stays above the game bar').toBe(true);
    await frame.locator('#board-menu').click();
    expect(await frame.locator('#board-sheet #accept-draw, #board-sheet #decline-draw, #menu-accept-draw, #menu-decline-draw').count()).toBe(0);
  } finally { await page.close(); }
});

it.each([197,240] as const)('keeps the narrow Menu policy header and details usable at %i px', async width => {
  for (const [rating_policy, label, detail] of [
    ['legacy', 'Legacy rated', 'This game keeps the rating rules from before Ranked and Casual.'],
    ['casual', 'Casual', 'This game does not change ratings.'],
    ['ranked-v1', 'Ranked', 'Do not use engine, AI or human advice about an active ranked position.'],
  ] as const) {
    const next = view('4k3/7p/8/8/8/8/P7/K7 w - - 0 1', {}, { kind: 'friend', rating_policy, opponent: { handle: 'Bob', icon: null, computer: false, deleted: false, last_seen_ms: null } });
    const page = await open(next, width, 760), frame = page.frameLocator('iframe');
    try {
      await frame.locator('#board-menu').click();
      const geometry = await frame.locator('#board-sheet .sheet-head').evaluate(head => {
        const box = (el: Element) => { const r = el.getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height }; };
        return { head: box(head), title: box(head.querySelector('h2')!), policy: box(head.querySelector('#game-policy')!), close: box(head.querySelector('[aria-label="Close"]')!) };
      });
      console.log(`Menu policy geometry ${width} ${rating_policy}: ${JSON.stringify(geometry)}`);
      expect(geometry.title.width).toBeGreaterThan(0); expect(geometry.title.height).toBeGreaterThan(0);
      expect(geometry.title.right).toBeLessThanOrEqual(geometry.close.left);
      expect(geometry.policy.top).toBeGreaterThanOrEqual(Math.max(geometry.title.bottom, geometry.close.bottom));
      for (const control of [geometry.policy, geometry.close]) {
        expect(control.width).toBeGreaterThanOrEqual(44); expect(control.height).toBeGreaterThanOrEqual(48);
        expect(control.left).toBeGreaterThanOrEqual(geometry.head.left); expect(control.right).toBeLessThanOrEqual(geometry.head.right);
        expect(control.top).toBeGreaterThanOrEqual(geometry.head.top); expect(control.bottom).toBeLessThanOrEqual(geometry.head.bottom);
      }
      await frame.locator('#board-sheet').getByRole('button', { name: `${label} game`, exact: true }).click();
      expect(await frame.locator('#board-sheet h2').innerText()).toBe(label);
      expect(await frame.locator('#board-sheet .sheet-body').innerText()).toContain(detail);
      if (rating_policy === 'ranked-v1') expect(await frame.locator('#board-sheet .sheet-body').innerText()).toContain('3 days per move.');
      await frame.locator('#board-sheet [aria-label="Close"]').click(); expect(await frame.locator('#board-sheet').isVisible()).toBe(false);
    } finally { await page.close(); }
  }
});

it.each([[320,568],[852,393]] as const)('keeps a short last move and its deadline above a short board at %i × %i', async (width,height) => {
  const initial_fen = '4k3/7p/8/8/8/8/P7/K7 b - - 0 1';
  const step = applyLan(fromFen(initial_fen), 'h7-h5', {})!;
  const next = view(toFen(step.pos), {}, {kind:'friend',history:{initial_fen,actions:['h7-h5']},deadline_at:'2026-10-15T18:00:00Z'});
  const page = await open(next, width, height), frame = page.frameLocator('iframe');
  try {
    if (width > height) await page.evaluate(() => (window as any).harnessSetContext({safeAreaInsets:{top:59,bottom:34,left:0,right:0}}));
    expect(await frame.locator('#short-move-words').innerText()).toBe('Black pawn h7 → h5');
    expect(await frame.locator('#move-time-left').innerText()).toBe('18 h left');
    const line = (await frame.locator('#short-last-move').boundingBox())!, board = (await frame.locator('#board').boundingBox())!;
    expect(line.y + line.height).toBeLessThanOrEqual(board.y + 1);
    expect(await frame.locator('#move-time-left').evaluate(e => e.getBoundingClientRect().right <= e.parentElement!.getBoundingClientRect().right + 1)).toBe(true);
    expect(await frame.locator('#moves-line').isVisible()).toBe(false);
    await frame.locator('#board-menu').click();
    await frame.locator('#board-sheet').getByRole('button', {name:'Moves',exact:true}).click();
    expect(await frame.locator('#board-sheet').innerText()).toContain('Black pawn h7 to h5.');
  } finally { await page.close(); }
});

it.each(['A', 'S', 'M', 'O', 'G', 'L'])('shows the %s lesson rule when a beginner selects the piece', async letter => {
  const names: Record<string, string> = { A: 'Archer', S: 'Beast', M: 'Maester', O: 'Ogre', G: 'Guard', L: 'Paladin' };
  const page = await open(view(`7k/8/8/8/3${letter}4/8/8/K7 w - - 0 1`, {}, { level: 'beginner' })), frame = page.frameLocator('iframe');
  try {
    await frame.locator('#board[aria-busy="false"]').waitFor();
    await frame.locator('html').evaluate(() => (window as any).testBoard.onSquareClick(27));
    expect(await frame.locator('#context-note').innerText()).toBe(LESSONS.find(lesson => lesson.name === names[letter])!.done);
    expect(await frame.locator('#move-hint').textContent()).not.toMatch(/\bTap\b/);
  } finally { await page.close(); }
});
it('keeps the normal piece rule for a player above beginner level', async () => {
  const page = await open(view('7k/8/8/8/3G4/8/8/K7 w - - 0 1', {}, { level: 'club' })), frame = page.frameLocator('iframe');
  try {
    await frame.locator('#board[aria-busy="false"]').waitFor();
    await frame.locator('html').evaluate(() => (window as any).testBoard.onSquareClick(27));
    expect(await frame.locator('#context-note').innerText()).toBe('Only a king can take it.');
  } finally { await page.close(); }
});


it('gives live pawn move choices the shared tablet face', async () => {
  const page = await open(view('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1')), frame = page.frameLocator('iframe');
  try {
    await frame.locator('#board[aria-busy="false"]').waitFor();
    await frame.locator('html').evaluate(() => (window as any).testBoard.onSquareClick(12));
    await frame.locator('#board-menu').click();
    await frame.locator('#board-sheet').getByRole('button', { name: 'Choose a move', exact: true }).click();
    await checkTabletButtons(frame, '#choices button');
    await checkButtonContent(frame, '#choices button');
    await frame.locator('#choices button[title="e2-e4"]').click();
    await frame.locator('#end-turn[aria-disabled="false"]').waitFor();
    expect(await frame.locator('#board-sheet').isVisible()).toBe(false);
  } finally { await page.close(); }
});

it.each([[320, 568], [393, 852]])('keeps the board size after a beginner selects a long lesson at %i px', async (width, height) => {
  const page = await open(view('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBOR w - - 0 1', {}, { level: 'beginner' }), width, height), frame = page.frameLocator('iframe');
  try {
    await frame.locator('#board[aria-busy="false"]').waitFor();
    const size = () => frame.locator('#board canvas').boundingBox();
    const settle = () => frame.locator('#board canvas').evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    await settle();
    await expect.poll(async () => (await size())?.width ?? 0).toBeGreaterThanOrEqual(192);
    const before = (await size())!;
    await frame.locator('html').evaluate(() => (window as any).testBoard.onSquareClick(6));
    const lesson = LESSONS.find(lesson => lesson.name === 'Ogre')!.done;
    expect(await frame.locator('#context-note').textContent()).toBe(lesson);
    // Wait for layout and the board's resize observer before the size comparison.
    await settle();
    const after = (await size())!;
    expect(after.width).toBeCloseTo(before.width, 0);
    expect(after.height).toBeCloseTo(before.height, 0);
    expect(after.y).toBeCloseTo(before.y, 0);
    expect(after.width).toBeGreaterThanOrEqual(192);
    await frame.getByRole('button', { name: 'All rules', exact: true }).click();
    expect(await frame.locator('#board-sheet').innerText()).toContain(lesson);
  } finally { await page.close(); }
});
