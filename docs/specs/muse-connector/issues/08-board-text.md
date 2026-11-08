# Choose how the board shows without a widget

Type: grilling
Status: resolved
Blocked by: 03
Parent: [Muse connector map](../map.md)
Labels: wayfinder:grilling

## Question

How does the user see the position when Muse may show only text, and may speak it?

## Answer

Layers in each result, decided 2026-11-08.

1. A status line of at most 20 words that Muse can speak unchanged: your colour, the move number, whose turn, check.
2. The last moves as sentences (the screen-reader text of `src/move-text.ts`).
3. Piece lists by side in one fixed order.
4. An 8×8 letter grid with a legend for the fairy letters, for screens.
5. A link to the game on kingdown.dev, as extra navigation only.

No picture and no widget in version 1: no source shows that Muse displays them. The custom-connector test ([ticket 12](12-custom-test.md)) checks images, links and monospace text.
