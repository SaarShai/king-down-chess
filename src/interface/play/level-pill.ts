import { choiceGroup } from '../ui/kit.js';
import { LEVELS } from './new-game';
import type { Level } from './saved';
import { text } from './texts';

export function levelPill(value: Level, describe: (value: Level) => string, onChange: (value: Level) => void): HTMLElement {
  const pill = choiceGroup(text.level, LEVELS.map(level => ({ value: level, label: text[level] })), value);
  pill.classList.add('level-pill');
  pill.querySelector('legend')!.classList.add('kd-sr');
  const track = pill.querySelector('.kd-segments')!;
  const thumb = document.createElement('span'); thumb.className = 'level-thumb'; thumb.setAttribute('aria-hidden', 'true');
  const line = document.createElement('p'); line.className = 'level-line'; line.setAttribute('aria-live', 'polite');
  const show = (level: Level) => { pill.dataset.level = String(LEVELS.indexOf(level) + 1); line.textContent = describe(level); };
  track.prepend(thumb); pill.append(line); show(value);
  pill.addEventListener('kd-change', event => {
    const next = (event as CustomEvent<{ value: Level }>).detail.value;
    show(next); onChange(next);
  });
  return pill;
}
