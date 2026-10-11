# Show threats gets its own marks

Status: done (PR #47 merged 2026-10-11)
Size: S
Blocked by: none. Ticket 01 (the legend) is on main.

Owner, 2026-10-11, on the W13 renders: "3. resolve all." Item D5 of ticket 01 was open: Show threats draws a red dot on each covered square and a red ring at the feet of each threatened piece, and in the legend red means a take. The pick is delegated by UI/UX best practice (owner, 2026-10-09) and recorded as delegated, not as the owner's yes.

## The pick (delegated)

- **Colour: amber `#f08c1a`**, with an ink edge (`#2b2621`, 2.4 units) and a vellum halo (`#fbf7ee`, 4 units). No legend mark uses amber (the legend uses red, green, navy, white, power blue and gold). Amber is the usual warning colour (ISO 3864 and road signs). The ink edge and the halo give the mark a contrast edge on light squares, dark squares, the green tile and the clay squares (WCAG 1.4.11, non-text contrast).
- **Shapes, not circles:** a covered empty square gets a diamond; a threatened piece gets the warning triangle with "!". The legend has no diamond and no triangle, so the meaning does not rest on colour alone (WCAG 1.4.1). Under deuteranopia amber and red look alike, so the shape carries the meaning.
- **Place: the square's bottom-right corner.** The legend uses the top-left corner (the badge) and the centre (the target, and the ring and glow under the feet). In the bottom-right corner a threat mark never covers a legend mark or the figure's face, also when a selected piece's moves land on a covered square, or when the read of an enemy piece puts its take mark on a threatened piece.
- **Size:** diamond 24 % of the square (at least 11 px); triangle 34 % (at least 16 px). On a 390 × 844 phone a square is about 44 px.
- **Words:** the Settings label "Show threats" names no colour, so it stays. `docs/visual-design/README.md` named "red ring" and "red dot"; it now names the amber marks.

## Plan

1. [x] `src/style.css` `.mk-cover::after` and `.mk-threat::after`: the amber diamond and the warning triangle as data-URI SVGs at the bottom-right corner. The markup in `src/screen/play.ts` `drawMarks()` stays (the classes do not change).
2. [x] `docs/visual-design/README.md`: the Threats row (`:133`) and the token line (`:160`).
3. [x] W13 (`docs/specs/web-redesign/samples/W13.mjs`): the states `painted-threats`, `painted-threats-queen`, `painted-threats-read`, `painted-threats-dark` (dark colour scheme), `clay-threats-queen`, `clay-threats-read`, `painted-threats-queen-deut`, `clay-threats-queen-deut`. Position `4k3/8/8/3r4/8/1Q6/3N4/4K3 w`: the rook d5 attacks the knight d2 and covers d3 and b5, where the queen b3 can move.
4. [x] Browser check `visual-design` (`docs/visual-design/verify.mjs`, part 3 "Show threats"): both marks draw the amber SVG; with the knight selected, its moves show and the 1 threat mark and 15 cover marks stay.

## Verification

- [x] `npm test` through the lock script passes.
- [x] `npm run check:browser visual-design` passes.
- [x] The W13 threats states render at 1440 × 900 and 390 × 844 with no fault.
- [x] Side-by-side images (before left, after right) for painted, clay, dark scheme and deuteranopia.
- [x] The owner sees the side-by-side images before the merge. Owner, 2026-10-11: "amber threat marks approved".

## Does not do

- No change to the legend marks, the check ring, the keyboard cursor or the Workshop's threat eye (`src/workshop/scene.ts` `threatsOf`).
- No `--danger` change: the check and the Workshop's warnings still use it.

## Comments

**2026-10-11, the build (branch `claude/threat-marks`).** `S` is the scratch folder `/private/tmp/claude-501/-Users-za-Documents-king-down-chess/08f2956c-63a7-4276-8738-a657bdb42b06/scratchpad/build/owner4/threats`.

What changed:
- `src/style.css`: the threat marks are the amber diamond and the amber warning triangle at the bottom-right corner, with an ink edge and a vellum halo.
- `docs/visual-design/README.md`: the Threats row and the token line name the amber marks.
- `W13.mjs`: 8 threats states, as in step 3.
- `docs/visual-design/verify.mjs`, part 3: 4 new assertions, as in step 4. No assertion is removed.

Evidence:
- `npm test` (lock script): 116 files passed, 1 skipped; 1892 tests passed, 21 skipped; exit 0 (`S/logs/npm-test-1.log`).
- `npm run check:browser visual-design`: passed, exit 0 (`S/logs/check-1.log`; run folder `/var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-check-runs/threat-marks-Yaiwvq`). Its log line: "Show threats: off by default; marks the attacked knight and 15 covered squares in amber, also with moves shown; saved".
- The 8 threats states of W13 (through a temporary copy of the table with only these states, deleted after): before, 16 renders, 0 with a fault (`S/before`, `S/logs/before.log`); after, 16 renders, 0 with a fault (`S/after`, `S/logs/after-1.log`).
- Side-by-side images (before left, after right): `S/*-sbs.jpg`, 10 images: painted and clay at 1440 × 900 and 390 × 844, the read of the rook, the dark scheme, and deuteranopia (painted desktop, clay phone).
- I looked at each render. Before: in the read of the rook, each covered square shows a red dot on a green tile, which reads as "move or take". After: the diamond and the triangle sit in the bottom-right corner; the target, the badge, the occupied-take edge and each face stay clear. Under deuteranopia the amber looks yellow and the tiles look khaki; the ink edge and the shapes keep the marks apart.

Changes from the ticket, and why:
- The task named a "flat" look and light and dark. The game has two looks (painted and clay), and the page is light only (`src/style.css:114`). So the renders cover light and dark squares in both looks, plus one dark-scheme state, which shows that the marks do not change.
- In the clay look, the read of an enemy piece shows no legend marks (`clay-threats-read`, before and after). That is the clay look as it is today, not this change.

**2026-10-11, the review fixes.** Review T (`review-T.md` in the build scratch folder).

Reviews:
1. should-fix, the ink edge is thinner than 1 CSS px on a phone. **Confirmed** by the arithmetic: on a 390 × 844 phone the diamond box is 11 px, so a 1.6-unit stroke in a 20-unit box is 0.88 px (the triangle: 1.07 px). Fix: the ink stroke is 2.4 units in both SVGs (diamond 1.3 px, triangle 1.6 px); the halo (4 units) still shows outside it. Renders: W13 threats states again, 16 renders, 0 with a fault (`S/after-2`, `S/logs/after-2.log`). Side-by-side images, 1.6 left and 2.4 right: `S/*-stroke-sbs.jpg` (painted phone, painted queen phone and desktop, clay queen phone). The edge is darker and clearer; nothing else moves.
2. should-fix, the amber check passes when no mark draws. **Confirmed**: with `content: ''` removed from the shared rule, the old assertion passed and only the new assertion failed ("mk-threat draws in the bottom-right corner", `S/logs/check-mutant.log`). Fix: the check also asserts `content` is not `none`, the width is more than 0, and `right` and `bottom` are set.
3. nit, the words "no legend mark uses the bottom-right corner" are wrong: the bite numbers use it. **Confirmed** (`src/render/marks.ts:171-172`); no collision, because bites are on enemy pieces. Fix: `src/style.css` and `docs/visual-design/README.md` say "no move or take mark".
4. nit, the message "the ring sits on d2" names a ring. **Confirmed**. Fix: "the threat mark is on d2".

Evidence:
- `npm test` (lock script): 116 files passed, 1 skipped; 1892 tests passed, 21 skipped; exit 0 (`S/logs/npm-test-2.log`).
- `npm run check:browser visual-design`: passed, exit 0 (`S/logs/check-3.log`; run folder `/var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-check-runs/threat-marks-DWN3Ru`). The run before it (`S/logs/check-2.log`) failed only because the temporary render table was in the checkout; I deleted it and ran again.
