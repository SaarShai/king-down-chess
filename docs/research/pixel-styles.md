# King Down Chess — Pixel Art Style Options

Art-direction survey for the designer. Answers "pieces and board are unclear; go beyond
16-bit colouring, more pixels per piece, pick the best style".

Read `docs/research/rendering.md` §(c)–(d) first — the three.js stack, the pixelation pass,
the palette shader and the voxel asset pipeline are decided there and are not re-argued here.
This document is about **what the pixels should look like**, not how they get on screen.

**Headline: the current look is not failing because of the style. It is failing because of
six measurable faults that hit every style equally.** Fix those first (§2, §5), then
choose a style (§3–4).

---

## 1. Comparison table

Piece size is quoted as **virtual pixels of figure height** (the number that decides whether
a shape reads), not texture size.

| # | Style | Reference look | px/piece | Colours per piece | Clarity (a) | Cost (b) | Brief fit (c) | New art for 11×2 |
|---|---|---|---|---|---|---|---|---|
| **S1** | HD pixel-3D, pixel-snapped | t3ssel8r, Dead Cells' 3D stage | 48–64 | 12–20 (3 mats × 5) | ●●●○○ | ●●●●○ | ●●●●● | 0 (re-use sculpts) |
| **S2** | Pre-rendered sprites on a 3D board | Dead Cells, DKC, HD-2D | 96 (50–128) | 15–25 | ●●●●● | ●●○○○ | ●●●○○ | 22 sprites + frames |
| **S3** | Cel-shaded 3D, toon bands + hull outline | Guilty Gear Xrd, Wind Waker | 64–110 | 8–12 (2–4 bands × 3 mats) | ●●●●○ | ●●●●● | ●●●○○ | 0 (re-use sculpts) |
| **S3b** | **Toon-pixel hybrid** (4 bands + pixel 2) | — (our own) | 48–64 | 10–16 | ●●●●○ | ●●●●○ | ●●●●● | 0 (re-use sculpts) |
| **S4** | Flat-shaded voxel, **no** pixelation | Crossy Road, Cube World | 90–130 | 6–10 | ●●●○○ | ●●●○○ | ●●○○○ | 11 chunky voxel models |
| **S5** | 32-bit isometric pre-render, hi-res | Diablo 1, Fallout, AoE2 DE | 110–160 | 48–96 | ●●●●● | ●○○○○ | ●●○○○ | 22 sprites + frames |
| **S6** | PS1 / lo-fi 3D + dithering | FF Tactics, Signalis, Crow Country | 40–70 | 16–32 + dither | ●●○○○ | ●●●●● | ●●●○○ | 0 |
| **S7** | 16-bit palette-limited (**what we ship now**) | SNES tactics, DB32 | **19–35 today** | 32 shared (DB32) | ●○○○○ | — | ●●●○○ | 0 |
| **S8** | Chunky 2.5D tactics | Into the Breach, Tactics Ogre Reborn | 56–80 | 14–20 | ●●●●○ | ●●○○○ | ●●●●○ | 11 re-silhouetted models |

Cost scale: ●●●●● = under a day, ●○○○○ = 4+ weeks part-time.

**Top 3 for this game: S3b (toon-pixel) → S1 (HD pixel-3D) → S2 (pre-rendered sprites).**
Reasoning in §4. Mock-up parameters in §8.

---

## 2. Why it is unclear right now — measured, not guessed

All numbers below come from the shipped code
(`src/render/renderer.ts`, `src/render/palette.ts`, `src/render/voxels.ts`,
`public/models/*.json`) and from
`node_modules/three/examples/jsm/postprocessing/RenderPixelatedPass.js` at three 0.186.0.

### 2.1 The pieces get 19–35 virtual pixels. They need 48–64.

Camera is orthographic at `(0, 8.5, 10.5)` looking at `(0, 0.45, 0)` →
**37.5° above the horizon**, so a vertical world unit occupies `cos(37.5°) = 0.794` of a
screen unit. Vertical view extent is `9.4` world units on landscape; on portrait the code does
`vh = size / aspect`, which blows the view up to **14.5 units**.

| Context | Virtual frame | Tile | Piece height | Virtual px per model voxel |
|---|---|---|---|---|
| Desktop 1000×714, `pixelSize 2` | 500 × 357 | 38 px | **34.7 px** (pawn 26) | **0.96** |
| Phone 390×600 portrait, `pixelSize 2` | 195 × 300 | 20.7 px | **18.9 px** (pawn 14) | **0.53** |
| Target | 320–420 wide | 34–44 px | **48–64 px** | **≥ 2.0** |

Two independent failures fall out of this:

- **Below one pixel per voxel.** Every sculpt in `public/models/` is 37 voxels tall and 22–36
  voxels wide (`beast` has 9903 voxels, `guard` 9676). At 0.96 virtual px per voxel the model
  carries roughly 37 levels of detail into a 35-pixel figure — every voxel is a single pixel
  with no room for its own shade, so detail turns into aliasing noise. `LESSONS.md` already
  records "14–20 voxels read as blobs, 36 reads like the sculpt" — true at *print* resolution,
  false at 35 screen pixels. **Rule: keep model voxel height ≤ half the on-screen pixel height.**
  At 56 px on screen the right model is ~24–28 voxels, not 37.
- **On a phone the pipeline is pixelating twice.** `renderer.setPixelRatio(1)` means the
  drawing buffer is CSS-sized; on a 3× phone the browser already stretches every buffer pixel
  into a crisp 3×3 block. `pixelSize 2` on top of that makes 6-device-pixel blocks and a
  195-pixel-wide frame. **On phones `pixelSize` should be 1.**

Sanity check by eye — the miniature renders in `public/sprites/` taken to each height and
quantised to DB32 (§7 has the script): at 35 px the archer, maester and pawn are the same
smear; at 64 px the spear, the robe, the shield and the beast's jaw all read.

### 2.2 The pieces overflow their squares

`paladin` is 36 voxels wide and 37 tall; scaled to `TARGET_HEIGHT = 1.3` tiles it is
**1.27 tiles wide**. `guard` (32 w) and `maester`/`rook` (31 w) are the same. Neighbouring
pieces interpenetrate, which destroys the one cue a chess player relies on: one square, one
shape. Fit each piece to a **width budget of 0.92 tiles** and let height vary instead.

### 2.3 The outline pass cannot outline the dark army

`RenderPixelatedPass`'s edge shader ends with:

```glsl
float Strength = dei > 0.0 ? (1.0 - depthEdgeStrength * dei) : (1.0 + normalEdgeStrength * nei);
gl_FragColor = texel * Strength;
```

It is a **multiply**. Depth edges darken the pixel, normal edges brighten it. There is no
outline colour. On an indigo piece (`0x3f3f74`, relative luminance 0.059) multiplying by 0.7
gives 0.041 — an invisible outline on a dark brown tile. And `depthEdgeIndicator` only fires
where a neighbour is *further away*, so the darkening lands **inside** the silhouette, never on
the ground behind it. The dark army has, structurally, never had an outline.

### 2.4 Piece and tile colours collide

WCAG relative-luminance contrast of the shipped colours
(`LIGHT = 0xd9a066`, `DARK = 0x663931`, ivory `0xffffff/0xcbdbfc`, indigo `0x3f3f74/0x222034`):

| | vs light tile `#D9A066` | vs dark tile `#663931` |
|---|---|---|
| ivory body `#FFFFFF` | 2.29 : 1 | 9.57 : 1 |
| ivory shade `#CBDBFC` | **1.64 : 1** | 6.87 : 1 |
| indigo body `#3F3F74` | 4.22 : 1 | **1.01 : 1** |
| indigo shade `#222034` | 6.93 : 1 | **1.66 : 1** |

**1.01 : 1.** The indigo army on a dark square is the same brightness as the square. Only hue
separates them, and hue is the first thing a 2-pixel-wide shape loses. Half of every game is
played at that contrast. Fixed in §6.

### 2.5 DawnBringer-32 is the wrong palette for a 3D render

DB32 was designed for hand-placed pixels. Applied as nearest-colour to a shaded render, a
single material walks across unrelated hues: the warm ramp goes
`#663931 → #8F563B → #D9A066 → #EEC39A` while the reds sit at
`#AC3232 / #D95763 / #D77BBA`, so one lit surface speckles between brown, orange, salmon and
pink. Quantising the existing renders to DB32 vs to a bespoke 23-colour ramp with dedicated
5-step per-army ladders is not a close comparison — DB32 produces hue noise inside every flat
surface, the bespoke ramp produces flat readable regions. **The fix is a purpose-built palette
with per-material ramps, not a bigger palette.** See §6.

### 2.6 One flat colour per army is not "unpainted", it is unreadable

The sculpts are unpainted, so today every piece is one hue. Pixel artists do not work that
way: a readable figure has **2–3 dominant materials**, each with its own **3–5 step ramp**
that shifts hue as well as value. A single-hue figure at 35 px has no internal edges, so the
silhouette is carrying 100% of the information — and the silhouette is exactly what the
37-voxel model and the missing outline have already destroyed.

Two citable anchors:

- *Pixel Logic* (Michael Azzi) — "readability is the #1 priority when choosing colours" (p.79);
  limit **main** colours to 2–3 per character (p.104); a worked reduction held up from 25 to 15
  colours and **degraded below 10** (pp.81–82); **dithering hurts small sprites and hinders
  animation** (p.117). <https://michafrar.gumroad.com/l/pixel-logic>
- Pedro Medeiros / saint11 — shadows go **cooler, bluer, less saturated**; lights go **warmer,
  yellower, more saturated**. Not a value ramp, a hue-shifting ramp.
  <https://saint11.art/pixel_art_articles/article6/>

Every style below assumes **at least 3 material zones per piece**, painted as vertex colours on
the voxel model or as a 3-colour ID map, each with its own 4–5 step hue-shifted ramp.
`ditherAmount` should be **0.0** on figures this small — it is currently 0.03.

---

## 3. The styles

Each entry: references → what makes it readable → pixels per character → recipe for our
pipeline → cost for 11 pieces × 2 armies → mobile.

---

### S1 — HD pixel-3D / pixel-snapped 3D

Real-time 3D rendered to a low virtual resolution, camera and geometry snapped to the pixel
grid so nothing shimmers. Motion is fully 3D, the image is pixels.

**References**

- **t3ssel8r** — the reference implementation of the style; devlogs cover the sub-pixel camera,
  the pixel-perfect outline pass and texture-grid snapping.
  <https://www.youtube.com/@t3ssel8r>
- **David Holland, "3D Pixel Art Rendering"** — the clearest written breakdown. Renders at
  **640×360**; **1-pixel outlines** from a **4-tap** (up/down/left/right only) depth + normal
  kernel — depth gives object outlines, normals give interior edges, convex edges isolated by
  the cross product of neighbouring normal texels. His own caveat is worth quoting to the
  designer: a perfect outline shader for all models at all angles at this resolution may not be
  possible, and **low-poly models with clearly defined outer edges suit the style best** — which
  is an argument against our 37-voxel scans and for chunkier geometry.
  <https://www.davidhol.land/articles/3d-pixel-art-rendering/>
- **three.js `webgl_postprocessing_pixel`** — our exact pass, with its parameter ranges.
  <https://threejs.org/examples/#webgl_postprocessing_pixel>
- **Ebert, "Texel Splatting: Perspective-Stable 3D Pixel Art"** (arXiv:2603.14587, 2026) — the
  formal statement of why an orthographic camera is required for this style.
  <https://arxiv.org/abs/2603.14587>
- Godot community thread on sub-pixel snapping in 3D pixel art (the failure modes, catalogued):
  <https://godotforums.org/d/36180-subpixel-snapping-in-a-3d-pixel-art-game>

**What makes characters readable**

Silhouette first: the outline is a *constant colour*, not a shade of the body, so it works
against any ground. Interior reads from large flat regions — 3–4 materials, 3–5 shades each,
and shading that follows the form rather than the polygon normals. The camera never rotates
freely; a fixed or step-snapped camera is what keeps pixels from crawling.

**Typical pixels per character:** 48–64 for a figure that must be told apart from ten siblings.
Below ~40 the head stops being a head.

**Recipe (three.js, ours)**

| Parameter | Value |
|---|---|
| `pixelSize` | 2 desktop, **1 on phones** (`window.innerWidth < 700`) |
| Ortho view extent | **8.2** world units (from 9.4) — board fills the frame |
| Portrait sizing | size by **width**: `vw = 9.2; vh = vw / aspect` — never `size / aspect` |
| Piece height | pawn **1.30**, minor **1.55**, major **1.75**, king **2.00** tiles |
| Piece width budget | ≤ 0.92 tiles, enforced at voxelise time |
| Model resolution | re-voxelise at `--height 24` (from 37) |
| Palette | bespoke **KD-24** (§6), not DB32; `ditherAmount` 0.02–0.04 |
| Outline | **replace the multiply** in `RenderPixelatedPass` with a constant-colour mix (§5) |
| `normalEdgeStrength` / `depthEdgeStrength` | 0.25 / 0.8 once outlines are a colour mix |
| Lights | keep `HemisphereLight(0xfff2dd, 0x2b2140, 1.2)` + one `DirectionalLight` at `(-4, 10, 6)`, intensity 2.0; add a `0.35` fill from `(6, 3, -4)` so the back of dark pieces is not solid black |
| Camera pitch | keep **37.5°**; do not go below 32° (pieces occlude each other) or above 45° (pieces read as floor decals) |

Yields **56 virtual px** per major piece on desktop, 2.3 px per model voxel.

**Cost:** no new art. Re-voxelise (one script run), paint 3 material zones per piece
(~30 min each, 6 h total), palette + outline work 1–2 days. **≈ 2–3 days.**

**Mobile:** best of any style. One draw call per piece, no textures, the low virtual
resolution is a fill-rate saving. `pixelSize 1` is mandatory.

---

### S2 — Pre-rendered sprites on a 3D board

Model once, render to sprite sheets offline, draw the sprites as camera-facing quads on a real
3D board. The board, lighting, highlights and particles stay 3D; only the figures are 2D.

**References**

- **Dead Cells** (Motion Twin) — **the single most relevant reference.** 3DS Max → FBX → a
  homebrew tool that "renders the mesh at a very small size and without antialiasing";
  characters land at **~50 px tall in-game**; each frame exports as a PNG **plus a normal map**
  so a toon shader restores volume in-engine. They are candid about the costs: flickering
  pixels had to be hand-cleaned and were never fully solved, and they accepted a
  "disappointing level of detail" in exchange for animation fluidity. The pipeline was a
  **labour decision** (one artist for the first year) before it was an aesthetic one.
  <https://www.gamedeveloper.com/production/art-design-deep-dive-using-a-3d-pipeline-for-2d-animation-in-i-dead-cells-i->
- **Donkey Kong Country** (Rare, 1994) — the pipeline's origin: SGI-rendered 3D models baked to
  SNES sprites. <https://en.wikipedia.org/wiki/Donkey_Kong_Country>
- **Octopath Traveler / "HD-2D"** (Square Enix) — 2D sprites standing on a 3D diorama with
  depth of field and bloom; the closest published look to "pixel pieces on a 3D board".
  <https://en.wikipedia.org/wiki/Octopath_Traveler>
- **Owlboy** (D-Pad Studio) — **640×360 base resolution, the protagonist Otus is 39 px tall**,
  integer-scaled to 720p/1080p/4K. The coining case for "hi-bit" pixel art.
  <https://www.gog.com/news/read_about_the_future_of_pixel_art_according_to_the_creators_of_owlboy>
- **Blasphemous** (The Game Kitchen) — fixed **360 px virtual frame height**, width from the
  aspect ratio; all art hand-made pixel by pixel.
  <https://www.behance.net/gallery/85604481/Pixel-arts-and-animations-for-game-Blasphemous>

**What makes characters readable**

Every pixel is authored or approved by a human, so the silhouette is *designed* rather than
sampled. A hard outline, a strong key light fixed for all sprites, and an exaggerated
signature prop per character.

**Typical pixels per character:** 50–100 tall — and the low end of that needs a caveat that
cuts both ways for us. Owlboy's Otus reads at **39 px** and Dead Cells' player at **~50 px**,
which sounds like our 35 px is nearly enough. It is not, for one reason: those games need a
character to read as *itself*, against a background, one at a time. We need **eleven** types to
be told apart **from each other**, sixteen at a time, on a patterned ground. Distinguishing
eleven siblings costs roughly 1.5× the pixels of recognising one protagonist — which is how
48–64 px falls out as our floor rather than 39.

**Recipe (ours)**

We already have most of the input: `dist/sprites/*.png` are the miniature renders at 130 px
tall, per army, and they already carry a near-black outline (`#101018` is the most common
colour in every one). They are **front** views, so they do not match a 37.5° camera — the
pipeline below re-renders from the sculpts at the right pitch.

```bash
# 1. Blender, orthographic camera at 37.5° elevation, 4x target size, transparent film
blender -b -P tools/render_sprites.py -- \
    --stl "$ART/sculpts/archer.stl" --out raw/archer.png \
    --height 384 --pitch 37.5 --key "(-4,10,6)"

# 2. Box-filter down to 96 px (Box, not Lanczos — Lanczos rings and invents colours)
magick raw/archer.png -filter Box -resize x96 -alpha on mid/archer.png

# 3. Snap to the game palette, no dither
magick mid/archer.png -dither None -remap docs/art/kd24.png sprites/archer.png

# 4. Hand-pass in Aseprite: rebuild the outline, cut 20-40 stray pixels, sharpen the prop
```

Render as an upright billboard (`quad.rotation.y = camera yaw`, never full-billboard, or the
feet leave the tile), `NearestFilter`, `alphaTest: 0.5`, `depthWrite: true`, sorted by rank.
Pixelation pass **off**, palette pass **off** — the sprites are already quantised; running them
through `RenderPixelatedPass` re-samples authored pixels and undoes the hand work. Board and
VFX keep their own low-res look by being modelled coarsely rather than post-processed.

**Cost:** highest of the realistic options. 22 sprites × 1–2 h hand-cleanup = **15–25 h**, and
that is the *static* pose. Animation is the trap: 5 actions × 6 frames × 11 pieces = 330 frames
to render and clean. **Mitigation that makes this viable: animate the whole quad** — squash,
stretch, hop, rotate, flash — and add only a 2-frame "hit" and a 3-frame "death crumble".
That caps it at ~5 extra frames per piece (≈ 55 sprites), not 330.

**Mobile:** one 2048×2048 atlas at 96 px per sprite holds all 22 plus frames, ~1.5 MB as PNG-8.
Fine. Retina phones want a 2× atlas (192 px) or the sprites look soft — budget 4 MB.

---

### S3 — Cel-shaded 3D: banded toon ramps + hull outlines

No pixelation at all. Lighting is quantised into 2–4 flat bands per material and every piece
carries a real drawn outline. This is "the sculpts, stylised", not "the sculpts, pixelated".

**References**

- **Guilty Gear Xrd** (Arc System Works) — the definitive technical talk on making 3D read as
  2D: hand-edited vertex normals, ramp textures, per-vertex outline thickness.
  Junya C. Motomura, GDC 2015, "GuiltyGearXrd's Art Style: The X Factor Between 2D and 3D".
  <https://www.gdcvault.com/play/1022031/GuiltyGearXrd-s-Art-Style-The> ·
  free mirror <https://archive.org/details/GDC2015Motomura> ·
  slides <https://www.ggxrd.com/Motomura_Junya_GuiltyGearXrd.pdf>
- **The Legend of Zelda: The Wind Waker** — flat colour + hard terminator, readable at any size.
  <https://en.wikipedia.org/wiki/The_Legend_of_Zelda:_The_Wind_Waker>
- **Dragon Quest XI** — figurine-like toon shading with restrained outlines.
  <https://en.wikipedia.org/wiki/Dragon_Quest_XI>
- **Hi-Fi Rush** (Tango Gameworks) — modern cel shading with halftone/ben-day accents.
  <https://en.wikipedia.org/wiki/Hi-Fi_Rush>

**What makes characters readable**

The terminator (the light/dark boundary) is a *hard line*, so it reads as drawn linework. Band
count is deliberately tiny — two bands for a simple material, three for skin, four at most.
The outline is a constant colour and is thicker on the silhouette than on interior creases.
Colour count per character stays around 8–12 total.

**Typical pixels per character:** works at any resolution; at 64 px it is still clean because
the bands are flat.

**Recipe (three.js, ours)**

```ts
// 3-band ramp. The texture IS the band list. Verified against three 0.186.0:
//   - RGBAFormat (RGBFormat is legacy and no longer a safe upload format)
//   - NearestFilter is required, and is DataTexture's default for both filters
//   - gradientMap is non-colour data, so leave colorSpace at NoColorSpace (default)
const ramp = new THREE.DataTexture(new Uint8Array([
   90, 90,110,255,   175,175,195,255,   255,255,255,255,
]), 3, 1);                                   // defaults: RGBAFormat, NearestFilter
ramp.needsUpdate = true;
const mat = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: ramp });

// Inverted-hull outline: one extra mesh per piece, BackSide, constant colour.
const outline = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x14121C, side: THREE.BackSide }));
outline.scale.multiplyScalar(1.04);
```

| Parameter | Value |
|---|---|
| Bands | **3** for body materials, 2 for metal, 4 for cloth |
| Outline | inverted hull, `1.035–1.05` scale, colour `#14121C` (bone army) / `#B9C2FF` (iron army) |
| `pixelSize` | 1 (no pixelation) |
| Palette pass | off |
| Piece height | 1.4–1.9 tiles |
| Lights | one `DirectionalLight` only (two lights = two terminators = mush) + `AmbientLight(0x404860, 0.35)` |
| Camera pitch | 37.5° |

**Cost: the cheapest real improvement.** Zero new art — the existing sculpt meshes work
directly (decimate the STLs instead of voxelising). Half a day of shader work, half a day of
ramp tuning. **≈ 1 day.** The catch: it is no longer pixel art.

**Mobile:** inverted-hull doubles the draw calls (32 → 64) and the triangle count. Still
trivial at this scale, but merge the outline meshes of each army into one `InstancedMesh`
if it shows on low-end Android.

---

### S3b — Toon-pixel hybrid (the recommendation)

S3's flat bands, then S1's pixelation on top. The bands guarantee large flat colour regions;
the pixel grid quantises an image that is *already* flat, so quantisation adds no noise. This
is the answer to "beyond 16-bit colouring": the colour reduction happens in the shading model,
not in a nearest-colour lookup after the fact.

No shipped reference is a perfect match — it is the intersection of t3ssel8r's pixel pipeline
and Xrd's shading. That is a feature; it is a look the game can own.

**Recipe:** S1's table, with `MeshToonMaterial` + a **4-band** ramp replacing
`MeshLambertMaterial` (4 is what §7 tested and it beat both 3 and 8 — 3 loses the form, 8 stops
reading as pixel art),
the inverted-hull outline from S3 **instead of** relying on the post-process edge pass
(set `normalEdgeStrength 0.15`, `depthEdgeStrength 0.25` — accents, not the outline), and
`ditherAmount 0.0`. Palette pass optional: with 4 bands × 3 materials the render is already
inside a 20-colour gamut, so the palette pass becomes a no-op and can be turned off for a
free frame-time win.

**Cost:** S1 + S3, sharing most of the work. **≈ 3 days.**

**Mobile:** S1's fill-rate win plus S3's extra draw calls, so it nets out slightly better than
S3 alone — the pixelation pass renders the hulls at the reduced resolution too. `pixelSize 1`
on phones, as with S1.

---

### S4 — Flat-shaded voxel / low-poly toy, no pixelation

Clean chunky geometry, flat colours, real (soft) shadows, no post-processing at all. The
"tabletop miniature in a toy box" look.

**References**

- **Crossy Road** (Hipster Whale) — 2–3 shades per object, hard drop shadow, fixed camera.
  <https://en.wikipedia.org/wiki/Crossy_Road>
- **Cube World** (Wollay) — voxel characters with genuinely distinct silhouettes at low
  voxel counts. <https://en.wikipedia.org/wiki/Cube_World>
- **Townscaper** (Oskar Stålberg) — flat palette, soft AO, no outlines, extremely legible.
  <https://en.wikipedia.org/wiki/Townscaper>

**What makes characters readable**

Silhouette and *volume*. Readability comes from ambient occlusion in the crevices and a hard
contact shadow on the ground, not from outlines. Colour counts are tiny (6–10 per character)
and hues are saturated. Because there is no pixel grid, the figure can be as tall as it likes
without aliasing.

**Typical pixels per character:** 90–130 (it is just resolution-independent 3D).

**Recipe (ours)**

`pixelSize 1`, palette pass off, `RenderPixelatedPass` replaced by a plain `RenderPass`,
`antialias: true`, `setPixelRatio(min(devicePixelRatio, 2))`. Models hand-built at
**16–20 voxels** tall (chunky, exaggerated — not the 37-voxel scans), `MeshLambertMaterial`
with vertex colours, one shadow-casting directional light plus a cheap `ContactShadows`-style
darkened quad under each piece. Piece height 1.4–1.7 tiles.

**Cost:** 11 hand-built chunky voxel models at 1–2 h each = **15–25 h**, plus a day of lighting.
The voxelised scans cannot be used; they are the wrong kind of asset for this look.

**Mobile:** heaviest of the low-cost options — antialiasing plus `devicePixelRatio 2` plus
shadow maps. Cap at `devicePixelRatio 1.5` on phones.

**Verdict:** clean and cheap to *look at*, but the designer asked for pixel art. This is the
"we gave up on pixel art" option. Worth mocking up precisely because it is the honest control
group.

---

### S5 — 32-bit isometric pre-render, high resolution

S2 with a much bigger budget: large sprites, dozens of frames, a 64–96 colour palette, and
player colour done by palette-index swapping.

**References**

- **Diablo** (Blizzard, 1996) — 3D Studio renders baked to isometric sprites; the template for
  the whole genre. <https://en.wikipedia.org/wiki/Diablo_(video_game)>
- **Fallout / Fallout 2** (Interplay) — pre-rendered isometric with extensive directional sets.
  <https://en.wikipedia.org/wiki/Fallout_(video_game)>
- **Age of Empires II: Definitive Edition** — the modern re-render of the same pipeline at 4K,
  and a documented case of "the pipeline still works, just at higher resolution".
  <https://en.wikipedia.org/wiki/Age_of_Empires_II:_Definitive_Edition>

**What makes characters readable**

Player/team colour occupies fixed palette index ranges, so the same sprite is recoloured per
army with no extra art — worth stealing regardless of the style we pick. Units are rendered
with a single fixed key light for the whole game, and a baked contact shadow travels with the
sprite, which is what pins them to the ground.

**Typical pixels per character:** 110–160.

**Recipe (ours):** S2's, with `--height 160`, a 64-colour palette, and 8 animation frames per
action. Team colour as an index range so one render serves both armies.

**Cost:** 25–40 h minimum, and it scales badly with animation. Realistically **4+ weeks
part-time** for 11 pieces with the five animations the game already has.

**Mobile:** a 160 px sprite set at 2× is ~8 MB of atlas. Doable, not free.

**Verdict:** the highest clarity ceiling and the worst fit for a browser game with one
developer. Ranked for completeness; not recommended.

---

### S6 — PS1 / lo-fi 3D with dithering

Vertex-snapped geometry, vertex lighting, no filtering, ordered dithering standing in for
colour depth.

**References**

- **Final Fantasy Tactics** (Square, 1997) — the directly relevant one, and the numbers are
  documented. Unit sheet **256 × 488 px at 4 bpp**, with **16 palettes × 16 colours** — the
  first 8 are the unit, the second 8 the portrait. **A unit is therefore 16 colours, total.**
  Faction colour is a palette-index swap on the same sheet. Units are flat textured quads
  (billboards) transformed by the 3D camera. Individual frame sizes are *not* fixed — frames
  are composed from sub-rectangles, so anyone quoting "32×32 for FFT" is extrapolating.
  <https://ffhacktics.com/wiki/SPR_Spritesheet>
- **Final Fantasy Tactics camera** — yaw rotates on shoulder buttons, and **if a target yaw
  would land orthogonal the game adds 45° so the map always sits diagonal**; three discrete
  zoom steps; the map auto-rotates when a tile is obscured. Constraining the camera to keep the
  pixel grid honest, expressed as game design.
  <https://ffhacktics.com/wiki/How_the_Battle_Camera_Works>
- **Vagrant Story** (Square) — the ceiling of PS1 character readability, via two tricks worth
  stealing: environment light **baked into vertex colours** that multiply the texture (no
  lighting engine at all), and pseudo-shadows made by **layering two differently-shaded copies
  of the character model**. <https://en.wikipedia.org/wiki/Vagrant_Story>
- **Signalis** (rose-engine) — low-poly 3D blended with 2D sprites; the modern revival.
  <http://rose-engine.org/press/Presskit_SIGNALIS.html>
- **Crow Country** (SFB Games) — real-time 3D shaded to read like *pre-rendered* PS1
  backgrounds; characters keep defined joints, smooth shading and high-contrast lighting
  precisely to stay readable. <https://en.wikipedia.org/wiki/Crow_Country_(video_game)>
- Technique reference, if we mock this up: <https://pikuma.com/blog/how-to-make-ps1-graphics>
  and <https://www.david-colson.com/2021/11/30/ps1-style-renderer.html> (the whole vertex-snap
  trick is `snapped.xy = floor(grid * snapped.xy) / grid;`).

**What makes characters readable — and why it fights us**

FF Tactics solves it by making the *units* 2D sprites (not lo-fi 3D) on a lo-fi 3D map, keeping
each unit to a 16-colour palette while the map carries far more colours at far lower contrast —
so a unit is the most saturated, most contrasted thing on screen by construction. The lo-fi 3D
part, the map, is deliberately simple.

Dithering is the opposite of what a 35-pixel figure needs: it converts flat regions into 50%
noise, which is precisely the failure mode the designer is complaining about. *Pixel Logic*
p.117 says the same thing in fewer words — dithering hurts small sprites and hinders animation.
`ditherAmount` is at 0.03 and should be 0. Note also that **no PSX-revival title found uses
outlines**; outlines are a modern 3D-pixel-art convention, not a PS1 one, so this style gives
up the single biggest readability lever from §5.1.

**Typical pixels per character:** 40–70, but with dithering the *effective* resolution is half.

**Recipe (ours):** `pixelSize 3`, palette pass on at 32 colours, `ditherAmount 0.12–0.18`,
`flatShading: true`, vertex-snap in an `onBeforeCompile` hook
(`gl_Position.xy = floor(gl_Position.xy / gl_Position.w * res) / res * gl_Position.w`),
camera yaw snapped to 45° steps. Pieces 1.5 tiles.

**Cost:** ~half a day of shader work, no new art.

**Mobile:** cheapest to run of any style here — `pixelSize 3` means a ~170-pixel-wide frame,
and the dither is a two-instruction addition. It is also where the style hurts most: dither
noise at phone scale is indistinguishable from JPEG artefacts.

**Verdict:** cheap, atmospheric, and actively worse for our core problem. Show it to the
designer as a mood option, not as a candidate.

---

### S7 — 16-bit palette-limited (what ships today)

Kept in the list because "fix what we have" is a legitimate answer and is the cheapest path to
a big improvement.

**References:** DawnBringer-32 <https://lospec.com/palette-list/dawnbringer-32>; the Lospec
palette list generally <https://lospec.com/palette-list>. Note the point already made in
`rendering.md`: "16-bit" means RGB565, which is not a retro look — what reads as 16-bit is a
hand-picked ramp of 24–64 colours.

**What to change (no style change, just the §2 bugs):**

1. `pixelSize` 1 on phones; portrait sized by width, not `size / aspect`.
2. Ortho view 9.4 → 8.2; piece heights up to 1.3–2.0 tiles; width capped at 0.92 tiles.
3. Re-voxelise at `--height 24`.
4. DB32 → **KD-24** (§6), `ditherAmount` 0.03 → 0.0.
5. Constant-colour outline (§5).
6. 3 material zones per piece instead of one flat army colour.

**Mobile:** the `pixelSize 1` change (item 1) is worth more on a phone than everything else in
this document combined — it triples the effective resolution at zero runtime cost.

**Cost: ≈ 2 days**, and it recovers most of the clarity gap on its own. Every other style in
this list needs items 1–5 done anyway, so this is not a fork — it is the prerequisite.

---

### S8 — Chunky 2.5D tactics

Deliberately low piece count, deliberately large pieces, heavy outlines, 4–5 shade ramps, and a
board drawn with a visible bevel so tiles read as objects rather than as a texture.

**References**

- **Into the Breach** (Subset Games) — the gold standard for reading a small grid at a glance;
  every unit silhouette is unique and the grid never competes with the units.
  <https://en.wikipedia.org/wiki/Into_the_Breach>
- **Tactics Ogre: Reborn** (Square Enix) — hand-reworked high-resolution sprites on an
  isometric grid. <https://en.wikipedia.org/wiki/Tactics_Ogre:_Reborn>
- **Unicorn Overlord** (Vanillaware) — not pixel art, but the reference for making dozens of
  unit classes distinguishable by silhouette and palette alone.
  <https://en.wikipedia.org/wiki/Unicorn_Overlord>
- **Pawnbarian** (j4nw) — a chess roguelike that solves exactly our problem by force: a
  monochrome blue board, gold for anything important, white pieces, nothing else.
  <https://j4nw.itch.io/pawnbarian>

**What makes characters readable**

Pieces are *big* relative to tiles — roughly 1.5–2 tiles tall — and the board is
deliberately low-contrast so it never competes. Every unit gets one exaggerated identifying
feature, and colour is used as a *category* channel (team, class) rather than for realism.

**Typical pixels per character:** 56–80.

**Recipe (ours):** S1's table with the piece heights pushed to **1.6 / 1.85 / 2.1 / 2.4** tiles,
board tile contrast dropped to **1.7 : 1** (§6), a 2-pixel constant outline, 5-step ramps, and
each sculpt re-silhouetted so the identifying prop is 30–50% oversized. That re-silhouetting is
real modelling work, which is where the cost sits.

**Cost:** 11 models re-blocked at 2–4 h each = **25–40 h**.

**Mobile:** excellent — it is the style *designed* for small screens.

---

## 4. Rankings

### (a) Clarity — 11 piece types on 8×8, at ~1000 px and on a phone

1. **S2 pre-rendered sprites** — every pixel human-approved; nothing else beats it.
2. **S5 hi-res isometric** — same mechanism, more pixels, worse cost.
3. **S3 cel-shaded** — flat bands + real outlines; the resolution-independent option.
4. **S8 chunky 2.5D** / **S3b toon-pixel** — near-tied; both solve the problem structurally.
5. **S1 HD pixel-3D** — good once §2 is fixed; still asks 56 px to do a lot.
6. **S4 flat voxel** — clear, but the 16–20 voxel models throw away the sculpts' character.
7. **S6 PS1** — dithering actively costs clarity.
8. **S7 as-shipped** — 19 px on a phone; currently unusable.

Phone-specific: S8 and S3 hold up best; S2 needs a 2× atlas; S1/S3b need `pixelSize 1`.

### (b) Cost, cheapest first

1. **S3 cel-shaded** — ~1 day, zero new art.
2. **S6 PS1** — ~half a day, but a step backwards.
3. **S7 fix-what-we-have** — ~2 days.
4. **S1 HD pixel-3D** — ~2–3 days.
5. **S3b toon-pixel** — ~3 days.
6. **S4 flat voxel** — 15–25 h of modelling.
7. **S8 chunky 2.5D** — 25–40 h of re-silhouetting.
8. **S2 sprites** — 15–25 h *plus* an animation pipeline; **S5** is 4+ weeks.

### (c) Fit with "pixel art but in 3D, stylised 16-bit, cool animations and special effects"

1. **S3b toon-pixel** — pixels, genuinely 3D, and the flat bands are what "stylised" means
   when the alternative is a palette-quantised photo of a render.
2. **S1 HD pixel-3D** — the literal reading of the brief.
3. **S8 chunky 2.5D** — pixel art, reads as 3D, best VFX legibility.
4. **S7** — the brief as currently interpreted.
5. **S2 / S6** — pixel art, but 2D figures / noisier.
6. **S3 / S5 / S4** — not pixel art.

VFX note, and it matters for the choice: the game's effects are already 3D
(`src/render/fx.ts` — instanced debris, arrows, chain lunges, screen shake). **S1, S3b, S4 and
S8 keep all of that for free.** S2 and S5 force every effect to become a sprite animation too,
or the 2D pieces and the 3D particles stop belonging to the same image. That single fact is the
strongest argument against the sprite routes.

### Overall

**S3b (toon-pixel) is the bet**, with **S1** as its fallback if the designer wants less
stylisation, and **S2** as the escape hatch if clarity still is not there.

But sequence the work by measured payoff, not by the style decision. The §7 test ranks the
gains: **(1) the 1-pixel contrast rim (§5.1), (2) bespoke per-material ramps replacing DB32
(§5.2, §6), (3) the resolution and sizing fixes (§2.1–2.2).** All three are style-agnostic,
they total about two days, and they are prerequisites for every option on this list. Ship them,
look at the board again, *then* pick between S3b and S1 — the choice will be much easier, and
it is entirely possible the designer signs off before the style question is reached.

---

## 5. Cross-style technique fixes

These three apply whichever style wins. Do them first.

### 5.1 The outline fix

`RenderPixelatedPass` multiplies; it cannot draw a light rim on a dark piece (§2.3). Two ways
out, both cheap:

**Option A — patch the pass shader** (post-process, no extra draw calls):

```ts
// `pixelatedMaterial` is the public handle in three 0.186.0 (checked against the source;
// `_fsQuad` is private and holds the same object). Patch it once, right after construction.
const mat = pixelPass.pixelatedMaterial;
mat.uniforms.outlineColor = { value: new THREE.Color(0x0B0D14) };
mat.uniforms.rimColor     = { value: new THREE.Color(0xB9C2FF) };
mat.fragmentShader = 'uniform vec3 outlineColor; uniform vec3 rimColor;\n' + mat.fragmentShader;
mat.fragmentShader = mat.fragmentShader.replace(
  'gl_FragColor = texel * Strength;',
  `vec3 c = texel.rgb;
   c = mix(c, outlineColor, dei * depthEdgeStrength);
   c = mix(c, rimColor,     nei * normalEdgeStrength);
   gl_FragColor = vec4(c, texel.a);`);
mat.needsUpdate = true;
```

One global outline colour and one global rim colour. Cheapest, and enough.

**Option B — inverted hull per piece** (per-army outline colour, needed for S3/S3b):

```ts
const hull = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
  color: army === BONE ? 0x3A2A20 : 0xB9C2FF, side: THREE.BackSide }));
hull.scale.setScalar(1.04);
piece.add(hull);
```

Doubles draw calls (32 → 64 — irrelevant here) and gives each army the outline colour its
value needs: **dark outline on the light army, light rim on the dark army.** Tested against the
existing renders at 64 px: adding a 1-pixel contrast rim is the single largest readability gain
of anything in this document, larger than the palette change and larger than the resolution
change.

Also add a **contact shadow**: a `0.55`-tile dark quad at `y = 0.01` under each piece,
`#0B0D14` at 45% opacity. It pins the piece to its square and adds local contrast at the one
place where piece and tile touch.

---

### 5.2 "Beyond 16-bit colouring" — the actual technique

This is the designer's phrase and it deserves a direct answer. The current pass does
**nearest-colour matching in RGB against a 32-entry list**. That is the one approach that
cannot preserve a ramp: RGB distance will happily move a shadow pixel into a different hue
family, and in dark ramps it picks visually wrong neighbours. It is why one lit surface
speckles between brown, orange and pink (§2.5).

**Replace nearest-colour with luminance-indexed per-material ramps.** Each material carries a
hand-authored 5-entry ramp (1 line colour + 4 lit bands); the shader takes the surface's
lighting term, quantises *that* to 4 levels, and looks up the ramp row for the material. Colour distance never enters the
calculation, so a ramp mathematically cannot break.

```ts
// tRamps: a 5 x N DataTexture, one ROW per material, one COLUMN per shade step
//          (column 0 = line colour, columns 1-4 = the four lit bands).
// vMaterial: material id, carried as an extra vertex attribute (or packed into vertexColor.r).
// Runs as a material, not a post-process — so it also keeps transparency intact.
`
  float l = dot(normalize(vNormal), lightDir) * 0.5 + 0.5;      // lambert 0..1
  float band = floor(clamp(l, 0.0, 0.999) * 4.0);                // 0..3  -> columns 1..4
  vec3 col = texture2D(tRamps, vec2((band + 1.5) / 5.0, vMaterial)).rgb;
`
```

Three consequences worth stating plainly:

- It is **the same thing** as `MeshToonMaterial` with a `gradientMap` (§3, S3), one level up: a
  ramp per material instead of one ramp for the whole mesh. The bookkeeping that makes the two
  numbers line up: **a 5-entry ramp is 1 line colour + 4 lit bands.** Entry 0 (`#3A2A20`,
  `#120F26`) is the outline/darkest-crease colour and is never produced by lighting; entries
  1–4 are the four toon bands. That is exactly what §7 tested. So S3/S3b are not a detour from
  "better colour" — they *are* the better-colour implementation.
- The post-process palette pass becomes redundant and can be switched off. With 3 materials ×
  5 steps × 2 armies the render is already inside a 30-colour gamut by construction.
- Two-army colour costs nothing: swap the ramp texture, not the model. This is exactly how
  Final Fantasy Tactics does faction colour — one 4 bpp sprite sheet, 8 unit palettes of 16
  colours, faction chooses the palette index.
  <https://ffhacktics.com/wiki/SPR_Spritesheet>

If an off-the-shelf palette is wanted instead of the bespoke KD-24 in §6, pick for **ramp
structure**, not for size:

| Palette | N | Why |
|---|---|---|
| [Apollo](https://lospec.com/palette-list/apollo) | 46 | Exactly **6 hue ramps × 6 steps** plus a 10-step neutral. Uniform ramp length is what makes luminance indexing trivial. Best structural fit of any public palette. |
| [Vinik24](https://lospec.com/palette-list/vinik24) | 24 | Connected 4-shade ramps that **share a common shadow and a common highlight** — quantisation error can never break the value hierarchy. Soft and desaturated. |
| [AAP-64](https://lospec.com/palette-list/aap-64) | 64 | Specifically well regarded for **voxel** art, i.e. already proven on 3D-shaded surfaces. |
| [Resurrect 64](https://lospec.com/palette-list/resurrect-64) | 64 | The safe popular default; adjacent ramps, muted. |
| [Endesga 64](https://lospec.com/palette-list/endesga-64) | 64 | High contrast and saturation, but has loose accent entries outside any ramp — **bad for naive nearest-colour matching**, fine for luminance indexing. |

DawnBringer-32 is not on this list on purpose.

---

### 5.3 Three more cheap techniques worth stealing

- **Pixel-crawl fix (t3ssel8r, via David Holland).** Snap the camera to a view-aligned,
  texel-sized grid — that kills creep but makes motion stutter — then shift the render output
  back in screen space by the snap error to restore smooth motion. Two steps, both cheap.
  <https://www.davidhol.land/articles/3d-pixel-art-rendering/>
- **Our orthographic camera is load-bearing, not a style choice.** Grid snapping works under
  orthographic projection and *fails* under perspective, because pixels at different depths
  drift at different rates and no single snap corrects them all
  (Ebert, "Texel Splatting: Perspective-Stable 3D Pixel Art", arXiv:2603.14587,
  <https://arxiv.org/abs/2603.14587>). `rendering.md` already picked ortho for sizing reasons;
  this is the second, stronger reason. Do not add a free-orbit camera.
- **Vagrant Story's fake shadow**: a second copy of the piece mesh, darkened and flattened onto
  the board plane. Cheaper and crisper at this resolution than a real shadow map, and it gives
  the contact shadow of §5.1 for free.

---

## 6. Colour scheme

Designed against the numbers in §2.4. Two constraints fight each other: a light army and a dark
army both need contrast against both tile colours, and total luminance is a fixed budget. With
a light army *and* a dark army, **no palette can reach 4.5 : 1 on all four pairings** — so the
board goes into a narrow band, and the outline carries the rest. That is not a compromise; it
is the Staunton convention (white pieces have black lines, black pieces have white lines) and
it is what Into the Breach and Pawnbarian do.

### 6.1 Recommended — "Bone vs Iron" (KD-24)

```
neutrals / board   #0B0D14  #171B28  #2A3044  #4E5A76  #7C8AA6  #AEB8CC
BONE ramp  (A)     #3A2A20  #8A6A4E  #C9A880  #F0DCB4  #FFF7E8
IRON ramp  (B)     #120F26  #2B2662  #4A46A8  #7C7FE8  #B9C2FF
class accents      #FFD447  #4FA8FF  #E2622A  #7CF0B0  #EDEFF2  #FF3E6B
state              #59E06B  #FF4A4A
```

23 colours. Every material ramp is 5 steps with hue shift (bone warms toward orange in shadow,
iron cools toward violet), which is what DB32 cannot do because its steps belong to different
ramps.

**Board**

| Role | Hex | Luminance | Notes |
|---|---|---|---|
| light tile | `#7C8AA6` | 0.285 | desaturated blue-grey: leaves the warm and violet ends of the spectrum free for the armies |
| dark tile | `#5A6478` | 0.126 | **1.90 : 1** vs light — enough to read the checker, low enough not to fight pieces |
| frame | `#2A3044` | 0.030 | a dark frame makes the board read as an object |
| background | `#171B28` | 0.011 | |
| tile bevel / grid line | `#AEB8CC` at 25% | — | 1 px on the top edge of each tile; gives the board depth without adding contrast |

**Armies**

| | body (lit) | vs light tile | vs dark tile | outline | outline vs tiles |
|---|---|---|---|---|---|
| **Bone** (A) | `#F0DCB4` | 2.40 : 1 | 4.55 : 1 | `#3A2A20` | 4.37 / 2.30 |
| **Iron** (B) | `#4A46A8` | 3.12 : 1 | 1.64 : 1 | rim `#B9C2FF` | 1.59 / 3.01 |

Bone vs Iron body: **7.48 : 1** — the two armies are never confusable with each other.
The weak cell is Iron on the dark tile (1.64 : 1), which is exactly what the `#B9C2FF` rim and
the contact shadow exist to solve. Note this is already better than today's **1.01 : 1**.

### 6.2 Alternative — "Bone vs Cobalt", maximum readability

If the designer will trade the light/dark chess convention for legibility, put **both armies in
the bright band and the board in the dark band**. Separation becomes hue (warm vs cold), not
value — the Advance Wars / Into the Breach solution.

| Role | Hex | vs light tile | vs dark tile |
|---|---|---|---|
| light tile | `#4A5468` | — | 1.59 : 1 |
| dark tile | `#2E3646` | 1.59 : 1 | — |
| Bone body | `#EBCF96` | **5.04 : 1** | **8.02 : 1** |
| Cobalt body | `#6FC2F0` | **3.86 : 1** | **6.15 : 1** |

**Worst pairing 3.86 : 1, versus 1.64 : 1 for option 6.1 and 1.01 : 1 today.** The cost is that
army-to-army value contrast falls to 1.30 : 1, so hue and outline colour carry the team read.
On a phone this is the safer option. Mock up both; this is a genuine designer choice.

### 6.3 The three sprite schemes already in the repo, measured

`public/sprites/` currently offers `blue-red`, `green-purple` and `ivory-charcoal`. Measured on
the dominant body colour of five pieces per side:

| Scheme | Army A | Army B | **A vs B** | worst vs current tiles | worst vs KD tiles |
|---|---|---|---|---|---|
| `blue-red` | `#70A0C0` L 0.324 | `#C08080` L 0.282 | **1.11 : 1** | 1.23 : 1 | 1.10 : 1 |
| `green-purple` | `#80B080` L 0.372 | `#9060A0` L 0.168 | 1.93 : 1 | 1.09 : 1 | 1.24 : 1 |
| **`ivory-charcoal`** | `#D0D0D0` L 0.631 | `#303030` L 0.030 | **9.10 : 1** | 1.38 : 1 | **2.22 : 1** |

`blue-red` puts both armies at the **same luminance**, so the only thing separating the two
sides is hue — which is the first channel lost to a small sprite, a colour-blind player, or a
phone in sunlight. `ivory-charcoal` is nine times better on the one comparison that decides
whose piece it is, and it is the only one of the three that clears 2 : 1 on every tile.

**Use `ivory-charcoal`, on the KD board, with the light rim on charcoal.** Recolour the other
two schemes into per-army *accent* trim (§6.4) if the colour variety is wanted; do not use them
as body colours.

### 6.4 Per-piece accent colours

Eleven distinguishable hues is not achievable. Measured in CIELAB after a deuteranope
simulation, an 11-hue set collapses to a minimum ΔE of **2.9** — gold and lime become the same
colour for ~6% of male players, and the difference is invisible for everyone at a 4-pixel patch.

Use **six class hues** instead. Piece *type* is carried by silhouette; the accent carries
*movement class*, which is also the thing a new player most needs to learn. Minimum
deuteranope ΔE for this set is **22.8**, which is safe.

| Class | Pieces | Hex | Deuteranope appearance |
|---|---|---|---|
| Royal | King | `#FFD447` gold | `#DAE243` |
| Slider | Queen, Rook, Bishop | `#4FA8FF` azure | `#0095FF` |
| Leaper | Knight, Beast | `#E2622A` orange | `#939718` |
| Ranged | Archer | `#7CF0B0` mint | `#B9D6B3` |
| Support | Maester, Guard | `#EDEFF2` pale | `#BDEEF2` |
| Sacrifice | Paladin | `#FF3E6B` magenta-red | `#8D9B63` |
| — | Pawn | none — plain body | |

Placement: a **base ring** (the bottom 2–3 pixels of the plinth) plus one **crest/trim band**
on the figure, both drawn with the outline colour around them so accent-to-body contrast is
guaranteed by the line and does not depend on the army's value.

Second, colour-free channel: **pips on the plinth** — 0 for pawn, 1 for minor, 2 for major,
3 for royal. Shape survives greyscale, colour-blindness and a 19-pixel phone render; hue does
not. Cheap, and it does more for clarity than any palette decision.

### 6.5 Board state highlights

Highlights are *additive emissive on the tile*, so what matters is that each state is
distinguishable from the others and from both tile colours. Contrast figures are against the
6.1 board.

| State | Hex | vs light / dark tile | Treatment |
|---|---|---|---|
| hover | `#AEB8CC` | 1.55 / 2.94 | tile lifts `+0.03` in y; no colour change |
| selected | `#FFD447` | 2.13 / 4.05 | full tile fill at 40%, plus a 2 px gold border |
| legal move | `#59E06B` | 2.04 / 4.04 | **a centred dot**, not a tile fill — a filled tile hides the piece that may land there |
| legal capture | `#FF4A4A` | 1.05 / 2.08 | **a ring around the tile edge**, not a fill; the red is low-contrast by luminance so it must be carried by shape |
| last move | `#4A8CFF` | 1.07 / 2.13 | from-tile and to-tile corners only, 25% |
| check | `#FF3E6B` | — | pulsing 2 px border on the king's tile at 1.4 Hz + a `THREE.Timer.setTimescale` slow-motion beat |
| threatened (optional) | `#E2622A` | — | hatched corner triangle |

Rules that matter more than the hexes:
- **Never fill a tile a piece is standing on.** Fill for empty destinations, outline for
  occupied ones. Today `set(h.captures, 0x8a1f1f)` fills the tile under the piece being
  captured — the piece and its highlight merge.
- Red and blue are the two lowest-luminance highlight colours available; give them **shape**
  (ring, corners) rather than relying on their colour.
- Cap total emissive so no more than ~20% of the board is lit at once, or the checker pattern
  disappears and with it the player's sense of file and rank.

---

## 7. Evidence — this was tested, not asserted

`public/sprites/{blue-red,green-purple,ivory-charcoal}/*.png` holds the miniature renders at
130 px tall in three army schemes. They are the perfect test rig: take them to the exact pixel
heights the engine produces and apply each candidate treatment offline. Four runs, all against
the same eleven pieces:

| Treatment | Result |
|---|---|
| 35 px (today's desktop size) + DB32 | Archer, maester and pawn are the same smear. The red army goes pink/salmon/orange inside single surfaces — DB32 hue noise, exactly §2.5. |
| 19 px (today's phone size) + DB32 | Nothing is identifiable. |
| 64 px + bespoke KD-24 ramps | Every piece readable. Flat colour regions, no hue noise. The palette change alone removes the speckle. |
| **56 px + 4-band posterise + KD-24 ramps + 1 px contrast rim** | **Reads as hand-made pixel art.** Spear, hammer, shield, robe, dress and jaw all legible; both armies clear on both tile colours. |

The last row is Mock 1 (§8) simulated as a still. The ordering of the gains, largest first:
**(1) the 1-pixel contrast rim, (2) the bespoke ramps replacing DB32, (3) the resolution.**
That ordering matters for scheduling — the two cheapest changes are the two biggest.

Reproduce any row in about ten seconds, no engine changes:

```python
# scratch/mock.py — python3 -m pip install pillow numpy
from PIL import Image, ImageFilter; import numpy as np
BONE=[0x3A2A20,0x8A6A4E,0xC9A880,0xF0DCB4,0xFFF7E8]      # army A ramp
IRON=[0x120F26,0x2B2662,0x4A46A8,0x7C7FE8,0xB9C2FF]      # army B ramp
hx=lambda h:((h>>16)&255,(h>>8)&255,h&255)
H, BANDS = 56, 4                                          # <- the two knobs
names='knight beast archer maester guard paladin rook bishop queen king pawn'.split()
tiles=[]
for i,n in enumerate(names):
    im=Image.open(f'public/sprites/blue-red/{n}-w.png').convert('RGBA')
    w=round(im.width*H/im.height); sm=im.resize((w,H), Image.LANCZOS)
    a=np.array(sm.split()[3])>110
    rgb=np.array(sm.convert('RGB'))/255
    L=0.2126*rgb[...,0]+0.7152*rgb[...,1]+0.0722*rgb[...,2]
    lo,hi=np.percentile(L[a],4),np.percentile(L[a],96)
    idx=(np.clip((L-lo)/(hi-lo),0,.999)*BANDS).astype(int)+1
    ramp, tcol = (BONE,0x7C8AA6) if i%2==0 else (IRON,0x4E5A76)
    out=np.full((H,w,3),hx(tcol),dtype=np.uint8)
    for b in range(1,BANDS+1): out[a&(idx==b)]=hx(ramp[min(b,4)])
    m=Image.fromarray((a*255).astype('uint8'))
    out[(np.array(m.filter(ImageFilter.MaxFilter(3)))>128)&~a]=hx(0x3A2A20 if i%2==0 else 0xB9C2FF)
    tiles.append(Image.fromarray(out))
W=sum(t.width+3 for t in tiles); sheet=Image.new('RGB',(W,H),hx(0x2A3044)); x=0
for t in tiles: sheet.paste(t,(x,0)); x+=t.width+3
sheet.resize((W*7,H*7), Image.NEAREST).save('mock.png')
```

Set `BANDS=8` and it degrades toward the smooth-quantised look; set `H=35` and it degrades
toward today's. Both are worth showing the designer as the "why" behind the numbers. Caveat:
the renders are a **front** view, so this is a colour-and-resolution test, not a camera test —
the real 37.5° view still has to be judged in-engine.

**Joins up with `docs/research/sprites/`.** A parallel pass produced sheets at h48 / h64 / h96 /
h128 × full / flat16 / dither32 / outline, plus `sheet-armies-h96-outline.png` showing four
army colours and grey on the current tiles. Read them together with §2.4 and §6.3: the sheets
answer *how much resolution and how much quantisation*, this document answers *which colours*.
The one thing visible in `sheet-armies-h96-outline.png` that the contrast table predicts is
that green and grey both weaken badly on the light tile `#D9A066` while every colour holds on
the dark tile — which is the §2.4 result, not a property of those particular hues. Re-shoot
those sheets on the §6.1 board before drawing conclusions about army colour from them.

---

## 8. What to show the designer

Five in-engine mock-ups, all from the same position (use `?fen=` with a crowded mid-game board
containing all 11 types — that is the only position that tests the actual question). Ship all
five behind a query-string switch so he can flip between them live, on desktop and on a phone.

**Do §2.1–2.2 (sizing), §5.1 (outline) and §5.2 (ramps) before any of these**, or every mock-up is
testing the wrong thing. That is about half a day.

### Mock 1 — "Toon-Pixel" (the recommendation, S3b)

```
pixelSize            2 desktop / 1 phone
ortho view extent    8.2 (portrait: vw = 9.2, vh = vw / aspect)
camera               (0, 8.5, 10.5) → (0, 0.45, 0)      [unchanged, 37.5°]
material             MeshToonMaterial, vertexColors, gradientMap = 4-step DataTexture (tested in §7)
outline              inverted hull, scale 1.04, #3A2A20 (bone) / #B9C2FF (iron)
pass edges           normalEdgeStrength 0.15, depthEdgeStrength 0.25
palette              KD-24, ditherAmount 0.0     (or palette pass OFF — should be a no-op)
lights               DirectionalLight(0xffffff, 2.0) @ (-4,10,6); Ambient(0x404860, 0.35)
model                re-voxelise at --height 24, width capped to 0.92 tiles
piece heights        pawn 1.30 / minor 1.55 / major 1.75 / king 2.00 tiles
contact shadow       0.55-tile quad, #0B0D14 @ 45%
→ 56 virtual px per major piece on desktop, 2.3 px per voxel
```

### Mock 2 — "HD Pixel-3D" (S1)

Identical to Mock 1 but `MeshLambertMaterial` instead of toon, outline via the patched pass
(§5.1 Option A) instead of hulls, `normalEdgeStrength 0.25 / depthEdgeStrength 0.8`,
`ditherAmount 0.02`. Shows what the current style looks like when it is simply given enough
pixels and a real outline — the cheapest possible "yes".

### Mock 3 — "Pre-rendered sprites" (S2)

```
pixelSize            1        (pixelation pass OFF)
palette pass         OFF
sprites              96 px tall, upright billboards, NearestFilter, alphaTest 0.5, depthWrite true
source               re-render sculpts in Blender at 37.5° pitch, 4x, box-downsample, remap to KD-24
board                unchanged 3D board, tiles from §6.1
piece heights        96 px ≈ 2.2 tiles at the Mock-1 view extent
```
Use 3 pieces only for the mock-up (knight, beast, maester — the three that read worst today).
Rendering all 22 before the decision is 20 wasted hours if he picks another style.

### Mock 4 — "Flat voxel toy" (S4, the control group)

```
pixelSize            1, RenderPass instead of RenderPixelatedPass, palette pass OFF
antialias            true, setPixelRatio min(dpr, 2)
material             MeshLambertMaterial, vertexColors, no outline
models               re-voxelise at --height 18  (chunky on purpose)
lights               Directional 2.2 with shadowMap + Hemisphere 1.0
piece heights        1.4–1.7 tiles
```
Answers "is the pixelation helping at all?" — worth knowing, and it takes an hour.

### Mock 5 — "Chunky tactics" (S8)

Mock 1's settings with: `pixelSize 3`, piece heights **1.6 / 1.85 / 2.1 / 2.4** tiles, a 2-pixel
outline, tile contrast dropped to the §6.2 board, and 5-step ramps. Deliberately the most
extreme option — it will look the clearest on a phone and the least like a chess set. Useful as
the far end of the scale even if he rejects it.

### Also put in front of him

- **The two board schemes side by side** (§6.1 Bone-vs-Iron and §6.2 Bone-vs-Cobalt). This is
  a real choice with a measured consequence: worst-case piece/tile contrast **1.64 : 1** vs
  **3.86 : 1**. It is independent of the style decision and can be settled first.
- **Accent scheme**: six class hues (§6.4) plus plinth pips, versus no accents at all.
- **A phone screenshot of each**, at 390 px wide. Four of the five styles look acceptable on
  desktop; the phone is where the decision actually gets made.

---

## 9. Open items

- The miniature STL sources are not on this machine (the Drive sweep in `TASKS.md` is
  unfinished). What *is* here is `public/sprites/{blue-red,green-purple,ivory-charcoal}/*.png`
  — the PSD renders at 130 px tall in three army schemes. Enough to prototype S2/S5 and to run
  §7, but a **front** view, not a 37.5° view. Mock 3 needs the STLs and a Blender render
  script.
- Those three sprite sets and `public/models/*.json` were changing on disk while this was
  written — another session is already working the sprite route. Reconcile before acting:
  the three colour schemes there are a different answer to §6 than KD-24 and should be judged
  against the §2.4 contrast numbers rather than by eye.
- `tools/render_sprites.py` does not exist yet; it is one Blender headless script (~60 lines).
- Per-piece material zones (§2.6) need someone to decide which part of each sculpt is metal,
  cloth and skin. That is a 2-hour pass over 11 models and it gates S1, S3, S3b and S8.
