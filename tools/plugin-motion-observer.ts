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
 * Record whether the animations under `scope` end within `ms` of the first `trigger` match. The page counts the time
 * on its document timeline from that match, and reads the animations at its first frame `ms` on. So a slow browser call
 * cannot use up the time, and a page that stalls reads the timeline at its next frame, when a short animation has ended.
 * An animation that stops moving (playbackRate 0) is still running there.
 * The result comes at that frame: `seen`, the animations under `scope` at the match, and `running`, those that run then.
 */
export async function watchMotionEnd(page: Page, trigger: string, scope: string, ms: number) {
  const watch = ({ trigger, scope, ms }: { trigger: string; scope: string; ms: number }) => {
    const animations = () => [...document.querySelectorAll(scope)].flatMap(e => e.getAnimations({ subtree: true }));
    let done!: (result: { seen: number; running: number }) => void;
    ((window as any).motionEnd ??= {})[trigger] = new Promise(resolve => done = resolve);
    const start = () => {
      if (!document.querySelector(trigger)) return;
      observer.disconnect();
      const from = Number(document.timeline.currentTime), seen = animations().length;
      const frame = () => {
        if (Number(document.timeline.currentTime) - from < ms) requestAnimationFrame(frame);
        else done({ seen, running: animations().filter(a => a.playState === 'running').length });
      };
      requestAnimationFrame(frame);
    };
    const observer = new MutationObserver(start);
    observer.observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });
    start();
  };
  await install(page, watch, { trigger, scope, ms });
  return () => page.frameLocator('iframe').locator('html').evaluate((_, trigger) => (window as any).motionEnd[trigger] as Promise<{ seen: number; running: number }>, trigger);
}
