# Approved effects in the game

Status: resolved
Type: task

## Authorization and scope

The owner asks: “integrate the approved effects into the game. no combat animations, and keep the indications i said don't need animation static.” Use the original 51 samples approved at category level: 12 states/indications, 21 cards and 18 interface samples. The rebuilt Firewall and Guard have explicit approval: “both look great”. Preserve this art and timing; adapt triggers to real game state. No new combat animation. Existing character work stays separate.

Keep selection, extra-move availability, destinations, capture targets, bite order, threats, reserve-drop indications and last-move indications static. Ground rings remain below figures. Archer distant targeting remains an approved exception; do not animate generic capture targets.

The later five GUI samples have no explicit feedback: coin-spend, draw-reply, opponent-found, setup-ready and invite-copy. Keep these in the workshop; do not integrate them in this task.

## Plan

1. Work from current origin/main and preserve the approved workshop as the visual reference. Audit all real consumers before editing.
2. In isolated worker trees, integrate state materials/static indications, card effects, and the approved interface motion. Give shared files exact ownership and merge their changes deliberately. Reuse the current lifecycle and data, never the sample clock, fixture boards or fabricated UI results.
3. Check real engine outcomes, one-use triggers, board orientation and layering, interruption/unmount, hidden tabs, Fast/Off/system-reduced settings, and static indication rendering. Check game and plugin consumers.
4. Run relevant unit/browser checks and a fresh independent review. Fix confirmed findings. Show the integrated game locally.
5. Record every effect's integrated, missing or pending-feedback status. No deployment is authorized. Code reaches main only through a reviewed PR.

## Acceptance

Approved effects run from real game events and retain their reviewed appearance. Ordinary combat gets no new effects. Static indications do not change pixels over time. Card actions keep exact legal outcomes and do not play twice on render, reload, replay cancellation or undo. Motion settings and disposal cancel work safely. The original effects workshop remains usable.

## Result

The 12 state/indication, 21 card and 18 interface studies now use real game consumers. [Coverage](../coverage.md) separates category approval, individual feedback and the five unreviewed interface studies. Workshop and game drawing share the runtime modules. No new ordinary combat effect or engine rule is added.

The combined renderer keeps settled effects on unaffected pieces during a move. Card playback uses its shown position for those holds. Freeze, Ice Wall and Firewall hand off to a quiet state after completion or Skip; they do not restart on the next sync. Static indications have no clock input. Ground rings draw below figures; symbols remain above protective material.

Review fixes remove the send checkmark when playback ends or is cancelled and use only the newest spent power notch. Rebuilt interface controls resume the same event time. Spent-card motion scales the paint child, preserving its button's click target; the raised paint remains unclipped and grey throughout. Existing first-load, reload and replay state remains still.

## Evidence

Base: `bdd886c7`. No dependency or engine-rule change.

- Combined production browser check: `PLAYABLE_BROWSER=chromium npm run check:browser effects-game` passes in 124 seconds. It plays all 21 legal card fixtures, checks six interruption paths, Fast timing, exact still indication pixels and persistent ice during another move. It also captures 36 completed card turns at 430/390 px in both board directions. Run: `effects-integration-xmXjPp` under the standard local check output root. Log: `/tmp/effects-integrated-game.log`.
- `PLAYABLE_BROWSER=chromium npm run check:browser effects-animation effects-states end turn powers lessons verb-marks`: all seven pass. Run: `effects-integration-jax7r6`. Log: `/tmp/effects-integrated-browser.log`. State capture covers 57 real-game images. Visual inspection checks the phone Firewall, phone result and live Guard board.
- Send-confirmation regression: two successful sends followed by a failed send, with and without reduced motion. Both cases pass; all 50 required scene cases pass. Log: `/tmp/effects-send-check.log`.
- The first full suite has 30 failures from obsolete motion/geometry assertions and missing browser mocks. Focused repairs preserve focus, text, control sizes, scroll and save-recovery checks. The motion file passes all 20 worker cases; all six other repaired test files have full-file passes. The extra remount race now waits for the new iframe's settings read and home state.
- The second full run passes 4,651 tests and exposes two test timing races. The send fixture now waits for the actual frame turn; the spent-card check reads all settled styles in one attached-node poll. All four targeted cases and all 50 scene cases pass in `/tmp/effects-motion-race.log`. The third full run retains one failure in the new confirmation test's coordinate taps. The test now chooses its real legal move through the game menu, which isolates confirmation behavior. The full 22-case motion file and all 50 scene cases pass in `/tmp/effects-motion-final.log`. The final combined rerun passes: 245 files, 4,653 tests, plus all 50 scene tests and the type check. The local environment skips 15 files / 224 cases. Log: `/tmp/effects-integrated-unit-green.log`; duration: 321.59 seconds.

- Broad browser command: `PLAYABLE_BROWSER=chromium npm run check:browser` runs all 24 standard checks. Twenty pass, including king effects, ordinary painted play, special moves, Workshop and all 17 QA scenarios. Run: `effects-integration-eBwP1G`; log: `/tmp/effects-integrated-all-browser.log`.
- The four broad failures are test synchronization. New Game and visual-design measure controls after the native entrance finishes, with the same 44 px requirements. Both pass in `effects-integration-cvZEZF`. Promotion Cancel waits for the new exit to finish. Account's overflow fixture waits for the provider render before replacing its content; the diagnostic confirms that this render removed all 30 injected rows. Menu-extra and cursor-adoption pass in `effects-test-game-eyZd5H` with identical combined production source. All original assertions remain. Thus all 24 standard checks and the three effects-specific checks have passing results.
- A subsequent spent-card target correction passes typecheck, all 23 focused motion/style cases and all 50 scene cases: `KINGDOWN_TEST_FILE='tools/plugin-{motion,ui-style}.test.ts' npm test`. Log: `/tmp/effects-spent-target-reviewed.log`. Normal and reduced-motion cases compare the button's size before and after use; native onset records verify unclipped, grey paint. Timing, final opacity/scale and no replay remain checked.
- The PR review's turn-highlight finding reproduces in both normal and reduced motion: a staged, unsent move highlights the opponent. The strip now reads the authoritative turn, as before integration. The strengthened real-browser send cases check the sender before submission, the opponent after success, and the sender after failure. All 23 focused motion/style cases, typecheck and all 50 scene cases pass in `/tmp/effects-turn-highlight-final.log`; failing baseline: `/tmp/effects-turn-highlight-baseline.log`.

## Independent review

A separate reviewer checks the final combined source and new files against `origin/main` at `bdd886c7`. Source review passes with no open confirmed finding. It covers standards and spec, all consumers, legal card results, Mirror and continuation attribution, replacements, drops, state retention, variant protection, symbols and interface event lifetime.

Three early findings are fixed: Skip followed by sync restarted material onset; success checkmarks lingered; a later power use could animate an older notch. The first two have focused regression cases. The third uses the last spent notch and passes the existing powers browser check. The review confirms original 51-study coverage, static exclusions and the five deferred GUI studies. It is an independent source review, not a new visual approval. The full suite passes.

A separate read-only review covers the later spent-card target correction. Its two appearance findings are fixed: allow the raised paint outside the stationary button's clip, and retain the existing grey colour throughout the press. Focused browser tests now assert both at native animation onset, as well as the unchanged click-target size. No confirmed finding remains open. PR #92 contains the integration; deployment remains outside this authorization.

The GitHub PR review also identifies an early turn highlight during an unsent draft. Restoring the authoritative `view.turn` fixes that finding; the shown position can advance without handing over the turn. The regression cases reproduce the fault before the one-line correction and pass afterwards. The handoff still starts only when an authoritative turn change arrives.

The later PR review finds that online updates rebuild equivalent rules objects, suppressing live state transitions. State history now compares normalized rule values with the existing stable serializer. Eight regression cases fail before this correction; all 95 state/card cases and 50 scene cases pass after it. A final independent review identifies the separate game boundary: equal rules cannot identify a game. The account draw now clears effect history after skipping old playback when the game ID changes. The real PaintedView regression checks a quiet second game at the next ply, then its next live effect. All 120 combined effect/UI cases and all 50 scene cases pass in `/tmp/effects-final-boundaries.log`.

CI's source-icon comparison reveals that protection badges overlap the next row in Symbols only. Badges now draw below symbol identities, with their contents in the inter-row gap. The unchanged original pixel criterion passes for every piece and all six kings; phone inspection confirms legible symbols and badges. The independent reviewer confirms the layering and closes a test-isolation fault: the gallery restores the shared account setting in cleanup. Spent-card focus now keeps both bands clear inside the unchanged button, and the visual symbol inset is measured from the compressed paint. All five existing focus/contrast cases and all 50 scene cases pass in `/tmp/effects-coin-focus-fixed.log`; the baseline reproduces three failures.

The CI Back/session test also races coordinate taps against the opening board. It now stages the same legal draft through the real move chooser; all original draft, refresh and view assertions remain. Final combined verification follows these corrections. CI also has the same Firefox retained-worker assertion as base `bdd886c7`. OAuth and shallow-checkout history checks also fail on base; the exact OAuth assertion has not been compared. The WebKit job times out and has not been established as a baseline fault. None is reported as passing.

## Final verification checkpoint

After the continuity, game-boundary, symbol layering and focus corrections, the full local suite passes 245 files / 4,665 tests, all 50 scene cases and typecheck (15 files / 224 cases skipped; 419.85 seconds). Log: `/tmp/effects-complete-final-suite.log`. The final state and card browser checks pass in 11.4 and 123.8 seconds in `effects-integration-s8By74`.

The account browser check then catches armed-card paint moving its entire click target out of the row. Selection now moves only the paint, as spent-card motion does. The original row alignment assertion passes in the subsequent run. All 24 focused UI/style cases, 50 scene cases and typecheck pass after that correction (`/tmp/effects-armed-face-tests.log`). The full account check progresses further, then fails its tiny-viewport touch-scroll assertion: at a 201 px viewport with 62/34 px host insets, the action row starts 4 px above the visible frame. Run: `effects-integration-26limp`, 215.6 seconds; log: `/tmp/effects-plugin-ui-final.log`. This final account check is not green; the earlier broad passes do not supersede this result. Unchanged base `bdd886c7` passes the same full check in 256.2 seconds (`/tmp/effects-layout-baseline.log`). The cause is the turn-handoff token remaining in the DOM after becoming transparent: its old coordinates enlarge the scroll area after resizing. The token now removes itself on completion, cancellation or disabled motion. Both normal/reduced browser regressions fail before this cleanup; all 36 motion/style cases, all 50 scene cases and typecheck pass after it (`/tmp/effects-token-after.log`). The original full account browser check then passes in 271.1 seconds, including the unchanged touch-scroll and armed-card assertions: `effects-integration-jscCMX`, `/tmp/effects-plugin-ui-token-final.log`. Its board scroll extent matches base exactly. Temporary handoff elements must be removed when their animation ends or cannot start; opacity alone does not remove layout overflow.

## Integration notes

The card drop gate reaches the shared renderer for Salvation; ordinary reserve drops keep their static indication. The existing scene clock owns card playback and cancellation. No new frame loop, package, state store or compatibility path is added.

The timer uses the real deadline in hours/minutes. Card refill has no event. Unknown first host projections stay still because no live start is known. Solo Abort keeps its existing return to setup. The five later GUI studies remain in the workshop. This integration does not deploy the game.
