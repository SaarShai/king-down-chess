/**
 * The card coins' images beside their coin boxes, measured in one page call against a root that a redraw keeps.
 * A measure that finds the images first and runs a second page call later (`locator.evaluateAll`) loses them when the
 * board redraws in between: `strips()` replaces each strip's content (`strip.innerHTML = ...`), so a found image is
 * detached and measures 0 × 0. `#game-table` survives a redraw; its images are found inside the same call as the
 * measure. A face is centred when the two gaps on each axis match (x and y are 0). Pass a frame or a page locator.
 */
export function cardFaces(scope) {
  return scope.locator('#game-table').evaluate(table => [...table.querySelectorAll('.card-coin img')].map(image => {
    const round = value => Math.round(value * 100) / 100;
    const coin = image.parentElement.getBoundingClientRect(), face = image.getBoundingClientRect();
    return {
      side: image.closest('.player-strip').id, coin: round(coin.width), image: round(face.width),
      x: round((face.left - coin.left) - (coin.right - face.right)), y: round((face.top - coin.top) - (coin.bottom - face.bottom)),
    };
  }));
}
