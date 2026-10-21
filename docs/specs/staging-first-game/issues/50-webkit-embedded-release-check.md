# Verify the shared embedded game UI in WebKit

Status: in progress. Parent: U09. Follows ticket 49.

## Plan and pass criteria

1. Reuse the registered `plugin-ui-http` check with `PLAYABLE_BROWSER=webkit`, the existing disposable PostgreSQL database and a clean committed checkout. Keep the normal timeout and all assertions. Run detached with a log and end report.
2. Exercise the existing compiled UI, SDK bridge harness and real local HTTP game service. Preserve its remount, privacy, settings, legal move, lost-reply retry, computer turn, rejection and viewport checks. Diagnose any failure from its retained receipt before changing code.
3. Credit this as a WebKit engine and harness journey only. Actual ChatGPT Safari/iOS, Codex scope enforcement, provider login and physical-phone checks remain distinct. No production or hosted game change is allowed.
4. Record the result, reuse existing mechanics and real-account evidence, close test resources and continue the next available release item.

## Evidence

The parent workspace's `evidence/staging-release-checks/` holds the detached log, source identity and end report.
