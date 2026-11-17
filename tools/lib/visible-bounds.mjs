import assert from 'node:assert/strict';

/** Required text and controls fit their own box and every clipping ancestor. Hidden content fails. */
export async function visibleBounds(page, selector, control = false) {
  const rows = await page.locator(selector).evaluateAll((nodes, control) => nodes.map(node => {
    const box = node.getBoundingClientRect(), clips = [{ left: 0, top: 0, right: innerWidth, bottom: innerHeight }];
    let visible = box.width > 0 && box.height > 0;
    for (let parent = node; parent; parent = parent.parentElement) {
      const css = getComputedStyle(parent), r = parent.getBoundingClientRect();
      visible &&= css.display !== 'none' && css.visibility === 'visible' && css.opacity !== '0';
      if (/(hidden|clip|auto|scroll)/.test(css.overflowX + css.overflowY)) clips.push({
        left: css.overflowX === 'visible' ? 0 : r.left + parent.clientLeft,
        right: css.overflowX === 'visible' ? innerWidth : r.left + parent.clientLeft + parent.clientWidth,
        top: css.overflowY === 'visible' ? 0 : r.top + parent.clientTop,
        bottom: css.overflowY === 'visible' ? innerHeight : r.top + parent.clientTop + parent.clientHeight,
      });
    }
    const rects = [], walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      if (!walker.currentNode.textContent.trim() || walker.currentNode.parentElement.closest('.kd-sr')) continue;
      const range = document.createRange(); range.selectNodeContents(walker.currentNode);
      rects.push(...[...range.getClientRects()].map(r => ({ left: r.left, right: r.right, top: r.top, bottom: r.bottom })));
    }
    const inside = (r, c) => r.left >= c.left - 1 && r.right <= c.right + 1 && r.top >= c.top - 2 && r.bottom <= c.bottom + 2;
    return { text: node.textContent, visible, box: box.toJSON(), clips, rects, target: !control || box.width >= 44 && box.height >= 44,
      fits: (control ? [box] : rects).every(r => clips.every(c => inside(r, c))) && rects.every(r => inside(r, box)) };
  }), control);
  assert(rows.length, `${selector}: required content exists`);
  for (const row of rows) assert(row.visible && row.target && row.fits, `${selector}: visible bounds ${JSON.stringify(row)}`);
}
