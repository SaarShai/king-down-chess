# Drive folder `board` — inventory and assessment

Source: Google Drive "King Down" → `board`, a local read-only copy. Reviewed 2026-09-13.
16 files, ~400 MB (one zero-byte macOS `Icon` stub, ignored).

The folder holds one asset: a **photographed black-and-white marble floor**, cut into an 8×8 board.
`FloorsCheckerboard0037_*` are the source photos, the PSDs assemble them, the `*_tile_*.jpg` files
are the finished squares. Nothing here is drawn or rendered art. Every PSD layer is a photo patch:
no text layer, no vector shape and no emblem layer exists, and the layer names are Photoshop
defaults (`Layer 0`, `Layer 2 copy`).

## 1. Inventory

| File | Size | Format | What it is |
|---|---:|---|---|
| `FloorsCheckerboard0037_1_L.jpg` | 2.10 MB | JPEG 3000×2367 | source photo of the marble floor |
| `FloorsCheckerboard0037_2_L.jpg` | 2.40 MB | JPEG 3000×2443 | same floor, different area |
| `FloorsCheckerboard0037_5_L.jpg` | 2.22 MB | JPEG 3000×2357 | same floor, different area |
| `FloorsCheckerboard0037_10_L.jpg` | 1.71 MB | JPEG 3000×2200 | same floor, different area |
| `white_tile_1/2/3.jpg` | 47–51 KB | JPEG 512×512 | three light squares, greyscale, edge shadow baked in |
| `black_tile_1/2/3.jpg` | 56 KB | JPEG 512×512 | three dark squares |
| `board_texture1.jpg` | 3.54 MB | JPEG 4000×4000 | grey stone slab, greyscale, **not seamless** |
| `master-standard-board.psd` | 101 MB | PSD 4180×4400, 5 layers | work in progress; ~40 % of the field is empty |
| `master-standard-board-01.psd` | 124 MB | PSD 4180×4369, 6 layers | **finished colour master** |
| `master-standard-board-02.psd` | 112 MB | PSD 4180×4369, 2 layers | same board, desaturated, RGB mode |
| `master-standard-board-03.psd` | 34 MB | PSD 4180×4369, 1 layer | same board, greyscale mode |

## 2. Board design

**Layout.** 8 columns × 8 rows. I confirmed this by reducing each composite to a 32×32 luminance map:
every tile spans exactly 4 cells. The field fills the canvas edge to edge.

- **No frame, no border, no bevel.** The tiles bleed off all four sides.
- **No rank or file labels**, no coordinates, no arrows, and **no centre marking** — nothing marks a
  "capital zone" (RULES §5, *Burn*) or any other card-game area.
- Tile pitch is 522.5 × 546.1 px on a 4180 × 4369 canvas at 72 ppi. The tiles are 4 % taller than
  wide because the floor was shot at a slight angle. That is camera perspective, not design intent.
- The grout gap is about 4–5 % of a tile width. A soft shadow sits on the left and bottom edges,
  so the light falls from the top right.

**Colours** — mean of the 64 tile centres, sampled 240×240 px from `master-standard-board-01.psd`:

| Element | Hex | Range across its 32 tiles |
|---|---|---|
| Light tile | `#EEEEEE` | `#E6E2DC` … `#FAFAFC` |
| Dark tile | `#191714` | `#0D0A0B` … `#252529` |
| Grout seam | `#81807E` | — |

The colour master carries a faint cast only: some light tiles drift warm (`#E6E2DC`), a few cool
(`#E7EAEF`). Files `-02` and `-03` are the same board with the cast removed; every pixel is neutral.
The 512 px single tiles are gentler and fully desaturated: light mean `#D4D4D4` (centre `#DADADA`),
dark mean `#323232` (centre `#333333`, edges `#212121`). `board_texture1.jpg` has mean `#7B7B7B`.

**Against our board.** Our `LIGHT = 0xefebe3` almost matches the master's light tile, but warmer.
Our `DARK = 0x6f6b65` is far lighter than the master's `#191714`. The designer's board is a
high-contrast marble floor, not a soft two-tone board.

## 3. Licensing and credits

`FloorsCheckerboard0037_1/2/5/10_L.jpg` are **stock photos from textures.com (formerly CGTextures)**.
Two signals agree. First, the names follow that site's scheme exactly — category `FloorsCheckerboard`,
set id `0037`, variant number, `_L` for the Large download size. Second, the four files carry no EXIF
and no XMP, only the comment `CREATOR: gd-jpeg v1.0 (using IJG JPEG v62), quality = 98`, the
signature of that site's server-side re-encode. Every other JPEG here keeps full Photoshop metadata.

**No copyright, author or credit string exists in any file.** I searched all PSDs and JPEGs for
`textures.com`, `copyright`, `licen`, `credit`, `author`, `Saar` and `King Down`, and found only
Adobe's own ICC string. The PSDs were made in Photoshop CS5/CS6 on Windows, created 2015-03-19 and
last saved 2015-04-04; `board_texture1.jpg` was created 2014-06-30 from a PNG. Confirm the
textures.com licence before this board art ships in a public build.

## 4. Useful now

**Tile albedo.** Use the six 512 px tile JPGs, downscaled to **64×64**. The renderer shows about
95 screen px per tile at 900 px tall; at `pixelSize: 2` that leaves roughly 47 × 39 texels per tile
after the pixel pass. Above 64 px is waste; 128 px is the hard ceiling. I reduced each tile to 24,
40, 64 and 128 px and magnified with nearest neighbour: the light tile keeps its cracks down to
**24 px** and reads well at 40 px, but the dark tile shows almost nothing at any size, because its
whole range is about 8 levels.

**Smallest change that works.** Build one shared greyscale detail map from a light tile, normalise it
to mean 1.0, and set it as `map` on the existing `MeshLambertMaterial` in `src/render/renderer.ts`.
Keep `color: LIGHT` and `color: DARK` — three.js multiplies `map` by `color`, so the palette does not
shift and the dark tiles gain the same grain. Set `texture.colorSpace = THREE.SRGBColorSpace` and
`magFilter = THREE.NearestFilter` so the pixel pass stays crisp. Then ship all six maps and pick one
per square from the square index: the real floor has no two identical tiles, and a cloned board looks
flat. Six 64 px textures cost almost nothing, so no atlas is needed.

**Frame.** Map `board_texture1.jpg` once across the frame box (`8.9 × 0.5 × 8.9`, `0x2b2a28`). It is
a single slab photo, and a half-roll test shows a clear seam, so never set `RepeatWrapping`. To adopt
the designer's contrast, move `DARK` from `0x6f6b65` toward `#191714` — a design decision, see §7.

## 5. Useful later

- The four source photos hold far more unique tiles than the six that were cut. Cut more when six
  starts to repeat visibly.
- `master-standard-board-02.psd` and `-03.psd` are ready-made luminance maps for a future roughness
  or bump pass. The warm and cool drift in `-01` supports per-army board tints.
- `board_texture1.jpg` was downscaled from 8000 × 7924 px. Ask for the original if we need a 4K
  table surface. The card game's board furniture — capital zone, coordinates, emblem — needs fresh
  design work; nothing here shows it.

## 6. Reference images in `docs/research/drive-assets/board/`

| File | Source | Use |
|---|---|---|
| `master-board-composite.png` | `master-standard-board-01.psd[0]`, 861×900 | the finished board, flattened |
| `white-tile-1/2/3.jpg` | `white_tile_1/2/3.jpg`, 512×512 | light tile albedo, ready to downscale |
| `black-tile-1/2/3.jpg` | `black_tile_1/2/3.jpg`, 512×512 | dark tile albedo |
| `frame-stone.jpg` | `board_texture1.jpg`, 900×900 | frame or table surface, one shot only |
| `source-floor-photos.jpg` | the four stock photos, contact sheet | shows what more tiles are available |

## 7. Open questions for the designer

1. Which textures.com account and plan cover `FloorsCheckerboard0037`? May we ship derivatives in a
   public web build, and what credit line does the licence need?
2. Is the black-and-white marble the intended King Down look, or a 2015 placeholder? Our board is
   warm ivory against mid-grey, which is much softer.
3. Does the retail board print a frame, rank and file labels, or a logo outside the 8×8 field?
4. Where does the physical board mark the "capital zone" that the *Burn* card needs?
5. Is `board_texture1.jpg` the frame or table material, or an unrelated test?
