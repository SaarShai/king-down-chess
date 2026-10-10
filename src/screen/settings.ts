import type { SkillName } from '../ai/skill';
import { isLevel } from '../new-game';
import type { BoardView, Pace } from '../render/PaintedView';
import { setSound } from '../render/sfx';
import type { Save } from './save';

const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;

/** The saved look (`?look=` wins over it); main.ts reads it before it makes the view. */
export const LOOK_KEY = 'kingdown.look';

/** The settings controls' values, and the computer's level. */
export interface Controls { skill: SkillName; coords: boolean; sound: boolean; queen: boolean; pace: Pace; threats: boolean; labels: boolean }

/** The save's settings fields (screen/save.ts SETTINGS), in the order the save writes them. */
export const settingsOf = (c: Controls) => ({
  skill: c.skill,
  coords: c.coords,
  sound: c.sound,
  queen: c.queen,
  pace: c.pace,
  threats: c.threats,
  labels: c.labels || undefined, // a new setting: written only when on
});

/**
 * The settings controls: sound, auto-queen, threats, pace, piece letters, coordinates, the look and
 * Reset view. A change goes to the view and to the save (`save`). `look`: the look this page draws.
 * `skill`: the computer's level, which the save keeps beside the settings.
 */
export function connectSettings(view: BoardView, c: {
  look: string;
  skill(): SkillName;
  setSkill(level: SkillName): void;
  save(): void;
  drawMarks(): void;
}) {
  $<HTMLSelectElement>('look').value = c.look === 'clay' ? 'clay' : 'painted';
  $<HTMLSelectElement>('look').onchange = () => {
    try { localStorage.setItem(LOOK_KEY, $<HTMLSelectElement>('look').value); } catch { /* private mode: the URL still switches */ }
    const url = new URL(location.href);
    url.searchParams.set('look', $<HTMLSelectElement>('look').value);
    location.href = url.href;
  };
  $('reset-view').hidden = c.look !== 'clay';
  $('sound').onchange = () => { setSound($<HTMLInputElement>('sound').checked); c.save(); };
  $('queen').onchange = c.save;
  $('threats').onchange = () => { c.drawMarks(); c.save(); };
  const pace = $<HTMLSelectElement>('pace');
  // No saved choice: the system's reduced-motion setting picks Off.
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) pace.value = 'off';
  /** The board's animation speed; Off also stills the New game picker's motion art (power-motion.css), as reduced motion does. */
  function applyPace(): void {
    view.setPace(pace.value as Pace);
    document.documentElement.dataset.pace = pace.value;
  }
  pace.onchange = () => { applyPace(); c.save(); };
  const labels = $<HTMLInputElement>('labels');
  labels.onchange = () => { view.setLabels(labels.checked); c.save(); };
  const coords = $<HTMLInputElement>('coords');
  coords.onchange = () => { view.setCoords(coords.checked); c.save(); };
  $('reset-view').onclick = () => view.resetView();

  /** The save's settings fields (account/sync.ts SETTINGS). */
  const settingsNow = () => settingsOf({
    skill: c.skill(),
    coords: coords.checked,
    sound: $<HTMLInputElement>('sound').checked,
    queen: $<HTMLInputElement>('queen').checked,
    pace: pace.value as Pace,
    threats: $<HTMLInputElement>('threats').checked,
    labels: labels.checked,
  });

  /** A save's settings onto the controls (at start-up, or newer ones from the account). */
  function applySettings(s: Save): void {
    if (typeof s.sound === 'boolean') $<HTMLInputElement>('sound').checked = s.sound;
    if (typeof s.queen === 'boolean') $<HTMLInputElement>('queen').checked = s.queen;
    if (typeof s.threats === 'boolean') $<HTMLInputElement>('threats').checked = s.threats;
    if (s.pace === 'normal' || s.pace === 'fast' || s.pace === 'off') pace.value = s.pace;
    // Old saves with no skill field stay Strong so a resumed game does not suddenly get easier.
    c.setSkill(isLevel(s.skill) ? s.skill : 'strong');
    if (typeof s.coords === 'boolean') coords.checked = s.coords;
    labels.checked = s.labels === true; // no field: off (an old save, or the account's settings with the letters off)
  }

  return {
    applySettings, applyPace, settingsNow,
    pace: (): Pace => pace.value as Pace,
    sound: (): boolean => $<HTMLInputElement>('sound').checked,
    queen: (): boolean => $<HTMLInputElement>('queen').checked,
    threats: (): boolean => $<HTMLInputElement>('threats').checked,
    labels: (): boolean => labels.checked,
    coords: (): boolean => coords.checked,
    /** `?labels=1` turns the letters on over the saved choice. */
    showLabels: (): void => { labels.checked = true; },
  };
}
