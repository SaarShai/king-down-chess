import { button, setButtonState } from './kit.js';
import { ease, onFrame, pulse, reducedMotion, shake, sound, tween, type Effect } from '../play/fx';

/** Keep one position for each action as its state changes. */
export function turnControls(labels: { undo: string; finish: string }, actions: { undo(): void; finish(): void; refusedFinish?(): void }) {
  const element = document.createElement('footer'); element.className = 'play-turn';
  const line = document.createElement('div'); line.className = 'play-state-line';
  const state = document.createElement('h2'); state.className = 'play-state';
  const help = document.createElement('p'); help.className = 'play-short';
  line.append(state, help);
  const undo = button(labels.undo, { onPress: actions.undo });
  const finish = button(labels.finish, { kind: 'main', onPress: actions.finish });
  const dots = document.createElement('span'); dots.className = 'play-wait-dots'; dots.setAttribute('aria-hidden', 'true');
  dots.append(...Array.from({ length: 3 }, () => document.createElement('i')));
  finish.append(dots); element.append(undo, finish);
  let sheen: Effect | undefined, press: Effect | undefined, waiting: Effect | undefined;
  element.addEventListener('click', event => {
    const control = (event.target as Element).closest<HTMLButtonElement>('button');
    if (control?.getAttribute('aria-disabled') !== 'true') return;
    sound('no'); shake(control, { amplitude: 3, ms: 200 });
    if (control === finish) actions.refusedFinish?.();
  }, true);
  finish.addEventListener('pointerdown', event => {
    if (event.button !== 0 || finish.getAttribute('aria-disabled') === 'true') return;
    sound('press'); pulse('light'); press?.cancel();
    if (reducedMotion()) return;
    press = tween(120, t => { finish.style.transform = `translateY(${2 * t}px) scale(${1 - .05 * t})`; }, { curve: ease.out3 });
  });
  const release = () => { press?.cancel(); finish.style.transform = ''; };
  for (const name of ['pointerup', 'pointercancel', 'pointerleave']) finish.addEventListener(name, release);
  return { element, line, state, help, undo, finish, update(data: { state: string; help: string; undoReason: string; finishReason: string; sent?: boolean; staged?: boolean; silent?: boolean }) {
    state.textContent = data.state; help.textContent = data.help;
    for (const [control, reason] of [[undo, data.undoReason], [finish, data.finishReason]] as const) {
      setButtonState(control, { reason }); control.title = reason;
    }
    const mode = data.sent ? 'wait' : data.finishReason ? 'dormant' : 'ready';
    if (finish.dataset.turnState !== mode || data.staged) {
      sheen?.finish();
      if (mode === 'ready' && data.staged && !data.silent) {
        sound('clink');
        sheen = tween(520, t => {
          finish.style.setProperty('--sheen-x', `${t * 160 - 30}%`);
          finish.style.setProperty('--sheen-opacity', String(Math.sin(Math.PI * t) * .52));
        }, { curve: ease.io3 });
      }
    }
    finish.dataset.turnState = mode;
    if (mode !== 'wait') waiting?.finish();
    else if (!waiting && !reducedMotion()) waiting = onFrame((_, now) => {
      if (!finish.isConnected) return false;
      dots.dataset.step = String(Math.floor(now / 280) % 3);
    }, () => { waiting = undefined; delete dots.dataset.step; });
  } };
}
