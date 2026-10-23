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

## Integration notes

The card drop gate reaches the shared renderer for Salvation; ordinary reserve drops keep their static indication. The existing scene clock owns card playback and cancellation. No new frame loop, package, state store or compatibility path is added.

The timer uses the real deadline in hours/minutes. Card refill has no event. Unknown first host projections stay still because no live start is known. Solo Abort keeps its existing return to setup. The five later GUI studies remain in the workshop. This integration does not deploy the game.
