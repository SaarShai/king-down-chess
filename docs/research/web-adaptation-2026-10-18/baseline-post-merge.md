**Post-merge run, 2026-10-19 (ticket 08, step 5).** The render pairs that this report links stayed in a temporary folder and are not in git (91 MB).

# Web baseline after PR 61

The local web app at `cd8fa9f2` has the same visible change list as the prior comparison with `52aca5fe`. No additional visible change appears. No prior change item is absent. All items have a recorded pick or fix. This run finds no new web trade-off.

## Scope and source

This report covers ticket 08, step 5, for the site root. The owner supplies `04b7af87` as the pre-merge live build. This run does not establish the current remote deployment identity. The deploy record must name that source and deploy ID.

| Input | Commit | Git tree | Local port |
|---|---|---|---:|
| Pre-merge live | `04b7af875e61009e934b17d7905ab8f06186dd1c` | `f13e8e43c48ee9b190391b41dceff6d7b6c1187c` | 5193 |
| PR 61 merge | `cd8fa9f27ecd9a1f193f4be75660db4fe42a819d` | `1183dd83b7789ff5f250233a005f79bec6e52f87` | 5194 |

Both source trees have no Git status entries at the end. `Source record`. Image names use `live` for the pre-merge build and `rc` for merged main. Both sizes use device scale 1: 390 × 844 and 1440 × 900.

## Already live at 04b7af87

- Coordinate labels below 8 CSS px stay hidden.
- Passive board effects stop after 5 seconds and restart on an action.
- The context row grows for its text.

| Screen | Existing behavior | Cause: file and commit | Prior report | Decision and source | Renders |
|---|---|---|---|---|---|
| Coordinates | Labels below 8 CSS px stay hidden. Both normal sizes show labels; a forced 180 px board shows none. The limit applies to the label font. | [src/render/board-ink.ts](../../../src/render/board-ink.ts); `d0a0d5f4`. Each commit is an ancestor of `04b7af87`. | Matches Known candidates. | recorded owner pick or fix — the named source fix and prior report (`baseline-pre-merge/report.md` on the local branch `prototype/web-account-sample`), Known candidates. | 390x844: `live` / `merged`<br>1440x900: `live` / `merged` |
| Passive board effects | Passive redraws stop after 5 seconds. A board action starts them again. | [docs/2d-first-pieces/board/scene.mjs](../../../docs/2d-first-pieces/board/scene.mjs); `7adaac11`. Each commit is an ancestor of `04b7af87`. | Matches Known candidates. | recorded owner pick or fix — the named source fix and prior report (`baseline-pre-merge/report.md` on the local branch `prototype/web-account-sample`), Known candidates. | 390x844: `live` / `merged`<br>1440x900: `live` / `merged` |
| Context row | The row grows through minmax(var(--context-height), max-content). All 48 main context boxes match across the trees. This CSS file has no net diff. | [src/ui/table.css](../../../src/ui/table.css); `aaba929f; b15de1b7`. Each commit is an ancestor of `04b7af87`. | Matches Known candidates. | recorded owner pick or fix — the named source fix and prior report (`baseline-pre-merge/report.md` on the local branch `prototype/web-account-sample`), Known candidates. | 390x844: `live` / `merged`<br>1440x900: `live` / `merged` |

## Arrives with the merge

- Twelve visible text paths change from “Tap” to “Select”: turn ready, waiting action, free mark, Haste, staged result, link turn, three armed powers, Beast refusal and two Guides.
- The first board frame waits for decoded stone art.
- Privacy, Support and Terms change their text.
- Disabled coins keep their faces in the forced diagnostic. This CSS change has no current visible local user path. Normal local coins match.

| Screen | Change | Cause: file and commit | Prior report | Decision and source | Renders |
|---|---|---|---|---|---|
| Turn ready | “Tap End turn” becomes “Select End turn”. | [src/turn.ts](../../../src/turn.ts); `cbcd590d` | Matches. | recorded owner pick or fix — [docs/specs/owner-decisions-2026-10-15/issues/02-home.md](../../../docs/specs/owner-decisions-2026-10-15/issues/02-home.md) — B4 and Review repair results A4/B5. | 390x844: `live` / `merged`<br>1440x900: `live` / `merged` |
| Action while a turn waits | “tap End turn” becomes “select End turn”. The other source form uses “Select End turn, or Undo”. | [src/turn.ts](../../../src/turn.ts); `cbcd590d` | Matches. | recorded owner pick or fix — [docs/specs/owner-decisions-2026-10-15/issues/02-home.md](../../../docs/specs/owner-decisions-2026-10-15/issues/02-home.md) — B4 and Review repair results A4/B5. | 390x844: `live` / `merged`<br>1440x900: `live` / `merged` |
| Free mark | “or tap End turn” becomes “or select End turn”. | [src/turn.ts](../../../src/turn.ts); `cbcd590d` | Matches. | recorded owner pick or fix — [docs/specs/owner-decisions-2026-10-15/issues/02-home.md](../../../docs/specs/owner-decisions-2026-10-15/issues/02-home.md) — B4 and Review repair results A4/B5. | 390x844: `live` / `merged`<br>1440x900: `live` / `merged` |
| Haste | “Move it again, or tap End turn” uses “select”. | [src/turn.ts](../../../src/turn.ts); `cbcd590d` | Matches. | recorded owner pick or fix — [docs/specs/owner-decisions-2026-10-15/issues/02-home.md](../../../docs/specs/owner-decisions-2026-10-15/issues/02-home.md) — B4 and Review repair results A4/B5. | 390x844: `live` / `merged`<br>1440x900: `live` / `merged` |
| Result before End turn | “Checkmate. Tap End turn to finish” uses “Select”. The source also changes Stalemate and Draw. | [src/turn.ts](../../../src/turn.ts); [src/context-line.ts](../../../src/context-line.ts); `cbcd590d; 62984d80` | Matches. | recorded owner pick or fix — [docs/specs/owner-decisions-2026-10-15/issues/02-home.md](../../../docs/specs/owner-decisions-2026-10-15/issues/02-home.md) — B4 and Review repair results A4/B5. | 390x844: `live` / `merged`<br>1440x900: `live` / `merged` |
| Local link: turn ready | “Tap Send your turn” becomes “Select Send your turn”. | [src/turn.ts](../../../src/turn.ts); `cbcd590d` | Matches. | recorded owner pick or fix — [docs/specs/owner-decisions-2026-10-15/issues/02-home.md](../../../docs/specs/owner-decisions-2026-10-15/issues/02-home.md) — B4 and Review repair results A4/B5. | 390x844: `live` / `merged`<br>1440x900: `live` / `merged` |
| Armed Freeze | “Tap an enemy piece” becomes “Select an enemy piece”. | [src/context-line.ts](../../../src/context-line.ts); `62984d80` | Matches. | recorded owner pick or fix — [docs/specs/owner-decisions-2026-10-15/issues/02-home.md](../../../docs/specs/owner-decisions-2026-10-15/issues/02-home.md) — B4 and Review repair results A4/B5. | 390x844: `live` / `merged`<br>1440x900: `live` / `merged` |
| Armed Ice Wall | “Tap one of your pieces” becomes “Select one of your pieces”. | [src/context-line.ts](../../../src/context-line.ts); `62984d80` | Matches. | recorded owner pick or fix — [docs/specs/owner-decisions-2026-10-15/issues/02-home.md](../../../docs/specs/owner-decisions-2026-10-15/issues/02-home.md) — B4 and Review repair results A4/B5. | 390x844: `live` / `merged`<br>1440x900: `live` / `merged` |
| Armed Sacrifice | “Tap one of your pawns” becomes “Select one of your pawns”. | [src/context-line.ts](../../../src/context-line.ts); `62984d80` | Matches. | recorded owner pick or fix — [docs/specs/owner-decisions-2026-10-15/issues/02-home.md](../../../docs/specs/owner-decisions-2026-10-15/issues/02-home.md) — B4 and Review repair results A4/B5. | 390x844: `live` / `merged`<br>1440x900: `live` / `merged` |
| Beast chain refusal | “Tap a marked piece, or stop here” uses “Select”. The context crops exclude the variable board. | [src/read.ts](../../../src/read.ts); `62984d80` | Matches. | recorded owner pick or fix — [docs/specs/owner-decisions-2026-10-15/issues/02-home.md](../../../docs/specs/owner-decisions-2026-10-15/issues/02-home.md) — B4 and Review repair results A4/B5. | 390x844: `live` / `merged`<br>1440x900: `live` / `merged` |
| Guide: Beast | The bite and Stop here instructions use “Select”. | [src/read.ts](../../../src/read.ts); `62984d80` | Matches. | recorded owner pick or fix — [docs/specs/owner-decisions-2026-10-15/issues/02-home.md](../../../docs/specs/owner-decisions-2026-10-15/issues/02-home.md) — B4 and Review repair results A4/B5. | 390x844: `live` / `merged`<br>1440x900: `live` / `merged` |
| Guide: Reaver | The piece and landing-square instruction uses “Select”. The line wrap changes. The capture uses a custom position. | [src/read.ts](../../../src/read.ts); `62984d80` | Matches. | recorded owner pick or fix — [docs/specs/owner-decisions-2026-10-15/issues/02-home.md](../../../docs/specs/owner-decisions-2026-10-15/issues/02-home.md) — B4 and Review repair results A4/B5. | 390x844: `live` / `merged`<br>1440x900: `live` / `merged` |
| First board frame | The canvas stays hidden until stone art decodes. ready() waits for the first frame. The complete board matches. The capture holds decode open. | [docs/2d-first-pieces/board/scene.mjs](../../../docs/2d-first-pieces/board/scene.mjs); [src/render/PaintedView.ts](../../../src/render/PaintedView.ts); `88f1188a; e2cb2dc5` | Matches. | recorded owner pick or fix — [docs/specs/plugin-submission/issues/29-release-candidate.md](../../../docs/specs/plugin-submission/issues/29-release-candidate.md) — lines 116, 137 and 157 (F13). | 390x844: `live` / `merged`<br>1440x900: `live` / `merged` |
| Privacy page | The page names the public ChatGPT app. It adds request counts, follows and blocks, three visibility choices, and Block/Unblock paths and effects. The page grows. | [public/privacy.html](../../../public/privacy.html); `86912ec7; c9e7a8ed; 5b77bf3a; be163c2f; df5b516d; e253b31f; d81d101c; f68d2983` | Matches. | recorded owner pick or fix — [ticket 08, Merge record](../../../docs/specs/web-adaptation/issues/08-release-evidence.md). | 390x844: `live` / `merged`<br>1440x900: `live` / `merged` |
| Support page | A Credits section names Studio Danro, Noun Project, CC BY 3.0 and the right-pointing sword. The page grows. | [public/support.html](../../../public/support.html); `c3133735` | Matches. | recorded owner pick or fix — [ticket 08, Merge record](../../../docs/specs/web-adaptation/issues/08-release-evidence.md). | 390x844: `live` / `merged`<br>1440x900: `live` / `merged` |
| Terms page | The date changes from 3 to 18 October 2026. The opening names the ChatGPT app. The phone text gains a line. | [public/terms.html](../../../public/terms.html); `86912ec7` | Matches. | recorded owner pick or fix — [ticket 08, Merge record](../../../docs/specs/web-adaptation/issues/08-release-evidence.md). | 390x844: `live` / `merged`<br>1440x900: `live` / `merged` |
| Disabled coin diagnostic | A forced disabled coin keeps its radial face in merged main. Live loses that face. Normal local coins match. No local user path sets this disabled state. | [src/style.css](../../../src/style.css); `87631a9a; 568a9f42` | Matches. | recorded owner pick or fix — [docs/specs/plugin-submission/issues/29-release-candidate.md](../../../docs/specs/plugin-submission/issues/29-release-candidate.md) — lines 82–88. | 390x844: `live` / `merged`<br>1440x900: `live` / `merged` |

The turn helper also changes the spoken turn announcement. Audio is outside this capture check. Some changed help text stays hidden in the local page.

## Comparison with the prior report

Reference: pre-merge report (`baseline-pre-merge/report.md` on the local branch `prototype/web-account-sample`). Every row above matches its Visible changes or Known candidates table. **Changes that the prior report does not find: none. Prior change items now absent: none.**

The prior report's variable pixels are not product change items. This run finds a different set of variable frames; the table below gives each area. The coin diagnostic remains conditional in both reports. Normal coin faces remain equal. The complete loaded board also remains equal.

The Git diff from `52aca5fe` to `cd8fa9f2` has no changed path in the local bundle, public files, `index.html` or build config. `Site delta` is empty. Changes to plugin-only files do not enter this root-page bundle. The live-to-merged module intersection still has 9 changed bundled files and 3 public pages. `File and commit list`, `source diff`, `full diff stat`.

## Unstable areas and treatment

The first two live main captures differ in 2 of 48 pairs. The first two live extra captures match in all 26 pairs. Two merged main pairs vary. A further full diagnostic pass finds Beast-board and phone idle variation. The comparisons below exclude all of these areas. Pixel threshold: a red, green or blue channel differs by more than 16 of 255. Lesser pixel noise does not count as a visible change under the house tool.

| Tree | Screen | Repeat | Pixels above threshold | Bounds: x, y, width, height | Treatment |
|---|---|---|---:|---|---|
| live | `first-visit-390x844.png` | pass 1 versus 2 | 45 | 331, 458, 22, 48 | Mask the king sprite: (327, 454, 30, 56). |
| live | `idle-after-5s-1440x900.png` | pass 1 versus 2 | 2562 | 335, 56, 571, 775 | Mask the full board; retain the redraw-count check. |
| merged | `idle-after-5s-1440x900.png` | pass 1 versus 2 | 719 | 334, 57, 572, 772 | Mask the full board; retain the redraw-count check. |
| merged | `idle-after-5s-390x844.png` | pass 1 versus 2 | 606 | 103, 84, 272, 358 | Mask the full board; retain the redraw-count check. |
| live | `beast-chain-refusal-1440x900.png` | extra 1 versus 3 | 506 | 173, 182, 681, 658 | Crop the context row; mask the full board in full-image comparisons. |
| live | `idle-verified-390x844.png` | extra 1 versus 3 | 54 | 207, 72, 34, 327 | Mask the full board; retain the redraw-count check. |
| merged | `beast-chain-refusal-390x844.png` | extra 1 versus 3 | 102 | 27, 133, 322, 313 | Crop the context row; mask the full board in full-image comparisons. |
| merged | `idle-verified-390x844.png` | extra 1 versus 3 | 41 | 206, 72, 28, 57 | Mask the full board; retain the redraw-count check. |

The first-visit phone area contains the small king figure. The idle variation stays on the board. Beast variation also stays on the board; the text crops match in all three captures per tree.

Masks apply to both trees and all compared passes. The phone board mask is `(4, 56, 382, 408)`; the desktop board mask is `(64, 24, 928, 852)`. Board masks apply only to idle and Beast states. They make no claim about those variable board pixels. The separate ready-board states remain unmasked. `Main masks`, `extra masks`, `raw bounds`. The original images stay in the pass folders and `renders`.

## Check evidence

| Comparison | Pairs | Differ | Result |
|---|---:|---:|---|
| Live main repeat after masks | 48 | 0 | Stable outside the masks. |
| Merged main repeat after masks | 48 | 0 | Stable outside the masks. |
| Live versus merged main after masks | 48 | 8 | Four Select text states at two sizes. |
| Live full extra repeat after masks | 32 | 0 | Stable outside the masks. |
| Merged full extra repeat after masks | 32 | 0 | Stable outside the masks. |
| Live versus merged full extra after masks | 32 | 26 | Eight text states, three public pages, first frame and forced disabled coins, at two sizes. |
| Beast text crop, live repeat | 2 | 0 | Both repeat passes also match the third pass. |
| Beast text crop, merged repeat | 2 | 0 | Both repeat passes also match the third pass. |
| Beast text crop, live versus merged | 2 | 2 | Select replaces Tap. |
| Review board, repeats and cross-tree | 2 each | 0 | No visible change. |
| Complete board after loading | 2 | 0 | No visible change. |

Every comparison has zero missing partners. `Main, crop and review results`, `full extra results`. The house comparator is `docs/specs/web-ux/render-compare.mjs`, two-folder form. Exit 1 for the listed cross-tree differences is the expected comparison result.

Both Vite production builds complete. Build output, copied configs and temporary config files stay under this output folder. The config path copy keeps config-loader writes out of the worktrees. `envDir: false` prevents env-file loading. `Build log`, `build script`, `live modules`, `merged modules`.

The copied capture, extra, review, compare, crop and report scripts keep the prior logic. Their paths and ports point at these trees and ports 5193/5194. The inventory revision points at the merge. `make-report.mjs` remains a reference copy; this report uses current evidence through `write-report.py`. The full diagnostic repeat uses an unchanged extra-script copy in `repeat-first/`.

All capture runs report zero faults. The review assertions pass. Each browser batch takes the house slot through `SLOTS` and `takeSlot` with the required merged-tree path. Each batch runs for less than 20 minutes. Each releases its slot and stops its own server in the final block. Both local ports refuse a connection at the end. `Live batch`, `merged batch`, `diagnostic batch`.

The idle checks count 80→80→88 frames at 390 × 844 in both trees. At 1440 × 900, live counts 82→82→90; merged counts 81→81→89. The first two counts follow 7 and 8 seconds of idle time; the third follows selection. Both normal board widths are 381 and 798 CSS px. A forced 180 px board draws zero coordinate labels in both trees.

The delayed-decode check reports visible/no decode wait in live, and hidden/decode wait in merged main. Both become visible after release. Both full diagnostic repeats keep that result. `Live checks`, `merged checks`, `live diagnostic repeat`, `merged diagnostic repeat`.

## Screens with no stable visible change

| Screen | Renders |
|---|---|
| home | 390x844: `live` / `merged`<br>1440x900: `live` / `merged` |
| first-visit | 390x844: `live` / `merged`<br>1440x900: `live` / `merged` |
| game | 390x844: `live` / `merged`<br>1440x900: `live` / `merged` |
| new-game | 390x844: `live` / `merged`<br>1440x900: `live` / `merged` |
| new-game-powers | 390x844: `live` / `merged`<br>1440x900: `live` / `merged` |
| new-game-two | 390x844: `live` / `merged`<br>1440x900: `live` / `merged` |
| new-game-two-powers | 390x844: `live` / `merged`<br>1440x900: `live` / `merged` |
| piece-selected | 390x844: `live` / `merged`<br>1440x900: `live` / `merged` |
| turn-ended | 390x844: `live` / `merged`<br>1440x900: `live` / `merged` |
| menu | 390x844: `live` / `merged`<br>1440x900: `live` / `merged` |
| settings | 390x844: `live` / `merged`<br>1440x900: `live` / `merged` |
| lesson | 390x844: `live` / `merged`<br>1440x900: `live` / `merged` |
| workshop | 390x844: `live` / `merged`<br>1440x900: `live` / `merged` |
| end | 390x844: `live` / `merged`<br>1440x900: `live` / `merged` |
| review | 390x844: `live` / `merged`<br>1440x900: `live` / `merged` |
| review-board | 390x844: `live` / `merged`<br>1440x900: `live` / `merged` |
| link-game | 390x844: `live` / `merged`<br>1440x900: `live` / `merged` |
| coins | 390x844: `live` / `merged`<br>1440x900: `live` / `merged` |
| power-read | 390x844: `live` / `merged`<br>1440x900: `live` / `merged` |
| loading-complete | 390x844: `live` / `merged`<br>1440x900: `live` / `merged` |

The first-visit statement excludes its masked king sprite. The two idle states exclude their board pixels. The lesson task and menu hint still use Tap in both sources. A menu can open a changed Guide; a later move can enter a changed turn prompt.

Other changed bundled exports add no current visible local control: `shortMove()` in `src/move-text.ts`, `cardName()` and `cardCost()` in `src/powers-ui.ts`, and the hidden move-help strings in `src/ui/table.ts`. The optional teaching fields, shared piece-title helper and default drag hooks add no local display change in these captures. The local read keeps its lower-case piece name.

## Full web suite and deploy record

**The full web suite at the deploy source comes from the deploy record. The deploy runs `npm test` and the default browser checks.** This run does not start either command. The release may use a later combined source, including PR 62, so a result for `cd8fa9f2` alone cannot establish that deploy's full pass. The release owner supplies the exact checked source, all results, skips, limits and deploy ID. [ticket 08, Merge record](../../../docs/specs/web-adaptation/issues/08-release-evidence.md) records that handoff. This report supplies the local render baseline only; ticket 08 as a whole remains open for its other evidence.

## What this run cannot check

- Current kingdown.dev content, deploy ID or the exact source of a later release. The live base here comes from the owner's task.
- Full unit, database or default browser-suite results at the deploy source. These come from the deploy record.
- Real phones, WebKit, Firefox, native keyboards, real zoom, screen readers, sound or a keyboard-only journey.
- Sign-in, account games, server state, migrations, grants, active-game engine records or account synchronization. The link capture uses the local URL game.
- An installed offline worker or a worker upgrade. App capture contexts block service workers. Public-page captures use fresh contexts.
- Every possible result/refusal sentence. Captures show representative forms; Stalemate, Draw and some link forms have source evidence only.
- Default loading duration. The loading diagnostic deliberately holds image decode. The 180 px board and disabled-coin states also use explicit test controls.
- Meaningful pixel equality inside a masked board area. The count and ready-board checks provide the separate behavior evidence.

The run does not change a source file, use a remote account, write a database or deploy. The house-lock lease is the required control-file exception to output-only writes; the house helper removes its own lease. No source worktree file changes. The report records no new rule or owner choice.

## Files

- `Final evidence check`.
- `Image index`: 84 pairs, 168 PNGs. This includes 2 Beast context pairs. Public-page images use full-page height.
- `Run ticket`: scope, plan, criteria and result.
- Main report: a scratch folder of the agent session (not in git).
- Renders: a scratch folder of the agent session (not in git).
- Final answer: a scratch folder of the agent session (not in git).
