# King Down trailer — motion direction

The standard every shot is built and reviewed against. The tools are in `engine/motion.mjs`: curves, keys, springs, speed ramps, camera, particles, optics and the character-name reveals. You can try the reveals in `engine/lab.html?style=arrow|bite|scan|shove|stand`.

## Principles

1. **Every move has a cause.** Nothing drifts for the sake of drifting. The camera leans *into* a hit; a name appears *because* of the action (the Archer's bolt writes ARCHER, the Beast's jaws chomp BEAST shut). If a motion has no motivation, cut it.
2. **Contrast makes speed.** The fast parts feel fast only next to slow parts. Build each beat as *hold → wind-up → strike → hang → release*: stillness, a small move back (anticipation), a very fast move, a moment frozen at the peak, then a long, soft settle.
3. **Ease like a professional.**
   - `ease.out` (fast start, long settle) is the default for anything arriving.
   - `ease.in` is only for things gaining speed *into* an impact.
   - `ease.inOut` is for camera moves.
   - `spring` is for things that land and settle (names, cards, pieces), `ring` for recoils and wobbles, and `ease.anticipate` for wind-ups.
   - Linear motion is for light and projectiles only.
4. **Impacts are events, not motion.** On an impact frame, stack in 2–4 frames:
   - a camera shake (`camera` shakes, trauma decays);
   - a flash (`flash`, 1–2 frames);
   - colour fringing (`aberration`, 4–10 px, gone within ~0.15 s);
   - sparks or dust (`sparks`, `dust`, `shockwave`);
   - a sound cue at the same timestamp (`titleHits` lists the hits).

   Never put two big impacts closer than ~0.35 s unless they belong to one chain.
5. **Speed ramps, not constant slow motion.** Use `remap` to run real time → melt into slow motion just before contact → hold near-frozen at the peak → snap back to real time. That is the language of every great action trailer.
6. **Depth is motion too.** Use camera parallax (`cam.apply(g, t, depth)`): the foreground moves more than the background, and dust or embers in front of the subject sell the space. Rack focus by blurring what the camera is not about.
7. **Light moves.** Every shot has at least one moving light: a flare on a blade, a sweep across gold, a torch flicker, a projector beam. Static lighting reads as a slideshow.
8. **Secondary motion keeps things alive.** Figures breathe (`drawFigure` breathe). Cloth and hair keep moving after the body stops. Embers drift through everything. Nothing on screen is ever perfectly still, except the Guard's name, on purpose.
9. **Restraint.** Let big moments breathe: after a hit, hold 8–15 frames before the next action. The eye needs time to read a name. Keep the gilded name on screen at least 1.2 s after it settles.
10. **Rhythm.** Cut and hit on a **120 BPM grid** (0.5 s beats, 0.25 s half-beats) until the music is chosen; hits then snap to the real track. Timings are data in `timeline.mjs` and the shot configs, so retiming is cheap.
11. **One frame language.** The same film finish on every shot (`finish`: grain, vignette, 2.39:1 bars). A warm/cool grade (`grade`), bloom on highlights (`bloom`). Motion blur in the final render (`render-trailer.mjs --blur 4`).

## Transitions

Every cut lands on a beat. A hard cut is the default; motion carries across it (match on action).
- **Wake → Archer:** the contact frame, then a hit-stop of two impact frames (the duel as flat silhouettes: light on black, then ink on paper), then black with the eye's afterimage of the duel fading (`wake.mjs` `CUT`). The Archer opens hard on the boom: a 2-frame flash, no whip.
- **Intro → intro:** each intro ends on its resume impact and whips out (about 0.15 s, directional smear). The next intro whips in from the same direction. The directions alternate.
- **Guard → montage:** a whip.
- **Kings → title:** the kings end in pure white. The title opens in the same white (drawn after `finish`, so no vignette) and clears from the edges inward.

## The name reveals (signature moments)

| Piece | Style | What happens |
|---|---|---|
| Archer | `arrow` | Her bolt crosses the frame as a white-hot streak with a lens flare. Each letter ignites as the tip passes, then cools to gold with a few sparks. |
| Beast | `bite` | Each letter is a pair of jaws with a toothed seam. The halves snap shut one after another, like the chain bite, with a white flash and red sparks on each chomp. |
| Maester | `scan` | A turquoise scan line draws the name as a glowing blueprint with guide lines and measurement ticks. Then gold floods it left to right behind a flare. |
| Ogre | `shove` | The name is rammed in from the left as one heavy block, smeared by its speed. It stops dead; a compression wave squashes the letters from right to left, then springs back; dust bursts off the leading edge. |
| Guard | `stand` | The name is already there in cold dark steel. The storm tears past and bends around it (a barrier shimmer shows where it strikes), and the letters barely tremble. Then a cold flare runs across the name and turns it to gold. |

All five settle into the same gilded name with its ornamental rule. That is the brand frame.

## Review checklist

A reviewer renders frame strips and short clips of the shot (`node tools/render-trailer.mjs`, which serves `docs/` itself) and checks:
1. Does every move have a cause, and a clear hold → wind-up → strike → hang → release?
2. Are curves right, with no linear or robotic motion except light and projectiles?
3. Do the impacts stack shake, flash, fringe, particles and hold, on the beat grid?
4. Is there moving light and living secondary motion, with nothing dead-still (except the Guard's name)?
5. Are the in-between frames clean, with no pops, clipping, letterbox collisions, teleports or flicker?
6. Does it read at a glance at 1080p, with one focal point per moment?
7. Is it restrained, so the big moments have room to breathe?
