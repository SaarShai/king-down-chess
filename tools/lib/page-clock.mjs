/**
 * Stops the page clock (`page.clock.install()`) at the page's own now, so no frame timer runs until `page.clock.resume()`,
 * `runFor` or `fastForward`.
 *
 * `page.clock.pauseAt(time)` jumps the running clock forward to `time`, and it throws "Cannot fast-forward to the past"
 * when the page clock has passed `time`. A running clock passes a time that a check reads from it before the pause
 * command reaches the page, on a slow runner also a time some seconds ahead. So a fixed wall time comes first: it stops
 * `Date.now()` and keeps the timers running (`setFixedTime`), and the pause at that same time is then a jump of zero.
 * `setSystemTime` lets the wall time run again from there when the clock resumes.
 * A read that a timer started before the pause can still be in flight; a check waits for it to end.
 */
export async function pauseClock(page) {
  const now = await page.evaluate(() => Date.now());
  await page.clock.setFixedTime(now);
  await page.clock.pauseAt(now);
  await page.clock.setSystemTime(now);
}
