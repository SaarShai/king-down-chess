import type { Page } from 'playwright';

// A fresh widget has a new document. Install a watch before its app starts, and in the widget that runs now.
async function install<A>(page: Page, watch: (arg: A) => void, arg: A) {
  await page.addInitScript(watch, arg);
  // Frame.evaluate passes the argument directly, as addInitScript does.
  await page.frames().find(f => f.parentFrame() === page.mainFrame())!.evaluate(watch, arg);
}

/** Record short motion states before a slow browser call can miss them. */
export async function watchMotion(page: Page, selector: string) {
  const watch = (selector: string) => {
    const state = ((window as any).motionWatch ??= {})[selector] = { count: 0, running: 0 };
    new MutationObserver(() => {
      const elements = [...document.querySelectorAll(selector)];
      state.count = Math.max(state.count, elements.length);
      state.running = Math.max(state.running, elements.flatMap(e => e.getAnimations({ subtree: true })).filter(a => a.playState === 'running').length);
    }).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });
  };
  await install(page, watch, selector);
  return () => page.frameLocator('iframe').locator('html').evaluate((_, selector) => (window as any).motionWatch[selector] as { count: number; running: number }, selector);
}

/**
 * Record whether the animations under `scope` end within `ms` of the first `trigger` match. The time runs from the
 * first frame after the match, when its animations start, to the first frame `ms` on, in frame times. So a slow browser
 * call cannot use up the time, and a page that stalls before or after the start reads the animations at a frame that
 * shows each one's own progress. An animation that stops moving (playbackRate 0) is still running there.
 * The result comes at that frame: `seen`, the animations under `scope` at the match; `found`, the `scope` elements then;
 * and `running`, the animations under `scope` then, or of the match, that run. It is null when no match came.
 * The page needs running frames: no paused page clock.
 */
export async function watchMotionEnd(page: Page, trigger: string, scope: string, ms: number) {
  const watch = ({ trigger, scope, ms }: { trigger: string; scope: string; ms: number }) => {
    const animations = () => [...document.querySelectorAll(scope)].flatMap(e => e.getAnimations({ subtree: true }));
    const state: { result: Promise<{ seen: number; found: number; running: number }> | null } = { result: null };
    ((window as any).motionEnd ??= {})[trigger] = state;
    const start = () => {
      if (!document.querySelector(trigger)) return;
      observer.disconnect();
      // The match's own animations count too, also when its element leaves `scope`.
      const seen = animations();
      state.result = new Promise(done => requestAnimationFrame(from => {
        const frame = (now: number) => {
          if (now - from < ms) { requestAnimationFrame(frame); return; }
          const running = new Set([...seen, ...animations()].filter(a => a.playState === 'running'));
          done({ seen: seen.length, found: document.querySelectorAll(scope).length, running: running.size });
        };
        requestAnimationFrame(frame);
      }));
    };
    const observer = new MutationObserver(start);
    observer.observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });
    start();
  };
  await install(page, watch, { trigger, scope, ms });
  return () => page.frameLocator('iframe').locator('html').evaluate((_, trigger) => (window as any).motionEnd[trigger].result as Promise<{ seen: number; found: number; running: number }> | null, trigger);
}
