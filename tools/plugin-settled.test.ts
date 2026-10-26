// Unit test of settled(): a timer that the frame sets when its board animation ends runs before settled() returns, and
// the tool call that the timer starts reaches the host. The board screen (src/plugin/screens/board.ts) starts the next
// computer command this way after the replay of a computer action that keeps the turn.
import { expect, it } from 'vitest';
import { launch } from './lib/checks.mjs';
import { settled } from './lib/plugin-settled.mjs';

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

it('waits for a call that a timer starts when the board animation ends', async () => {
  const browser = await launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(host);
    await page.evaluate(widget => { document.querySelector('iframe')!.srcdoc = widget; }, widget);
    const frame = page.frameLocator('iframe');
    await frame.locator('#reload').waitFor();
    await settled(page, frame);
    expect(await page.evaluate(() => ({ calls: (window as any).harnessCalls.length, inflight: (window as any).harnessInflight }))).toEqual({ calls: 1, inflight: 0 });
  } finally { await browser.close(); }
}, 30000);
