// The tap height and width at the centre lines of each visible control: the run of points that reach the control.
export const hitSizes = (root) => [...root.querySelectorAll('button, label, input:not([type=radio]):not([type=checkbox])')].filter(e => e.offsetParent && !e.closest('dialog:not([open])')).map(e => {
  e.scrollIntoView({ block: 'center' });
  const own = (p) => p?.closest('button, label, input'), r = e.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2, target = own(e);
  const run = (dx, dy) => { let n = 0; while (n < 40 && own(document.elementFromPoint(x + dx * (n + 1), y + dy * (n + 1))) === target) n++; return n; };
  return { name: e.id || e.textContent.trim().slice(0, 20), height: run(0, -1) + run(0, 1) + 1, width: run(-1, 0) + run(1, 0) + 1 };
});
