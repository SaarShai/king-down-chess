import { button, setButtonState } from './kit.js';
import { swapText } from '../play/motion';

/** Keep Undo and End turn in place during a reply and a result. The state line sits at the top of the reading area. */
export function turnControls(labels: { undo: string; finish: string }, actions: { undo(): void; finish(): void }) {
  const element = document.createElement('footer'); element.className = 'play-turn';
  const line = document.createElement('div'); line.className = 'play-state-line';
  const state = document.createElement('h2'); state.className = 'play-state';
  const help = document.createElement('p'); help.className = 'play-short';
  line.append(state, help);
  const undo = button(labels.undo, { onPress: actions.undo });
  const finish = button(labels.finish, { kind: 'main', onPress: actions.finish });
  element.append(undo, finish);
  /** `sent`: the turn is now final, so the state swaps with Weight; other state changes swap with Exact. */
  return { element, line, state, help, undo, finish, update(data: { state: string; help: string; undoReason: string; finishReason: string; sent?: boolean }) {
    swapText(state, data.state, data.sent ? 'weight' : 'exact'); help.textContent = data.help;
    for (const [control, reason] of [[undo, data.undoReason], [finish, data.finishReason]] as const) {
      setButtonState(control, { reason }); control.title = reason;
    }
  } };
}
