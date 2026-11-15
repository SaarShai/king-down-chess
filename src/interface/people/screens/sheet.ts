/**
 * The frame of the people sheets and the parts that they share. One modal `<dialog>`: a sheet from the bottom on a
 * phone, a centred panel from 600 px (decision 37 of the design project). Close, a tap on the scrim and Escape close
 * it and give the focus back to the control that opened it. A sheet changes its view in place (sign-in, then the name,
 * then the task).
 */
import { ICONS, type Icon } from '../../../account/profile';
import { button, setButtonState } from '../../ui/kit.js';
import './people.css';

export const node = <K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text = ''): HTMLElementTagNameMap[K] => {
  const element = document.createElement(tag); element.className = className; element.textContent = text; return element;
};
/** A picture of the game (no photo): the player's icon, or a pawn. */
export function picture(icon: Icon | null, size: 'small' | 'large' = 'small'): HTMLImageElement {
  const image = node('img', `people-picture people-picture-${size}`); image.src = `/${ICONS[icon ?? 'pawn']}`; image.alt = '';
  return image;
}
/** A line for a result of the current view. It is a live region, so a screen reader reads it when it changes. */
export function statusLine(): HTMLParagraphElement {
  const line = node('p', 'people-status'); line.setAttribute('role', 'status'); line.id = `people-status-${++ids}`; return line;
}
export function say(line: HTMLElement, text = '') { line.textContent = text; }

export interface SheetView { title: string; body: HTMLElement[]; back?: () => void }
let ids = 0;

/** `source` gets the focus back on close (a tap on a phone does not focus a button, so the caller names it). */
export function peopleSheet(source: HTMLElement | null = document.activeElement as HTMLElement | null, onClose: () => void = () => {}) {
  const opener = source instanceof HTMLButtonElement ? source : null;
  if (opener) setButtonState(opener, { busy: true });
  const dialog = node('dialog', 'people-sheet'), panel = node('div', 'people-sheet-panel');
  const head = node('div', 'people-sheet-head'), title = node('h2'), body = node('div', 'people-sheet-body');
  title.id = `people-sheet-${++ids}`; title.tabIndex = -1; dialog.setAttribute('aria-labelledby', title.id);
  let backTo: (() => void) | undefined, closed = false;
  const back = button('Back', { onPress: () => backTo?.() }), close = button('Close', { onPress: () => shut() });
  back.classList.add('people-sheet-back'); close.classList.add('people-sheet-close');
  head.append(back, title, close); panel.append(head, body); dialog.append(panel);
  // The scrim is the dialog's own box outside the panel.
  dialog.addEventListener('click', event => { if (event.target === dialog) shut(); });
  dialog.addEventListener('cancel', event => { event.preventDefault(); shut(); });
  function shut() {
    if (closed) return;
    closed = true;
    if (dialog.open) dialog.close();
    dialog.remove();
    if (opener) setButtonState(opener, {});
    if (source?.isConnected) source.focus();
    onClose();
  }
  return {
    element: dialog, close: shut,
    /** Show a view; the first view opens the sheet. */
    show(view: SheetView) {
      if (closed) return;
      if (!dialog.isConnected) document.body.append(dialog);
      if (!dialog.open) dialog.showModal();
      if (opener) setButtonState(opener, {});
      title.textContent = view.title; body.replaceChildren(...view.body); backTo = view.back; back.hidden = !view.back;
      body.scrollTop = 0; title.focus();
    },
    get isOpen() { return dialog.open; },
  };
}
export type PeopleSheet = ReturnType<typeof peopleSheet>;
