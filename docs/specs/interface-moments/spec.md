# Painted moments for Daylight

Launch decisions 43, 53, 55, 61 and 136 and Daylight decision P19 apply.
The 22 collapse sheets and 12 bow sheets in `public/moments/painted/`
come from the launch moments copy. Each WebP keeps the source alpha,
frame times, feet point and body height. `painted.json` names each sheet.
The launch pack and alpha audit are in `runs/tools/moments2/` in the design project.

## Playback

The join calls `playCollapse(piece, army, target)` at contact and
`playBow(king, army, target)` when the last move lands. It supplies a
positioned layer and measures the figure in layer CSS pixels.
The bottom centre of the rectangle is the feet point. Supply the current
body height in pixels. For pawn, bishop and archer, pass the current pose
and its rectangle as `from`. Hide the old figure in `onReady`, when the
frame player takes over. The join can supply its effect clock.

- Collapse plays for 1,100 ms, holds for 400 ms and fades for 250 ms.
- Pawn, bishop and archer dissolve from the current pose in 120 ms.
- Bow plays for 1,400 ms and keeps the last pose.
- Fast uses half the time. Reduced motion removes the taken figure
  immediately or shows only the final bow pose when the art is ready.
- `skip()` ends the effect. For a pending bow, use the fallback if the
  sheet is still loading. `dispose()` cancels playback and removes any pose.
- `finished` gives `finished`, `not-ready` or `cancelled`. Keep the
  fallback on `not-ready`.

The loader requests the index and one sheet on use. The service worker
can cache both at use. Installation does not fetch either.

See [the Daylight port ticket](issues/02-moments2.md).
