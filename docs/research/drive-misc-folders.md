# Drive folders `drafts`, `dropbox`, `early inspiration` — inventory and assessment

Source: Google Drive "King Down", local read-only scratch copies. Reviewed 2026-09-13.
136 real files, 222 MB (plus 4 zero-byte macOS `Icon` stubs and one `.DS_Store`, ignored).

These three folders hold **the earliest design work and the retail package**, not new art. `drafts` holds the
only board and rules diagrams in the Drive. `dropbox` holds the printed box, and its back cover carries the
**only copyright notice found anywhere**. `early inspiration` is almost all other people's work.

---

## 1. `drafts` — 7 files, 3.1 MB

All are Adobe Illustrator CC (Macintosh), 2014-01-07 to 2014-08-24. The oldest dated game files in the Drive.

| File | Type | What it is |
|---|---|---|
| `rules.ai` | 1-page AI | 8×8 board. A left column lists the unit types: KING, QUEEN, ROOK, BISHOP, KNIGHT, **?**, **?**, PAWN. Three green markers. 2014-01-07 |
| `rules-02.ai` | 1-page AI | The same sheet with all seven markers placed. 2014-04-05 |
| `rules-02-test.ai` | 1-page AI | A mid-game position; both colours stand on the board. A move test |
| `board-01.ai` | 5-page AI | Board zoning. Four coloured territories grow from four edges. **CAPITOL** first appears on page 3 |
| `board-02.ai` | 3-page AI | The same study, later. Page 3 shows four armies on four edges |
| `proto-board.ai` | 1-page AI | The two-player board: **FRONTLINE PLAYER 1 / 2** strips and a 2×2 **CAPITOL**. 2014-08-24 |
| `proto-board.png` | PNG 500×500 | An export of `proto-board.ai` |

## 2. `dropbox` — 55 files, 41 MB

The Boxshot project files give the path `C:\Users\Saar\Dropbox\outward\…`, so this folder is the designer's
own Windows Dropbox, copied to Drive. It is a **staging copy**; see §8.

| Path | Files | What it is |
|---|---:|---|
| `box packs` | 17 | Four card-pack boxes: **EARTH, FIRE, ICE, SKY**. Front, side and top flats (800×1000 px) plus one 3D render each, and `boxshot-packs.tbs` (a Boxshot 3D project) |
| `main box` | 11 | The retail box: six faces at 1774×1222 px, three 3D renders and two Boxshot projects |
| `model packs` | 8 | Kickstarter single-figure packs: **CROSS (THE BISHOP)** and **BLOCK (THE GUARD)**, each marked "KING DOWN EXCLUSIVE" |
| `pieces collections` | 13 | Twelve 1600×800 renders of the full army in one plastic colour — green, red, blue, purple — plus `pieces.30.psd` (3 flat layers, no useful names). Plastic colour trials |
| `prison` | 6 | Two renders of a walled **keep** and a skull-marked **pit** that hold pieces, plus 4 binary STL models (`prison1`, `prison2`, `prison_combined`, `polysoup`) |

## 3. `early inspiration` — 74 files, 178 MB

| File | Type | What it is |
|---|---|---|
| `King-Down-Mood-03.ai` | 4-page AI | The first art-direction board, 2013-11-14 morning. 14 pinned images |
| `King-Down-Mood-04.ai` | 7-page AI | The full board, same day. 33 pinned images |
| `King-Down-Mood-04-new.ai` | 8-page AI | 2014-02-10. The same 33 images; page 8 is empty |
| `King-Down-Mood-04.pdf` | 7-page PDF | An export of `King-Down-Mood-04.ai` |
| 70 loose JPG / PNG | images | Downloaded reference. 58 are DeviantArt files that name the artist (43 handles). The rest are Kidrobot Munny photos, Lego, Mickey Mouse, Superman, Wolverine, Pokémon, Warhammer and screen grabs |

---

## 4. Useful now

- **The art direction brief.** `King-Down-Mood-04` states the style rule in the designer's words:
  "50% knights, sword fights, kings, horses, castles… / 25% magic, mythology, fantasy… / 25% comical
  features, exaggerated proportions…"; then "be COOL", "strong but simple recurring motifs, themes and
  symbols", "basic forms that lend themselves to customization … easily identifiable". Page 1 rejects the
  opposite: "too gothic, trying too hard to intimidate", "no personality, just armor", "details for details'
  sake". Apply this test to new sprites and UI icons. It agrees with `readability-notes.md`.
- **The credit line.** The box back prints "Copyright © 2014 by Saar Shai"; the front prints "Designed by
  Saar Shai"; side B prints the logos **DOUBLE EDGED GAMES** and **DREAM CATCHER**, with a CE mark and the
  UPC `0 91037 96967`. "Dream Catcher" matches the ZBrush path in `3d files`, so it is the studio name, not a
  folder name. This answers part of the credit question in all three earlier reviews.
- **The pitch text** for a title screen or an about page (quoted in §6, row 4), and the play data printed on
  the box: age **8+**, **2–4** players, **30–60** minutes.

## 5. Useful later

- **A fire deck was designed.** `box packs` holds a finished FIRE PACK box. `drive-cards.md` §9 asks whether a
  fire deck was planned; the box answers yes. The four packs are named ICE and SKY here, not water and air.
- **Off-board holding areas.** `prison/castle.18.png` shows a crenellated **keep** holding six pieces and a
  skull-marked **pit** holding two. This matches the keep and chasm on `Player_mats.jpg`
  (`drive-concept-art.md` §4) and gives Salvation ("revive a taken piece") a place to draw from.
  `prison_combined.stl` is a four-walled tray, 2216 × 2063 × 256 units.
- **A sixth piece name.** The model pack prints **BLOCK (THE GUARD)**. With Bash = Paladin from
  `drive-concept-art.md`, only the Archer and the Maester lack a card name.
- **Army plastic colours.** The 12 renders in `pieces collections` show the whole army in one colour each.
  Use them with `army-pantones.jpg` when a "moulded plastic" piece style is wanted.
- **Retail art** for a store page or a press kit: six box faces, four pack boxes, two figure packs and three
  3D box renders, all clean sRGB PNG.

## 6. Rule differences vs `docs/RULES.md`

| # | File | What it prints | `RULES.md` says |
|---|---|---|---|
| 1 | `proto-board.ai` | "FRONTLINE PLAYER 1" / "FRONTLINE PLAYER 2" — a strip **6 squares wide** (b–g) on each home rank | §2 fills all 8 files of rank 1 / 8 |
| 2 | `proto-board.ai`, `board-01.ai` p3 | "CAPITOL" — a **2 × 2 block** at the board centre (d4–e5) | No capitol. `drive-art-stuff.md` read the painted plan as one square |
| 3 | `board-01.ai`, `board-02.ai` | Four coloured territories from four edges; four camps of six | A two-player game |
| 4 | `main box/Box_cover-back.png` | "King Down, is the prequel to chess. It is an epic strategy game for 2-4 players where each player allies themselves with one King, **hand picks their army** and goes into battle by competing to take down the other Kings **and cross the board to victory**." | §1 wins by checkmate only. §2 draws the army **at random** |
| 5 | `rules.ai`, `rules-02.ai` | The camp column lists eight unit types: KING, QUEEN, ROOK, BISHOP, KNIGHT, **?**, **?**, PAWN. Only **two** new pieces existed in 2014 | §3 has five new pieces: archer, paladin, guard, maester, beast |
| 6 | `prison/castle.18.png` | Pieces stand inside a keep and a pit, off the board | Captured pieces leave play for good |
| 7 | `model packs/guard.png` | "BLOCK (THE GUARD)" | §3 names only Pike, Steed, Cross, Rock, Thorn |

Rows 1–4 describe the 2014 card game, not the 2017 chess variant. Treat them as design history until the
designer says otherwise. Row 7 is a naming gap and can be closed now.

## 7. Third-party / do-not-ship

- **All 70 loose images in `early inspiration` are other people's work.** 58 are DeviantArt downloads whose
  file name carries the artist handle (`*_by_<handle>-<id>`), such as `Black_Knight_by_darksilvania.jpg`. The
  rest are product photos and brand art: Kidrobot Munny, Lego, Mickey Mouse, the Superman logo, Wolverine,
  Pokémon, Warhammer, League of Legends, Spiral Knights and Transformers. Several are whole chess sets by
  other designers. **Reference only. Do not ship, and keep them out of a press kit.**
- **The mood boards embed that material.** `King-Down-Mood-04` pins 33 of these images and `-03` pins 14, so
  the `.ai` and `.pdf` files must not ship either. Their **text** is original and safe to quote; this report
  quotes what matters, so no mood-board page is copied to `drive-assets/`.
- `dropbox` and `drafts` hold **no** third-party material.

## 8. Duplicates

- **`dropbox` is a copy, not a source.** 38 of its 55 files repeat, by name and size, files in the Drive
  folders `page/boxes/`, `outward/` and `King Down Tabletopia/materials/`. Only 17 files are unique here:
  `pieces collections` (13), `prison/prison1.stl`, `prison2.stl`, `prison_combined.stl` and
  `box packs/boxshot-packs.tbs`. Review `page/` and `outward/` before this folder, not after.
- `drafts` and `early inspiration` share **no** file with any other Drive folder, including `mood board`.
- `King-Down-Mood-04.pdf` is an export of `King-Down-Mood-04.ai`, and `-04-new.ai` adds only an empty page.
  Read one file, not four. In `pieces collections`, `*new.png` differs only in the render lighting.

## 9. Reference images copied

8 files in `docs/research/drive-assets/misc/`, each ≤ 1200 px and ≤ 300 KB. All are original King Down art.

| File | Source | Why |
|---|---|---|
| `draft-proto-board-capitol.jpg` | `drafts/proto-board.ai` | the frontline strips and the 2×2 capitol |
| `draft-board-4player-zones.jpg` | `drafts/board-01.ai` p3 | the four-player territory plan |
| `draft-camp-column.jpg` | `drafts/rules-02.ai` | the camp column with two unnamed pieces |
| `box-back-story-blurb.jpg` | `dropbox/main box/Box_cover-back.png` | the pitch text and the copyright line |
| `box-side-credits.jpg` | `dropbox/main box/Box_cover-sideB.png` | 8+, 2–4, 30–60 and the two publisher logos |
| `card-pack-boxes-four-elements.jpg` | `dropbox/box packs/*-3dbox.png` | Earth, Fire, Ice and Sky packs; proof of a fire deck |
| `modelpack-block-the-guard.jpg` | `dropbox/model packs/guard.png` | "BLOCK (THE GUARD)" |
| `prison-keep-and-pit.jpg` | `dropbox/prison/castle.18.png` | the keep and the pit that hold pieces |

## 10. Open questions for the designer

1. **Does the capitol belong in the web game?** The drafts make it a 2×2 centre block with a 6-wide frontline
   on each side. v0.1 has neither. Keep, drop, or make it an option?
2. **Is "cross the board to victory" a real second win condition?** The box prints it. If yes, which squares
   win, and does it replace checkmate or sit beside it?
3. **Do captured pieces go to a prison and come back?** A keep and a pit were modelled and a Salvation card
   exists. Should v0.1 keep captures permanent?
4. **Is the Guard called Block?** That leaves the Archer and the Maester without a card name. Please give both.
5. **What credit line ships?** The box says "Copyright © 2014 by Saar Shai" with DOUBLE EDGED GAMES and DREAM
   CATCHER. Is that still correct for a 2026 web build, and do both studios stay on it?
