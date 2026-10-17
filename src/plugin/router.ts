import type { View } from '../match/protocol';
import type { Screen } from './client';
import type { JobOptions } from './queue';
export function createRouter(call: (name: string, args: Record<string, unknown>, options: JobOptions) => Promise<View | undefined>, navigate: (screen: Screen) => void, show: (view: View) => boolean | void) {
  function routeView(view: View) {
    const screen: Screen = view.status === 'waiting' ? view.kind === 'friend' ? 'friend' : 'wait'
      : view.status === 'aborted' && view.kind === 'solo' && view.result?.reason === 'abort' ? 'play'
      : view.status === 'finished' || view.status === 'aborted' ? 'end'
      : view.status === 'setup' && view.options ? 'seat' : 'board';
    if (show(view) === false) return;
    navigate(screen); return screen;
  }
  async function start(kind: View['kind'], args: Record<string, unknown> = {}, options: Pick<JobOptions, 'route' | 'then' | 'origin' | 'king'> = {}) {
    // Retry, also after a remount, sends the same command ID, so the server gives back the first game, never a second one.
    const command_id = crypto.randomUUID().replaceAll('-', '');
    const next = await call(kind === 'random' ? 'kingdown_find' : 'kingdown_create', kind === 'random' ? { ...args, command_id } : { ...args, kind, command_id }, { ...options, retain: true, route: false });
    if (next && options.route !== false) routeView(next);
    return next;
  }
  return { routeView, start };
}
