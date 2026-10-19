# GUI previews 2026-10-19: the result moment and promotion

Status: in-progress
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
