# Staging runtime and public config

Status: implemented; integration checks pending.

## Plan

1. Remove production browser defaults. Check explicit public account settings before SDK creation.
2. Open the named HTTP operations only for guarded staging or the existing loopback test hook. Use shared player service, admission and current-user checks.
3. Add account route rewrites and a preview-only deploy path bound to the approved staging project.

## Verification

Check missing, malformed and production settings; database and origin isolation; operation parity; route boundaries; and preview deploy guards. Run typecheck here. The integration task runs the shared test and database lanes.

## Evidence

- `npm run typecheck` passes in this worktree.
- Node syntax checks pass for the three changed server/deploy modules. `git diff --check` passes.
- Unit checks cover public settings, rejected production targets before network/database access, test-hook boundaries, account route rewrites and the preview command/project guard. The shared test lane runs them after the HTTP route changes land.
- No remote action or database write runs in this task. The integration task owns test and deploy evidence.
