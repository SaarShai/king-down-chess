# Home fills a desktop window

Status: ready-for-human (the owner approves the rendered sample)

On a desktop window the Home painting used about two thirds of the width, with empty paper round it. Now the painting fills the window, edge to edge (`object-fit: cover`, top centre: the two kings stand in the top corners and stay whole at 3:2 and wider).

- Gate: `(min-width: 1200px) and (min-aspect-ratio: 3/2) and (hover: hover) and (pointer: fine)` in `menus.css`. Phones, tablets (an iPad in landscape is under 3:2) and touch screens keep the old layout. The 390x844 and 768x1024 Home pictures have 0 changed pixels.
- The title sits between the kings on a gilt vellum plate. The utility buttons and the actions sit at the lower right; the actions are one gilt vellum panel, so the quiet actions ("New game", "Play a friend") also have a ground.
- One grid cell holds the painting, the buttons and the panel: a tall saved-game panel makes the painting taller, and nothing is clipped. No positioned pseudo-element, no gradient over a large box; the masks are off on desktop.
- The film plays once, full window, under the same framing; the title plate is hidden while it plays and fades in at `ended` (`home-reveal.ts` does not change).

Contrast (text hidden, the ground behind it sampled, WCAG, worst pixel): title 12.85:1, Guide 8.24:1, Sign in 9.34:1, setup line 5.45:1, Play a friend 5.64:1, intro 5.64:1 (1280x800; 1920x1080 is the same or better).

Check: `next-menus` case `home_wide` (each size: the painting fills the window only at the desktop gate; each control is 44 px high and inside the window).
