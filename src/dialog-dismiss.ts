/**
 * A tap or click outside a modal dialog closes it, as Escape does: the dialog gets a cancelable
 * `cancel` event first, so a dialog that handles Escape (or refuses it) handles this the same way.
 * One listener for every dialog and sheet, the Workshop's included. The press must start and end on
 * the backdrop: a drag that starts inside the dialog (its padding too) and ends outside does not
 * close it. A full-screen dialog (the title, the Workshop) has no backdrop to tap.
 */
let down: { on: EventTarget | null; x: number; y: number } | null = null;
const inside = (d: Element, x: number, y: number): boolean => {
  const r = d.getBoundingClientRect();
  return x >= r.left && x < r.right && y >= r.top && y < r.bottom;
};
document.addEventListener('pointerdown', e => { down = { on: e.target, x: e.clientX, y: e.clientY }; }, true);
document.addEventListener('click', e => {
  const d = e.target;
  if (!(d instanceof HTMLDialogElement) || !d.open || down?.on !== d || e.detail === 0) return;
  if (inside(d, down.x, down.y) || inside(d, e.clientX, e.clientY)) return; // pressed or released on its own padding
  if (d.dispatchEvent(new Event('cancel', { cancelable: true }))) d.close();
});
