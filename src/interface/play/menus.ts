/**
 * The control set of the menus (launch decision 24) and the two settings places: You (decision 28) and the in-game
 * Menu (decision 27). Both use one order of settings and the same handlers in main.ts.
 */
import { button, choiceGroup, icon, switchRow } from '../ui/kit.js';
import { apiOrigin } from '../../platform';
import { calm, ms, token } from './motion';
import { text } from './texts';
import { sideText } from './sides';

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, className = '', content = '') => {
  const node = document.createElement(tag); node.className = className; node.textContent = content; return node;
};
export const menuText = {
  saved: sideText.staysSaved, board: 'Board', soundMotion: 'Sound and motion', about: 'About',
  device: 'You play on this device.', deviceLine: 'Your settings stay here.',
  links: ['Privacy', 'Terms', 'Support'] as const,
} as const;
/** The one order of settings in You and in the Menu. */
export const SETTING_ORDER = ['pieces', 'hand', 'coords', 'sound', 'motion'] as const;
export type Setting = typeof SETTING_ORDER[number];

/** A list row: the whole row is the target. A link for a route or a page, a button for a local action. */
export function listRow(o: { label: string; line?: string; href?: string; onPress?: () => void; lead?: Node }): HTMLAnchorElement | HTMLButtonElement {
  const row = o.href ? el('a', 'list-row') : el('button', 'list-row');
  if (row instanceof HTMLAnchorElement) row.href = o.href!; else { row.type = 'button'; if (o.onPress) row.addEventListener('click', o.onPress); }
  const copy = el('span', 'list-row-copy'); copy.append(el('strong', '', o.label)); if (o.line) copy.append(el('small', '', o.line));
  const next = icon('next'); next.classList.add('list-row-next');
  row.append(...(o.lead ? [o.lead] : []), copy, next); return row;
}
/** A picture choice: the kit's radio cards, each with its picture before the words. */
export function pictureChoice(label: string, choices: { value: string; label: string; description?: string; art: Node }[], value: string): HTMLElement {
  const group = choiceGroup(label, choices, value, 'cards'); group.classList.add('picture-choice');
  group.querySelectorAll<HTMLElement>('.kd-choice').forEach((control, i) => { const art = el('span', 'picture-art'); art.setAttribute('aria-hidden', 'true'); art.append(choices[i].art); control.prepend(art); });
  return group;
}
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
export const aboutLinks = () => menuText.links.map(name => ({ name, href: `${apiOrigin}/${name.toLowerCase()}.html` }));
const changed = (node: HTMLElement, handle: (value: string) => void) => { node.addEventListener('kd-change', event => handle((event as CustomEvent).detail.value)); return node; };

export interface Settings {
  pieceView: string; handView: string; coords: boolean; sound: boolean; motion: string;
  setPieceView(value: string): void; setHandView(value: string): void; setCoords(on: boolean): void; setSound(on: boolean): void; setMotion(value: string): void;
}
const speeds = () => ['normal', 'fast', 'off'].map(value => ({ value, label: text[value as 'normal' | 'fast' | 'off'] }));
/** The setting controls in the one order. `pictures`: You shows Pieces and Powers and cards as picture choices. */
function controls(s: Settings, pictures: { figure: () => Node; symbol: () => Node; hand: () => Node; ribbon: () => Node } | null): Record<Setting, HTMLElement> {
  const pieces = pictures
    ? pictureChoice(text.pieceView, [{ value: 'figures', label: text.figures, art: pictures.figure() }, { value: 'symbols', label: text.symbols, art: pictures.symbol() }], s.pieceView)
    : segmented(text.pieceView, [{ value: 'figures', label: text.figures }, { value: 'symbols', label: text.symbols }], s.pieceView, true);
  const hand = pictures
    ? pictureChoice(text.handView, [{ value: 'hand', label: text.hand, art: pictures.hand() }, { value: 'ribbon', label: text.ribbon, art: pictures.ribbon() }], s.handView)
    : segmented(text.handView, [{ value: 'hand', label: text.hand }, { value: 'ribbon', label: text.ribbon }], s.handView, true);
  const all: Record<Setting, HTMLElement> = {
    pieces: changed(pieces, s.setPieceView), hand: changed(hand, s.setHandView),
    coords: switchSetting(text.coordinates, s.coords, s.setCoords), sound: switchSetting(text.sound, s.sound, s.setSound),
    motion: changed(segmented(text.motion, speeds(), s.motion, true), s.setMotion),
  };
  for (const name of SETTING_ORDER) all[name].dataset.setting = name;
  return all;
}

/** You (launch decision 28): the device notice, Board, Sound and motion, Reset hints where learning put it, About. */
export function youPage(s: Settings, o: { figure: () => HTMLImageElement; symbol: () => HTMLImageElement; card: (k: number) => HTMLImageElement; reset: HTMLElement[] }): HTMLElement {
  const page = el('section', 'shell-page you-page'), title = el('h1', '', text.you); title.tabIndex = -1;
  const note = el('div', 'device-note'), copy = el('p'); copy.append(el('strong', '', menuText.device), ' ', el('span', '', menuText.deviceLine));
  note.append(o.figure(), copy);
  const fan = () => { const box = el('span', 'hand-sample'); box.append(o.card(0), o.card(1), o.card(2)); return box; };
  const ribbon = () => { const box = el('span', 'ribbon-sample'); box.append(el('span', '', 'Freeze'), el('span', '', 'Flight')); return box; };
  const c = controls(s, { figure: o.figure, symbol: o.symbol, hand: fan, ribbon });
  const group = (name: string, ...rows: HTMLElement[]) => { const box = el('section', 'settings-group'), head = el('h2', 'group-title', name); box.append(head, ...rows); return box; };
  const about = group(menuText.about, ...aboutLinks().map(link => listRow({ label: link.name, href: link.href })));
  about.classList.add('about-group');
  const columns = el('div', 'you-columns'), first = el('div', 'you-column'), second = el('div', 'you-column');
  first.append(group(menuText.board, c.pieces, c.hand, c.coords));
  second.append(group(menuText.soundMotion, c.sound, c.motion), ...o.reset, about);
  columns.append(first, second); page.append(title, note, columns);
  return page;
}

/** The in-game Menu (launch decision 27): Back to home and Resign first, the save line, then the setting rows. */
export function gameMenu(s: Settings, o: { saveLine: string; onClose(): void; onHome(): void; onResign(source: HTMLButtonElement): void }): HTMLElement {
  const menu = el('div', 'game-menu'), head = el('div', 'menu-head');
  head.append(el('h3', '', text.menu), button(text.close, { onPress: o.onClose }));
  const exits = el('div', 'menu-exit'), resign: HTMLButtonElement = button(text.resign, { kind: 'danger', onPress: () => o.onResign(resign) });
  exits.append(button(text.home, { onPress: o.onHome }), resign);
  const rows = el('div', 'menu-settings'), c = controls(s, null);
  rows.append(...SETTING_ORDER.map(name => c[name]));
  menu.append(head, exits, ...(o.saveLine ? [el('p', 'menu-note', o.saveLine)] : []), rows);
  return menu;
}
/**
 * The Menu opens with its head and its exit row in place (a short fade), and only the setting rows slide up. A tap
 * soon after the Menu opens lands on the control that it sees (runs/launch/soak/report.md fault 4).
 */
export function menuEnter(menu: HTMLElement) {
  const fixed = [...menu.children].filter(node => !node.classList.contains('menu-settings')), rows = menu.querySelector<HTMLElement>('.menu-settings');
  const fade = { duration: ms(calm() ? '--dur-reduced-in' : '--dur-sheet-in'), easing: 'linear' };
  for (const node of fixed) node.animate([{ opacity: 0 }, { opacity: 1 }], fade);
  rows?.animate(calm() ? [{ opacity: 0 }, { opacity: 1 }] : [{ transform: `translateY(${Math.min(rows.clientHeight, 160)}px)`, opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: fade.duration, easing: calm() ? 'linear' : token('--ease-out5') });
}
