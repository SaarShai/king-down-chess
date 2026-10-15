import type { View } from '../match/protocol';
import type { Screen } from './client';
export function createRouter(call: (name: string, args: Record<string, unknown>, retain: boolean) => Promise<View | undefined>, navigate: (screen: Screen) => void, show: (view: View) => void, pending: () => boolean = () => false) {
  let waitingStart: ((view: View | undefined) => void) | undefined;
  function finishStart(view?: View) {
    if (!waitingStart) return false;
    const resolve = waitingStart; waitingStart = undefined; resolve(view); return true;
  }
  function routeView(view: View) {
    const screen: Screen = view.status === 'waiting' ? view.kind === 'friend' ? 'friend' : 'wait'
      : view.status === 'finished' || view.status === 'aborted' ? 'end'
      : view.status === 'setup' && view.options ? 'seat' : 'board';
    show(view); navigate(screen); return screen;
  }
  async function start(kind: View['kind'], args: Record<string, unknown> = {}, options: { route?: boolean } = {}) {
    finishStart();
    // Retry, also after a remount, sends the same command ID, so the server gives back the first game, never a second one.
    const command_id = crypto.randomUUID().replaceAll('-', '');
    let next = await call(kind === 'random' ? 'kingdown_find' : 'kingdown_create', kind === 'random' ? { ...args, command_id } : { ...args, kind, command_id }, true);
    if (!next && pending()) next = await new Promise<View | undefined>(resolve => { waitingStart = resolve; });
    if (next && options.route !== false) routeView(next);
    return next;
  }
  return { routeView, start, finishStart };
}
