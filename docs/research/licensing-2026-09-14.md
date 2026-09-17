# Licensing review — what the game ships, 2026-09-14

Scope: every file the build publishes. Researched from the primary licence documents, not from
summaries. Nothing in the repo was changed and nothing was published.

**The shipped set is 143 files** (`dist/files.json`): 126 sprites, 11 voxel models, 3 bundled
JS/CSS assets, and **3 JPEG textures**. Two web fonts load from Google's CDN. No font file, no
logo and no card art ships.

**One problem exists.** The three JPEGs in `public/textures/` derive from textures.com stock
photos. The game serves them as plain image files at fixed URLs, which the licence does not
permit. Everything else is clear or needs only a credit line.

---

## 1. Shipped asset classes

| Asset class | Files | Source | Licence | Status |
|---|---|---|---|---|
| Board tiles `white_tile_1.jpg`, `black_tile_1.jpg` | 2 (256×256, 20 KB) | Cut from textures.com `FloorsCheckerboard0037_*_L.jpg`, then downscaled twice | Textures.com Terms of Service Rev 3-21 | **Must replace** |
| Frame slab `board_texture1.jpg` | 1 (256×256, 30 KB) | Same Drive folder as the stock photos; origin probable, not proven | Same, if the origin holds | **Must replace** |
| Voxel models `public/models/*.json` | 11 | Voxelised from the designer's Tabletopia OBJ meshes, decimated from his own STL sculpts | © Saar Shai / Double Edged Games. Sculpting by Dream Catcher | Needs attribution |
| Sprites `public/sprites/*` | 126 | Rendered from the same sculpts with the designer's Pantone colour guides | Same | Needs attribution |
| Press Start 2P (Google CDN) | 0 shipped | Google Fonts | SIL Open Font License 1.1 | Clear |
| DotGothic16 (Google CDN) | 0 shipped | Google Fonts | SIL Open Font License 1.1 | Clear |
| Google Fonts CSS request | — | `fonts.googleapis.com` / `fonts.gstatic.com` | Google APIs Terms of Service | Clear (see the privacy note, §5) |
| three.js in the JS bundle | in `assets/index-*.js` | npm `three@0.186.0` | MIT | Clear |
| Build-tool runtime code in the bundle | same | Vite, esbuild and helpers | MIT / Apache-2.0 / ISC / MPL-2.0 | Clear |
| Palettes DB32, Endesga 32, warm | in the bundle | DawnBringer (2012), ENDESGA; both on Lospec | Free to use; a colour list is not a protected work | Clear |
| Imperator fonts | **not shipped** | Paul Lloyd | Aggregators label it "100% Free"; no author EULA found | Unknown — and it does not matter today |

---

## 2. Textures.com — the operative clauses

Source: **Textures.com Terms of Service Rev 3-21**, CGTextures B.V.
<https://www.textures.com/static/terms/TexturesCom%20-%20Terms%20of%20Service%20Rev3-21.pdf>

Games are allowed. Article 6.2(b) permits you to:

> "incorporate the Content in computer games and 3D models and 3D scenes"

Modification is allowed. Article 6.1:

> "Content may be modified to suit your needs."

But Article 6.3(a) forbids you to:

> "sell or distribute any Content (modified or not) by themselves"

**That last clause is the one we break.** Our tiles are not baked into a model or a scene. They
are three standalone JPEG files at `/textures/*.jpg`. Any visitor can read the URL out of the page
and save a clean, tiling marble texture. "Modified or not" closes the argument that our downscale
makes them ours. The files are recognisably the source photograph.

The nearest permission, Article 6.2(c), covers bundling with a 3D model, and it carries two strings.
It applies only when

> "only Regular Photos (as indicated on the download page) are included"

and it requires this line in the accompanying documentation:

> "These photographs may not be redistributed by default; please visit www.Textures.com"

Two further clauses matter for this project. Article 7.1:

> "The foregoing license is non-sublicensable, with the sole exception"

— the exception covers a client who publishes work you delivered, not a public web build's visitors.
And Article 6.3(k) forbids you to

> "release the Content or derivative products with Content under Open Source Licences"

**So the repository can never be published under MIT, GPL or any other open licence while these
three JPEGs are in it.** The git history keeps them even after a later deletion.

**Free account versus paid.** There is no separate free licence. Article 2.4:

> "downloads fall under the Indie license with an annual revenue or funding limit"

The cap is $150k USD per year. A paid subscription raises the tier (Indie, Studio, Corporate);
it does **not** unlock redistribution. Article 6.3(a) applies to every tier.

**Attribution.** Required only under 6.2(c), inside a 3D-model bundle. It is not a general credit
requirement, and it does not make standalone redistribution legal.

**One piece of good news.** Article 14.1 says that if the account lapses,

> "you will remain entitled to continue to exploit any Content that was already downloaded"

The 2015 download therefore still carries rights, provided the use follows Article 6. The current
use does not.

*Note on age.* The tiles were downloaded in 2015, when the site was CGTextures. The 2015 terms were
not retrievable; the company is the same legal entity (CGTextures B.V.) and the redistribution ban
is long-standing, so Rev 3-21 is the right document to plan against.

---

## 3. Google Fonts — clear

Both faces are SIL Open Font License 1.1.

- `Copyright 2012 The Press Start 2P Project Authors`, Reserved Font Name "Press Start 2P" —
  <https://raw.githubusercontent.com/google/fonts/main/ofl/pressstart2p/OFL.txt>
- `Copyright 2020 The DotGothic16 Project Authors` (Fontworks) —
  <https://raw.githubusercontent.com/google/fonts/main/ofl/dotgothic16/OFL.txt>

The OFL grants permission

> "to use, study, copy, merge, embed, modify, redistribute, and sell modified and unmodified copies"

and its preamble settles our case directly — the licence

> "does not apply to any document created using the fonts or their derivatives"

We link to Google's CDN and ship no font file, so OFL condition 2 (ship the notice with the Font
Software) never triggers. **No attribution is required. No action needed.**

Using the CDN adds one document: by using the API

> "you consent to be bound by the Google APIs Terms of Service"

— <https://developers.google.com/fonts/terms>. Free, no registration, no credit.

---

## 4. Imperator — not shipped, confirmed by grep

`grep -ril imperator` over the repo (excluding `node_modules` and `.git`) returns **seven documents
and no asset**: `TASKS.md`, `docs/STATUS-2026-09-13.md`, `docs/research/drive-cards.md`,
`docs/research/drive-final-art.md`, `docs/status/index.html`, `art-src/MANIFEST.md` and
`art-src/fonts/README.md`. Every hit is prose about the font.

A second check confirms it: `find public dist src -iname "*.ttf" -o -iname "*.otf" -o -iname
"*.woff*"` returns **nothing**. No font file exists anywhere in the build.

The logo is the only asset that could carry rasterised Imperator glyphs. It lives at
`art-src/emblems-logo/Logo.png` and `logo 02.jpg`. **Neither ships.** `dist/files.json` lists 143
entries; 140 are sprites, models and code, and the other 3 are the texture JPEGs. The game draws
its title with CSS text in Press Start 2P, not with an image.

**Who publishes it.** Paul Lloyd. The family has 7 styles — Imperator, Bold, Bronze, Bronze Small
Caps, Plaque, Small Caps, Small Caps Bold — which matches the 7 TTF files in `art-src/fonts/`
exactly. That match is the identification.

**Under what licence.** No author EULA was found. Paul Lloyd distributes through aggregators, and
dafont labels every one of his 25 families "100% Free"
(<https://www.dafont.com/paul-lloyd.d88>), which in dafont's own legend means personal and
commercial use. FontRiver lists it as free with no terms text
(<https://www.fontriver.com/font/imperator/>). Resale of the font files is refused everywhere.

**Verdict: unknown but harmless.** An aggregator label is not a licence. Nothing ships, so nothing
is at risk. If the printed card look ever moves into the web game, get the readme from Paul Lloyd
first, or substitute an OFL serif.

---

## 5. Other third-party material — none reached `public/`

The Drive holds three third-party pools. The curation kept all three out of `art-src/`, and none
of them reaches the build:

| Pool | Size | What it is | Where it is |
|---|---|---|---|
| `early inspiration/` | 178 MB | 70 downloads: 58 DeviantArt files naming the artist, plus Lego, Pokémon, Warhammer, Mickey Mouse, Superman brand art | Drive only |
| `mood board/` | 96 MB | 33 of 40 files are other people's work | Drive only |
| `art stuff/Characters/materials/` | 4.4 MB | 14 sheets pinning stock photos and apparent film and TV stills around each sculpt | Drive only |

Sources: `docs/research/drive-misc-folders.md` §7, `docs/research/drive-art-stuff.md` §4, and the
"Left on Drive" table in `art-src/MANIFEST.md`. The mood-board `.ai` and `.pdf` files embed that
material, so they must not ship either. Their **text** is original and safe to quote.

One more item deserves a flag before any press kit: `page/movies/Footage_board` films identifiable
people at a table. Get their consent first.

**Privacy, not licence.** The Google Fonts CDN sees each visitor's IP address. A 2022 Munich
judgment treated that as a GDPR problem for embedded Google Fonts. Self-hosting the two WOFF2
files removes the question, and the OFL permits it (ship `OFL.txt` beside them). Low priority for
a prototype; decide before a public launch with EU traffic.

---

## 6. Recommendations

### 6.1 Board tiles — replace them procedurally

**Draw the stone in code.** The renderer already does this, so the pattern is proven and local.
`edgeTexture()` at `src/render/renderer.ts:42` builds a 32×32 `THREE.CanvasTexture` with
`NearestFilter`, no mipmaps and sRGB — exactly the shape the stone maps need. Add a sibling that
fills a 64×64 canvas with value noise and a few cracks, and return light and dark variants.

The consumer is one line. `applyBoard()` at `src/render/renderer.ts:259` currently does, at line 269:

```ts
this.stone = { light: load('white_tile_1.jpg'), dark: load('black_tile_1.jpg'), frame: load('board_texture1.jpg') };
```

Point that at the generator instead and delete the `TextureLoader` block above it. Nothing else
changes: the `m.map = ... : this.stone[light ? 'light' : 'dark']` assignment and the
`0xc2b5a3` torch knock-back both stay.

**Only 3 of 13 presets are affected** — `dungeonVoxel` (the default), `dungeonSprite` and
`dungeonBright`, the three that set `tiles: 'stone'` in `src/render/styles.ts`. The other ten
already run `tiles: 'flat'` or `'edged'` and touch no JPEG. The flat path is
`m.map = null` plus `m.color.setHex(light ? LIGHT : DARK)`, and it ships today.

**A 64 px procedural tile loses nothing.** `docs/research/drive-board.md` §4 measured the ceiling:
the light tile reads well down to 24–40 px, and the dark tile "shows almost nothing at any size,
because its whole range is about 8 levels". We are already throwing that detail away at
`pixelSize: 2`. The stock photograph buys us grain we cannot see.

Afterwards, delete `public/textures/`. The build then carries **zero third-party art**, the
repository can go open source (the code dependencies are all MIT-class), and the `dist` payload
drops by 50 KB.

**Keep the source files in `art-src/board/`** for reference. They are not published there.

### 6.2 Frame slab — same fix, or drop it

`board_texture1.jpg` has the weakest evidence of stock origin (same folder, no metadata), but it is
also the least load-bearing asset in the game: one grey slab under the board. Generate it with the
same function at a darker tint, or drop the map. The fallback path exists at
`src/render/renderer.ts:284`: without a stone map the frame takes `map = null` and the flat
`0x2b2a28` that the other ten presets already use.

### 6.3 Sprites and models — add one credits line

These are the designer's own work and carry no licence risk. They do carry a **credit** question,
because a second hand made them: the sculpts show the Windows path
`C:\Users\rafiba\My Projects\Dream Catcher\KING DOWN\Models`, and the printed artbook prints the
DREAM CATCHER logo beside DOUBLE EDGED GAMES.

Add to the rules dialog or a footer, once the designer confirms the wording:

> Design and art © Saar Shai / Double Edged Games. Sculpts by Dream Catcher.

This matches question 3 already open in `docs/STATUS-2026-09-13.md`.

### 6.4 Fonts — no action

Leave the CDN link. Revisit self-hosting for the GDPR reason, not the licence.

### 6.5 Before any open-source release

Publishing the repo under an open licence with the three JPEGs in the git history breaks Article
6.3(k) even if the working tree is clean. Replace the tiles **first**, then rewrite the history or
start the public repository from a fresh commit.

---

## 7. The decision for the designer

**One decision, and only one.**

> Do we replace the three board textures with procedural pixel stone, or do we keep the
> textures.com marble?

Keeping it costs four things:

1. The textures.com account and plan that downloaded `FloorsCheckerboard0037` in 2015, confirmed.
2. The 6.2(c) credit line in the game's documentation.
3. The repository stays closed. No open-source licence, ever, under 6.3(k).
4. The Indie revenue cap of $150k per year, unless a higher tier is bought.

And even with all four, serving the tiles as plain `/textures/*.jpg` files still sits outside
Article 6.3(a). A lawyer, not a licence page, would have to settle that.

Replacing it costs about half a day of rendering work and loses detail the pixel pass already
discards.

**The recommendation is to replace.** Say the word and it goes in the queue.
