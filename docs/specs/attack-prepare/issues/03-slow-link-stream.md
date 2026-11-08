# Slow link: the painted motion plays, not the still picture

Status: ready-for-human
Type: task

## Fault

Live release 16, Chromium 1280x800, 1.6 Mbps and 150 ms latency. When the art of a move is not decoded 1 s after
the click, `prepare()` returns null. The figure stands still for 1 s, then its still picture slides to the target:
no turn, walk or attack gesture. Seen on King captures, Archer shots, Pawn walks and a Maester capture. Evidence:
`~/kd-runs/look-r16/slow-link/`.

## Causes

1. The click ends the selection before the move prepares. `releaseMovePrefetch()` cancelled the selection's
   requests that were already on the network, then `prepare()` asked for the same frames again. A King capture
   lost its first six attack frames this way.
2. At the 1 s limit, a start frame that was still loading made `prepare()` return null. A King capture needs
   27 to 34 frames (545 to 912 KB) before it starts, which a 1.6 Mbps link cannot load in 1 s.
3. A capture's separate effect (the Archer's arrow, 1.1 MB of PNG) started to load only at the click.

## Change

- `releaseMovePrefetch()` keeps the requests already on the network. The next `prepare()` takes them over; a load of
  higher priority still cancels the others. `prepare()` queues all its requests before the loader runs.
- At the limit, a start or walk frame that is still loading streams during play. The clock holds the last decoded
  frame before it, also across turn parts, and an attack holds the turn's last pose. A failed frame, or an undecoded
  first pose, still gives the still picture.
- The selection prefetch also loads the capture's separate effect.

## Checks

- Unit tests: kept requests, a streamed capture and walk, the effect with the selection.
- Browser checks `character-prepare` (now a streamed walk) and `king-capture-facing` pass.
- Slow link (1.6 Mbps, 150 ms), live against the local build. King h1xg2: both start at about 1 s; live draws no
  turn or attack frame, the build draws the turn and attack banks. Archer d4xd6 after a 7 s selection: live slides
  the still picture after 1113 ms, the build plays the painted shot after 460 ms.

## Open

- An Archer shot within about 5 s of selection on a 1.6 Mbps link still slides the still picture: its effect PNGs
  (1.1 MB) cannot load in time. WebP effect art would fix it.
- The start still waits up to 1 s on a slow link.
