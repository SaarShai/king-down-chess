// Read the text that the board canvas draws, after its CSS scale.
export async function recordBoardText(page) {
  await page.addInitScript(() => {
    window.boardText = {};
    const fill = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function(text, x, y, ...rest) {
      if (this.canvas.parentElement?.id === 'board') {
        const scale = this.canvas.getBoundingClientRect().width / this.canvas.width;
        const font = Number(this.font.match(/([\d.]+)px/)?.[1] ?? 0);
        const transform = this.getTransform(), glyph = this.measureText(text);
        window.boardText[text] = { font: this.font, glyphHeight: (glyph.actualBoundingBoxAscent + glyph.actualBoundingBoxDescent) * transform.d * scale, size: font * transform.a * scale, bottom: ((y + this.measureText(text).actualBoundingBoxDescent) * transform.d + transform.f) * scale, height: this.canvas.getBoundingClientRect().height };
        if (this.font.includes('bold')) window.boardText[`bold:${text}`] = window.boardText[text];
      }
      return fill.call(this, text, x, y, ...rest);
    };
  });
}

export const boardText = (page, text) => page.evaluate(text => window.boardText[text], text);
