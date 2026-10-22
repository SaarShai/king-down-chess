# 17 — Diagnose integrated board source fixtures

Status: resolved

## Failure

The integrated U09 source suite reports 102 failures in `tools/plugin-board.test.ts`, including stale `Not current` status and missing card Use controls. The narrow A8 caller checks passed before the next archive publication. Source evidence alone does not prove an archive identity mismatch: this file sets both source-page identity and synthetic views to `test-engine`.

## Plan and checks

1. Read the actual failure log and trace the source harness, synthetic views and real fixture calls. Under a CPU grant, run a bounded existing failing selection and inspect actual page identity, preview routing and read notice. Keep gameplay and privacy assertions unchanged.
2. Fix only the confirmed fixture/harness cause. Do not bypass unknown-engine previews or change product rules. Coordinate before editing the shared host.
3. Repeat the exact failing selection, then the affected file if needed, through `npm test` with typecheck and art checks. Record evidence and an independent read before normal hooks.

## Evidence

- Approved unchanged-product diagnostic: four existing cases selected through `npm test`. Two fail (Their-move Haste and Vault target controls); the A8 mouse/touch ceremony cases pass. Typecheck passes. Log: `/tmp/kingdown-u09-board-diagnostic.log` (exit 1).
- Passive page probe shows `PAGE_ENGINE` is undefined although the harness requests `test-engine`; the synthetic view has `test-engine`, so the page correctly requires server preview. The synthetic game has no server record. Its preview fails and sets the stale-read notice. This explains the disabled controls without a rule change.
- Installed Vite 8.3.0 skips define replacement on dev client modules. Its dev environment module applies configured defines on the global object. The raw source harness HTML does not load that module or the normal Vite client. The root cause is missing dev environment initialization, not a wrong published archive hash.
- Corrected the source harness boot to await the existing `/@vite/env` module before importing the app. The open helper asserts the requested page stamp. The temporary dump is removed. No product behavior, synthetic identity or existing gameplay assertion changes.
- The same four cases plus one unstamped-source regression pass: 1 file / 5 selected cases; 181 cases are outside the selection. Typecheck and 54 art checks pass. Log: `/tmp/kingdown-u09-board-green.log` (exit 0).
- The unstamped regression uses the existing fixture-position service and SDK host. It asserts undefined page identity, one actual server-preview call and no failed-read notice after completion. Unknown identity still requires server preview.
- The full board file and combined source suite remain the parent's acceptance work. The prepared previous-turn boundary remains separate and paused.

- Independent final read finds no confirmed should-fix. The one source environment import restores Vite behavior; the stamp assertion and unstamped actual-preview probe preserve enforcement.
