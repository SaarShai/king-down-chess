export function controlBounds(el) {
  const r = el.getBoundingClientRect(), css = getComputedStyle(document.documentElement);
  const safe = edge => parseFloat(css.getPropertyValue(`--safe-${edge}`)) || 0;
  const limit = innerHeight - safe('bottom') - (innerWidth >= 900 ? 128 : 96);
  let accessible = r.left >= safe('left') - 1 && r.right <= innerWidth - safe('right') + 1 && r.top >= safe('top') - 1 && r.bottom <= limit + 1;
  for (let p = el.parentElement; p; p = p.parentElement) {
    const style = getComputedStyle(p), box = p.getBoundingClientRect();
    if (/(auto|scroll|hidden|clip)/.test(style.overflowY)) accessible &&= r.top >= box.top - 1 && r.bottom <= box.bottom + 1;
    if (/(auto|scroll|hidden|clip)/.test(style.overflowX)) accessible &&= r.left >= box.left - 1 && r.right <= box.right + 1;
  }
  return { accessible, text: el.textContent || el.getAttribute('aria-label'), rect: [r.x, r.y, r.width, r.height], limit };
}
