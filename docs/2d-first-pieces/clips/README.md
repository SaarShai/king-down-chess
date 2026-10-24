# Character clips

A clip is a short series of whole painted drawings. A selected figure plays his clip once, then he breathes as before. Two clips have the owner's approval:

- **Knight lance tap** (`knight/tap.webp`): the banked nine-drawing version, 18 ticks at 24 fps, 750 ms.
- **Rook slam** (`rook/slam.webp`): the stone arm lifts, slams, cracks and heals. 26 drawings, 120 ticks at 60 fps, 2 s.

With reduced motion or Motion Off, no clip plays. The still figure shows at once. Each clip ends on the drawing it starts with.

## Files

- `clips.mjs`: the clip table, the drawing at a time (`frameAt`) and the cell draw (`drawFrame`). `board/scene.mjs` uses it for the selected figure; `scene.clip` reports the drawing of the last frame for checks.
- `frames.mjs`, `provenance.json`, the two atlases: written by `build.mjs`. Do not edit them by hand.
- `clips.test.mjs`: each clip plays once through every drawing, ends, plays again on a new selection, and does not play under reduced motion.
- Browser check: `npm run check:browser character-clips` (`tools/verify-character-clips.mjs`). It also saves key drawings and a video.

## Build

```sh
node docs/2d-first-pieces/clips/build.mjs <samples folder>
```

The samples folder holds the reviewed sample sheets and manifests (`knight-tap-frames-v2.*`, `rook-slam-hq.*`). By default it is `docs/specs/character-animation-samples/preview/assets`. `provenance.json` records the SHA-256 of each source sheet.

The script does not repaint a drawing. It fits one scale and one translation for each clip: the clip's rest drawing against the board's still sprite. It mirrors the Rook as the board does. Each drawing keeps the registration anchor of its sample manifest. The atlas stores each drawing at 0.36 of sprite size, which is more than the board's largest display needs.

The samples are Ivory only. The Charcoal drawings are the Ivory drawings through a colour map. The map comes from the board's two painted armies: for each Ivory colour, the mean Charcoal colour at the same place. `provenance.json` records the map's mean error against the painted Charcoal still. The map cannot tell two parts with the same Ivory colour apart: the Charcoal Knight's cape comes out lighter than the painted cape.

## Known limits

- The Rook slam drawings are a redrawn Rook. Face, skin colour and proportions differ from the board's Rook, so the figure changes when the clip starts and ends.
- The Knight drawings are close to the board's Knight, but small drawing changes remain between them.
