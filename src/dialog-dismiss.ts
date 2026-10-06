/**
 * A tap or click outside a modal dialog closes it, as Escape does: the dialog gets a cancelable
 * `cancel` event first, so a dialog that handles Escape (or refuses it) handles this the same way.
 * One listener for every dialog and sheet, the Workshop's included. The press must start and end on
 * the backdrop: a drag that starts inside the dialog and ends outside does not close it. A full-screen
 * dialog (the title, the Workshop) has no backdrop to tap.
 */
let downOn: EventTarget | null = null;
document.addEventListener('pointerdown', e => { downOn = e.target; }, true);
document.addEventListener('click', e => {
  const d = e.target;
  if (!(d instanceof HTMLDialogElement) || !d.open || downOn !== d || e.detail === 0) return;
  const r = d.getBoundingClientRect();
  if (e.clientX >= r.left && e.clientX < r.right && e.clientY >= r.top && e.clientY < r.bottom) return; // its own padding
  if (d.dispatchEvent(new Event('cancel', { cancelable: true }))) d.close();
});
