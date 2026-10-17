// The board takes a tap inside the page (ticket 25 c). A touch becomes a pointer event, and PaintedView.onUp
// runs on the pointerup: it calls the play screen's onSquareClick, or onDragSelect for a drag. That call
// recomputes the marks (screen/play.ts refresh). page.touchscreen.tap() resolves when the browser has sent the
// touch, not when the page has run that handler, so a read of the marks right after the tap can see the state
// before the tap. Under load the read-piece and verb-marks checks failed this way at main 8a9c0f7d.
// These helpers wait for the board to take the tap: a real condition, never a sleep or a longer time limit.

/** Counts the taps that the board takes: wraps the view's two handlers. A page load makes a new view, so arm it again. */
export const armTapCount = page => page.evaluate(() => {
  const view = window.view;
  if (view.__taps !== undefined) return; // this page is armed already
  view.__taps = 0;
  const click = view.onSquareClick, drag = view.onDragSelect;
  view.onSquareClick = (sq, shift) => { view.__taps += 1; return click(sq, shift); };
  view.onDragSelect = sq => { view.__taps += 1; return drag(sq); };
});

/** The taps that this page's board has taken; undefined until armTapCount() ran on this page. */
export const tapCount = page => page.evaluate(() => window.view.__taps);

/** Waits until the board has taken one more tap than `before`. A tap that never reaches the board fails here. */
export async function waitForTap(page, before) {
  try {
    await page.waitForFunction(n => window.view.__taps > n, before);
  } catch (error) {
    const now = await tapCount(page).catch(() => null);
    const detail = `\ntap: the board did not take the tap; it has taken ${now ?? 'an unreadable number of'} taps, and it had taken ${before} before the tap`;
    // Node prints the stack of an error that nobody catches, and Playwright sets the stack once: add the detail to both.
    const stack = typeof error.stack === 'string' ? error.stack : '';
    const frames = stack.indexOf('\n    at ');
    error.message += detail;
    error.stack = error.message + (frames < 0 ? '' : stack.slice(frames));
    throw error;
  }
}

/** Taps the square `sq` through the board, and waits until the board has taken the tap. */
export async function tapSquare(page, sq) {
  let before = await tapCount(page);
  if (typeof before !== 'number') { await armTapCount(page); before = 0; }
  const p = await page.evaluate(s => window.view.screenOf(s), sq);
  await page.touchscreen.tap(p.x, p.y);
  await waitForTap(page, before);
}
