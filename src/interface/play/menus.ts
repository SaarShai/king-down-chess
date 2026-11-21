/** Shared controls for the account settings and the game menu. */
import { button, closeX, choiceGroup, switchRow } from '../ui/kit.js';
import { apiOrigin } from '../../platform';
import { text } from './texts';

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, className = '', content = '') => {
  const node = document.createElement(tag); node.className = className; node.textContent = content; return node;
};
export const SETTING_ORDER = ['pieces', 'coords', 'sound', 'vibration', 'motion'] as const;
export type Setting = typeof SETTING_ORDER[number];

/**
 * A segmented control: one track, one selected segment, one radio tab stop. `row`: a setting row, the name at the left
 * and the track at the right, in an inner box (WebKit does not lay out a fieldset as a flex box); the legend stays the
 * group's name for assistive technology.
 */
export function segmented(label: string, choices: { value: string; label: string; art?: Node }[], value: string, row = false): HTMLElement {
  const group = choiceGroup(label, choices, value); group.classList.add('segmented');
  group.querySelectorAll<HTMLElement>('.kd-segment').forEach((control, i) => { const art = choices[i].art; if (art) { const box = el('span', 'segment-art'); box.setAttribute('aria-hidden', 'true'); box.append(art); control.prepend(box); } });
  if (row) {
    const line = el('div', 'segment-row'), name = el('span', 'segment-name', label); name.setAttribute('aria-hidden', 'true');
    group.querySelector('legend')!.classList.add('kd-sr'); line.append(name, group.querySelector('.kd-segments')!); group.append(line);
  }
  return group;
}
/** A switch row: the whole row changes the value. */
export function switchSetting(label: string, checked: boolean, onChange: (on: boolean) => void): HTMLButtonElement {
  const row = switchRow(label, '', checked) as HTMLButtonElement; row.classList.add('switch-setting');
  row.addEventListener('kd-change', event => onChange((event as CustomEvent).detail.checked));
  return row;
}
/** The About links (iOS need P1): in the app they open on the public site, not inside the app files. */
export const aboutLinks = () => ['Privacy', 'Terms', 'Support'].map(name => ({ name, href: `${apiOrigin}/${name.toLowerCase()}.html` }));
const changed = (node: HTMLElement, handle: (value: string) => void) => { node.addEventListener('kd-change', event => handle((event as CustomEvent).detail.value)); return node; };

export interface Settings {
  pieceView: string; coords: boolean; sound: boolean; vibration: boolean; motion: string;
  setPieceView(value: string): void; setCoords(on: boolean): void; setSound(on: boolean): void; setVibration(on: boolean): void; setMotion(value: string): void;
}
const speeds = () => ['normal', 'fast', 'off'].map(value => ({ value, label: text[value as 'normal' | 'fast' | 'off'] }));
function controls(s: Settings): HTMLElement[] {
  const all: Record<Setting, HTMLElement> = {
    pieces: changed(segmented(text.pieceView, [{ value: 'figures', label: text.figures }, { value: 'symbols', label: text.symbols }], s.pieceView, true), s.setPieceView),
    coords: switchSetting(text.coordinates, s.coords, s.setCoords),
    sound: switchSetting(text.sound, s.sound, s.setSound),
    vibration: switchSetting('Vibration', s.vibration, s.setVibration),
    motion: changed(segmented(text.motion, speeds(), s.motion, true), s.setMotion),
  };
  return SETTING_ORDER.map(name => {
    const row = all[name]; row.dataset.setting = name; return row;
  });
}

export function dismissSheet(dialog: HTMLDialogElement, onClose: () => void) {
  dialog.addEventListener('click', event => { if (event.target === dialog) { event.preventDefault(); onClose(); } });
  dialog.addEventListener('cancel', event => { event.preventDefault(); onClose(); });
}

export function settingsSheet(s: Settings, o: { account: HTMLElement; onClose(): void }): HTMLDialogElement {
  const dialog = el('dialog', 'kd-dialog sheet-dialog settings-sheet'), head = el('header', 'sheet-head');
  const title = el('h2', '', text.settings); title.id = 'account-settings-title'; title.tabIndex = -1;
  dialog.setAttribute('aria-labelledby', title.id);
  head.append(title, closeX('Close settings', o.onClose));
  const body = el('div', 'sheet-body'), group = el('div', 'settings-group'), about = el('footer', 'about-inline');
  group.append(...controls(s));
  for (const { name, href } of aboutLinks()) {
    const link = el('a', '', name); link.href = href;
    if (about.childElementCount) {
      const dot = el('span', '', '·'); dot.setAttribute('aria-hidden', 'true'); about.append(dot);
    }
    about.append(link);
  }
  o.account.classList.add('settings-account');
  body.append(o.account, group, about); dialog.append(head, body);
  dismissSheet(dialog, o.onClose);
  return dialog;
}

export function gameMenu(s: Settings, o: {
  saveLine: string; onClose(): void; onHome(): void; onGuide(): void; onHistory?(): void;
  onResign(source: HTMLButtonElement): void; showResign?: boolean; onlineActions?: HTMLElement;
}): HTMLElement {
  const menu = el('div', 'game-menu'), head = el('header', 'menu-head');
  const title = el('h3', '', text.menu); title.id = 'game-menu-title'; title.tabIndex = -1;
  head.append(title, closeX('Close menu', o.onClose));
  const body = el('div', 'sheet-body'), exits = el('div', 'menu-exit');
  exits.append(button(text.homeLabel, { onPress: o.onHome }), button(text.guide, { icon: 'learn', onPress: o.onGuide }));
  if (o.onHistory) exits.append(button(text.history, { onPress: o.onHistory }));
  body.append(exits);
  if (o.saveLine) body.append(el('p', 'menu-note', o.saveLine));
  if (o.onlineActions?.childElementCount) body.append(o.onlineActions);
  const rows = el('div', 'menu-settings'); rows.append(...controls(s)); body.append(rows);
  if (o.showResign !== false) {
    const resign: HTMLButtonElement = button(text.resign, { kind: 'danger', onPress: () => o.onResign(resign) });
    body.append(resign);
  }
  menu.append(head, body);
  return menu;
}
