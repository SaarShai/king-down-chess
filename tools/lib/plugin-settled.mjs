import { STEP } from './checks.mjs';

/**
 * Waits until the widget frame is settled, so a read, measure, focus or screenshot meets the nodes that stay:
 * - no tool call is in flight at the host, but the ones a check holds on purpose (harnessHeld);
 * - no harnessNextView waits for its board read;
 * - the frame has every reply the host sent: a fence that the frame sends back comes after them (postMessage keeps
 *   the order), so the frame's own next call (the games read after a board read) is at the host before it;
 * - the mount and each write have ended (#reload is on);
 * - no draw is due: no coin is in its spend moment (strips() draws the coins again 300 ms after a spend), and the
 *   visible board does not animate (the end of a move animation draws the strips again).
 * The host's call count must not change over one pass, else the pass runs again.
 */
export async function settled(page, frame) {
  const end = Date.now() + 30_000 * STEP;
  const host = () => page.waitForFunction(() => window.harnessNextView === undefined && window.harnessInflight === window.harnessHeld && { calls: window.harnessCalls?.length ?? 0 }).then(handle => handle.jsonValue());
  const fence = () => page.evaluate(() => new Promise(resolve => {
    const target = window.harnessWidgets.at(-1).frame.contentWindow, id = `settled-${Math.random()}`;
    // A frame that a remount replaces never answers; the pass then runs again.
    const timer = setTimeout(() => { removeEventListener('message', echo); resolve(false); }, 1000);
    function echo(event) {
      if (event.source !== target || event.data?.harness !== 'fence' || event.data.id !== id) return;
      clearTimeout(timer); removeEventListener('message', echo); resolve(true);
    }
    addEventListener('message', echo);
    target.postMessage({ harness: 'fence', id }, '*');
  }));
  for (;;) {
    const before = await host();
    const answered = await fence();
    const widget = await (await frame.owner().elementHandle()).contentFrame();
    await widget.waitForFunction(() => {
      const board = document.querySelector('#board');
      return document.querySelector('#reload')?.disabled === false && !document.querySelector('.coin.is-spending')
        && !(board?.dataset.animating === 'true' && board.checkVisibility());
    });
    // A timer that the frame set before this pass (the computer turn after a move) runs before the second fence.
    const again = await fence();
    const after = await page.evaluate(() => ({ calls: window.harnessCalls?.length ?? 0, idle: window.harnessNextView === undefined && window.harnessInflight === window.harnessHeld }));
    if (answered && again && after.idle && after.calls === before.calls) return;
    if (Date.now() > end) throw new Error(`settled: the frame did not settle: ${JSON.stringify({ answered, again, before, after })}`);
  }
}
