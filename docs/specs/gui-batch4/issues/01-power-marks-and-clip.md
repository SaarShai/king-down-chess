# Power marks, the Guide clip and the Home still after a turn

Status: ready-for-human (the owner approves the rendered sample)

Light theme, web app.

- **Home after a turn.** When the film ends after a turn, its last frame stays until the still for the new shape is ready (`home-reveal.ts`). If that still cannot load, or the device turns back, the film ends on the picture that it has.
- **Guide clip.** The figure of a piece or king entry plays its first idle clip one time, about 400 ms after the player opens the entry (`portrait-idle.ts`, `playFigure` in `guide.ts`). The clip lies over the still, so the layout does not move. The code and the figure package load at that time only. Reduced motion, the list, the default entry of a wide screen and a reload play nothing.
- **Power marks.** Each power has its own mark (`public/ui/powers/`, 128 px, 173 kB together; `power-mark.ts` is the one map). It is the hand coin of both players, the picture of a power in the reader (64 px; a short reader drops it) and the picture before the power name in the Guide. The rim of the mark is the ring of the coin; the notches hang on the rim. The king emblem stays where a king shows.

Tests: `home-reveal.test.ts`, `portrait-idle.test.ts`, `guide-rule.test.ts`, `power-mark.test.ts`, `offline-build.test.ts`; `home_resize` in `verify-next-menus.mjs`.
