# Close account privacy and host startup gaps

Status: in progress. Parent: U09/U11. Follows tickets 10, 34 and 46.

The owner asks to solve second-account privacy and the existing host-startup issue. Keep all work in staging. Current product source is `25978776`; its game artifacts match the accepted mechanics and cross-host evidence.

## Plan and pass criteria

1. Reuse the prior attached/native startup controls. Reproduce the current attached-path failure before changing product code. Record the first missing boundary and distinguish it from the separate game-list Internal error. Use supported browser/native diagnostics, fixed method/status data and no tokens or account payloads.
2. Inspect the normal staging identity and account-switch paths. Use an existing authenticated second identity if available. A provisioned staging test account must use normal auth, never an injected actor or relaxed production policy. Identify any exact user-only credential or consent step.
3. Verify A-to-B disposal of private board, draft, invite, history and late replies; B must be refused A's private game. Keep source/compiled checks distinct from actual website and ChatGPT evidence. Fix only demonstrated gaps at their shared boundary.
4. A cause-specific startup fix must turn the original red path green. Require ten fresh opens of the formerly failing attached path and ten native controls on one exact artifact, without Try again or a hidden retry. If no application defect is found, record the exact external boundary and the verified supported-path limit without calling it fixed.
5. Run only affected checks, publish only through the guarded staging path if product changes, restore the original account connection and remove probes. Reconcile the report and blueprint; no production release.

## Evidence to reuse

- [Original startup diagnosis](10-first-chatgpt-load.md): minimal widget also fails before its HTML appears; debugger detachment releases navigation in controlled comparisons.
- [Interrupted request and account-switch checkpoint](34-host-recovery-and-account-switch.md): transaction retry is proved; only one staging/GitHub identity is available at that checkpoint.
- [Available-provider proof](46-available-sign-in.md): GitHub-only staging choices, PKCE, account switch and local/offline continuity pass. No provider credentials change.
