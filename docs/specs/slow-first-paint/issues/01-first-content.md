# 01 Slow first content

Status: resolved
Branch: fix-slow-first-paint

## Fault

On Slow 3G (2000 ms latency, 400 kbit/s) at 390x844, the game page shows empty parchment for 80 to 90 s. No line says that it loads. The table stays hidden until `view.ready()`, and the only loading text is in a hidden source box. While the board waits for the stone and the still figures (about 2 MB), other pictures share the link: the title pictures (also when the title does not open), the New game emblems, the effect atlases, the king ground layers and the fallen figures.

## Change

1. `index.html`: a styled line, "Loading the board…", shows from the first paint until the class `local-ready`.
2. The title pictures and the New game emblems load lazily: a closed dialog does not load them.
3. `src/render/painted/after-board.mjs`: effect atlases (fire, clouds, swap bells), king ground layers and fallen figures start to load when the scene's first load ends (also on a failed picture). The animated frame banks already load after the board.

## Verification

Chromium, Slow 3G, 390x844, service worker off, a full board (`?fen=` with all piece kinds), title skipped. The same `vite preview` server for the two builds.

| Build | Loading line | First contentful paint | Board ready | MB before ready |
| --- | --- | --- | --- | --- |
| origin/main 1f7fe166b | none | 88.5 s | 88.5 s | 3.18 |
| this branch | 2.1 s | 2.1 s | 59.6 s | 2.44 |

Fast link, Chromium and WebKit: the effect atlases and fallen figures load after the board; the title opens with 19 of 19 pictures; the loading line hides and the table shows.

Not done: the still figures stay about 2 MB, so the board needs about 60 s on Slow 3G. Smaller first stills (for example half-size copies of the sheets, drawn until the full sheet loads) can cut this further (not measured).
