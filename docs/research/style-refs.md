# Reference styles from the designer (2026-09-13, round 2)

Three screenshots, one look each. Traits below are what the eye picks up; the engine knobs are how we reproduce them.

## A — "Chunky outlined tactics" (`ref-a-chunky.png`)
- Big pixels (about 3 screen px per art pixel at 1080p), saturated flat colours, almost no gradients.
- A 1-art-pixel near-black outline on every object: units, trees, rocks, **and the terrace/tile edges**.
- Terrain = stacked flat blocks with a lighter top and a darker side face; no texture, no noise.
- Even bright light, no cast shadows; unit state as overlays (yellow tiles, health bars, outlined selection).
- UI: dark panels, bold pixel type, cards with thick frames.
- Engine: pixelSize 3, toon 2 bands, hull outline 1 art px, tile blocks with a dark edge ring, no dither, optional saturated 32-colour palette.

## B — "Painterly dungeon" (`ref-b-dungeon.png`)
- Small pixels (about 2 screen px), painterly shading with 5+ tones per material, hand-placed detail (cracks, webs, skulls).
- No outlines; figures separate from the floor by value contrast and a soft shadow.
- Dark ambient with warm point lights (torches) and a vignette; floor = textured stone tiles with a visible grid.
- Camera: high top-down, ~60° elevation, straight on (no diagonal).
- Engine: pixelSize 2, lambert, no hull outline, textured tiles (Drive `board/` tile JPGs), dim hemisphere + 4 warm point lights, contact shadows, dither on.

## C — "Iso pixel" (`ref-c-iso.png`, Pathway-like)
- True isometric: 45° azimuth, ~30° elevation, orthographic.
- Warm limited palette (~32 colours), dithered ground, 1-art-pixel darker outline only on silhouettes.
- Terrain as chunky blocks with visible side faces; small figures (~32–40 art px tall).
- Engine: pixelSize 3, palette on (warm ramp), hull outline, iso camera, tall board block with side faces, sprites or voxels.

## Options built for the style board (round 2)
| Key | Base | Pieces | Notes |
|---|---|---|---|
| chunkyVoxel | A | painted voxels | pixel 3, tile edges, 2-band toon |
| chunkySprite | A | painted sprites + thick outline | pixel 3, tile edges |
| chunkyPalette | A | painted voxels | + Endesga-32 palette |
| dungeonSprite | B | painted sprites | stone textures, torch lights, dark |
| dungeonVoxel | B | painted voxels | same board and lights |
| dungeonBright | B | painted sprites | stone textures under our bright paper lighting |
| isoVoxel | C | painted voxels | iso camera, warm palette, outline |
| isoSprite | C | painted sprites | iso camera, warm palette |
| isoClean | C | painted voxels | iso camera, no palette |
