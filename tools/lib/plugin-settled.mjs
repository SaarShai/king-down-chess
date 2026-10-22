import { STEP } from './checks.mjs';

// One round trip may not answer: a remount replaces the frame, or the page clock is paused. Node keeps this limit,
// so the page clock cannot stop it; an answer that comes later goes to a promise that nobody reads.
const ROUND_TRIP = 1000;
// The frame's CSP forbids a string expression, so one function gives both the wait and the state report.
const frameState = report => {
  const board = document.querySelector('#board');
  const state = { reload: document.querySelector('#reload')?.disabled === false, spending: document.querySelectorAll('.coin.is-spending').length,
    animating: board?.dataset.animating === 'true' && board.checkVisibility(), toppling: board?.dataset.toppling === 'true' };
  const ok = state.reload && !state.spending && !state.animating && !state.toppling;
  return report ? { ...state, ok } : ok;
};

/**
 * Waits until the widget frame is settled, so a read, measure, focus or screenshot meets the nodes that stay:
 * - host idle: no tool call is in flight at the host, but the ones a check holds on purpose (harnessHeld), and no
 *   harnessNextView waits for its board read;
 * - fence: the frame has every reply the host sent (a message that the frame sends back comes after them, because
 *   postMessage keeps the order);
 * - frame timers: each 0 ms timer that the frame set before has run. HTML runs the timers of one window with an equal
 *   or shorter timeout in the order they were set, so the end routing after a finished or aborted view
 *   (src/plugin/screens/board.ts draw()) and the computer turn after a move run first;
 * - frame: the mount and each write have ended (#reload is on), no coin is in its spend moment (strips() draws the
 *   coins again 300 ms after a spend), the visible board does not animate (the end of a move animation draws the
 *   strips again), and the King Down ceremony does not run (data-toppling; its own timer clears it after 1130 ms);
 * - call count: a second fence brings each call that the frame started to the host, and the host's call count did
 *   not change over the pass. Else the pass runs again.
 * It does not cover a timer longer than 0 ms other than the two above (the poll, the deadline, the thinking line),
 * or a read that the frame has not started yet. When the page clock is paused (page.clock.pauseAt), no frame timer can
 * run until the check moves the clock, so the frame timer condition holds when the frame's Date.now() does not move.
 * At its limit (30 s x STEP) the helper fails with the condition that did not hold, its state and the last pass.
 */
export async function settled(page, frame) {
  const end = Date.now() + 30_000 * STEP, timeout = () => Math.max(1, end - Date.now());
  const hostState = () => page.evaluate(() => ({ nextView: window.harnessNextView !== undefined, inflight: window.harnessInflight, held: window.harnessHeld, calls: window.harnessCalls?.length ?? 0 }));
  let last;
  const fail = async (condition, state) => { throw new Error(`settled: ${condition} did not hold in ${30 * STEP} s: ${JSON.stringify(await state())}; last pass: ${JSON.stringify(last ?? null)}`); };
  const timedOut = error => error?.name === 'TimeoutError';
  const roundTrip = async answer => {
    let timer;
    answer.catch(() => {});
    try { return await Promise.race([answer, new Promise(resolve => { timer = setTimeout(resolve, ROUND_TRIP, false); })]); }
    finally { clearTimeout(timer); }
  };
  const fence = () => roundTrip(page.evaluate(id => new Promise(resolve => {
    const target = window.harnessWidgets.at(-1).frame.contentWindow;
    function echo(event) {
      if (event.source !== target || event.data?.harness !== 'fence' || event.data.id !== id) return;
      removeEventListener('message', echo); resolve(true);
    }
    addEventListener('message', echo);
    target.postMessage({ harness: 'fence', id }, '*');
  }), `settled-${Math.random()}`));
  // A detached frame (a remount) gives no answer; the pass then runs again.
  const timers = async widget => {
    const now = () => widget.evaluate(() => Date.now()).catch(() => undefined), start = await now();
    if (await roundTrip(widget.evaluate(() => new Promise(resolve => setTimeout(() => resolve(true), 0))).catch(() => false))) return true;
    // A paused page clock: no frame timer runs before the check moves the clock.
    return start !== undefined && await now() === start;
  };
  for (;;) {
    const before = await page.waitForFunction(() => window.harnessNextView === undefined && window.harnessInflight === window.harnessHeld && { calls: window.harnessCalls?.length ?? 0 }, undefined, { timeout: timeout() })
      .then(handle => handle.jsonValue(), error => timedOut(error) ? fail('host idle', hostState) : Promise.reject(error));
    const answered = await fence();
    const widget = await (await frame.owner().elementHandle({ timeout: timeout() })).contentFrame();
    const ran = await timers(widget);
    await widget.waitForFunction(frameState, false, { timeout: timeout() })
      .catch(error => timedOut(error) ? fail('frame (#reload on, no spending coin, no animating board, no ceremony)', () => widget.evaluate(frameState, true)) : Promise.reject(error));
    const again = await fence();
    const after = await hostState();
    const idle = !after.nextView && after.inflight === after.held;
    if (answered && ran && again && idle && after.calls === before.calls) return;
    last = { answered, ran, again, before, after };
    if (Date.now() > end) await fail(!answered || !again ? 'fence answers' : !ran ? 'frame timers' : !idle ? 'host idle' : 'call count', async () => ({ answered, ran, again, before, after }));
  }
}
