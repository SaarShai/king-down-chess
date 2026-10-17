/**
 * Whether a control shows in full: in the safe area above the host composer and inside each clipping parent.
 * `locator.evaluate(controlBounds)` measures one control. `locator.evaluateAll(controlBounds, true)` measures a list in
 * one page call: before it measures a control, it scrolls the control as Playwright's scrollIntoViewIfNeeded does
 * (only when the control is out of view, to the centre of each scroll box on each axis, at once).
 */
export function controlBounds(el, scroll = false) {
  if (Array.isArray(el)) return el.map(item => controlBounds(item, scroll));
  if (scroll) el.scrollIntoViewIfNeeded(true);
  const r = el.getBoundingClientRect(), css = getComputedStyle(document.documentElement);
  const safe = edge => parseFloat(css.getPropertyValue(`--safe-${edge}`)) || 0;
  const limit = innerHeight - Math.max(safe('bottom'), innerWidth >= 900 ? 128 : 96);
  let accessible = r.left >= safe('left') - 1 && r.right <= innerWidth - safe('right') + 1 && r.top >= safe('top') - 1 && r.bottom <= limit + 1;
  for (let p = el.parentElement; p; p = p.parentElement) {
    const style = getComputedStyle(p), box = p.getBoundingClientRect();
    if (/(auto|scroll|hidden|clip)/.test(style.overflowY)) accessible &&= r.top >= box.top - 1 && r.bottom <= box.bottom + 1;
    if (/(auto|scroll|hidden|clip)/.test(style.overflowX)) accessible &&= r.left >= box.left - 1 && r.right <= box.right + 1;
  }
  return { accessible, text: el.textContent || el.getAttribute('aria-label'), rect: [r.x, r.y, r.width, r.height], limit };
}
