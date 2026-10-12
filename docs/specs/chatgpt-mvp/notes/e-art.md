# Art and visual assets for the ChatGPT plugin MVP

Explorer note, area E. Read only. Repository: main checkout, branch `main` (e73f8061), plus the
worktree `.claude/worktrees/multiplayer-foundation` (branch `claude/multiplayer-foundation`,
41 commits ahead of main). All sizes are bytes on disk unless the note says otherwise.

## 0. The short answer

- The plugin board embeds **20 WebP images** as base64 data URIs: 11 piece sheets, 6 king sheets,
  1 stone board, 2 king-effect masks. They come from `docs/2d-first-pieces/`, not from `public/`.
  Raw total 2,937,532 bytes; as base64 in the page, 3,917,196 bytes. That is **91 % of the page**.
- The budget is nearly full. The page on main is about **4,296,133 bytes** (ticket 32 record). The
  multiplayer branch build is **4,325,857 bytes** (JSON payload 4,327,040). The hard stop is
  4,400,000 payload bytes (`tools/plugin-ui-build.mjs:16`). The project's "stop and ask" line is
  4,350,000 (`docs/specs/web-redesign/spec.md:63`). **Free on the multiplayer branch: about 72,960
  bytes to the hard stop, about 22,960 bytes to the ask line.** One raster image of normal size does
  not fit.
- The plugin CSP blocks all outside images: `_meta.ui.csp.resourceDomains: []`
  (`src/plugin/server.ts:16` and `:24`). So today every image must be inline.
- Good news: much MVP art already exists in `public/ui/` (king portraits, emblems for the king coin,
  piece cut-outs, piece icons as SVG, 10 card faces and a card back). None of it is in the plugin.
- Missing for the MVP: a scroll frame for the games registry, achievement badges, menu toggle art
  (can be CSS/SVG), card art for about 26 of the 36 cards, and a power-specific coin face (today the
  coin shows the king's emblem, not the power).
- Recommended route: (a) draw new UI from what is already inline (crop king and piece figures from
  the sheets on a canvas, zero new bytes), (b) use inline SVG for icons, seals, toggles, frames,
  (c) for raster art (cards, emblems, portraits, scroll), open `resourceDomains` to the plugin's own
  origin and serve `public/ui/` from it. Choice (c) is an owner/planner decision (section 9).

---

## 1. Project rules that apply to art

| Rule | Source |
|---|---|
| New images come only from Codex's built-in `image_gen` on the owner's ChatGPT plan (`codex exec ... < /dev/null`, or the project wrapper). No paid OpenAI images API, no imagegen CLI fallback, unless the owner asks in the current conversation. If image_gen cannot do it, say so and ask. | `~/.claude/CLAUDE.md`, "Image generation" |
| A visual build waits for the owner's yes on a rendered sample. The owner approves each spec before its build. | `AGENTS.md:46` |
| A visual step stays a draft PR until the owner says yes to a rendered sample from the step branch. Sizes: phone 390×844 (DPR 2), desktop 1440×900. | `docs/specs/web-redesign/spec.md` §2 rule 3 |
| Every module that `src/plugin/app.ts` imports also runs in the plugin page. A change to a shared module: keep old behaviour as default, run `plugin-ui` and `plugin-ui-http`, record the page size before and after, **add no new raster image to a shared module** (draw new marks on the canvas), stop and ask past 4,350,000 bytes. | `docs/specs/web-redesign/spec.md:58-66` (rule 5) |
| Clay look is parked: build, render and review the painted look only. | memory `project-clay-parked.md` (2026-10-11) |
| Licences are unconfirmed for the 2014/2015 art (sculpts, board marble, card illustrations, Imperator fonts). Confirm with the designer before a public build. | `art-src/MANIFEST.md:14-24`, `:165-179`, `:199-214` |
| Imperator fonts: "licence unknown - reference only, do not ship". | `art-src/MANIFEST.md:278-290` |
| Generated assets carry a `.prompt.txt` beside the master in `art-src/` and a manifest row. | `art-src/MANIFEST.md` (cards/generated, emblems, workshop) |

---

## 2. What the plugin board embeds today, and how

### 2.1 The build

`tools/plugin-ui-build.mjs` (19 lines):

- Runs Vite on `src/plugin/` with `assetsInlineLimit: Number.MAX_SAFE_INTEGER` (line 6). Every asset
  that the code imports through `new URL('…', import.meta.url)` becomes a base64 data URI in the JS.
- Inlines the script (line 11) and the CSS (line 12) into one HTML file.
- URI: `ui://kingdown/board-<sha256 of html>.html` (line 13). A changed page gets a new URI.
- Guard: `JSON.stringify({contents:[{uri,mimeType:'text/html;profile=mcp-app',text:html}]})` must be
  ≤ 4,400,000 bytes, else the build throws (lines 14-16). `tools/plugin-server-check.mjs:68` checks
  the same limit on the served resource.
- Prints the **HTML** byte length (line 19), not the payload length. The payload is about 1,183 bytes
  larger (JSON escapes). Measure the payload when near the line.

### 2.2 The page shell

- `src/plugin/index.html` (990 bytes, one line): header "King Down", `#status`, `#board`,
  `#move-hint`, `#choices`, `#error`, nav buttons (`#reload`, `#retry`, `#computer`, `#invite`), a
  `<details>` "Games" with `#solo`, `#friend`, `#resume`, `#token`, `#join`, and `#invitation`.
  **No image, no icon, no SVG.**
- `src/plugin/app.css` (1,232 bytes, one line): system-ui font, host colour variables
  (`--color-text-primary`, `--color-background-primary`, `--color-background-secondary`) with
  parchment-like fallbacks (`#302821`, `#f4eee6`, `#fff9f0`). **No image, no font file.**
  `docs/plugin-preparation.md:64`: "UI controls use system typography."
- `src/plugin/app.ts` (117 lines): `new PaintedView($('board'))` (line 17), `board.setPace('off')`
  (line 18). All art comes in through `PaintedView` → `createScene`.

### 2.3 The art chain

`src/render/PaintedView.ts:1` imports `createScene` from
`docs/2d-first-pieces/board/scene.mjs`. That module and `board/king-sheets.mjs`,
`board/king-effects.mjs` list the images as literal `new URL(...)` (one literal per file so the
bundler inlines it):

| Key | File (under `docs/2d-first-pieces/`) | Bytes | Pixels | Declared at |
|---|---|---:|---|---|
| pawn | `lance/pawn.webp` | 102,982 | 1536×1024 | `board/scene.mjs:35` |
| knight | `knight/knight.webp` | 146,462 | 1536×1024 | `board/scene.mjs:35` |
| bishop | `bishop/bishop.webp` | 110,078 | 1536×1024 | `board/scene.mjs:35` |
| rook | `rook/rook.webp` | 173,062 | 1536×1024 | `board/scene.mjs:35` |
| queen | `queen/queen.webp` | 127,318 | 1536×1024 | `board/scene.mjs:35` |
| archer | `wrist-bow/archer.webp` | 149,960 | 1536×1024 | `board/scene.mjs:35` |
| paladin | `paladin/paladin.webp` | 158,540 | 1536×1024 | `board/scene.mjs:35` |
| guard | `guard/guard.webp` | 205,704 | 1536×1024 | `board/scene.mjs:35` |
| maester | `maester/maester.webp` | 140,628 | 1536×1024 | `board/scene.mjs:35` |
| beast | `beast/beast.webp` | 170,322 | 1536×1024 | `board/scene.mjs:35` |
| ogre | `ogre/ogre.webp` | 123,464 | 1536×1024 | `board/scene.mjs:35` |
| king frost | `king-frost/king.webp` | 199,192 | 1536×1024 | `board/king-sheets.mjs:3` |
| king flame | `king-flame/king.webp` | 165,206 | 1536×1024 | `board/king-sheets.mjs:3` |
| king stratus | `king-stratus/king.webp` | 210,548 | 1536×1024 | `board/king-sheets.mjs:3` |
| king mud | `king-mud/king.webp` | 146,456 | 1536×1024 | `board/king-sheets.mjs:3` |
| king spirit | `king-spirit/king.webp` | 113,210 | 1536×1024 | `board/king-sheets.mjs:3` |
| king shadow | `king-shadow/king.webp` | 247,668 | 1536×1024 | `board/king-sheets.mjs:3` |
| board | `board-art/stone-board.webp` | 112,300 | 1024×1024 | `board/scene.mjs:38` |
| lava mask (Flame king effect) | `king-flame/lava-mask.webp` | 107,994 | — | `board/king-effects.mjs:22` |
| smoke mask (Shadow king effect) | `king-shadow/smoke-mask.webp` | 26,438 | — | `board/king-effects.mjs:23` |
| **Total** | 20 files | **2,937,532** | | |

Measured from the built `plugin-server-dist/board.html` in four worktrees: 20 `data:image/webp`
URIs, 3,917,196 bytes of data URI text.

- Each sheet is one pair: the **ivory (White) army on the left, the charcoal (Black) army on the
  right** (`board/king-sheets.mjs:1`, `art-src/MANIFEST.md:294-300` for the same layout).
- Kings load on demand: the two in play before the scene is ready, the others when a side picks
  one (`board/scene.mjs` `kingImage`). But all six are already in the page bytes.
- King design per side: `PaintedView.ts:42`
  `kingDesign = (c) => (RULES.kings[c]?.king ?? PLAIN_KINGS[c]).toLowerCase()`. `setKings` re-reads
  it (`PaintedView.ts:115`). So **"king powers off" already shows White = Spirit, Black = Shadow**
  on the plugin board.
- Pieces with no painted art (lab pieces `catapult`, `reaver`, `templar`; letters C V T) draw as a
  lettered disc: `token(value)` in `board/scene.mjs:103-110` (Georgia, `LETTERS`).
- Letter chips over every piece already exist: `setLabels(on)` (`board/scene.mjs:948`),
  `drawLabels()` (`:846-852`), a small disc with the piece letter at the square's upper right.
- Move/take marks are canvas vector drawing (`src/render/marks.ts`, `src/render/legend.ts` on main),
  no raster. Note: `legend.ts` (the owner's range-tile legend, 192 lines) is on main but **not on
  the multiplayer branch** yet (the branch diff deletes it, because the branch is older than the
  merge of PR #41). A merge will add it back; it is vector code, a few KB.

### 2.4 Budget history (page bytes from `node tools/plugin-ui-build.mjs`)

| When | Bytes | Source |
|---|---:|---|
| Web-redesign spec baseline | 4,291,318 | `docs/specs/web-redesign/spec.md:63` |
| Ticket 10 (power coin) | 4,292,542 | `issues/10-power-coin.md:41` |
| Ticket 13 | 4,294,665 | `issues/13-their-turn-tell.md:44` |
| Ticket 30 | 4,296,101 | `issues/30-batch-3-small-repair.md:54` |
| Ticket 32 (latest main record) | 4,296,133 | `issues/32-polish-2.md:24` |
| Built `mp-03`, `mp-08` worktrees | 4,296,150 (payload 4,297,333) | measured |
| Built `multiplayer-foundation`, `mp-09` (HEAD 584b6b14 "ChatGPT tools…") | 4,325,857 (payload 4,327,040) | measured |

Headroom on the multiplayer branch: 72,960 bytes to the hard stop; 22,960 to the ask line. The MVP
adds new screens (setup, toggles, pickers, arrangement, profile, settings) in code too, so the code
alone can eat most of this.

---

## 3. Pieces

Engine set (`src/rules/engine.ts:19-23`): `P N B R Q K A L G M S O C V T` =
pawn, knight, bishop, rook, queen, king, archer, paladin, guard, maester, beast, ogre, catapult,
reaver, templar. Fairy pieces of King Down: archer, paladin, guard, maester, beast, ogre. Lab pieces
with no art: catapult, reaver, templar.

| Piece | Board sheet (inline in plugin) | Cut-out portrait | Icon (SVG) | Old sprites |
|---|---|---|---|---|
| pawn | `docs/2d-first-pieces/lance/pawn.webp` ✔ | `public/ui/pieces/pawn-w.webp` 15,592 / `pawn-b.webp` 12,188 | `public/ui/icons/pawn.svg` 1,783 | `public/sprites/*/pawn-*.png` |
| knight | `knight/knight.webp` ✔ | `knight-w` 19,408 / `-b` 17,184 | `knight.svg` 3,470 | yes |
| bishop | `bishop/bishop.webp` ✔ | `bishop-w` 14,578 / `-b` 11,980 | `bishop.svg` 4,300 | yes |
| rook | `rook/rook.webp` ✔ | `rook-w` 22,268 / `-b` 18,710 | `rook.svg` 2,208 | yes |
| queen | `queen/queen.webp` ✔ | `queen-w` 15,544 / `-b` 13,926 | `queen.svg` 5,596 | yes |
| king | 6 king sheets ✔ (section 4) | `public/ui/kings/*` | `king.svg` 5,232 | yes |
| archer | `wrist-bow/archer.webp` ✔ | `archer-w` 17,230 / `-b` 16,192 | `archer.svg` 4,580 | yes |
| paladin | `paladin/paladin.webp` ✔ | `paladin-w` 20,704 / `-b` 17,790 | `paladin.svg` 2,120 | yes |
| guard | `guard/guard.webp` ✔ | `guard-w` 23,924 / `-b` 23,080 | `guard.svg` 2,358 | yes |
| maester | `maester/maester.webp` ✔ | `maester-w` 16,862 / `-b` 15,088 | `maester.svg` 3,241 | yes |
| beast | `beast/beast.webp` ✔ | `beast-w` 24,190 / `-b` 21,568 | `beast.svg` 5,779 | yes |
| ogre | `ogre/ogre.webp` ✔ | `ogre-w` 16,094 / `-b` 12,920 | `ogre.svg` 1,321 (new, owner's option B) | **no** (no ogre in `public/sprites/`) |
| catapult, reaver, templar | none (lettered token) | none | none (`src/piece-icons.ts:10`) | none |

- Portraits: `public/ui/pieces/<piece>-w|b.webp`, 270×320 (pawn measured), 22 files, 387,020 bytes.
  Cut from the painted sheets by `docs/visual-design/make-ui-art.py`.
- Icons: `public/ui/icons/<piece>.svg`, 12 files, 41,988 bytes in all. 48-unit viewBox, root
  `<svg id="icon">`. Paint by CSS: disc `--pi-disc` (default `#bccac8`), ring `--pi-ring` /
  `currentColor`, glyph `--pi-glyph` / `currentColor`. Classes `.pi`, `.pi-w`, `.pi-b` in
  `src/style.css`. Markup helper `pieceIcon(t, army?)` in `src/piece-icons.ts:13-18` uses
  `<use href="${BASE_URL}ui/icons/<name>.svg#icon">` — **an outside file reference; it does not
  work in the plugin as is** (no file host, CSP empty). For the plugin, inline the path data (raw
  ~42 KB; a minified, de-commented copy is smaller). Source: the 2017 rulebook vectors,
  `tools/extract-piece-icons.py`; Ogre options A/C in `docs/visual-design/piece-icons/`.
- `public/sprites/` (2.8 MB) and `public/models/` (804 KB) belong to the old voxel/sprite looks
  (`src/render/sprites.ts:61`). They use the old retail king names (celestial, ember, frost, gaya).
  Do not use them for the MVP.
- `public/ui/workshop/` (66 WebP, 2,338,712 bytes, 338×448): 33 Workshop custom-piece figures
  (antler-guardian … wooden-catapult, ids in `src/workshop/figures.ts`, `figureUrl` at line 253).
  They are not draw-pool pieces. Not needed for the MVP unless custom pieces come in.

**Settings "icon mode" (symbols only):** no such mode exists in the painted scene. Parts that exist:
the icon SVGs, the `token()` disc path, `setLabels()`. A build can add an icon mode that draws each
piece as its icon disc in place of the figure, on the canvas, with `Path2D` from the SVG path data.
Cost: the icon path data (≤ ~42 KB raw, less after stripping comments and the duplicated ring
circles) plus code. It removes no bytes: the figure sheets stay inline for the normal mode. The
icons are vector, so the mode needs **no new image**. The disc colours for White/Black exist in
`src/style.css` (`.pi-w` pale disc, `.pi-b` charcoal disc, pale glyph).

---

## 4. Kings

Six kings (`src/rules/rules.ts:82`, `KingName`): **Frost, Flame, Stratus, Mud, Spirit, Shadow**.
Powers (`rules.ts:154-161`, `KINGS`): Frost Freeze/IceWall · Flame Strike/Haste · Stratus
Flight/Sacrifice · Mud March/Leap · Spirit HolyLight/Mercy · Shadow DeathTouch/Darkness.
Plain kings (no power): `PLAIN_KINGS = ['Spirit', 'Shadow']` (`rules.ts:167`) — White's
**Spirit King**, Black's **Shadow King** (owner, 2026-10-03). This matches the MVP toggle "king
powers off".

Old retail names (sculpts, `art-src/pieces/`, `public/sprites/painted-*`): Celestial, Ember, Frost,
Gaya, plus Spirit and Shadow. Ember = Flame, Gaya = Mud, Celestial = Stratus (by the six-to-six map
of `KING_DESIGNS` order; confirm with `docs/2d-first-pieces/README.md` if it matters).

| King | Board sheet (inline ✔) | Portrait White | Portrait Black | Emblem (coin face) |
|---|---|---|---|---|
| Frost | `docs/2d-first-pieces/king-frost/king.webp` 199,192 | `public/ui/kings/frost.webp` 19,326 | `frost-b.webp` 19,386 | `public/ui/emblems/frost.webp` 22,906 (water emblem) |
| Flame | `king-flame/king.webp` 165,206 (+ lava mask) | `flame.webp` 18,750 | `flame-b.webp` 16,200 | `flame.webp` 16,500 (fire emblem) |
| Stratus | `king-stratus/king.webp` 210,548 | `stratus.webp` 19,860 | `stratus-b.webp` 18,432 | `stratus.webp` 14,504 (air emblem) |
| Mud | `king-mud/king.webp` 146,456 | `mud.webp` 17,172 | `mud-b.webp` 15,660 | `mud.webp` 15,746 (earth emblem) |
| Spirit | `king-spirit/king.webp` 113,210 | `spirit.webp` 14,564 (221×320) | `spirit-b.webp` 13,192 | `spirit.webp` 15,188 (made 2026-10-03, image_gen) |
| Shadow | `king-shadow/king.webp` 247,668 (+ smoke mask) | `shadow.webp` 25,050 | `shadow-b.webp` 22,362 (232×320) | `shadow.webp` 16,264 (made 2026-10-03, image_gen) |

- Portraits: `public/ui/kings/`, 12 WebP, 219,954 bytes, about 220×320.
- Emblems: `public/ui/emblems/`, 6 WebP, 101,108 bytes, 256×256. Cut by
  `docs/visual-design/make-emblems.py` from `art-src/emblems-logo/*emblem.png` (1772×1772 element
  emblems; Spirit/Shadow 1254×1254). Unused alternatives: `art-src/emblems-logo/generated-variants/
  spirit-b.png`, `shadow-b.png`.
- Masters: `art-src/pieces/final-ivory/` holds `Spirit_king_color.png` and `Shadow_king_color.png`
  with a **baked shadow** (no clean build exists) (`art-src/MANIFEST.md:102-103`). The painted
  board sheets are the clean source in practice.
- Where the web app uses them: `src/ui/table.ts:195` (portrait by side, `-b` for Black),
  `src/ui/guide.ts:21`, `src/new-game.ts:118` (emblem buttons in the king picker),
  `src/ui/coin.ts:22` (power coin), `src/workshop/ground.ts:55`, `index.html:85-87` (title).

**For the plugin, zero-byte option:** crop a king portrait from the inline king sheet on a canvas
(`drawImage(sheet, sx, sy, sw, sh, …)`; origins per design in `docs/2d-first-pieces/court-motion.mjs`
`kings` table, lines 18-25). Same for piece portraits in the arrangement screen. No new bytes, no new
art. Inline emblems instead cost about 135 KB as base64 — they do not fit.

---

## 5. King powers and the king coin

- There is **no per-power coin art**. The web app's power coin (`src/ui/coin.ts`, `coinRow`) is a
  `<button class="coin">` with the **king's emblem** image (`ui/emblems/<king>.webp`, line 22),
  notches for uses (`.notches`, `.notch`, `.is-spent`, lines 25-35), `data-state`
  (`always` / armed / …) and an aria label from `coinWords` (`src/powers-ui.ts`), e.g.
  "Freeze · 1 left". The coin frame is CSS. Decided by the owner: "King powers: B, a coin by the
  portrait" (`docs/specs/web-redesign/spec.md` §3, ticket 10).
- Card coins join the same row after the power coin (`coin.ts:4` comment; ticket 24, blocked).
- Power vignettes (small animated board pictures per power) exist in the web New game dialog:
  `src/power-motion.ts` / `.css` (branch `claude/power-motion` per `docs/visual-design/README.md`
  round 3; check whether it merged). They are CSS/SVG motion, not images.
- The MVP's "click the king's coin to open a sub-menu, pick a king and a power" needs: six king
  choices (emblems or cropped portraits) and 12 power choices (text plus, optionally, a glyph).
  **Missing:** a glyph per power (12). Options: words only (the owner's coin reads in words), the
  2014 card art where it exists (section 6), or new SVG glyphs (no image_gen needed; still needs a
  sample and the owner's yes).

---

## 6. Cards

Card list (`src/rules/rules.ts:91-94`, `ALL_CARDS` at `:190`): the 8 spent powers
(Freeze, IceWall, Strike, Haste, Flight, Sacrifice, March, Leap) then the 28 `CARD_ONLY`
(Mimic, Vault, Curse, SkyLift, Salvation, Rage, RageB, Mirror, MirrorB, Firewall, FirewallB,
EarthQuake, EarthQuakeB, Burn, FireStarter, Control, Rescue, Growth, GrowthB, Rally, Morph,
MorphB, Spawn, SpawnK, Spawn2, SpawnK2, MorphP, MorphS). **36 cards.** (HolyLight, Mercy,
DeathTouch, Darkness are always-on powers and are not cards.)

Shipped card faces: `public/ui/cards/`, 512×512 WebP, 370,356 bytes in all.
List in code: `ART` in `src/workshop/ground.ts:63`; others fall back to `back.webp` (`:65`).

| Card | Shipped face | Source in `art-src/cards/` | Note |
|---|---|---|---|
| Freeze | `freeze.webp` 54,796 | `generated/freeze.png` (2026-10-03) | image_gen |
| IceWall | `icewall.webp` 43,644 | `generated/icewall.png` | image_gen |
| Sacrifice | `sacrifice.webp` 11,546 | `sacrifice.jpg` (2014) | |
| March | `march.webp` 40,908 | `generated/march.png` | image_gen |
| Leap | `leap.webp` 15,212 | `leap.jpg` (2014) | |
| Mimic | `mimic.webp` 27,094 | `generated/mimic.png` | image_gen |
| Vault | `vault.webp` 47,940 | `generated/vault.png` | image_gen |
| SkyLift | `skylift.webp` 46,788 | `generated/skylift.png` | image_gen |
| Salvation | `salvation.webp` 10,146 | `illus_01.jpg` (2014) | |
| Rescue | `rescue.webp` 21,368 | `rescue.jpg` (2014) | owner note on Rescue art 2026-10-10 (memory `project-rules-ui-direction.md`) |
| (back) | `back.webp` 50,914 | `generated/back.png` (gold crown on navy) | square; crop for portrait |
| Strike | **none shipped** | `illus_08.jpg` (2014, 1134×1181 CMYK) | source exists |
| Haste | none shipped | `illus_04.jpg` | source exists |
| Flight | none shipped | `illus_03.jpg` | source exists |
| Curse | none shipped | `illus_09.jpg` | source exists |
| Rage, RageB | none shipped | `illus_05.jpg` | source exists |
| Growth, GrowthB | none shipped | `illus_06.jpg` | source exists |
| Mirror, MirrorB | none shipped | `illus_07.jpg` | source exists |
| Firewall, FirewallB | none shipped | `illus_10.jpg` | source exists |
| Control | none shipped | `control (2).jpg` (793×826) | source exists |
| (Shield) | — | `illus_02.jpg` | a 2014 card with no current engine card |
| EarthQuake(B), Burn, FireStarter, Rally, Morph, MorphB, MorphP, MorphS, Spawn, SpawnK, Spawn2, SpawnK2 | **none** | **none** | needs image_gen, or a text-only face |

Count: 10 faces shipped; 9 more card names (13 with B variants) have 2014 source art that needs a
cut (CMYK JPEG → sRGB WebP, like `make-ui-art.py`); 12 card names have no art at all.
Licence: "original art; a second artist is likely" (`art-src/MANIFEST.md:203`).
Card print reference: `art-src/cards/Bow.pdf`, `King-Ice.pdf`, `Leap.pdf` (print layout of unit,
king and spell cards); card titles used Imperator (do not ship). The Proving Ground draws card
tiles as `<img class="art">` + title + a king-emblem badge (`src/workshop/ground.ts:1375`).

**Plugin cost:** all 11 faces as base64 ≈ 494 KB. Does not fit. Thumbnails at 96 px would be
roughly 3-5 KB each (estimate, not measured), ≈ 40-70 KB base64 for 11 — still past the ask line
on the multiplayer branch. The card feature in the plugin needs either a text-and-CSS card face, or
outside image hosting (section 9).

---

## 7. Board and tiles

| Asset | Path | Bytes | Pixels | Use |
|---|---|---:|---|---|
| Painted stone board (plugin, game canvas) | `docs/2d-first-pieces/board-art/stone-board.webp` | 112,300 | 1024×1024 | inline ✔ |
| Stone board (web CSS, title) | `public/ui/stone-board.webp` | 29,566 | 640×640 | `src/style.css:555`, `index.html:81`, `src/workshop/ground.css:187` |
| Marble board master | `art-src/board/board-2500x2500px.png` | 5.2 MB | 2500×2500 | not used; stock-texture licence open |
| Colour board master | `art-src/board/master-standard-board-01-2048.png` | 4.6 MB | 1959×2048 | not used |
| Tile albedos | `art-src/board/white_tile_1-3.jpg`, `black_tile_1-3.jpg` | ~50 KB each | 512×512 | old 3D look |
| Stone slab | `art-src/board/board_texture1.jpg` | 3.5 MB | 4000×4000 | not seamless |
| Board brief (handwriting) | `art-src/board/board-02(1).jpg` | 4.3 MB | — | reference |

Range-tile legend (the owner's move/capture tile key): source `art-src/emblems-logo/range-tiles.png`
(1920×1080, 2.4 MB). In the game it is **vector canvas drawing**: `src/render/legend.ts`
(`badge`, `kindOf`, `paint`, `tile`; on main), used by `marks.ts`. Rows: Move = green tile;
Capture = white tile with red target (on an enemy: red edge, ring, badge at top-left); Archer shot
= target pierced by an arrow (`docs/visual-design/README.md` round 2 table). Threat marks: amber
triangle "!" and amber diamond at the bottom-right corner (move-legend ticket 02). Colours:
`--leg-green #7cb342`, `--leg-navy #1c2e5c`, `--leg-red #d63428`. The rules-UI research mockups
(`docs/research/rules-ui-2026-10-10/mockups/`) carry their own copies of the assets and the token
kit (`mockups/assets/KIT.md`). No raster cost for the legend.

---

## 8. UI chrome: scroll, badges, toggles, settings icon, fonts

| MVP need | What exists | Where | Gap |
|---|---|---|---|
| **Scroll / parchment frame for the games registry** | No scroll image anywhere (`public/`, `art-src/MANIFEST.md`, docs searched). Parchment is CSS tokens only: `--parchment #f3ead7`, `--vellum #fbf7ee`, `--parchment-deep #e7d8b8`, `--floor` radial gradient, `--gold #c99a3e` ornament (`src/style.css :root`; `docs/visual-design/README.md` "Tokens") | — | **Missing.** Either new art (image_gen, then sample + owner yes; then hosting or a tiny inline size), or a CSS/SVG scroll (rolled ends as SVG, parchment fill from tokens) at ~1-3 KB |
| **Achievement badges** | Wax seal as inline SVG: `WAX` path (145-point scalloped circle) + inner circle + a piece icon, `src/ui/tricks.ts:9-12`, `:27`, class `.trick-seal .wax` in `src/style.css`. Six tricks with seals (`src/tricks.ts:6-11`: chain/beast, shot-over/archer, shove-guard/ogre, far-swap/maester, king-guard/king, second-life/pawn). Workshop seals: `WAX(id,a,b,c)` gradient seal, `src/workshop/marks.ts:63`. Rules-UI direction: "one rule = one wax seal" (`docs/research/rules-ui-2026-10-10/REVIEW.md:100`) | code | **No badge art, but a ready pattern.** Wax seal + piece icon or king emblem glyph = badge set in SVG, near zero bytes. Painted badges would need image_gen |
| **Unlocks** | Parked by the owner ("No crowns, no locked pieces", `web-redesign/spec.md` §3). `i-crown` symbol exists | `index.html` | MVP says all unlocked: no lock art needed |
| **Menu / toggle icons** | 12 inline SVG `<symbol>`s, 24×24 viewBox, 76-202 bytes each: `i-new`, `i-guide`, `i-settings`, `i-undo`, `i-return`, `i-resign`, `i-share`, `i-play`, `i-learn`, `i-continue`, `i-crown`, `i-workshop` | `index.html` (23 `<svg>` in the file) | Copy the needed ones into `src/plugin/index.html`: ~1.5 KB for all 12. Toggles (fairy pieces, arrangement, classic chess, cards, king powers) need switch styling (CSS) and maybe one glyph each: piece icons (fairy = e.g. beast icon, classic = knight icon), card back glyph (SVG), king emblem (raster) or crown (SVG) |
| **"All" sub-menu with piece checkboxes** | Piece icons (section 3) | `public/ui/icons/` | Must be inlined (no `<use href>` to a file) |
| **Settings icon mode** | Icons + `token()` + `setLabels()` | section 3 | Code only; no image |
| **Fonts** | Web: Cinzel (`public/fonts/cinzel-latin.woff2` 23,756) and Alegreya Sans (3 × ~19.5 KB), OFL | `public/fonts/` | Plugin uses system fonts. Cinzel alone inline ≈ 32 KB base64: eats most of the headroom. Keep system fonts |
| **Logo / wordmark** | `art-src/emblems-logo/Logo.png` (1181×2362, alpha), `logo 02.jpg` (colour) | art-src | Not cut for web. Plugin header is the text "King Down" |
| **App icons** | `public/icons/icon-192.png` 69,434, `icon-512.png` 419,180, `maskable-512.png` 395,807, `apple-touch-icon.png` 62,200 | `public/icons/` | Usable for the ChatGPT app listing icon (outside the 4.4 MB page) |
| **Sword (capture effect)** | `art-src/emblems-logo/sword.png` | art-src | Not used |

---

## 9. The budget problem and the options

Facts:

1. Page on the multiplayer branch: 4,325,857 bytes HTML / 4,327,040 payload.
2. 3,917,196 bytes of that are the 20 inline images. Code + CSS + HTML ≈ 410 KB.
3. Hard stop 4,400,000 payload; ask line 4,350,000.
4. CSP `resourceDomains: []` (`src/plugin/server.ts:16`, `:24`); `domain: origin` is set.
5. `docs/plugin-preparation.md:64` describes the board as "one self-contained MCP App resource".

Options (planner/owner decides; I give a recommendation):

| Option | Effect | Risk |
|---|---|---|
| A. Zero new raster: crop portraits from the inline sheets on canvas; inline SVG for icons, seals, toggles, scroll; text-and-CSS card faces | +~45-60 KB (icons + symbols + scroll SVG) plus the MVP code | The code for six new screens may itself pass 4,350,000. Card faces look plain |
| B. Open `resourceDomains` to the plugin's own origin (`https://kingdown-plugin.vercel.app`) and serve `public/ui/` (and later the 20 sheets) as files | Frees the page; card faces, emblems, portraits, scroll art all usable. Moving the 20 sheets out frees ~3.9 MB | Changes the "self-contained" design; needs the static files in the Vercel plugin deploy (`tools/plugin-server-build.mjs`), cache headers, and a host check that ChatGPT honours `resourceDomains`. Release + ChatGPT "Refresh" per `docs/plugin-preparation.md:66` |
| C. Re-encode the 20 sheets smaller (lower WebP quality, or 1152×768) | Could free several hundred KB | Visible quality loss on the board; every sheet change needs a sample and the owner's yes; scene geometry (`court-motion.mjs` origins, anchors) assumes 1536×1024 |
| D. Load king sheets other than the two in play only on demand from a URL | Frees up to ~0.9 MB (4 of 6 king sheets) once B is in place | Same as B |

**Recommendation:** B for raster art (cards, emblems, scroll, badges if painted), with A as the
default for everything that can be vector. Keep the board sheets inline until B is proven in the
real ChatGPT host, so the board never loses its art.

---

## 10. What is missing for the MVP (checklist)

| # | Item | Exists? | Smallest path | Needs image_gen? | Needs owner yes on sample? |
|---|---|---|---|---|---|
| 1 | Games registry **scroll** graphic | No | SVG scroll from tokens; or painted scroll | Only if painted | Yes |
| 2 | **Achievement badges** | Pattern only (wax seal SVG) | Wax seal + icon/emblem SVG set | Only if painted | Yes |
| 3 | **King coin** (power coin by the portrait) | Web version: emblem + notches (`src/ui/coin.ts`) | Port to plugin; emblem needs hosting (B) or crop the king figure from the inline sheet | No | Yes (new plugin visual) |
| 4 | King picker sub-menu (6 kings × 2 powers) | Web picker in `src/new-game.ts` (emblems) | Emblems via B; or cropped king figures (A) | No | Yes |
| 5 | Power glyphs (12) | No | Words only; or 2014 card art where present | Optional | Yes |
| 6 | Menu toggles (fairy, arrangement, classic, cards, king powers) and "all" sub-menus | Symbols in `index.html`; piece icons | CSS switches + inline SVG glyphs | No | Yes |
| 7 | Piece checkboxes in "all" (12 pieces incl. classic) | Icons ✔, portraits ✔ (web) | Inline icon paths | No | Yes |
| 8 | Card faces for the 4-card draw | 10 of 36 + back | Text face (A); art via B; cut the 9 2014 sources; image_gen for the 12 with no art | For 12 cards | Yes |
| 9 | Arrangement screen (drag your own back rank) | Board sheets inline ✔; portraits (web) | Crop from sheets on canvas, or reuse the board itself | No | Yes |
| 10 | Settings **icon mode** | Icons ✔, `token()`, `setLabels()` ✔ | Canvas `Path2D` icon discs in `scene.mjs` (shared module: default stays painted) | No | Yes |
| 11 | Profile header, score, results | Fonts/tokens only | CSS | No | Yes |
| 12 | Spirit/Shadow defaults when powers are off | ✔ `PLAIN_KINGS`, `PaintedView.ts:42` | Nothing | — | — |
| 13 | App listing icon | ✔ `public/icons/` | Reuse | No | — |

## 11. Risks

- **Budget:** about 23 KB to the ask line on the multiplayer branch. Any inline raster breaks it.
  The build prints HTML bytes, the guard reads payload bytes (+~1.2 KB).
- **Shared modules:** `scene.mjs`, `PaintedView.ts`, `marks.ts`, `legend.ts` run in the web game
  too. An icon mode or a portrait crop helper there must keep the default look and pass the web
  checks (`web-redesign/spec.md` rule 5).
- **Outside file references in reused web code:** `pieceIcon()` (`src/piece-icons.ts:17`),
  `coinRow()` (`src/ui/coin.ts:22`), `src/ui/table.ts:195`, `src/new-game.ts:118` all use
  `import.meta.env.BASE_URL` paths. In the plugin these load nothing (no file host, CSP empty).
  Do not import them unchanged.
- **Licences:** 2014 card illustrations ("second artist likely"), board marble (textures.com),
  sculpts (Dream Catcher). Confirm before a public listing. The image_gen assets are clean.
- **King art sizes differ:** Shadow sheet 247,668 vs Spirit 113,210; the Shadow smoke mask and the
  Flame lava mask are extra. Any "load on demand" plan should keep the two default kings inline.
- **Ogre** has no old sprite and no `public/sprites` entry — irrelevant to the painted look, but
  a trap if someone reuses `sprites.ts`.
- **Lab pieces** (catapult, reaver, templar) have no figure and no icon. Exclude them from the
  plugin's "all pieces" sub-menu, or give them icons first.
- **Card names vs art names:** `back.webp` is the fallback for every card with no face
  (`src/workshop/ground.ts:65`). A 4-card draw can show four identical backs.
