// Unit test of settled(): a timer that the frame sets when its board animation ends runs before settled() returns, and
// the tool call that the timer starts reaches the host. The board screen (src/plugin/screens/board.ts) starts the next
// computer command this way after the replay of a computer action that keeps the turn. openBoardMenu() waits for that
// command and its replay, so its tap opens Menu.
import type { FrameLocator, Page } from 'playwright';
import { expect, it } from 'vitest';
import { launch } from './lib/checks.mjs';
import { openBoardMenu, settled } from './lib/plugin-settled.mjs';

// The host counts each call of the frame and answers it 50 ms later (tools/plugin-ui-host.ts).
const host = `<iframe></iframe><script>
  Object.assign(window, { harnessCalls: [], harnessInflight: 0, harnessHeld: 0, harnessWidgets: [{ frame: document.querySelector('iframe') }] });
  addEventListener('message', event => { if (event.data?.harness !== 'call') return; harnessCalls.push(event.data); harnessInflight++; setTimeout(() => harnessInflight--, 50); });
</script>`;
// The widget runs its timers in the order it sets them, but 200 ms late, as the page clock (page.clock.install) can run
// a frame timer late. The fence echo of the frame shim (tools/plugin-ui-harness.ts) is not late. The board animation
// ends 300 ms after the first fence, and in the same task a 0 ms timer starts a call (scheduleComputer in board.ts).
const widget = `<button id="reload">Reload</button><div id="board" data-animating="true">Board</div><script>
  const native = window.setTimeout, due = [];
  window.setTimeout = run => { if (!due.length) native(() => due.splice(0).forEach(f => f()), 200); due.push(run); return 0; };
  let started = false;
  addEventListener('message', event => {
    if (event.source !== parent || event.data?.harness !== 'fence') return;
    parent.postMessage(event.data, '*');
    if (!started) native(() => { document.querySelector('#board').dataset.animating = 'false'; setTimeout(() => parent.postMessage({ harness: 'call' }, '*'), 0); }, 300);
    started = true;
  });
</script>`;
// A computer turn of two commands. The first replay ends 300 ms after the load, and in the same task a 0 ms timer sends
// the second command. Its write turns the buttons off (the lock of src/account-game/state.ts); 50 ms later its reply turns
// them on and starts the second replay, 500 ms long. A tap during a replay only ends the replay (owner pick A8,
// src/render/PaintedView.ts).
const computerTurn = `<button id="reload">Reload</button><div id="board" data-animating="true">Board</div><button id="board-menu">Menu</button>
<dialog id="board-sheet"><button aria-label="Close">Close</button></dialog><script>
  const board = document.querySelector('#board'), lock = off => document.querySelectorAll('button').forEach(button => { button.disabled = off; });
  const replay = (ms, then) => { board.dataset.animating = 'true'; setTimeout(() => { board.dataset.animating = 'false'; then(); }, ms); };
  replay(300, () => setTimeout(() => { parent.postMessage({ harness: 'call' }, '*'); lock(true); setTimeout(() => { lock(false); replay(500, () => {}); }, 50); }, 0));
  let skipped = false;
  document.addEventListener('pointerdown', event => { skipped = board.dataset.animating === 'true'; if (skipped) { event.preventDefault(); event.stopImmediatePropagation(); } }, true);
  document.addEventListener('click', event => { if (skipped) { skipped = false; event.stopImmediatePropagation(); } }, true);
  document.querySelector('#board-menu').onclick = () => document.querySelector('#board-sheet').show();
  addEventListener('message', event => { if (event.source === parent && event.data?.harness === 'fence') parent.postMessage(event.data, '*'); });
</script>`;

async function withWidget(source: string, run: (page: Page, frame: FrameLocator) => Promise<void>) {
  const browser = await launch({ headless: true, channel: process.env.PLAYABLE_BROWSER || 'chromium' });
  try {
    const page = await browser.newPage();
    await page.setContent(host);
    await page.evaluate(source => { document.querySelector('iframe')!.srcdoc = source; }, source);
    const frame = page.frameLocator('iframe');
    await frame.locator('#reload').waitFor();
    await run(page, frame);
  } finally { await browser.close(); }
}

it('waits for a call that a timer starts when the board animation ends', () => withWidget(widget, async (page, frame) => {
  await settled(page, frame);
  expect(await page.evaluate(() => ({ calls: (window as any).harnessCalls.length, inflight: (window as any).harnessInflight }))).toEqual({ calls: 1, inflight: 0 });
}), 30000);

it('taps Menu after the second command of a computer turn and its replay', () => withWidget(computerTurn, async (page, frame) => {
  await openBoardMenu(page, frame);
  expect(await frame.locator('#board-sheet').evaluate(sheet => (sheet as HTMLDialogElement).open)).toBe(true);
  expect(await page.evaluate(() => (window as any).harnessCalls.length)).toBe(1);
}), 30000);
