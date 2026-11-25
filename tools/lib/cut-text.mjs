/** In the page: text that a clipping box cuts, and words that break over two lines. A scroll box can show its text. */
export function cutText(suffix = '') {
  const out = [], modal = window.playSceneModal?.(), walk = document.createTreeWalker(modal ?? document.body, NodeFilter.SHOW_TEXT), range = document.createRange();
  const name = node => `${node.tagName.toLowerCase()}${node.className && typeof node.className === 'string' ? `.${node.className.trim().split(/\s+/).join('.')}` : ''}`;
  textNodes: for (let text; (text = walk.nextNode());) {
    const host = text.parentElement, words = text.textContent.trim();
    if (!words || host.closest('[inert], [aria-hidden="true"], script, style') || modal && !modal.contains(host) || !host.checkVisibility({ visibilityProperty: true })) continue;
    range.selectNodeContents(text);
    // Each line, less a quarter of its height at the top and the bottom: a tall font box may pass its line box.
    let lines = [...range.getClientRects()].filter(r => r.width >= 2 && r.height >= 2).map(r => ({ left: r.left, right: r.right, top: r.top + r.height / 4, bottom: r.bottom - r.height / 4 }));
    if (!lines.length) continue;
    for (let node = host; node && node !== document.body; node = node.parentElement) {
      const style = getComputedStyle(node), edge = node.getBoundingClientRect();
      if (edge.width <= 2 && edge.height <= 2 && style.clipPath === 'inset(50%)') continue textNodes;
      if (edge.width <= 2 || edge.height <= 2) break; // a text for screen readers only
      if (/auto|scroll/.test(style.overflowX + style.overflowY)) { lines = [edge]; continue; }
      // The closed History shows its newest record as a one-line preview; the open History and the button's name hold it in full.
      if (node.matches('.play-history-record')) { lines = [edge]; continue; }
      // A box that draws an ellipsis cuts its text at the first part of a pixel.
      const slack = style.textOverflow === 'ellipsis' ? .05 : 1;
      if (/hidden|clip/.test(style.overflowX + style.overflowY) && lines.some(box => box.left < edge.left - slack || box.right > edge.right + slack || box.top < edge.top - 1 || box.bottom > edge.bottom + 1)) { out.push(`text "${words.slice(0, 40)}" is cut by ${name(node)}${suffix}`); break; }
    }
    // The browser can wrap at a hyphen. Check the parts between legal breaks.
    for (const word of text.textContent.matchAll(/[^\s\u00ad\u2010-]+/g)) {
      range.setStart(text, word.index); range.setEnd(text, word.index + word[0].length);
      if (new Set([...range.getClientRects()].filter(r => r.width > 0).map(r => Math.round(r.top / 4))).size > 1) {
        const king = host.closest('.king-block')?.getAttribute('aria-label');
        out.push(`word "${word[0]}" breaks over two lines in ${name(host)}${king ? ` (${king})` : ''}${suffix}`);
      }
    }
  }
  // A capture count in the opponent bar leaves room for a two-digit count (10 or more) without cutting the name or the count.
  const store = !suffix && document.querySelector('.play-opp .play-store[data-empty="false"]');
  if (store) {
    const before = store.textContent;
    try { store.textContent = '10'; out.push(...cutText(' with 10 captures')); }
    finally { store.textContent = before; }
  }
  return out;
}
