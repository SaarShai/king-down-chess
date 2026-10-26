# Bank the completed effects previews

Status: ready-for-review
Type: task

## Scope

The owner asks to merge the finished animation sessions. Bank the completed card artwork, motion, concepts and comparison source from the effects-integration worktree. Keep prompts, prior paintings and the decisions with the source. Keep the upstream game effects, including the removed permanent Guard shield. No artwork, rule or effect-renderer change is needed.

## Plan and checks

1. Copy only the new preview source and decision files. Preserve the rejected comparisons as studies. Add the six missing preview checks and the approved Hop display name for the stable Vault identity.
2. Use the existing Vite build to export the final card comparison, all-card overview, artwork corrections, living cards and banked interface previews. Use relative asset URLs. Keep the source beside the export.
3. Check the asset and renderer hashes, build links and fetch-loaded metadata. Run the focused card catalog test, docs checks and the registered card preview checks. Open the static export on the existing review server. Record exact results and limits.

## Decisions retained

- Mirror option 2 and Rally's banner are selected. All 23 review entries have motion previews. Rescue and the card back remain review extras.
- The proposed Freeze ending is approved. The Holy Light ending awaits feedback.
- The proposed crowded-board marks, Ice Wall ending, game information and polished Holy Light, Mercy, Control and Mimic are rejected. Keep the original game versions.
- All 23 interface studies are banked. The seconds clock and card refill remain previews. The four-card rule stays unchanged.
- The final Leap, March and Morph temporal frames have an independent artifact check. That check does not claim a physical-phone or fresh real-time playback pass.

## Result

The branch starts at upstream staging `dab2cc41`. It adds 150 new source and decision files from the effects-integration worktree (`5c53d450` plus its completed local previews). The two research notes are banked in `../research/` and their local links are adjusted. The upstream effects spec and all game-effect code stay unchanged. The permanent Guard shield stays removed.

All 25 wide-art files, six prior paintings, exact prompts, correction records and the three final effect renderers match the source bytes. The approved catalog name is Hop; its internal identity stays Vault. All six missing preview checks are registered.

Portability fixes reuse the existing `art()` helper for preview images, load card-motion JSON relative to its page, and import the check study's king icon as an asset. The Vite export uses no app config or public-directory copy. It keeps relative assets, explicit HTML inputs and fetch-loaded metadata. Its local link and catalog assertions pass. It adds no new effect implementation.

Run `node docs/specs/effects-animation/export-static.mjs` to rebuild. The result is `../static-preview/`: 19 source pages, an entry redirect, 23 living cards and `SOURCE-HASHES.json`. The source bank is `../preview/bank.html`. Both indexes label the approved, pending and rejected studies. The export is 226 files, about 76.2 MB.

The generated export is excluded locally from Git; the exporter rebuilds it. The source remains the merge artifact. The size gate has 33 exact exceptions for native source paintings over 2,000,000 bytes: 23 wide images, six prior revisions and four Salvation concepts. Each entry records why its original pixels and provenance stay. No image is recompressed. The gate test keeps its required baseline entries while permitting justified additions; its stale-file check still covers every entry.

The existing static server opens the export at `http://127.0.0.1:5197/.claude/worktrees/animation-effects-merge/docs/specs/effects-animation/static-preview/`. Browser inspection confirms loaded artwork and fonts, live Leap awakening, all 23 GUI choices and the Proposed Freeze ending replay. No console error is observed in those inspected pages.

## Verification

- `KINGDOWN_TEST_FILE=src/content/cards.test.ts npm test`: type checks, three catalog cases and all 57 scene cases pass. This is a focused run.
- `npm run test:docs`: 178 cases in 15 files pass.
- `PLAYABLE_BROWSER=chromium npm run check:browser card-art card-crops card-art-wide wide-card-motion effects-concepts effects-comparisons`: all six pass in `animation-effects-merge-Y8Dbsh`. This covers source fidelity, all 23 motion entries, loops, seeking, reduced motion, controls, legal concept outcomes and desktop/phone framing.
- Static build, local HTML links, 23-entry catalog parity, art/provenance byte checks and `git diff --check` pass.
- `KINGDOWN_TEST_FILE=tools/gate.test.ts KINGDOWN_TEST_NAME='the size allowlist of this repository' npm test`: both selected gate cases, type checks and all 57 scene cases pass. All 33 source files over the size limit have exact justified entries. The generated static export is ignored locally.

Logs are in `/tmp/kingdown-effects-merge/`. The browser report is under the standard local check output root. The export's source hash inventory records all preview inputs, including the unchanged final renderer hashes.

No full engine suite, physical-phone check, commit, pull request or deployment occurs in this work phase. Live integration of the new wide card art/motion and the banked GUI object studies stays separate. The approved Freeze-ending proposal also stays a preview. Root owns independent review and the final merge.
