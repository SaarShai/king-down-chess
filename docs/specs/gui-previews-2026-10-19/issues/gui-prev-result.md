# GUI previews 2026-10-19: the result moment and promotion

Status: done
Type: task

## Why and the rule
Saar, 2026-10-19: "by the time i get back - everything must be sleek and pixel-perfect and faultless and beautiful to look at and a joy to use." His standing rule: a taste call needs his approval. So this lane builds a PREVIEW of the recommended pick of each item below, on its own branch, at award-level craft. Nothing merges until he approves the item on his approval page. Build each pick exactly as its option text says; do not build the other options; add no idea that the item does not name. Where a pick leaves a detail open, choose the most restrained and clear answer, and name it in your answer as a taste choice.

Record: copy this ticket to docs/specs/gui-previews-2026-10-19/issues/<this file name> in the repo, set its Status to done, and add the check results at the end.

Screens before the change: /private/tmp/claude-501/-Users-za-Documents-king-down-chess/b7cd01b9-9824-4854-8a44-29f55a926d5b/scratchpad/lanes/gui-review/gallery/ (INDEX.md names each image). The expert reviews: /private/tmp/claude-501/-Users-za-Documents-king-down-chess/b7cd01b9-9824-4854-8a44-29f55a926d5b/scratchpad/lanes/gui-expert/panel.md, /private/tmp/claude-501/-Users-za-Documents-king-down-chess/b7cd01b9-9824-4854-8a44-29f55a926d5b/scratchpad/lanes/gui-review/suggestions.md, review-astra.md, review-opus.md; /private/tmp/claude-501/-Users-za-Documents-king-down-chess/b7cd01b9-9824-4854-8a44-29f55a926d5b/scratchpad/lanes/gui-expert/argon-1.md, argon-2.md.
Proof for each item: before and after screenshots of each screen it changes, at the sizes where it shows (plugin harness: 390x844 and 1280x800, light and dark; web: 390x844 and 1440x900), saved as /private/tmp/claude-501/-Users-za-Documents-king-down-chess/b7cd01b9-9824-4854-8a44-29f55a926d5b/scratchpad/lanes/gui-prev-result/previews/A<n>-<screen>-<size>-<theme>-before.png and -after.png. Take the before shots from the branch base, the after shots from your commit. A test for each behaviour change. npm test and the plugin-ui browser check pass. One commit per item.
Art: new or changed images only through Codex's built-in image_gen on the ChatGPT plan (never the paid images API). Match the painted cast (public/pieces/painted-2d/, docs/2d-first-pieces/) and keep every page under its size limit (the plugin page HTML stays under 1,000,000 bytes).

### A9 One clear result moment

Problem: The web plays a slow replay and a word hold before the result; the plugin shows board words behind the result card.

Build: **Direct plugin result; one short web topple**. The web keeps one skippable topple (at most 0.65 s), no slow replay. Main action full width, two smaller actions below.

Why this pick: One short, skippable moment, then one clear main action, gives a strong finish without a wait.

Other options (do not build): Direct result on both (No topple animation.)

### A20 Result words after a resignation

Problem: On the web, “That side gave up.” reads wrong after “White resigns”. Your W8 B choice already replaces this line, but its words were not made yet. In the plugin, the rematch caption sits away from its button.

Build: **Build the W8 B outcome line now**. For example “Resigned on move 23”.

Why this pick: One outcome line now, as part of W8 B, fixes the wrong reference.

Other options (do not build): Stopgap: name the side (“White gave up.”); Plugin only: move the rematch caption under its button (No layout change elsewhere.)

### A22 Result screen: the 1 s guard also blocks keys

Problem: Your C4 c guard ignores taps for 1 s after the result opens, so an old tap cannot hit Rematch. It also blocks Enter and Space on a focused button.

Build: **Let keys work at once**. Taps keep the 1 s guard.

Why this pick: A key press cannot be an old tap, so it can work at once.

Other options (do not build): Keep as is ()

### A24 Result card: the beaten king stands

Problem: Your end-card pick says the beaten king lies down, but on the result card both kings stand. It touches your result-card look.

Build: **Lay the beaten king down**. Same angle as the fallen king on the board. No change on a draw.

Why this pick: It carries out the look you already chose, with the same angle as the fallen king on the board.

Other options (do not build): Tilt and dim the beaten king (A smaller change; the king stays in view.); Keep as it is (Both kings stand.)

### A12 Promotion choices

Problem: The four promotion choices have unequal sizes.

Build: **Two by two, equal cards**. At every size.

Why this pick: Two by two at every size reads as one equal group.

Other options (do not build): Four across on desktop (Two by two on phones only.)

## Plan and checks

Base: bc62f4eec18f58b9e99c426422e362a6b5a8dc56.

1. A9: remove the replay and board words. Keep one web fall of at most 650 ms. Put the main action above the two small actions.
2. A20: show one outcome line with the move number. Keep the last move in Review.
3. A22: let key input pass the tap guard. Keep the one-second pointer guard.
4. A24: lay the beaten king down. Keep both kings upright on a draw.
5. A12: use two equal columns for promotion at all widths.

For each part, save before and after images at device scale 2. Inspect each image. Add a behavior check. Commit each part on this branch. Run the type check, unit tests, and the approved plugin browser runner. Do not merge or publish.

## Build record

- A9: d407b1f3. The plugin opens the card directly. The web plays one fall for at most 650 ms. A tap or a key skips it. The main action fills its row. The two small actions have equal width.
- A20: e3afb24f. The web says “Resigned on move 23.” The move count uses the position. Review holds the last move.
- A22: d0d39017. Native key activation works at once. Pointer taps keep the one-second guard. Unit checks cover the guard. Browser tests press Enter and Space.
- A24: 4d4c710c. The result art uses the board fall angle. The right-edge angle agrees with the board. Both kings stay upright on a draw.
- A12: the last commit. The four painted promotion choices use two equal columns at all widths. Cards have a 120 px minimum height and 72 px art. The desktop dialog is 440 px wide. Cancel stays below.

## Visual review

The proof folder holds 50 before-and-after pairs at device scale 2. Its INDEX.md links each pair. Plugin sizes: 390 × 844 and 1280 × 800, light and dark. Web sizes: 390 × 844 and 1440 × 900.

The review finds three faults and fixes them:

- Initial focus scrolls the result title out of view on short landscape screens. Set the card scroll to the top when it opens.
- The desktop promotion heading leaves “a8” on a line by itself at 360 px. Use a 440 px dialog.
- An older ID rule overrides the promotion card height. Give the 120 px rule the promotion group ID.

The kings clear each other and the card edge. The card text and actions have no cut text. The action gaps and widths agree. Draw art keeps both kings upright.

Taste choices: keep the existing type, colours and art. Use an 180 ms, 8 px win entrance and a 120 ms fade for other plugin results. Keep Review as a quiet web action below the main action group. Keep rematch reply actions full width, with New game and See the board in one equal row. Use 112 px art slots for a decisive result, with a static fall. Set the fallen art down by 22 px in the plugin and 24 px on the web, so it rests on the same floor. Use 440 px for the desktop promotion dialog.

The sample review also corrects the web resignation fixture. Move the queen from h2 to g2, so Black is not in check while White has the turn. Retake the affected before images from the branch base and the after images from each part’s commit.

Capture rule: wait for the visible art. Do not wait for image decode in hidden dialogs; their deferred images can hold the capture.

## Check results

The type check passes. The first plugin browser run at d407b1f3 finds the short-screen scroll fault above. A24 fixes it. The run at 0c003511 confirms the promotion height fault. It also finds an old test that requires a scroll bar when the new card fits. The check now tests sideways overflow; the action access and hit checks stay in place. The run at 32faad26 passes on the M1: plugin-ui in 289.8 s and end in 20.5 s. The runner exits 0. The page is 752,279 bytes; its resource payload is 756,145 bytes. Both stay below 1,000,000 bytes. The focused npm test run passes: 4 ceremony tests and 51 art checks, exit 0. The full npm test run passes: 194 files, 3,244 tests pass, and 8 opt-in balance checks skip. The 51 art checks also pass. Exit 0. The run uses the local test database URL from the lane rules.

The final source edit removes two old ceremony comments. A fresh plugin build is byte-for-byte identical to the checked page; cmp exits 0. The final commit also records these results. All five parts are built. Each preview still needs Saar’s approval.
