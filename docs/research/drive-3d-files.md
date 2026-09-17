# Drive folder `3d files` — inventory and assessment

Source: Google Drive "King Down" → `3d files`, downloaded to a local scratch copy (read-only).
Reviewed 2026-09-13. 172 files, 9.9 GB (plus 12 zero-byte macOS `Icon` stubs and one `.DS_Store`, ignored).

All sculpts are ZBrush work by Windows user `rafiba`, from the project folder
`C:\Users\rafiba\My Projects\Dream Catcher\KING DOWN\Models` (string found inside three `.ZTL` files).
The PSD renders were made in Adobe Photoshop CC on macOS, created 2015-01-08, last saved 2015-01-21.

---

## 1. Inventory

### 1.1 `final/King Down STL` — the master set (14 files, 3.1 GB)

ASCII STL, millimetres, **Y up**, one 22 mm round base each, bounding box zeroed at the origin
(exception noted). Widths above 22 mm are overhang past the base, not a scale difference.

| File | Bytes | Triangles | W×H×D (mm) | Piece |
|---|---:|---:|---|---|
| `Archer_22mm.stl` | 256,731,518 | 947,559 | 22.02 × 33.01 × 22.00 | Archer |
| `Beast_22mm.stl` | 248,974,888 | 920,061 | 22.00 × 31.57 × 25.75 | Beast |
| `Bishop_22mm.stl` | 166,493,501 | 613,933 | 22.02 × 35.39 × 22.00 | Bishop |
| `Guard_22mm.stl` | 338,196,050 | 1,249,437 | 27.73 × 31.75 × 22.00 | Guard |
| `King_Celestial_22mm.stl` | 188,680,082 | 696,093 | 22.02 × 37.00 × 22.00 | King — Sky / Stratus |
| `King_Ember_22mm.stl` | 451,876,343 | 1,668,896 | 28.80 × 37.17 × 22.00 | King — Fire / Flame |
| `King_Frost_22mm.stl` | 113,526,972 | 417,920 | 22.02 × 37.22 × 22.00 | King — Ice / Frost |
| `King_Gaya_22mm.stl` | 393,897,373 | 1,454,462 | 23.67 × 37.29 × 22.48 | King — Mud / Gaya |
| `Maetser_22mm.stl` | 120,565,700 | 444,052 | 22.02 × 26.41 × 22.00 | Maester (typo in name) |
| `Paladin_22mm.stl` | 252,373,846 | 929,400 | 30.97 × 32.03 × 22.75 | Paladin |
| `Queen_22m.stl` | 219,283,365 | 809,544 | 22.02 × 34.99 × 22.00 | Queen (typo: `22m`) |
| `Rook_22mm.stl` | 250,903,778 | 926,962 | 25.92 × 31.58 × 23.00 | Rook |
| `knight_22mm.stl` | 110,849,938 | 408,513 | 22.02 × 32.58 × 22.00 | Knight, standing pose |
| `pawn_22mm.stl` | 165,657,065 | 611,034 | 22.02 × 32.63 × 22.00 | Pawn, "Pawn-1" sculpt |

`Paladin_22mm.stl` is the one file not at the origin: x = 121.38…152.35, y = −2.07…29.96, z = 34.33…57.08.
Its internal solid name is `"Paladin"`, not `"Paladin_22mm"` — it was exported separately from the rest.
`Queen_22m.stl` and `Rook_22mm.stl` also carry short solid names (`"Queen"`, `"Rook_22mm"`).
`voxelize.py` already calls `apply_translation(-m.bounds[0])`, so the offset is harmless.

The four kings here are the four **retail army kings**. `King_Shadow` and `King_Spirit` are not in this
folder; they live in `Extra Kings and Poses`.

### 1.2 `final/Extra Kings and Poses` — alternates (6 files, 1.0 GB)

Same format, same 22 mm base, same scale as the master set.

| File | Bytes | Triangles | W×H×D (mm) | Piece |
|---|---:|---:|---|---|
| `King_Shadow_22mm.stl` | 193,966,745 | 716,485 | 22.02 × 37.08 × 22.00 | King — Shadow |
| `King_Spirit_22mm.stl` | 207,323,782 | 765,456 | 22.02 × 37.23 × 22.00 | King — Spirit |
| `knight_pose_22mm.stl` | 147,173,172 | 543,840 | 25.71 × 32.48 × 25.54 | Knight, lunging pose ("Knight-2") |
| `pawn_01_22mm.stl` | 182,643,430 | 674,362 | 22.02 × 31.75 × 22.00 | Pawn, "Pawn-2" sculpt |
| `pawn_02_22mm.stl` | 138,965,549 | 512,838 | 22.02 × 32.62 × 22.00 | Pawn, "Pawn-3" sculpt |
| `pawn_03_22mm.stl` | 135,252,431 | 499,270 | 22.00 × 23.36 × 30.59 | Pawn, "Pawn-4" sculpt |

Two orientation traps:

- `knight_pose_22mm.stl` is offset from the origin (x 0.62…26.33, y 13.37…45.85, z 1.48…27.01). Harmless.
- **`pawn_03_22mm.stl` is Y-up like everything else, but its Z extent (30.59) is larger than its height
  (23.36)** because the spear lies almost horizontal. `voxelize.py --up auto` compares `extents[2] >= extents[1]`,
  so it picks `z` and tips the model on its side. Pass `--up y` for this file. I confirmed this by rendering
  point-cloud silhouettes: the X–Z view is a plain disc (the base seen from above), the X–Y view is the figure.

### 1.3 `Extra STLs for print` — older / alternate exports (20 files, 4.3 GB)

Binary STL written by ZBrush (80-byte header `COLOR=…MATERIAL=…`). Much denser meshes than `final/`
(1.5 M – 11 M triangles) and **inconsistent scales**: four different unit systems appear.
These are earlier print tests, superseded by `final/`.

| Path | Bytes | Triangles | W×H×D | Notes |
|---|---:|---:|---|---|
| `Shadow_King_resize2.stl` | 162,882,434 | 3,257,647 | 2.08 × 3.50 × 2.08 | "3.5 unit" scale group |
| `guard_30mm.stl` | 74,506,984 | 1,490,138 | 27.94 × 32.00 × 22.17 | mm; ≈ `final` Guard, marginally larger |
| `knight_v01.stl` | 378,716,484 | 7,574,328 | 1.47 × 1.86 × 1.46 | own scale, not zeroed |
| `pawn_01.stl` | 276,897,684 | 5,537,952 | 2.43 × 3.50 × 2.43 | |
| `pawn_02.stl` | 554,360,484 | 11,087,208 | 2.36 × 3.50 × 2.36 | largest file in the folder |
| `pawn_03.stl` | 149,404,584 | 2,988,090 | 3.30 × 3.50 × 4.59 | |
| `wetransfer-a83c9c/STLs for print/Queen_resize.stl` | 451,408,384 | 9,028,166 | 11.96 × 19.01 × 11.95 | "19 unit" scale group |
| `…/STLs for print/bishop_resize.stl` | 116,850,184 | 2,337,002 | 11.82 × 19.01 × 11.81 | |
| `…/STLs for print/ember_resize.stl` | 120,432,784 | 2,408,654 | 14.73 × 19.01 × 11.25 | King Ember / Fire |
| `…/STLs for print 2/KingFrost_resize.stl` | 149,287,384 | 2,985,746 | 2.07 × 3.50 × 2.07 | |
| `…/STLs for print 2/King_Gaya_resize.stl` | 116,591,184 | 2,331,822 | 93.96 × 148.00 × 89.22 | 148 mm display scale |
| `…/STLs for print 2/Maister_resize.stl` | 144,331,984 | 2,886,638 | 2.92 × 3.50 × 2.92 | Maester, third spelling |
| `…/STLs for print 2/celestial_resize.stl` | 154,889,184 | 3,097,782 | 2.08 × 3.50 × 2.08 | King Celestial / Sky |
| `…/STLs for print 2/guard_resize.stl` | 74,506,984 | 1,490,138 | 27.94 × 32.00 × 22.17 | **duplicate** of `guard_30mm.stl` |
| `…/STLs for print 2/rook_resize.stl` | 435,084,484 | 8,701,688 | 2.87 × 3.50 × 2.55 | |
| `…/kings and poses/Shadow_King_resize2.stl` | 162,882,434 | 3,257,647 | 2.08 × 3.50 × 2.08 | **duplicate** of the root copy |
| `…/kings and poses/Spirit_King_resize.stl` | 134,113,584 | 2,682,270 | 2.07 × 3.50 × 2.07 | |
| `…/kings and poses/knight_01.stl` | 378,716,484 | 7,574,328 | 1.47 × 1.86 × 1.46 | **duplicate** of `knight_v01.stl` |
| `…/kings and poses/pawn_01.stl` | 276,897,684 | 5,537,952 | 2.43 × 3.50 × 2.43 | **duplicate** of the root copy |
| `…/kings and poses/pawn_03.stl` | 149,404,584 | 2,988,090 | 3.30 × 3.50 × 4.59 | **duplicate** of the root copy |

**Duplicates.** Five pairs are byte-identical (verified by hashing the first and last 4 MB of each file):
`Shadow_King_resize2`, `guard_30mm` ↔ `guard_resize`, `knight_v01` ↔ `knight_01`, `pawn_01`, `pawn_03`.
In short, the `Extra STLs for print` root folder is a partial re-copy of the `wetransfer-a83c9c` subfolders.
1.0 GB of the folder's 4.3 GB is redundant.

**Superseded by `final/`.** Every sculpt in this folder also exists in `final/`, at a consistent scale and
with a lighter mesh. Nothing here is unique. Missing from this folder (only in `final/`): Archer, Beast,
Paladin, the Pawn-1 master, and the lunging knight.

### 1.4 `ZTLs for Print` — ZBrush source tools (20 files, 1.4 GB)

`.ZTL`, magic `ZBrush File.Copyright 1977-2012.PIXOLOGIC INC`. **Not opened** — the format is proprietary and
needs ZBrush; no Python reader is available. One file per sculpt, matching the 20 base renders exactly:

`archer_resize` (110 MB), `beast_resize` (140 MB), `bishop_resize` (18 MB), `guard_30mm` (13 MB),
`King-celestial_resize` (27 MB), `King-ember_resize` (19 MB), `King-spirit_resize` (21 MB),
`King_Gaya_140mm` (22 MB), `Kingfrost_resize` (26 MB), `Maister_resize` (21 MB), `knight_01` (96 MB),
`knight_02` (190 MB), `paladin_30mm` (145 MB), `pawn_01_v03` (72 MB), `pawn_02_v02` (70 MB),
`pawn_03_v02` (71 MB), `pawn_04_v01` (135 MB), `Queen_resize` (83 MB), `rook_resize` (114 MB),
`Shadow_King_resize2` (32 MB).

This folder finished downloading during the review; an earlier pass saw only four files.

### 1.5 `imgs` — grey clay renders (20 PSD, 29 MB)

Single-layer sRGB PSD, 8-bit, no alpha, grey background, each figure on its plinth, front three-quarter view.
Small: 216×320 up to 344×418.

| File | px | File | px |
|---|---|---|---|
| `Archer.PSD` | 216×320 | `Knight-2.PSD` | 273×341 |
| `Beast.PSD` | 287×395 | `Maester.PSD` | 249×301 |
| `Bishop.PSD` | 222×350 | `Paladin.PSD` | 265×278 |
| `Guard.PSD` | 278×320 | `Pawn-1.PSD` | 220×323 |
| `King-Fire.PSD` | 310×400 | `Pawn-2.PSD` | 279×295 |
| `King-Gaya.PSD` | 297×454 | `Pawn-3.PSD` | 240×344 |
| `King-Ice.PSD` | 294×480 | `Pawn-4.PSD` | 248×360 |
| `King-Shadow.PSD` | 259×425 | `Queen.PSD` | 218×346 |
| `King-Sky.PSD` | 282×470 | `Rock.PSD` | 344×418 |
| `King-Spirit.PSD` | 269×448 | `Knight-1.PSD` | 263×384 |

### 1.6 `imgs/colored` — tinted renders and lineups (83 PSD + 8 PNG, 26 MB)

Same renders, flat-tinted, **with alpha**. Each file holds the flattened composite at the canvas size plus one
trimmed layer; `magick file.psd[0]` yields the composite with a clean alpha channel. Canvas sizes match `imgs/`.

- 14 pieces × 5 files (`-blue`, `-green`, `-purple`, `-red`, plus an untinted grey `.PSD`):
  Archer, Beast, Bishop, Guard, Knight-1, Knight-2, Maester, Paladin, Pawn-1…4, Queen, Rock — 70 files.
- Kings, tinted only in their own faction colour: `King-Fire-red`, `King-Gaya-green`, `King-Sky-purple`,
  and `King-Ice` in **all four** (blue, green, purple, red — it was the test subject).
- `King-Shadow.PSD` and `King-Spirit.PSD` exist in grey only. No tinted variant.
- 8 PNGs, all 2380×780, white background, no alpha (see §3).

---

## 2. Piece mapping

### 2.1 STL → game piece

| Game piece | Master STL (`final/King Down STL`) | Alternate pose |
|---|---|---|
| Pawn | `pawn_22mm.stl` | `pawn_01_22mm.stl`, `pawn_02_22mm.stl`, `pawn_03_22mm.stl` |
| Knight | `knight_22mm.stl` | `knight_pose_22mm.stl` |
| Bishop | `Bishop_22mm.stl` | — |
| Rook | `Rook_22mm.stl` | — |
| Queen | `Queen_22m.stl` | — |
| King, Ice / Frost | `King_Frost_22mm.stl` | — |
| King, Fire / Ember / Flame | `King_Ember_22mm.stl` | — |
| King, Sky / Celestial / Stratus | `King_Celestial_22mm.stl` | — |
| King, Mud / Gaya | `King_Gaya_22mm.stl` | — |
| King, Spirit | — | `King_Spirit_22mm.stl` |
| King, Shadow | — | `King_Shadow_22mm.stl` |
| Archer | `Archer_22mm.stl` | — |
| Paladin | `Paladin_22mm.stl` | — |
| Guard | `Guard_22mm.stl` | — |
| Maester | `Maetser_22mm.stl` | — |
| Beast | `Beast_22mm.stl` | — |

### 2.2 Pawn and knight sculpts — STL ↔ PSD

I could not read this off the filenames, so I rendered point-cloud silhouettes of each STL and compared them
against the alpha channel of the matching tinted PSD. All six matched one-to-one:

| PSD render | STL file | Pose |
|---|---|---|
| `Pawn-1` | `final/King Down STL/pawn_22mm.stl` | upright, spear vertical, shield at the side |
| `Pawn-2` | `final/Extra Kings and Poses/pawn_01_22mm.stl` | leaning forward, pack on the back, axe diagonal |
| `Pawn-3` | `final/Extra Kings and Poses/pawn_02_22mm.stl` | small, in profile, very tall spear |
| `Pawn-4` | `final/Extra Kings and Poses/pawn_03_22mm.stl` | pack on the back, spear angled across the body |
| `Knight-1` | `final/King Down STL/knight_22mm.stl` | standing, spear vertical, cloak |
| `Knight-2` | `final/Extra Kings and Poses/knight_pose_22mm.stl` | lunging, spear thrust forward |

### 2.3 What each sculpt looks like

From the grey renders: Archer is a barefoot woman drawing a bow. Paladin is a stout bearded warrior with a
war hammer and a cross on his tabard. Guard is a squat armoured figure inside a turtle-like shell.
Maester is a bearded gnome with an eyepiece and a pack. Beast is a round toothy monster, almost all mouth.
Rook is a rock golem carrying a brick tower on his back. Bishop is a thin robed figure with a mitre and a book.
Queen is a slim crowned woman in a gown.

### 2.4 Naming quirks

| Seen as | Means | Where |
|---|---|---|
| `Rock` | rook | all PSD files; matches the card-game name in `docs/RULES.md` §3 |
| `Maetser` | maester | `final/King Down STL/Maetser_22mm.stl` |
| `Maister` | maester | `Extra STLs…/Maister_resize.stl`, `ZTLs…/Maister_resize.ZTL` |
| `Maester` | maester | PSD renders (the correct spelling) |
| `Queen_22m` | Queen, 22 mm | missing `m` in the filename |
| `King-Ice` / `KingFrost` / `Kingfrost` | Frost king | PSD / STL / ZTL |
| `King-Fire` / `ember` | Flame king | PSD / STL |
| `King-Sky` / `celestial` | Stratus king | PSD / STL |
| `King-Gaya` | Mud king | everywhere |
| `knight_v01` = `knight_01` | Knight-1 | duplicate names for the same file |
| `pawn_01/02/03` (STL) | Pawn-2/3/4 (PSD) | the numbering is **off by one**; see §2.2 |

The last one is the real trap: `pawn_01_22mm.stl` is **not** the `Pawn-1` render.

---

## 3. Artwork for the web game

### 3.1 The tinted PSDs are usable as-is

`imgs/colored/*-{blue,green,purple,red}.psd` are clean, alpha-cut, front-view renders of every piece.
One `magick x.psd[0] x.png` per file gives a transparent PNG at the sizes in §1.6. That is enough for:

- **The piece guide** already in the HUD — one render per piece, at native size or 2× nearest-neighbour.
- **The promotion picker** — crop to the figure, square it, scale to 64–96 px. The tallest is
  `King-Ice` at 480 px, the shortest `Paladin` at 278 px, so a shared square crop works.
- **Army colour reference** — the four tints are the shipped army colours (see §4).

Limits: they are small (216–344 px wide), they are a fixed three-quarter camera, and they are flat tints, not
painted minis. They will not scale past about 2×. They are reference and UI art, not board art. The in-game
board pieces stay voxelized; these are the flat icons beside them.

### 3.2 `lineup-base-*.png` and `lineup-boost-*.png`

All eight are 2380×780, white background, no alpha, one per colour.

- **`lineup-base-<colour>.png`** shows the 15 sculpts of one base army, in two rows:
  row 1 — King (Ice), Bishop, Queen, Rook, Paladin, Archer, Knight-1, Knight-2;
  row 2 — Beast, Guard, Maester, Pawn-2, Pawn-1, Pawn-3, Pawn-4.
- **`lineup-boost-<colour>.png`** shows 6 sculpts: Bishop, Rook, Pawn-2, Pawn-1, Pawn-3, Pawn-4.
  These are the second copies — base + boost gives 2 bishops, 2 rooks and 8 pawns, a complete army.
  The boost lineup is the base lineup minus the unique pieces, on the same 2380×780 canvas, so the right half
  is empty white.

Both are good marketing/reference images. To use one as a background or a header, cut the white
(`magick x.png -fuzz 2% -transparent white out.png`) — the figures are cleanly separated.
Note that the base lineup always uses the **Ice** king, whatever the tint.

---

## 4. Signals for future versions

- **Four retail armies, one king each.** The tinted PSDs pair a faction with a colour exactly once:
  Fire→red, Gaya→green, Sky→purple, Ice→blue. That is the intended army palette. `King-Ice` also exists in
  the other three tints, which reads as a colour test rather than a fifth option.
- **Two bonus kings.** Shadow and Spirit have full sculpts (`final/Extra Kings and Poses`) and grey renders,
  but no tint, no lineup slot and no `.ZTL` colour pass. They look like expansion or promo kings. This matches
  `docs/RULES.md` §4, where Spirit and Shadow are the two kings whose powers are "always on" while the other
  four have activated powers.
- **Six kings, six power pairs.** The six sculpts line up one-for-one with the six power rows in RULES §4
  (Frost, Flame, Stratus, Mud, Spirit, Shadow). Nothing in the 3D files names a power, but the roster is
  complete — a king-selection screen has all the art it needs today.
- **Base / boost split.** The lineups show the retail structure: a 15-mini base set plus a 6-mini boost that
  doubles the bishop, the rook and the pawns. Nothing suggests a third tier.
- **Four pawn sculpts and two knight sculpts.** These are per-figure variety inside one army, not different
  pieces. Useful later for "random pawn sculpt per file" so a rank of eight pawns does not look cloned.
- **No card, spell or power art** anywhere in `3d files`. Nothing here supports RULES §5.

---

## 5. Recommendations

### 5.1 STL to use per piece

Use `final/King Down STL` for all eleven piece types, plus the two kings from `final/Extra Kings and Poses`.
It is one consistent 22 mm-base, Y-up, millimetre coordinate system, and the meshes are 5–20× lighter than the
`Extra STLs for print` versions with no visible loss at 28–37 voxels. The current
`public/models/*.json` already come from this folder — I checked each voxel grid against the source bounding
box and they agree (for example `maester.json` is 31×37×31, and `Maetser_22mm.stl` at 26.41 mm tall with a
22 mm base gives exactly 31×37×31 at `--height 36`). The one grid that cannot be traced to a single file is
`king.json` at 22×37×22: Frost, Celestial, Shadow and Spirit all produce that grid, because all four sit inside
the 22 mm base. Record the chosen king in the pipeline rather than inferring it later.

Ignore `Extra STLs for print` entirely. It adds no sculpt, mixes four scales, and a quarter of it is duplicates.

### 5.2 Voxelizer flags

| File | Flags |
|---|---|
| `pawn_03_22mm.stl` | **`--up y`** — `auto` picks `z` and lays the model on its side |
| everything else in `final/` | `--up auto` is correct (Y is the longest axis) |

`Paladin_22mm.stl` and `knight_pose_22mm.stl` are not at the origin; `voxelize.py` already re-zeroes with
`apply_translation(-m.bounds[0])`, so no flag is needed. Check the `--yaw` of each piece by eye: the sculpts
face different directions, and nothing in the files records a canonical facing.

### 5.3 Kings for the two default armies

Use **`King_Frost_22mm.stl`** and **`King_Ember_22mm.stl`** — Ice (blue) against Fire (red).

Reasons: they are the two clearest silhouettes, they are the lightest and the heaviest mesh in the king set
(418 k and 1.67 M triangles) but both voxelize to the same 22×37×22 grid, Ice is the king in every
`lineup-base-*.png`, and blue-versus-red is the readable default for two armies on one board. Frost and Flame
are also the first two rows of the kings' powers table in RULES §4, so the Phase 2 work lands on the same pair.

Keep Celestial (purple) and Gaya (green) for a colour picker, and Shadow and Spirit for later. Note that
`King_Ember` and `King_Gaya` overhang the base (28.8 mm and 23.7 mm wide against a 22 mm base), so their voxel
grids are wider than a square; the renderer must not assume a fixed footprint.

### 5.4 Artwork pipeline

Convert the tinted PSDs once, at build time or as a committed asset:

```
magick "imgs/colored/<Piece>-<colour>.psd[0]" -trim +repage public/art/<piece>-<colour>.png
```

Fourteen pieces × two army colours is 28 small PNGs, roughly 1 MB total. That covers the piece guide and the
promotion picker without shipping any PSD.

### 5.5 Licensing and attribution

**No licence, copyright notice or credit file exists anywhere in `3d files`.** I searched every PSD, PNG and
STL for `copyright`, `author`, `rights`, `Saar`, `Shai` and `King Down` and found nothing. The only
copyright strings are Pixologic's own, stamped in every `.ZTL` header by ZBrush.

What is recoverable:

- The sculptor's working path, `C:\Users\rafiba\My Projects\Dream Catcher\KING DOWN\Models`, appears inside
  `King_Gaya_140mm.ZTL`, `paladin_30mm.ZTL` and `Shadow_King_resize2.ZTL`. "Dream Catcher" is the parent
  project folder; `rafiba` is the Windows account. This is the closest thing to an artist credit in the files.
- The PSDs were authored on macOS in Photoshop CC between 2015-01-08 and 2015-01-21, two years before the
  2017 release.

Before the art ships in a public build, confirm with Saar who sculpted the minis and how they should be
credited. The Drive folder does not answer it.

---

## 6. What I could not open

- **All 20 `.ZTL` files.** ZBrush's format is proprietary and undocumented; no reader exists outside ZBrush.
  I verified the magic bytes and the file sizes only. The `final/` STLs are exports of these same sculpts,
  so nothing needed for the game is locked inside them.
- **`final/` STL interiors were scanned, not loaded.** Reading a 450 MB ASCII STL into `trimesh` costs several
  GB of RAM, so I streamed each file with `awk` to get the triangle count and bounding box, and rendered
  silhouettes by projecting vertices. The numbers above are exact; no mesh was held in memory.
- I sampled the PSDs rather than opening all 103. I converted all 20 grey renders, plus 13 tinted files across
  every colour and every king, plus the alpha channels of the six pawn and knight renders, and both blue
  lineups. The remainder differ only by tint.
