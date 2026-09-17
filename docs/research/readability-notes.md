# Readability notes (digest of the sprite-style sub-survey, 2026-09-13)

Verified points that apply to our "pieces overlap and look alike" problem. Full sources were in the agent transcript; the load-bearing ones are linked.

## Mechanisms shipped games use to keep units legible on a grid
1. **Owner-colour outline when obstructed** — Age of Empires II SLP command `0x4E` draws a team-coloured outline around a unit hidden behind buildings/trees; carried into the DE formats as a first-class layer. The only mechanism documented *as* a readability feature. → Draw an army-coloured rim on any piece whose base is covered by a piece in front (depth test against the row in front), or always.
   https://github.com/SFTtech/openage/blob/master/doc/media/slp-files.md
2. **Dedicated shadow layer** at fixed opacity (AoE2 shadow palette; HoMM3 reserves indices 1–4 for 25 %/50 % shadow). → A soft contact shadow under every piece grounds it and separates it from the piece behind.
3. **Team colour as a shaded ramp, never a flat fill** (AoE2 16-entry blocks, HoMM3 32-entry owner ramp, Infinity Engine 7×12 ranges with auto-blended seams). → Army colour = luminance ramp of the sculpt, not one flat colour; accents shared across armies carry piece identity.
4. **Outlines are dark but not black**: Octopath / Triangle Strategy / Live A Live use RGB(24,24,24) with hue-shifted darks on warm regions; Tactics Ogre Reborn softens to (48,40,32). Triangle Strategy's pixel artist: darkest outline "is not pure black". https://www.ndw.jp/trianglestrategy_pixelart-interview/
5. **Silhouette + one accent, state in overlays** — Into the Breach puts ~42×36 px mechs on an 8×8 board and moves every tactical fact into arrows, tile highlights and animated tooltips ("sacrifice cool ideas for the sake of clarity every time"). https://www.gamedeveloper.com/design/-i-into-the-breach-i-dev-on-ui-design-sacrifice-cool-ideas-for-the-sake-of-clarity-every-time-
6. **Boss silhouette trick (Live A Live)**: two enlarged copies of the sprite stacked behind it to thicken the contour; grid shadow doubles as the occupied-tile display. https://gamemakers.jp/article/2023_02_21_30973/

## Numbers
- Readable tactics unit on a rotatable grid (Triangle Strategy): ~19×38 px, 29–48 colours per frame, 8 directions drawn for only 4 heroes (cost).
- Battle-scale pixel character (Octopath): ~34×51–56 px; Tactics Ogre Reborn redrew at ~64×104 on an effective 2× grid.
- Shades per material: 3 is the standard, 5 the max (Derek Yu: base + 2 dark + 2 light); whole characters land at 20–35 colours.
- Below ~50 px tall: fewer details, more contrast, fewer close colours (Kiwi, 2dwillneverdie).

## What we take from it
- Cel style: army luminance ramp + shared accents + not-quite-black rim (24,24,24) + contact shadow; army-coloured rim for overlapped pieces; optional letter labels; keep tactical state (legal squares, shots, chains) as tile overlays.

## three.js specifics (from the 3D-realtime sub-survey, verified against r186 source)
- `MeshToonMaterial.gradientMap`: only the red channel is read; `dotNL` is remapped [-1,1]→[0,1] so the **middle texel is the terminator** — a 3-texel ramp reads as 2 bands; hand-write non-linear ramps (e.g. `[0,0,0,90,200,255,255,255]`) for deep flat shadow + tight terminator. Keep `colorSpace` at `NoColorSpace` (default); sRGB crushes band positions. Ambient light is plain Lambert (not banded); light intensity >1 flattens bands.
- `RenderPixelatedPass(pixelSize, scene, camera, {normalEdgeStrength, depthEdgeStrength})` uses `||` for defaults: passing `0` silently becomes 0.3/0.4 — set the properties after construction (we do). Depth edges darken (multiply), normal edges lighten; it never draws an ink line, hence hull outlines for dark pieces.
- The pass has no camera snapping: with orbit at pixel size ≥2 the grid swims; the official example's `pixelAlignFrustum` (shift the ortho frustum by the sub-pixel remainder, save→render→restore) fixes it. Not needed at pixel size 1.
- Inverted hull pitfalls: split/hard normals tear the hull (extrude along smoothed normals), non-uniform scale distorts it, keep it opaque + depth-writing, open geometry has no hull, hull = silhouette only (creases need the post-process). `examples/jsm/effects/OutlineEffect.js` is a ready inverted hull with clip-space thickness (WebGLRenderer only).
- Cel references: Guilty Gear Xrd and Hi-Fi Rush both use **2 bands** (hard step) with inverted-hull (GGXrd) or split depth/normal post-process outlines (Hi-Fi Rush); A Short Hike = low-res target + flat shading + soft outline, user-adjustable pixel size.
