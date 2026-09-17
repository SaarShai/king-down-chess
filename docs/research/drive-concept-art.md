# Drive folder `concept art` — inventory and assessment

Source: Google Drive "King Down" → `concept art`, a local read-only scratch copy. Reviewed 2026-09-13.
703 real files, 834 MB (plus 11 zero-byte macOS `Icon` stubs and one `.DS_Store`).

This is the **working folder of the 2014 print campaign**: piece art, the board plan, the logo build, the
Kickstarter pages and four movies (2014-03 to 2014-11). It carries the Drive's only `dc:creator` fields
(§6), and it holds **no move, capture, swap or chain animation** — see §3.

## 1. Inventory

| Path | Files | Formats | Contents |
|---|---:|---|---|
| (root) | 232 | 124 jpg, 81 png, 12 ai, 9 psd, 4 mov, 1 tif, 1 zip | Painted piece cut-outs, kings, board plans, logo, Kickstarter pages, movies |
| `KingDown_storyboard` | 111 | 110 jpg, 1 gif | The teaser storyboard, 1280×720, plus a 117-frame animatic |
| `animated gifs/color` | 32 | 28 png, 3 psd, 1 gif | Painted pieces; the light rises and falls. 700×278 |
| `animated gifs/grey` | 33 | 30 png, 2 psd, 1 gif | Grey sculpt fades to painted and back. 700×281 |
| `cards` | 20 | 20 jpg | Spell art variants, a card back, one captioned card layout |
| `sword sequence` | 2 | 1 rar, 1 gif | `Logo.rar` (an archive of `Logo/`) and a 56-frame web gif |
| `sword sequence/Logo` | 112 | 112 png | **Master logo reveal**, 2048×1080 with alpha |
| `sword sequence/Logo 2` | 73 | 71 png, 1 psd, 1 gif | The same reveal at 700 px, plus `logo-sequence.gif` |
| `sword sequence/Logo copy` | 34 | 34 png | A shorter cut, 700×341, no alpha |
| `sword sequence/untitled folder` | 54 | 54 png | A shorter cut, 700×369, with alpha |

## 2. Useful now

### 2.1 Painted piece cut-outs — a ready sprite source

`*_colored*.png` hold **one figure per file, painted, on transparent alpha**, 530–990 px tall — one per piece
(`Archer_colored5`, `Bishop_colored_dagger2`, `Guard.colored`, `Knight_colored1b`, `Maester_colored2`,
`Paladin.colored2`, `Queen2`, `Rook_colored`, `pawn.colored2`, `beast_colored`) and one per retail king
(`King_Celestial_colored`, `King_Frost_colored`, `King_ember_colored2`, `King_gaya_colored`).
`3d files/imgs/colored/` holds the same renders as layered PSDs; **these PNGs are the flattened result**, and
`Paladin.colored-no.glow.png` pairs with `Paladin.colored2` to separate the glow layer. `<Piece>.png` and
`<Piece>-col.png` (1920×1062) are the **grey clay** version of the same pose.

### 2.2 Board, logo and UI

- `board-02(1).jpg` (4000×3846) — the board plan in the designer's handwriting: "plateaus of different
  heights", "First Row individual icebergs. Closer to capital the icebergs are formed together", "Less lava
  towards center", "**IN BETWEEN BIOMES THERE'S OVERLAPPING OF TWO NEIGHBORING BIOMES**". Read this with
  `drive-art-stuff.md` §2.2 before any restyle. `board_KD.jpg` paints the same plan small, and `cover sketch
  04 annotated.jpg` marks the cover art AIR / ICE / FIRE / EARTH KING, SEA, GLACIERS, ROOTS, LAVA, VOLCANO.
- `Illustrarion_ref.jpg` — an isometric mock-up: grey pieces on a cut-stone 8×8 board. `boardv5 small.jpg`
  and `board_marble_texture.jpg` give a stone tile set and a marble ground.
- `logo 02.jpg` (1000×2000) and `logo gold fix.jpg` — the **finished colour logo**: a crowned steel shield
  reading KING DOWN, a sword through it, blood on the point. `art stuff` holds only the line art.
- `sword.png` / `sword-real.png` (1181×2362, alpha) — the sword alone. A capture or strike effect.
- `kingdown_pantones.jpg` — the **four army colours in Pantone**, two columns, a black box on the chosen one:
  purple **521c**, red **1805c**, blue **645c**, green **7490c** (rejected: 667c, 180c, 645c). This fixes the
  army colours of RULES §6.6.
- `Silhouette lineup.jpg` — three silhouette rows (A, B, C) of every piece; better than
  `Silhouettes_round2.jpg`, which shows four. `Character_Lineup.jpg` (6567×1048) shows true relative height.
- `8TxKneKpc-new.png` (1600×1576, alpha) is a black beast paw print, a ready UI glyph; the four
  `fixed-background*.png` (1600×1600) are marble page grounds.

## 3. Animation references

**No file shows a piece moving, capturing, swapping or chaining.** The movies are turntables and a teaser film;
the gif sets are reveals. Character gifs run at 10 fps, logo gifs at 20–25 fps.

| Asset | Frames | Size | What it shows | Maps to |
|---|---:|---|---|---|
| `sword sequence/Logo/Logo_0338…0449.png` | 112 | 2048×1080, alpha | The crest builds from silhouette to dark steel to gold; a sword then drops through it and blood runs down the point | Title screen; the **sword drop is our capture / strike effect** |
| `sword sequence/Logo 2/logo-sequence.gif` | 78 | 700×340, 661 KB | The same reveal plus a dissolve-out. Gif transparency dithers the edge | Preview only; use the PNG master |
| `animated gifs/color` (28 png + `output_hVjAVh.gif`) | 27 | 700×278, 1.9 MB | Knight, Paladin, Rook and Archer painted; the light on them rises (a00→a15) then falls (b01→b10). The Paladin cross and the archer arrow glow | **Selected-piece highlight**, or a "power active" pulse |
| `animated gifs/grey` (30 png + `output_Ih2nKD.gif`) | 30 | 700×281, 2.5 MB | Queen, Guard, Pawn and Beast cross-fade from grey sculpt to painted (a00→a14) and back (b01→b15) | Promotion reveal, or a loading screen |
| `KingDown_storyboard/KingDown.gif` | 117 | 320×180, 1.7 MB | The storyboard as an animatic | Story timing |
| `KingDown_ANIMATION_v01.mov` | 1428 | 1920×1080, 25 fps, 57.1 s, 148 MB | **The finished colour teaser with sound** — the `art stuff` storyboard realised: the dead king, the herald, the map of four houses, the four kings in fire, nature, ice and sky colour | Title-screen film; the four-army palette in motion |
| `Rook_TT.mov`, `Rook_TT2.mov`, `Rook_R_V1.3 (Converted).mov` | 150, 150, 450 | 1555×720 6 s; 800×450 15 s | Rook turntable, grey clay, on black and on white | Piece rotation, not a game action |

## 4. Useful later

**Card effects that `cards` does not hold (RULES §5).** A second illustration set exists, flat vector with a caption, drawn after the `cards` art. Each effect has
a line version and a colour version: `illustration_control1.jpg` + `control (2).jpg` (a caged golem on
strings), `illustration2_leap1.jpg` + `leap.jpg` / `leap2.jpg` (a leaping stag), `illustration_rescue.jpg` +
`rescue.jpg` (an ice hand pulls a hand from water), `illustration_sacrifice1.jpg` + `sacrifice.jpg` (an arm
and a burning dagger). **Control, Leap, Rescue and Sacrifice are in RULES §5 but on no printed card.**
`frame_*.jpg` and `frame_*.ai` are finished banners ("Take FLIGHT", "Feel RAGE", "Find SALVATION", "STRIKE —
Hard, Fast, Far", "Light FIRE"); `cards/card layou_ref2.jpg` prints an **Overgrowth** card reading "Restrict
a movement to certain tiles" — wording found nowhere else.

- `Shadow_king.png`, `Spirit_king.png` (1200×1600, alpha) — large painted art of the two bonus kings, an
  upgrade on the small jpgs in `drive-assets/art-stuff/`; `Kings_color.jpg` paints the four retail kings.
- `kingdown-ks-tease-char.png` — card names with the chess name below: Cross = Bishop, Steed = Knight, Pike
  = Pawn, Rock = Rook, **Bash = Paladin**, **Beast = Beast**; the last two carry a "NEW" wax seal.
- `Player_mats.jpg`, `player mats sketch.jpg`, `player-mat-diagram.ai` — the **physical player mat**: a
  capitol border, a walled keep (90×100 mm), a pawn shop and a hole/chasm (58×90 mm each). Card-sized location
  tiles that RULES does not mention. Read §6 first. `king-down-tease*.ai` and `kingdown-ks-tease*.ai` are the
  Kickstarter pages, tagline "Long Live The King"; `booklet*` and `cover*` are rulebook and box art.

## 5. Duplicates

- **`KingDown_storyboard/` repeats `art stuff/storyboard/`**: same 110 names, pixel-identical (`compare
  -metric AE` = 0; each file here is 465 bytes smaller, a resource fork). `KingDown_storyboard.zip` zips that
  folder, so only `KingDown.gif` is new.
- **27 loose files are byte-identical** to `art stuff` (`KingRedraw.jpg`, `Silhouettes_round2.jpg`,
  `Shadow_king2.jpg`, `Spirit_king2.jpg`, `logo.jpg`, `all.jpg`, `emblems sketches.jpg`, the sketch rounds,
  `cards/sketches01.jpg`, `cards/scatches02.jpg`) or to `final art` (`Front_cover.jpg`,
  `board_colored_4K.jpg`, `cover1_color_v2.jpg`). `emb-celest/gaya/ice.png` and `fire-emblem.png` repeat the
  four emblems at other sizes; use `cards/Emblems/*.png` (1772×1772, clean alpha) instead.
- `cards/illus_0*.jpg` are crops and variants of `cards/Illustrations/illus_*.jpg`, but six are **sRGB**
  (`illus_05_rage`, `05_rage2`, `07c`, `08b`, `09b`, `10b`), so they need no CMYK conversion.
  `sword sequence/Logo 2`, `Logo copy` and `untitled folder` are shorter 700 px cuts of `Logo/`.

## 6. Licensing and credits

**Seven files carry a `dc:creator` field — the only ones in the Drive.** `Knight_pose.JPG`, `Pawn_pose_0*` and
`Spirit_King(2).JPG` give `rafiba`; `Paladin_symbol.JPG` and `Paladin_symbol2.JPG` give
`rafi_000`. Both match the Windows account already seen in the `3d files` ZBrush paths
(`C:\Users\rafiba\…\Dream Catcher\KING DOWN\Models`). No other file carries a creator, copyright or licence;
the only user path in the Illustrator files is `/Users/test`, which credits nobody.

**Third-party material, the same risk as `art stuff/Characters/materials`.** `player-mat-diagram.ai` links six
borrowed files by name, among them `Piren's Bluff.png` (a Magic: The Gathering card title) and
`maxresdefault.jpg` (a YouTube thumbnail); `Player_mats.jpg` is built from them. Seven loose textures are
stock downloads by their names (`M701_White_Carrara.jpg`, `NAXOS-1.jpg`, `MLV19202L__17751.jpg`,
`free_texture_friday_49-768x1024.jpg`, `white-large-marble-texture-19438383.jpg`,
`marble-floor-texture-ideas-design-5.jpg` and its 41 MB `.psd`). **Do not ship these and keep them out of a
press kit.** All character, board, logo and card art, and all four movies, are original.

## 7. Copied reference images — `docs/research/drive-assets/concept-art/`, each ≤ 1200 px and ≤ 300 KB

| File | Source (relative to `concept art/`) | Why |
|---|---|---|
| `logo-colour-final.jpg` | `logo 02.jpg` | the finished colour logo |
| `sword-blood-alpha.png` | `sword.png` | capture / strike effect, alpha kept |
| `board-biome-notes.jpg` | `board-02(1).jpg` | the four-biome board brief in the designer's words |
| `army-pantones.jpg` | `kingdown_pantones.jpg` | the four army colours in Pantone |
| `character-lineup-scale.jpg` | `Character_Lineup.jpg` | true relative height of every piece |
| `silhouette-grid-all-pieces.jpg` | `Silhouette lineup.jpg` | UI icon source, all pieces, three rounds |
| `piece-cutout-archer.png` | `Archer_colored5.png` | shows the painted cut-out format |
| `card-effect-banners.jpg` | `kingdown-ks-tease-illus.jpg` | the second illustration set with captions |
| `piece-names-aka.jpg` | `kingdown-ks-tease-char.png` | the card names, including Bash = Paladin |
| `anim-logo-sword-4frames.png` | `sword sequence/Logo/` | the logo reveal and the sword drop |
| `anim-piece-glow-4frames.png` | `animated gifs/color/` | the light-rise loop for a selected piece |
| `anim-grey-to-colour-4frames.png` | `animated gifs/grey/` | the grey sculpt to painted cross-fade |

## 8. Open questions for the designer

1. **Is `rafiba` / `rafi_000` the credit?** Give the full name, and say who made the logo animation, the
   movies and the vector illustrations.
2. **Can we use `KingDown_ANIMATION_v01.mov`?** A finished 57-second colour teaser with sound, the best
   marketing asset in the Drive; no other folder points at it.
3. **Is the Paladin called Bash?** RULES §3 stops at Pike, Steed, Cross, Rock and Thorn. What are the Guard,
   Archer and Maester called?
4. **Does the web board keep the four biomes?** The plan overlaps ice, cloud, earth and lava at the seams,
   around a gold capitol. v0.1 draws two tones.
5. **Do Control, Leap, Rescue and Sacrifice ship as cards?** Art exists for all four and they are in RULES §5,
   but none is on a printed card.
