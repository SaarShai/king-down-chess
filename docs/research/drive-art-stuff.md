# Drive folder `art stuff` — inventory and assessment

Source: Google Drive "King Down" → `art stuff`, downloaded to a local scratch copy (read-only).
Reviewed 2026-09-13. 224 JPEG files, 93 MB (plus 6 zero-byte macOS `Icon` stubs and one `.DS_Store`, ignored).

Every file is a JPEG. There is no layered source, no vector file and no PDF. All files were written in
Adobe Photoshop between 2014-03-05 and 2014-10-27, three years before the 2017 rulebook. The character work
was made on Windows (CS5 / CS6); the storyboard was made on macOS (CS6). All 224 files are unique by MD5.

---

## 1. Inventory

| Subfolder | Files | Size | Contents |
|---|---:|---:|---|
| `Characters` | 66 jpg | 13.2 MB | Concept sketches, grey ZBrush turnarounds and review sheets, one per design round. Many carry red arrows and hand notes (some in Hebrew) from the designer to the sculptor. Covers every piece and all six kings. |
| `Characters/color guides` | 14 jpg | 23.4 MB | **Finished "KING DOWN — Coloring Reference" sheets.** One per piece, 2956×2220 to 5988×5163. Painted front/side/back views plus a callout list of **Pantone coated codes** per part. |
| `Characters/materials` | 14 jpg | 4.4 MB | Material mood boards, 1920×1062. Grey sculpt in the middle, lines to reference photos. **The references are third-party photos, film and TV stills** — see §4. |
| `Illustrations` | 20 jpg | 20.0 MB | Logo art and sketches, the four element emblems (finished), board design art and notes, and rough card/spell illustrations. |
| `storyboard` | 110 jpg | 31.3 MB | A greyscale value storyboard for an animated teaser. All 1280×720, all exported on 2014-06-12. |

The 14 colour guides and the 14 material sheets cover the same list: Archer, Beast, Bishop, Guard, Knight,
Maester (spelt `mister` / `Meister`), Paladin, Pawn, Queen, Rook, and the four kings Celestial, Ember, Frost, Gaya.
**King Shadow and King Spirit have no colour guide and no material sheet** — the same gap as in `3d files`.

---

## 2. Useful now

### 2.1 Piece colour — the canonical palette

`Characters/color guides/*.jpg` are the source of truth for how each piece is coloured. Each sheet names the
part and gives a Pantone coated code, for example the Guard: helmet `C 7543` / `Cool grey 10 C`,
armour rims and arms `C 446` / `Black C`, eyes and face `C 7485` / `Black 6 C`.
Every piece stands on the same red base, written `red 032c` on the older sheets and `C 1805` on the newer ones.

`public/sprites/painted-*` already come from these sheets, so no new extraction is needed. The remaining
value is the written Pantone list: it fixes the army palette in print terms, not guesswork.

Piece colour in one line each: Archer green, Beast dark blue, Bishop magenta, Guard blue-grey, Knight red and
skin, Maester olive and brown, Paladin blue and white with a gold cross, Pawn bare metal, Queen white and red,
Rook stone, King Celestial gold and blue, King Ember gold and red, King Frost ice blue, King Gaya green and bone.

### 2.2 Board and UI motifs

- `Illustrations/board-02_sketchy_notes2.jpg` (8000×7924) — the painted stone board. Light and dark squares
  are cracked earth, cut stone and boulders. Good tile reference. Compare with the tiles already in
  `docs/research/drive-assets/board/`.
- `Illustrations/board-ref.jpg` — the board colour plan. Four element zones on the edges (blue = ice,
  green = earth, red = fire, purple = sky) around a yellow centre square marked **CAPITOL**.
- `Illustrations/board-02_sketchy_notes.jpg` — the designer's own brief, written on the art:
  "this should be like chess board, dark and bright squares, so the dark should be the ocean and the bright
  should be the floating ice"; "crown points to one of the players, best to leave it out".
  Read this before any board restyle: the light/dark contrast must survive the texture.
- `Illustrations/Emblems_small.jpg` and `Illustrations/all.jpg` (4963×1280) — the four element emblems,
  finished, on white. Ready for army badges, a favicon or a king-selection screen. Cut the white with
  `-fuzz 2% -transparent white`.
- `Illustrations/logo.jpg` — the KING DOWN logo (sword, crown, shield banner), clean line art.
- `Characters/Silhouettes_round2.jpg` — black silhouettes of Guard, Maester, Paladin and Archer, three
  variants each. The best source for flat UI icons or move hints.

---

## 3. Useful later

### 3.1 Kings and armies (RULES §4)

- `Characters/KingRedraw.jpg` — four king silhouettes labelled **ICE, NAT, FIR, AIR**. This is the four-army
  retail set: Frost, Gaya (nature, not mud), Ember, Celestial.
- `Characters/Shadow_king2.jpg`, `Characters/Spirit_king2.jpg` — full painted concept art of the two bonus
  kings. Shadow is black and blood-red with a raven on the shoulder. Spirit is white on white with a long
  beard and a cross crown. These two files are the **only** colour reference for Shadow and Spirit anywhere.
- `Characters/KingsNEW.jpg`, `Kings_design2.jpg`, `Kings_sketches.jpg`, `KingLineup.jpg` — design rounds for
  the king silhouette. Useful if a king-selection screen needs more than one pose.

### 3.2 Card and spell effects (RULES §5)

`Illustrations/sketches01.jpg` and `Illustrations/scatches02.jpg` are near-black CMYK files. Raise the levels
and they show **numbered card illustrations with captions**:

| # | Name | Caption on the sheet |
|---:|---|---|
| 1 | Revival | "Light coming out of a grave in a dark grave yard" |
| 2 | Blessing | "A shield protected by an energy of light, can't be harmed by any weapon" |
| 6 | Overgrowth | "A sword can't go through a wall of thorns" |
| 7 | Mirror Image | (a beast mirrored in ice) |
| 8 | Strike | (a flaming skull over broken ground) |
| 10 | Firewall | (a rider before a wall of flame) |

`Illustrations/illus_02.jpg` is card 2 alone; `illus_07.jpg` and `illus_07b01.jpg` are card 7 alone.
The numbering runs to at least 10, so six of ten or more concepts survive. All are rough pencil; none is finished.

### 3.3 Story, lore and marketing

- `storyboard/KingDown_sb_WIP_0001…0110.jpg` — a teaser in five beats: a dead king is carried up the steps to
  an empty throne; crossed axes glow; a herald announces to a crowd; a map shows four houses around a central
  castle; the four elemental kings raise their armies; the logo lands on frame 110.
- `storyboard/KingDown_sb_WIP_0042.jpg` — the map frame. A central castle with four house shields around it:
  air (spiral), fire (flame), water (wave), earth (leaf). This is the same layout as the CAPITOL board plan.
  Note the map uses a **water** wave for the house whose finished emblem is an **ice** crystal.
- `Illustrations/emblems sketches.jpg`, `logo_scatches*.jpg` — rejected emblem and logo variants.

---

## 4. Licensing and credits

**No licence, copyright notice, artist name or credit exists in any file.** I read the EXIF, XMP, IPTC and ICC
blocks of all 224 files. The only names are Adobe's and HP's, inside the colour profiles. There is no
`dc:creator`, no `photoshop:Credit`, no embedded file path and no watermark. The working dates
(2014-03 to 2014-10, UTC+02/+03) and the Windows/macOS split are the only evidence, and they point at two
different people: a character artist on Windows and a storyboard artist on macOS.

**`Characters/materials` carries a real risk.** Each of the 14 sheets pins third-party images around the
sculpt: stock photos of plate armour, boulders, towers, tiaras, wedding dresses and icicles, plus what appear
to be stills and character art from commercial films and TV. These were mood reference for the sculptor.
They are fine as a private brief and **must not ship in a public build or a press kit**. Nothing in
`color guides`, `Illustrations` or `storyboard` has that problem — that work is all original.

---

## 5. Copied reference images

12 files, downscaled to ≤ 1200 px and ≤ 300 KB, in `docs/research/drive-assets/art-stuff/`:

| File | Source | Why |
|---|---|---|
| `emblems-four-elements.jpg` | `Illustrations/Emblems_small.jpg` | the four army emblems, finished |
| `logo-king-down.jpg` | `Illustrations/logo.jpg` | the logo |
| `board-stone-painted.jpg` | `Illustrations/board-02_sketchy_notes2.jpg` | painted board tiles |
| `board-colour-plan.jpg` | `Illustrations/board-ref.jpg` | four zones and the CAPITOL square |
| `board-designer-notes.jpg` | `Illustrations/board-02_sketchy_notes.jpg` | the board brief in the designer's words |
| `silhouettes-fairy-pieces.jpg` | `Characters/Silhouettes_round2.jpg` | UI icon source |
| `colour-guide-guard-example.jpg` | `Characters/color guides/guard_color_ref.jpg` | shows the Pantone sheet format |
| `kings-four-element-silhouettes.jpg` | `Characters/KingRedraw.jpg` | ICE / NAT / FIR / AIR |
| `king-shadow-concept.jpg` | `Characters/Shadow_king2.jpg` | only colour reference for Shadow |
| `king-spirit-concept.jpg` | `Characters/Spirit_king2.jpg` | only colour reference for Spirit |
| `cards-spell-concepts-brightened.jpg` | `Illustrations/sketches01.jpg` + `scatches02.jpg` | six named card concepts; **levels raised**, the originals are near-black |
| `storyboard-map-four-houses.jpg` | `storyboard/KingDown_sb_WIP_0042.jpg` | the world map and the four houses |

---

## 6. Open questions for the designer

1. **Who made this art, and how do they want to be credited?** The 3D folder gave only a Windows account name
   (`rafiba`). This folder gives nothing at all, and the storyboard looks like a second artist's work.
2. **Is the fourth army "Mud" or "Gaya"?** RULES §4 says Mud. The art says Gaya and `NAT`, and the emblem is
   ram horns, wood and vines — nature, not mud. Which name ships?
3. **Do the card illustration names replace the names in RULES §5?** Revival, Blessing, Overgrowth, Mirror
   Image, Firewall do not match Salvation, Shield, Growth, Mirror, Burn. How many cards are in the set?
4. **Does the CAPITOL centre square belong in the web game?** The board plan and the storyboard map both build
   the world around it, and RULES §5 mentions a "capital zone", but v0.1 has no such square.
5. **Can the `materials` sheets be shown to anyone outside the team?** They contain third-party photos and what
   look like film stills.
