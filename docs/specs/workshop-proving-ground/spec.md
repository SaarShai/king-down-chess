# Workshop: the Proving Ground

Status: ready-for-agent

Owner, 2026-10-10: "the final choice is A, so implement that" (`docs/research/rules-ui-2026-10-10/REVIEW.md:119`).
Owner, 2026-10-10: "yes, go with my legend, but change the red X to a red target symbol." ([move legend](../move-legend/spec.md))
Owner decision, 2026-10-10: a piece keeps at most 3 rules (`REVIEW.md:120`).
Owner choice, Workshop sharing: "A, Card": custom pieces travel as cards (`docs/specs/web-redesign/spec.md:43`).

This choice ends the park of 2026-10-09 ("park workshop for now", `TASKS.md:9`). The `TASKS.md` line changes on main.

The approved sample is mockup A: `docs/research/rules-ui-2026-10-10/mockups/proving-ground.html`, with `shared/marks.js`, `shared/grammar.css` and `shared/scenes.js`. In this spec, `mockups/` means `docs/research/rules-ui-2026-10-10/mockups/`. That folder is not in Git yet; the first ticket's pull request commits it.

## Problem

- The Workshop edits a piece on two 7 × 7 grids (`src/workshop/dialog.ts:416-451`), and tests it on a second board (Try it, `src/workshop/sandbox.ts`). The player maps a diagram onto a board in the head.
- The rules are cards with pills (`dialog.ts:523-616`). Nothing shows which rule makes which mark, or which rule refuses a target.
- The marks use the old language (gold diamond, red ring, dashed ring: `src/workshop/workshop.css:174-180`, `:278-285`).
- The worth shows as a thermometer and a band word with a long Why? sheet (`dialog.ts:659-685`). It explains the estimate, not the moves.

## Solution

Mockup A in the real game. One stone board is the editor and the test at once.

- The open piece stands on d4 of a stone board. The marks use the owner's legend. Rails show slides, arches show "passes over", a dashed frame shows "only sometimes", grey with a bar shows "refused".
- Brushes Move, Take and Both are also the key. A tap on a square paints it. The Shot tool, the Eraser, Mirror and 8 line nubs do the rest.
- Each rule is one line on the plinth: a wax seal (the Does), a When chip and one sentence with a pill. At most 3. The Rules shelf adds a rule with a preview on the board and a Stamp.
- A tap on a square opens the Why tag: the base mark plus the stamp of each rule equals the mark now.
- The ledge at the foot holds the 11 pool pieces, the player's own pieces ("Yours") and NEW. A pool piece opens read only; the first edit makes a private copy.
- Try with: lift and place the piece, add friends and enemies, see threats, Move here and Take back.
- A link opens the card face (from mockup B), then the board.

## How the build ships

- **Preview first.** `?workshop=a` makes `openWorkshop` (`src/main.ts:90-97`; `params` at `:29`) import `./workshop/ground` in place of `./workshop/dialog`. `groundDialog()` has the same API as `workshopDialog()` (`{ open, openDesign }`, `dialog.ts:48`) and the same `id="workshop"`, so the title kings (`src/ui/title.ts:46`), the menu focus (`src/ui/menu.ts:87`) and the key guard (`src/screen/keys.ts:46`) work with no change.
- Each ticket merges to main on its own, behind the preview switch. The old Workshop stays the default and its checks stay green. Ticket 11 cuts over and deletes the old Workshop.
- New files (all in the Workshop chunk, none in the plugin page):
  - `src/workshop/ground.ts`: the A dialog.
  - `src/workshop/ground.css`: A's styles, with the components of `mockups/shared/grammar.css` scoped under `#workshop.pg` and with no `.mk-*` class (the old Try it uses those names).
  - `src/workshop/marks.ts`: the TypeScript port of `mockups/shared/marks.js`. Its tiles, targets, shots, occupied takes and badges come from `src/render/legend.ts` (move-legend ticket 01). Its blocks and When words come from `vocab.ts`, not from copies (`marks.js:127-141`, `:650`). The refused (grey) forms, the condition frames, the stamps and the knots stay in the port: the legend has no such marks.
  - `src/workshop/scene.ts`: design + board → scene, in the format of `mockups/shared/scenes.js:7-23`. It reads `movesOf` and the board; it decides no move rule itself (decision 36).
  - `src/workshop/why.ts` (ticket 04): the why-trace.
  - `tools/verify-proving-ground.mjs`, registered in `tools/lib/registry.mjs` as `proving-ground`. At the cutover it moves onto the path `tools/verify-workshop.mjs` (ticket 11), so the `workshop` check keeps its name and its path.
  - `docs/specs/web-redesign/samples/W14.mjs`: one sample table for the owner. Each ticket adds its states.

## What stays

These are the compatibility contract. Old saves and old links must load before and after each ticket.

- The store key `kingdown.workshop` with `{ v: 1, designs }`, at most 50 designs (`src/workshop/store.ts:9-10`). `validStored` (`model.ts:215-219`) may only widen.
- The link `?design=<code>`: base64url JSON with exactly the 7 keys `kind, squares, lines, rules, name, look, letter` (`designCode` `model.ts:191`, `parseDesign` `model.ts:222-233`), at most 4,000 characters. `keysAre` is strict, so no new key goes into a code.
- The look keys `body, auto, glow, army` (and `figure`). A does not show `glow`, but keeps it. Every cast id in `FIGURES` stays (`src/workshop/figures.ts:6`).
- Golden fixtures (ticket 01) hold literal old codes and stored entries, so a later change cannot break them in silence. Each old code that `designCode` made also gives the same code again through `designCode(parseDesign(code))`, so the link format and the rule order of `canonical` (`model.ts:141-148`) cannot drift.
- Code that A uses as it is:
  - `model.ts`: the types, `MAX_RULES` (`:72`), `orbit` and `lineOrbit` (`:77-88`), `PRESETS` (`:103-120`), `BLANK`, `presetOf`, `fromPreset` (`:121-134`), `canonical` and `keyOf` (`:141-150`), `limit` (`:154-161`, with its words "3 of 3 rules. Remove one to add another."), `empty`, `likeSquares`, `likeAlways`, `setMark`.
  - `vocab.ts`: `BLOCKS`, `GROUPS`, `blockOf`, `whenWords`, the validators and the When lists (`:66-188`).
  - `store.ts`, `judge.ts` (worth, band word, like line), `anchors.ts`, `moves.ts` (`movesOf`, `holds`), `text.ts` (`ruleParts`, `ruleText`, `describe`), `names.ts`, `figures.ts` and the 68 webp in `public/ui/workshop/`.
  - The engine's `makeMove` (`src/rules/engine.ts:985`) and `genPiece` (`:928`) for Try with. No second move interpreter.
  - The doors: `#title-workshop`, `#workshop-btn`, the `?design=` handling (`src/main.ts:188-194`).
  - Ctrl/Cmd+Z, 50 undo steps, the save alerts and their words (`dialog.ts:132-178`, `:315-331`).

## What goes (at the cutover, ticket 11)

- `src/workshop/dialog.ts` (786 lines), the old parts of `card.ts` (`cellMarks`, `gridHtml`, `cardHtml`), `sandbox.ts`, `motion.ts` (Set A), `art.ts` `gaugeHtml`, `look.ts` `ghost`, `text.ts` `dirWords`, `workshop.css`.
- The judge's exports that only the old screens read, with their tests: `whyHead`, `whyTitle` and `badgeText`. The `Verdict` fields stay: `memory` feeds `warn` and `line` (`judge.ts:295`, `:319`, `:326`), and `judge.test.ts:102` reads `metal`. A trim of the judge is not part of this build.
- Surprise me, the Why-estimate sheet, the thermometer, rule badges, the two 7 × 7 editor grids, Apply to, Take by, the Sliding directions disclosure, the Try it screen.
- `tools/workshop-motion.mts`, the old groups of `tools/verify-workshop.mjs` (A's check takes its path) and of `tools/verify-workshop-cast.mjs` (with `Removed-check:` trailers), the W12 sample states that open the old screens.

## Phases

| Phase | Tickets | The owner sees |
|---|---|---|
| 1. The view | 01 | A's board, plinth, seals and ledge, behind `?workshop=a` |
| 2. The editor | 02, 03, 07 | Paint, rules, new pieces, names and looks |
| 3. Why and try | 04, 05, 06 | The stamps, refused targets, the Why tag, Try with |
| 4. Finish | 08, 09, 10 | The share card, short landscape, motion |
| 5. Cutover | 11 | A is the Workshop; the old one is gone |
| Later | 12 to 17 | Rules, Kings and Cards tabs, See all, the engine case, games with a design |

## Decisions

Sources: "owner" is a quote; "mockup" is the approved sample; "delegation" is decided by delegation (owner, 2026-10-09), where the owner left the choice open; "engineering" is a build choice that the player does not see.

| # | Decision | Source | Reason |
|---|---|---|---|
| 1 | Build behind `?workshop=a`; cut over in ticket 11 | engineering | Main stays shippable, and the old checks guard the old Workshop until A covers it. |
| 2 | One legend module, `src/render/legend.ts`, for the game and A | owner | The legend ticket says "Do not make a second design." |
| 3 | A's board is SVG from the port of `marks.js`, on `public/ui/stone-board.webp` | engineering | The mockup renderer already draws rails, arches, stamps, seals and tags; the game's canvas board draws none of them. |
| 4 | `movesOf` makes every mark; `makeMove` plays every move | engineering | One interpreter; `moves.test.ts` already holds `movesOf` equal to the engine for the pool pieces. |
| 5 | At most 3 rules per piece | owner | `REVIEW.md:120`. |
| 6 | A pool piece opens read only; the first edit makes the copy | mockup | `proving-ground.html:1788`. |
| 7 | The copy is "My Pawn"; when that name is taken, "My Pawn 2" and on | mockup, number by delegation | The mockup names one copy; names must stay distinct on the ledge. |
| 8 | Paint by tap only; no drag strokes | mockup | Mirror paints up to 8 squares with one tap. |
| 9 | Nubs and knots have a hit area of 24 × 24 px or more (the mockup draws 22 px nubs, `proving-ground.html:169`, and 18 px knots, `:1020`); the board squares are as large as the board allows (45 px at 390 px wide, 36 px at 320 px); every other target is 44 px, the tools too (48 px in the mockup, `:209`) | delegation | A nub sits inside one 45 px square on a phone, and a knot in the 22 px gutter; 24 px meets WCAG 2.5.8. The W14 states and the check test `.nub`, `.knot` and the squares at 24 px and the rest at 44 px (rule 3). |
| 10 | The When chip opens the When choices | delegation | The chip is the When; the logic of today's When panel (`dialog.ts:618-656`) moves there. |
| 11 | Remove a rule: × on the desktop line, Remove in the phone sentence card; Undo gives it back | delegation | The mockup has no control for it. |
| 12 | Knots are gold or cracked; no "unknown" | delegation | The game computes each pair, so "unknown" never applies. |
| 13 | Weigh shows the worth, the band word and the like line | mockup, band word by delegation | The band word keeps today's warning in one word. |
| 14 | The Why-estimate sheet, its fixes and the rule badges go | delegation | The Why tag explains the marks; A has no place for the estimate sheet. |
| 15 | Surprise me goes | delegation | A opens on a working pool piece, which answers "start from a working sample". |
| 16 | The ⋯ design menu holds Copy as text, Make a copy and Delete; a pen renames | delegation | Today's features with no place in the mockup. |
| 17 | The look row (mockup) plus "More": the 34 figures with the tag filter, and the army | mockup, "More" by delegation | Today's gallery and army stay. |
| 18 | Pool art for pool pieces and their copies; cast figures for a new piece | mockup | `proving-ground.html:733`, `:1024-1027`. |
| 19 | Each pool piece starts on its example board (the piece placements of `scenes.js`); a new piece stands alone on d4 | mockup | The scenes are the approved examples. |
| 20 | Pills show as text until ticket 03 | engineering | Ticket 01 is the view only. |
| 21 | The seal art uses the mockup's `SIGILS` (`marks.js:88`); `vocab.ts` gets a `label` field from the mockup's short names (`proving-ground.html:681`) | mockup | One list of seals. |
| 22 | No Colour check switch; no Words switch in v1 | delegation | The Colour check is a review tool of the states menu (`proving-ground.html:2118`). The phone ⋯ menu's "Words off" (`:968`, `:1992`) is later: the words teach the marks, and the desktop has no such switch. |
| 23 | Wide layout from 1000 px; narrow below 1000 px; short landscape (landscape, at most 500 px high) has its own layout | delegation | The wide layout needs the board and two 300 px columns. |
| 24 | "Move N" and "card played" show in the Try with tray only when a rule reads them | delegation | Most designs do not need them; `fromMove`, `beforeMove` and `afterCard` do. |
| 25 | A link opens the card face (from B), then the board | owner and review | "A, Card" (`web-redesign/spec.md:43`); `REVIEW.md:106`. |
| 26 | "See all" is B's binder grid | review | `REVIEW.md:106`. |
| 27 | A's motion is the mockup's list, each within 600 ms (300 ms at Fast); none with reduced motion or Animations Off | mockup | The limit of `docs/WORKSHOP.md:77-79`. |
| 28 | The laws are read-only status | review | `REVIEW.md` asks for a read-only outline first; the flags are balance choices. |
| 29 | No king mini boards (`PMINI`) | delegation | They are hand data; the power marks on the board show the same. |
| 30 | Cards on the board: Freeze, IceWall, Leap, March, Mimic, Vault | mockup | `proving-ground.html:1392`. |
| 31 | Powers and cards act only on unchanged pool pieces until ticket 16 | engineering | The engine makes these moves only for its own piece types. |
| 32 | Previews of powers and cards run in `withRules(over, fn)`, which puts `RULES` back in the same turn | engineering | The open game shares `RULES` (`src/rules/rules.ts:761`). |
| 33 | Until the cutover, `ground.ts` has its own save plumbing in A's look | engineering | `dialog.ts` goes whole in ticket 11, so a shared copy would change dead code. |
| 34 | The Shot tool on a Both square gives Move + Shot (`moveShoot`); the mockup gives Shot (`proving-ground.html:1779`) | delegation | The Shot tool adds a shot and keeps the move channel, as `setMark` does (`model.ts:236-241`); a tap must not erase a move. |
| 35 | A nub switches its line with the Mirror set (`lineOrbit`, `model.ts:83`); the mockup switches one line (`:1803`) | delegation | Lines and squares follow the same Mirror; Mirror One gives the mockup's behaviour. |
| 36 | A square's mark is the painted mark at that offset: on an empty square, or on an enemy that the piece can take there. A line square is `move` when empty and `take` on the enemy that ends it. A move-only mark on an occupied square, and any friend, has no mark (swap and push show as effects) | mockup | This is how the approved scenes are drawn (`scenes.js` Pawn c5 and e5, Archer b6, Maester c5); `movesOf` gives the reach, the board gives the occupant, and `scene.ts` adds no move rule. |
| 37 | Hover-only marks and effects (`on` in the scene format, `scenes.js:11`) show while their square has the pointer, the key focus or the open Why tag (`proving-ground.html:1144`, `:2041`, `:2047-2054`) | mockup | The Beast's second take, the Archer's sight lines and the Ogre's follow need a way in on a touch screen (the Why tag) and with keys (the focus). |
| 38 | A rule line shows the mockup's short line with its pill (`sealLineHTML`, `proving-ground.html:979-1005`): "steps 2 straight ahead", "becomes [a piece you choose]", "cannot take [a king]". The When chip holds only the When words; a When parameter ("a piece, not a pawn") is a pill after the chip. The short lines are one table beside the long sentences in `text.ts` (`lineParts`); `ruleText` stays for the old Workshop and for screen readers | delegation (the approved mockup wins) | Ticket 01 kept the long vocabulary sentence, which takes two or three rows on a line; the approved mockup has one short row. The long sentence stays on the Rules shelf's sentence card, and it names the phone's plinth seals for screen readers. |

## Later, with no ticket

Each item is in the mockup or the review, and v1 leaves it out for the reason given.

- Editing the laws (`RULES` flags): the flags are balance choices, and `REVIEW.md` asks for a read-only outline first (decision 28).
- The power and card facts table (MATRIX C.1 as code): only tickets 13 and 14 need it, and they are later.
- The small step boards in the Why tag (`proving-ground.html:1320`): hand data in the mockup (`scenes.js` `steps`); the sum of the tag already explains the mark.
- The "Also changed by" row (`:604-615`, `:1055`): it lists powers and cards, which act only on pool pieces until ticket 16 (decision 31).
- `captureRefusal()` for engine pieces: refusals by shelters, the capital and marks need an engine change (ticket 04, Risks).
- Ranged lines and offsets beyond ±3 (`REVIEW.md` §6 item 6): the share code and `validParts` (`model.ts:201-213`) hold ±3; a wider range changes the link format.
- History scenes for Salvation, Rescue, Mirror and Growth: the owner dropped Mirror and Rescue from the deal (2026-10-07), and the others need ticket 14.
- The phone's "Words off" switch (`:968`, `:1992`): decision 22.
- The die's hand-made boards (`:1995-2005`): a design has none; the die places random enemies (ticket 06).

## Rules for every ticket

1. **Tests:** `npm test` passes (type check, vitest, node tests, the doc lints). Never bare vitest. Pure logic goes in a module with a unit test that runs with no DOM.
2. **Browser checks:** `npm run check:browser proving-ground` and the checks that the ticket names pass. A new or changed check group runs three times with no failure before the pull request. The check reads marks from the `data-sq` and `data-k` attributes of the SVG, not from pixels.
3. **Samples:** `SAMPLE=W14 node docs/specs/web-ux/capture.mjs <preview-url> <out>` renders the ticket's states at 1440 × 900 and 390 × 844 (ticket 09 adds `landscape`, 844 × 390). Each W14 state sets `targets: 'button:not(.sq, .nub, .knot), select, summary, label'`, because the 44 px touch test of `capture.mjs:108` would fail the 24 px parts of decision 9; `tools/verify-proving-ground.mjs` tests those parts at 24 px. Renders stay out of Git.
4. **The owner's look:** a ticket that changes what the player sees stays a draft pull request until the owner says yes to its renders. The ticket records his words and the date.
5. **The legend:** A imports `src/render/legend.ts`. No colour or size of a mark is written a second time.
6. **Compatibility:** the golden fixtures of ticket 01 stay green in every ticket.
7. **Removed checks:** each removed or changed assertion line of a registered check gets a `Removed-check: <file>: <what>, <why>` trailer.
8. **Docs:** `docs/WORKSHOP.md` changes only at the cutover, with its deny list (`src/workshop/workshop.docs.test.ts:29-43`) in the same commit: A brings back words that the list denies (brushes, plinth, rim), so ticket 11 drops the entries that A's doc needs. Until then, this spec describes the preview. The same test lints each file in `src/workshop` and each `tools/*workshop*` file (`:59-82`): a `§` must have its doc's name just before it (`REVIEW.md §6`), or the file must name the revision 3 doc. A bare `§` in `ground.ts`, `scene.ts`, `marks.ts` or `why.ts` fails `npm test`.
9. **Size:** the shortest diff that works. No new dependency. Delete what A makes dead in the same ticket, or list it for ticket 11.
10. **Plugin:** no ticket here changes a module of the plugin page (web-redesign spec rule 5). If one must, it follows that rule.

## Tickets

| # | Title | Size | Blocked by |
|---|---|---|---|
| [01](issues/01-proving-ground-view.md) | The Proving Ground view | L | move-legend 01 |
| [02](issues/02-paint-on-the-board.md) | Paint on the board | M | 01 |
| [03](issues/03-rule-seals.md) | Rule seals: change, add and remove | M | 02 |
| [04](issues/04-why-trace.md) | Why-trace and refused targets | M | 01 |
| [05](issues/05-why-tag.md) | The Why tag | S | 02, 04 |
| [06](issues/06-try-with.md) | Try with | M | 05 |
| [07](issues/07-new-piece-name-look.md) | New piece, name, look and the design menu | S | 02 |
| [08](issues/08-share-card.md) | The card face for sharing | M | 07 |
| [09](issues/09-short-landscape.md) | Short landscape | S | 03, 06, 07 |
| [10](issues/10-motion.md) | Motion | M | 03, 06 |
| [11](issues/11-cutover.md) | Cut over: A becomes the Workshop | L | 02 to 10 |
| [12](issues/12-rules-tab.md) | Rules tab (later) | S | 03, 11 |
| [13](issues/13-kings-and-powers.md) | Kings tab and powers (later) | M | 06, 11 |
| [14](issues/14-lab-cards.md) | LAB cards tab (later) | M | 13 |
| [15](issues/15-see-all.md) | See all: the binder grid (later) | S | 08, 11 |
| [16](issues/16-engine-designed-piece.md) | Engine: the designed-piece case (later) | M | none |
| [17](issues/17-play-a-design.md) | Play a design in a game (later) | L | 16 (step 5: 13, 14) |

## Open decisions for the owner

1. The engine case and real games with a design (tickets 16 and 17) come after A. Pick: later.
2. Weigh shows the worth, the band word and the like line; the Why-estimate sheet, fixes and badges go. Pick: yes.
3. Surprise me goes. Pick: yes.
4. A design link opens the card face first, then the board. Pick: yes.
5. The Rules, Kings and Cards tabs and See all come after the cutover. Pick: yes.
6. "A is final" covers A's motion list, and ticket 10's phone video is the check. Pick: yes.
7. The `?workshop=a` preview lives on main until the cutover. Pick: yes.
