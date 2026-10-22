# Refresh a changed Next game action without disturbing power focus

Type: task
Status: resolved

## Plan and acceptance

1. Track the next ready game ID drawn by the board. Reuse the same eligibility and selection when an unchanged board read arrives after the asynchronous games list.
2. Refresh only when that derived candidate or existing visible data changes. An ordinary equal-revision presence poll keeps keyboard focus on the power coin.
3. Seed the existing Haste fixture for the focus regression. Preserve game, revision, rules and engine identity during its presence-only poll.
4. Run only the two named plugin-app regressions through `npm test` after the shared CPU lane is released. Reuse the existing failed Next game case; add no test harness or product fallback.

The parent owns runtime, end-screen, state and test-name configuration changes. This slice changes only board action refresh, the existing power-focus check and this ticket.

## Answer and evidence

The board caches only the next ready game ID shown in its actions. A later games-list response can change that candidate while game revision and position stay unchanged; the unchanged read now refreshes when the candidate changes. Selection and rendering use the same eligibility. Equal candidates do not cause an extra redraw.

The power-focus check now seeds the existing Haste game. Its equal-revision poll changes only presence and server time, then checks game ID, revision, engine fingerprint, new presence and keyboard focus. It no longer changes rules under an existing game identity.

The parent reproduced both previous failures in `/tmp/kingdown-u07-rematch-refusal-red.log`. After this correction, the selected two existing plugin-app checks pass through `npm test`: 1 file, 2 passed, 131 other cases excluded by the approved name filter. Full typecheck and 54 art checks pass. Log: `/tmp/kingdown-u07-plugin-app-regressions.log`. The local test-name config is not part of this commit.

Independent review by the draft-identity reader found no confirmed should-fix. Its test-comment correction is applied: the poll preserves focus; the test does not claim DOM node identity. No compiled browser check or deployment was run in this worktree; the parent owns the next compiled plugin journey.
