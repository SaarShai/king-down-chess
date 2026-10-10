import assert from 'node:assert/strict';

/** A full turn stays in Moves; short phones hide whole optional rows. */
export async function assertHiddenDetail(page) {
  const layout = await page.locator('#context-text').evaluate(text => {
    const rows = [...text.children], detail = rows[1], style = getComputedStyle(text);
    const clone = text.cloneNode(true);
    clone.style.cssText = `position: fixed; visibility: hidden; width: ${text.clientWidth}px; max-height: none; height: auto;`;
    [...clone.children].forEach(row => { row.hidden = false; });
    document.body.append(clone);
    const fullHeight = clone.scrollHeight;
    clone.remove();
    const box = text.getBoundingClientRect(), area = document.getElementById('context-line').getBoundingClientRect();
    return { text: text.textContent, width: text.clientWidth, fullHeight, lineHeight: parseFloat(style.lineHeight), maxHeight: parseFloat(style.maxHeight),
      detailHidden: detail.hidden, summaryHidden: rows[0].hidden,
      whole: rows.filter(row => row.checkVisibility()).every(row => {
        const range = document.createRange(); range.selectNodeContents(row);
        return [...range.getClientRects()].every(r => r.top >= box.top && r.bottom <= box.bottom && r.top >= area.top && r.bottom <= area.bottom);
      }),
      fits: text.scrollHeight <= text.clientHeight + 1 && box.bottom <= document.getElementById('moves-line').getBoundingClientRect().top,
    };
  });
  assert.ok(layout.fullHeight >= 4 * layout.lineHeight, `the full turn needs at least four lines: ${JSON.stringify(layout)}`);
  assert.ok(Number.isFinite(layout.maxHeight) && layout.maxHeight <= 3 * layout.lineHeight, 'short phones limit Previously to three lines');
  assert.equal(layout.detailHidden, true, 'the full detail row hides when it does not fit');
  assert.equal(layout.summaryHidden, false, 'the summary stays');
  assert.ok(layout.whole && layout.fits, 'visible rows have whole glyphs above Moves');
}
