# Drive folder `cards` — inventory and assessment

Source: Google Drive "King Down" → `cards`, a local read-only scratch copy. Reviewed 2026-09-13. 76 real files,
4.2 GB (plus 7 zero-byte macOS `Icon` stubs and one `.DS_Store`).

This folder holds the **2014 card-game prototype**, not the 2017 chess variant. All work comes from Adobe
Illustrator CC and Photoshop CC on macOS, dated 2014-06-08 to 2014-10-13. The five fairy pieces (Archer,
Paladin, Guard, Maester, Beast) appear on **no card**. Treat it as the visual identity and the design history,
not as a rules source.

## 1. Inventory

| Path | Files | Formats | Contents |
|---|---:|---|---|
| (root) | 14 | 11 `.psd`, 2 `.tif`, 1 `.png` | Card frame templates, 709×1087 px CMYK; two card layouts; `Logo.png` |
| `Emblems` | 4 | `.png` | The four element emblems, 1772×1772 px, sRGB with alpha |
| `Font` | 7 | `.ttf` | The Imperator family (see §5) |
| `Illustrations` | 10 | `.jpg` | Spell card art, 1134×1181 px, **CMYK** |
| `prototype` | 5 | `.ai` | First card sheets, 2014-06 / 2014-07 |
| `prototype/new print proto` | 8 | 4 `.ai`, 4 `.pdf` | **Final print proto, 2014-10-13** |
| `prototype/playtesters` | 28 | 16 `.ai`, 12 `.pdf` | Playtest decks, 2014-08 to 2014-10-09 |

Every `.ai` is PDF-compatible and PyMuPDF opens all of them; each `.pdf` is an export of the matching `.ai`, so
a pair is one artwork. **Composite sheets** (`king down_0*.ai`, `*_pieces_03.ai`, `*_spells_03.ai`) are 1355×893
pt with 7×3 = 21 slots and live text; these are the working files. **Print sheets** (`*-A4*`, `*-Letter*`) hold
4 pages of 3×3 cards with outlined text: p1 spells, p2 backs, p3 units, p4 backs. Two decks exist, `earth` and
`sky`; p1 is identical in both and p3 differs by one card, the king (MUD or CUMULUS). The back colour codes the
deck — **earth = gold, sky = pale blue**. A4 and Letter hold the same cards. `* resterized.ai` are flattened
copies.

### 1.1 Three text generations

| Gen | Date | Files | Marks |
|---|---|---|---|
| A | 2014-06-08 … 2014-07-15 | `prototype/*.ai` | Kings unnamed. `DIVINITY` and `FIRE WALL` exist |
| B | 2014-08-18 … 2014-10-09 midday | `playtesters/*copy.ai`, `*_pieces_03.ai`, `*_spells_03.ai`, `*-A4.pdf`, `*-Letter.pdf` | `SHIELD` replaces `DIVINITY`. Effects in brackets. Kings named |
| C | 2014-10-09 evening … 2014-10-13 | `*-A4 03.pdf`, `*-Letter 03.pdf`, `new print proto/*` | Rewritten around "capitol" and "calling cards". **Final** |

## 2. Card effects as printed

Cost is in action points (`A`). The element is the emblem behind the cost badge. `?A` on MIRROR is printed, not
missing: the copy costs what the copied card costs.

### 2.1 Spell cards, Gen C — `new print proto/king down_02.pdf`

| Card | Element | Cost | Effect text |
|---|---|---|---|
| SALVATION | earth | 2A | REVIVE A TAKEN PIECE |
| SHIELD | earth | 2A | taking your pieces costs +1 action |
| STRIKE | earth | 3A | TAKE WITHOUT MOVING |
| CURSE | air | 1A | spell cards can apply to any piece |
| FIREWALL | air | 1A | calling cards can apply to piece in capitol |
| HASTE | air | 1A | CURE A STUNNED PIECE |
| FLIGHT | air | 2A | MOVE A PIECE ANYWHERE |
| GROWTH | water | 2A | calling cards cost -1 action |
| RAGE | water | 3A | +1 MOVE / +1 TAKE |
| MIRROR | water | ?A | COPY A CARD |
| SKY LIFT | air | — | no cost, no text; the air emblem fills the art window |

### 2.2 Unit cards, Gen C — `new print proto/king down_01.pdf`

One unit appears with two elements (an air PIKE and a water PIKE): the element tags the deck, not the piece.

| Card | Chess piece | Element | Cost | Effect text |
|---|---|---|---|---|
| PIKE | pawn | air / water | 1A | +1 MOVE |
| STEED | knight | earth / water | 2A | +1 TAKE |
| CROSS | bishop | earth | 2A | +1 MOVE / +1 CARD |
| ROCK | rook | water | 2A | +1 MOVE / adjacent pieces are stunned |
| THORN | queen | air | 3A | +1 TAKE / move costs 1 action |
| MUD | king (earth) | air | 1A | +1 MOVE/TAKE / unspent actions are saved for next turn |
| CUMULUS | king (sky) | air | 1A | +1 TAKE / can move 2 tiles in 1 direction |
| EARTH QUAKE | — | earth | — | no cost, no text; the earth emblem fills the art window |

### 2.3 Earlier wordings

| Card | Gen A (2014-07) | Gen B (2014-09 … 2014-10-09) |
|---|---|---|
| SALVATION | 2A — Return a taken piece to the board | 2A — (Return to your camp) |
| DIVINITY → SHIELD | 1A — you can MOVE and TAKE with any of your pieces | 2A — (Protected) |
| STRIKE | 2A — +1 TAKE with any of your pieces | 2A — +1 TAKE |
| CURSE | 1A — Discard all played cards of another player and draw as many | 1A — (If taken, take a piece from the board costing 1A less) |
| FIRE WALL → FIREWALL | 1A — Your pieces cannot be taken this round | 2A — (Swap positions with any other piece) |
| HASTE | 1A — +1 ACTION on your next turn | 1A — (Cure summon sickness) / +1 MOVE/TAKE (when summoned) |
| FLIGHT | 1A — on MOVE, relocate any piece capitol to any vacant tile (outside the capitol) | 2A — +1 MOVE (anywhere) |
| GROWTH | 2A — All piece cards this turn cost 0A | 1A — (Costs -1A next turn) |
| RAGE | 2A — +2 TAKE | 3A — +1 MOVE / +1 TAKE |
| MIRROR | 1A — Copy any played card on the board | 2A — (Copy spell) |
| SKY LIFT | not present | (MOVE/TAKE costs 1A less) |
| EARTH QUAKE | not present | (+1 CARD for each taken piece) |
| STEED | 1A — no text | 2A — +1 MOVE/TAKE (can summon 2 Steeds) |
| CROSS | 1A — no text | 2A — +1 MOVE/TAKE (can move to adjacent tile) |
| ROCK / THORN | 1A / 2A — no text | 2A — +1 MOVE / 3A — +1 MOVE/TAKE |
| PIKE | 1A — +1 CARD | 1A — +1 MOVE |

Gen B gave CROSS `+2 CARD` on the print sheets and `+1 CARD` on the composite sheets; Gen C kept `+1 CARD`.

## 3. Kings and powers as printed

| King | Element | Gen | Cost | Power text |
|---|---|---|---|---|
| MUD | earth | C | 1A | +1 MOVE or +1 TAKE; unspent actions are saved for next turn |
| CUMULUS | sky / air | C | 1A | +1 TAKE; can move 2 tiles in 1 direction |
| MUD | earth | B | 1A | +1 MOVE/TAKE (can move like any piece in your camp) |
| CUMULUS | sky | B | 1A | +1 MOVE/TAKE (can use multiple spells) |
| KING (Ice sculpt) | earth badge | A | 1A | +1 TAKE |
| KING (Mud sculpt) | air badge | A | 1A | +2 MOVE |

Files — Gen C: `*-A4 03.pdf` p3 and `new print proto/king down_01`. Gen B: `playtesters/king down_pieces_03.ai`.
Gen A: `prototype/king down_02.ai`, which shows **four** king portraits under one `KING` title (Ice, Mud, Fire /
Ember, Sky); the Fire and Sky cards carry a portrait only. Only two kings got a name later, and no card names
Frost, Flame, Stratus, Spirit or Shadow. **None of these powers match `docs/RULES.md` §4**: the card powers are
economy powers (actions, cards, range), while the rulebook powers (Freeze, Ice Wall, Strike, Haste, Flight,
Sacrifice, March, Leap) came with the 2017 rulebook.

## 4. Differences from `docs/RULES.md`

- **No fairy pieces.** The deck holds PIKE, STEED, CROSS, ROCK, THORN and two kings only.
- **RULES §5 is a different list.** The cards print 10 spells plus 2 element cards; Burn, Control, Sacrifice,
  Rescue, Leap, Fire Starter and Frost Bite appear on no card here.
- **Named effects disagree.** RULES §5 gives Curse as "control an enemy piece of the same type"; all three
  generations say something else, and Shield, Growth, Haste and Flight also differ.
- **The card game runs on an economy** the chess variant drops: action points, camp, capitol, summoning, summon
  sickness and stun. A port must re-state every effect in chess terms.
- **Elements, not armies.** Four elements against six kings. Water maps to Frost, fire to Flame, air to Stratus
  / Cumulus, earth to Mud / Gaya. Spirit and Shadow have no emblem and no card.

## 5. Emblems and fonts

The four `Emblems/*.png` are 1772×1772 px, sRGB with alpha: **air** = feathered wings around a sunburst over a
cloud; **earth** = a wooden shield between two ram horns with green vines; **fire** = a flame inside a dripping
steel frame; **water** = a burst of blue ice crystals. `Logo.png` is 1181×2362 px, same format: a crowned helm
shield reading KING DOWN with a bloodied sword behind it. All five are clean cut-outs with a soft alpha edge and
no embedded licence or credit. The fire emblem is on **no printed card**; only air, earth and water badges
appear.

The ten `Illustrations/*.jpg` are the spell art windows, 1134×1181 px CMYK, no alpha: 01 SALVATION (graveyard),
02 SHIELD (shield over spears), 03 FLIGHT (claws over mountains), 04 HASTE (wolf in a forest), 05 RAGE (charging
bull), 06 GROWTH (sword in thorns), 07 MIRROR (bear mirrored on ice), 08 STRIKE (meteor), 09 CURSE (red skull,
cyan flame), 10 FIREWALL (fire wall, lone rider). The unit cards use the 3D renders from `3d files`, not these
illustrations.

The 11 PSDs and 2 TIFFs are empty silver frames, CMYK, no card text. `card-template.psd` … `-06.psd` and
`card-template-final-01.psd` are one series of 172 to 225 layers at 709×1087 px; `card-template-final-unit.psd`
and `-spell.psd` are the flattened 9-layer results, one per card type. `card layout 04.psd` / `.tif` and `card
layout 04 back.tif` are a smaller CS5-on-Windows layout at 1102×1181 and 771×1066 px. Three frame colours exist:
silver (used), gold and blue (never printed).

### Fonts

All seven are one design, `Version 1.00`, `fsType = 0` (installable embedding allowed). Each carries `Created by
Type-Designer 3.0`, the editor name, not the designer. **No licence, vendor, designer or URL is embedded in any
of them.**

| File | Family / style | Bytes | Glyphs | Look |
|---|---|---:|---:|---|
| `Imperator.ttf` | Imperator Regular | 30,980 | 92 | Roman inscriptional serif, thin hairlines |
| `Imperator Bold.ttf` | Imperator Bold | 24,596 | 89 | The same, heavier stems |
| `ImperatorSmallCaps.ttf` | ImperatorSmallCaps Regular | 30,592 | 89 | Small caps. **This is the card title face** |
| `ImperatorSmallCaps Bold.ttf` | ImperatorSmallCaps Bold | 25,064 | 89 | Bold small caps |
| `ImperatorBronze.ttf` | ImperatorBronze Regular | 30,768 | 89 | Inline / outlined variant |
| `ImperatorBronzeSmallCaps.ttf` | ImperatorBronzeSmallCaps | 40,492 | 89 | Inline small caps |
| `ImperatorPlaque.ttf` | ImperatorPlaque | 21,964 | **29** | Each letter inside a filled plaque. Caps and digits only |

**Not suitable for a pixel-art UI.** The strokes are high-contrast with hairline serifs; below about 24 px they
break up and the small caps lose their x-height. Use them for a title lockup at large size only, and pick a
separate bitmap face for HUD and board text.

## 6. Useful now

- **The four emblems** — at 64 px they make clean element or army glyphs, and they are the only per-element icon
  set the project has.
- **`Logo.png`** — the best logo asset in the whole Drive; use it for the title screen and favicon.
- **The ten spell illustrations** — square, flat-shaded, readable at 128 px. Convert CMYK to sRGB first (`magick
  illus_01.jpg -colorspace sRGB out.png`) or the colours shift.
- **Nothing else.** No emblem is per piece, and the archer, paladin, guard, maester and beast have no icon. The
  fonts do not suit the HUD, and the unit card renders duplicate `3d files`.

## 7. Useful later

- **A spell system, already costed** — ten spells with a cost and a one-line effect, plus two element cards.
  Enough to build a card layer without new design work.
- **A four-element scheme** — each element has an emblem and a deck-back colour. The fire deck was designed but
  never printed; the art exists for it.
- **Two king powers and four king portraits** — MUD and CUMULUS carry printed powers; the Ice and Fire kings
  have portraits but no text.
- **Print-ready empty frames**, plus unused gold and blue frames that could mark rarity.
- **A design record** — the generations show which effects were dropped, and why the wording moved from
  piece-level to global modifiers.

## 8. Licensing and credits

**No artist name, credit line or copyright notice exists anywhere in this folder.** I searched every PSD, AI,
PDF, TIFF, JPEG, PNG and TTF for `dc:creator`, `dc:rights`, `photoshop:Credit`, `Copyright` and `Author`. The
only hits are Adobe boilerplate (`Copyright 2000 Adobe Systems, Inc.` in the ICC profiles) and tool names; the
one user path is `/Users/test` in the `.ai` files, which credits nobody; the fonts carry no licence field. The
illustration style (flat vector, limited palette, strong rim light) is one hand across all ten images and
differs from the ZBrush sculpts in `3d files`, so a second artist is likely.

## 9. Open questions for the designer

1. Who drew the ten illustrations, the four emblems and the logo, and how should they be credited?
2. Where did the Imperator fonts come from, and is there a licence that allows web embedding?
3. A fire emblem exists but no fire deck was printed. Was a fire (or Spirit / Shadow) deck planned?
4. The 2014 cards predate the fairy pieces. Should each fairy piece get a card, and do the card names (Pike,
   Steed, Cross, Rock, Thorn) stay?
5. The printed king powers do not match `docs/RULES.md` §4. Which set is the target — the 2014 cards, the 2017
   rulebook, or a merge?

## 10. Reference images copied

In `docs/research/drive-assets/cards/` — 12 files, each ≤ 1200 px and ≤ 300 KB. From `Emblems/`:
`emblem-air.png`, `emblem-earth.png`, `emblem-fire.png`, `emblem-water.png`. From `Logo.png`: `logo.png`. From
`playtesters/king down_earth-A4 03.pdf`: `card-king-mud.jpg` and `card-unit-steed.jpg` (p3),
`card-spell-salvation.jpg` (p1), `card-back-earth.jpg` (p2). From `king down_sky-A4 03.pdf`:
`card-king-cumulus.jpg` (p3). From `new print proto/king down_02.pdf`: `card-element-skylift.jpg` and
`sheet-spells-final.jpg` (all 10 spells).

**Not read: PSD layer names.** ImageMagick flattens them away and a raw `luni` scan returned nothing; only the
flattened composites were read, and the templates hold no card text. All else opened.
