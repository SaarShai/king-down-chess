# 12 · Rules tab (later)

Status: done (PR #42, merged to main with #41, 2026-10-11)
Size: S
Blocked by: 03, 11
Later: not needed for v1; the Rules shelf of ticket 03 already shows each seal with its sentence and preview.

## Scope

- The ledge's Rules tab: the ten seals in their 6 groups; an open seal shows large on the plinth with its example, its MATRIX row and where it is seen.
- The laws as read-only status (decision 28), and the Fixed plaque.
- Mockup state `rules`; functions `renderInfo` (`proving-ground.html:1105`); `SEALINFO` (`:721`) is hand data, so the words come from `vocab.ts`.

## Plan

1. [x] **`src/workshop/ground.ts`:** the Rules tab. A tap on a seal shows a 168 px seal and its `label` on the plinth, and in the info column its `example`, `matrix` row and `seenOn` (`vocab.ts:18-47`). The board shows the seal's preview on its example piece.
2. [x] **Laws, read only:** one plaque for each of `fiftyMove` (`src/rules/rules.ts:633`), `threefold` (`:635`), `insufficientMaterial` (`:637`), `guardNextToKing` (`:288`) and `bishopsOppositeColours` (`:629`), with "On" or "Off" from `RULES` as text (not a switch); promotion in words for each value of `promotionSet` (`:631`; the values at `:20`). The Fixed plaque: "8×8 board · check and checkmate · no castling · no en passant · a power never takes a king." Desktop only (the phone hides the laws, as the mockup).
3. [x] **Check group `rulesTab`;** W14 state `rules-tab`.

## Verification

- [x] `npm test` passes; a `ui.test.ts` case holds the law words to `RULES`.
- [x] `npm run check:browser workshop` passes three times.
- [ ] W14 renders at 1440 × 900 and 390 × 844; the owner sees them before the merge.

## Risks

- A law's words must follow `RULES` in force, never demo text (web-redesign spec rule 11).

## Does not do

- No law editing (spec, "Later").

## Comments

### 2026-10-11: built (branch `claude/proving-ground`)

- Step 1: `openSeal` and `sealOn` in `src/workshop/ground.ts`; the styles in `src/workshop/ground.css`. A tap on a seal of the Rules tab shows the seal at 168 px and its `label` on the plinth. The right column shows the `example`, the `matrix` row and "Seen on". The board shows the example piece on its example board with the rule kept (the isolate of ticket 04), as the mockup's `SEALINFO` `show` does.
- Step 2: `lawsOf` and `promotion` in `src/workshop/text.ts`. The laws read `RULES` in force each time the tab draws. The plaques are list items with "On" or "Off", not switches. The Fixed plaque has the ticket's words.
- Step 3: the group `rulesTab` in `tools/verify-workshop.mjs`; the W14 state `rules-tab` in `docs/specs/web-redesign/samples/W14.mjs`. No old assertion changed.

Changes from the ticket, with the reasons:

- `vocab.ts` has no `seenOn` field. "Seen on" comes from `PRESETS`: the pool pieces that have the rule. So it cannot drift from the pool, and it adds no hand data. "Moves like" is on no pool piece: "Seen on" says "No pool piece has it yet.", and its example piece is the Pawn with the block's default rule (the mockup shows "My Pawn" with the same rule).
- The example piece is the first pool piece with the rule. A tap on a piece in "Seen on" opens that pool piece on the Pieces tab with the rule kept (the mockup's `data-seenon`).
- Promotion: the engine's `PROMOTION_SETS` is not exported, and `engine.ts` runs in the plugin page (web-redesign spec rule 5). So `promotion()` asks the engine for the moves of a pawn on a7 (`genPiece`) and names their pieces. The plaque shows the letters ("Q R B N", as the mockup's pill); its label and title give the words.
- Each law plaque has its sentence from the mockup's info words as its title ("Fifty moves with no take and no pawn move: a draw."). The mockup's law item (a law on the plinth) is not built: the ticket names plaques only.
- In the seal view the brushes, the key row, the tray (desktop), Undo, Share and ⋯ do not show, and the editor keys (1, 2, 3, B, S, Ctrl+Z) do nothing: the view shows a rule, not a design to edit. The mockup's right column shows the words only. A tap on a square still opens its Why tag.
- The phone: the seal is 56 px beside its name (the mockup's `html.phone .bigseal`). The right column under the board has room for the example only, so the MATRIX row and "Seen on" show on the wide layout only. The mockup's phone shows no info words.
- Short landscape: the ledge's sheet has the Rules tab too, and its groups stay in one row that scrolls sideways. Two rows did not fit in the 198 px sheet.
- The Kings and Cards tabs are tickets 13 and 14 (another builder). The tab list is `[['pieces', 'Pieces'], ['rules', 'Rules'], …]` in `renderLedge`, so each ticket adds its tab there.
- W14 `beast-cancel`: the recipe now waits for the open Workshop before it asks if the ledge is hidden, as `piece()` does. On the dev server it failed 2 of 2 times (`w14.log`) because the ledge did not exist yet, so the recipe clicked the hidden Pieces button of the narrow layout. After the fix it passed 3 of 3 times in a scratch run and in the full table.

Evidence (S = `/private/tmp/claude-501/-Users-za-Documents-king-down-chess/08f2956c-63a7-4276-8738-a657bdb42b06/scratchpad/build/12-rules`):

- `npm test` through the shared lock: 115 test files passed and 1 skipped, 1,883 tests passed and 21 skipped (2 new in `ui.test.ts`: the law words follow `RULES` for each law on and off, and the promotion words for each value of `promotionSet`), `exit 0`. Log: `S/npm-test-1.log`. A second run on the final tree: `S/npm-test-2.log`.
- `npm run check:browser workshop`, three runs: each workshop log ends "workshop: all groups pass" (`S/ws-2mKegX.log`, `S/ws-OfqKtm.log`, `S/ws-j9IBTa.log`). The runner marked run 1 FAIL only because this ticket file changed during the run (`S/check-1.log`: "changed in the checkout: …12-rules-tab.md"); runs 2 and 3 are "ok" (`S/check-2.log`, `S/check-3.log`). A run before these (`S/check-0.log`) failed on a wrong expectation of the check: "cannot take" is the Paladin's rule II, not III.
- `SAMPLE=W14 node docs/specs/web-ux/capture.mjs` on the dev server of this worktree (port 5183): 94 renders, 0 with a fault (`S/w14-2.log`, `S/w14/`; `rules-tab-desktop.png` and `rules-tab-phone.png`).
- The build beside the mockup's state `rules`: `S/build-rules-1440.png` and `S/build-rules-390.png` beside `S/mock-rules-1440.png` and `S/mock-rules-390.png`. Also `S/build-moveslike-*.png`, `S/build-chain-*.png` and short landscape `S/build-landscape-sheet.png` and `S/build-landscape-seal.png`. The plinth, the board, the right column and the ledge agree with the mockup. The differences that stay are in the list above: the MATRIX row (the ticket adds it), "On" and "Off" in place of the lamps (the ticket), the example under the phone's board, and no Kings and Cards tabs (tickets 13 and 14).

### Reviews

Review 1 (`review-12.md`, 6 findings). S is the evidence folder above. A scratch probe on the dev server (`S/probe.mjs`) showed each failure before the fix.

1. should-fix, focus lost after a tap on "Seen on": **confirmed.** The probe pressed Enter on "Paladin": the focus went to `BODY`, because the render removes the `data-seenon` button. Fix: after the render, the focus goes to the open slot `[data-piece="paladin"]` (`ground.ts`, one line). The probe now gives `BUTTON paladin`. New assertion in `rulesTab`: "the focus goes to the Paladin's slot".
2. should-fix, `aria-label` on the plain promotion pill: **confirmed.** ARIA 1.2 does not allow `aria-label` on a generic `span`; the Chromium accessibility tree read "Promotion Q R B N". Fix: the pill has `aria-hidden="true"`, and the words are in a `sr-only` span. The tree now reads "Promotion queen, rook, bishop or knight". The look does not change (`S/build-rules-1440-review.png`). The `rulesTab` text expectation of the laws changed to match.
3. nit, a law's sentence is only in a `title`: **confirmed, not fixed.** It is the recorded choice above, and the fix costs more than one line (text and its check). For a later ticket.
4. nit, the rule-focus lookup two times and two renders after "Seen on": **confirmed, not fixed.** The extra render does no harm, and a shared helper costs more than one line.
5. nit, `rulesTab` between the doc comment of `motionRun` and `motionRun`: **confirmed, fixed.** The comment moved back above `motionRun`.
6. nit, no target-size check on the phone: **confirmed as a gap, fixed with one line.** The phone's seal buttons are 64 × 66 px now (the probe), so nothing fails today; `minTarget(ph, '#workshop [data-openseal]')` now guards them.

Evidence after the fixes: `npm test` through the shared lock, 115 files passed and 1 skipped, 1,883 tests passed and 21 skipped, `exit 0` (`S/npm-test-review.log`). `npm run check:browser workshop` three times: "ok workshop" and "check: all 1 passed" each time (`S/check-review-1.log`, `S/check-review-2.log`, `S/check-review-3.log`).
