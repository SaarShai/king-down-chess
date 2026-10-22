# Sync an open solo game between hosts

Status: complete in staging. Parent: U07.

## Plan and acceptance

The shared poll excludes solo games. An open seat or board does not see Ready, a turn or a result from another host until Refresh. A waiting human game also replaces the solo read.

1. Use the existing single poll for solo setup, play and the result's rematch watch. Read while visible; keep the existing write, navigation and teardown guards. Keep the waiting human notification during computer play.
2. Preserve unsent setup choices and turn drafts when the server has not changed. Apply a newer accepted position and remove an obsolete draft. Do not commit an unsent player draft from a background read or add presence writes for a computer opponent.
3. Prove the defect and repair with focused source checks. Extend both compiled clients to receive another host's Ready, turn and result without Refresh. Check unchanged drafts and a remote rematch where practical.
4. Check the exact artifact, publish only to staging and verify the live web–ChatGPT journey. Reuse the accepted mechanics, engine and archive evidence when their bytes stay the same.

The second-account check does not block this work. Production is outside scope.

## Source verification

The solo poll regression fails before the patch. The focused run passes 244 tests in seven files, typecheck and 54 art checks. It covers the shared controller, poll, queue, board and seat models, lifecycle and page state. The waiting human read still runs in the same tick as the solo read. No Seen write is sent for solo play. Both human and solo late reads retain the navigation and teardown guards.

The repair uses the existing timer, command queue and draft validation. No new service, state store, schema or gameplay rule is needed. Compiled web passes in 52.839 seconds on `74023abb`. Embedded HTTP passes in 304.900 seconds on final source `8756aff9`. The only intervening edits correct two test-fixture assumptions: Open does not accept a board ID, and a fresh result document needs full rules rather than a poll delta. The web pass is reused after the source-diff guard. No application edit follows the source pass.

The exact artifact passes. Preview `dpl_CYY7F41ieVprcB1imGTRtb1m4Pc1` serves the staging alias; its index hash matches the checked output. Server, runtime and all eleven archives are unchanged. The accepted 112 mechanics executions remain valid.

Actual web and post-Try-again ChatGPT receive Ready, the committed turn, the result and the rematch without game Refresh or page reload. Web preserves an unsent a2–a3 draft until ChatGPT commits b2–b3. Both then show that turn and the computer reply; history contains no a2–a3. The rematch is aborted, both hosts return to Play automatically, and the original ten active game IDs remain. Full evidence is in the parent project at `evidence/staging-solo-sync/verification.md`.

The separate attached-host first-open failure, second-account, Codex interruption, physical-phone/network and operator gates remain open. Production is unchanged.
