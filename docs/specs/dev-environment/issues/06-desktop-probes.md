# 06: Desktop probes for the preview folder, the package link and the trailer

**What to build:** The builder confirms, once and before the merge, three things that `npm test` cannot see, and writes the results into this ticket. Preview: which launch file a desktop worktree session reads. Packages: a desktop worktree session gets the package link. Trailer: a desktop commit ends with the neutral trailer and holds no `Claude-Session:` line. The preview result decides one guidance line for the steering spec. No probe starts a run. This ticket adds no dependency.

**Blocked by:** 02, 04, 05; checks-and-hooks/03 (the prepare-commit-msg hook that removes a `Claude-Session:` line)

**Status:** ready-for-agent

**Owns:** `docs/specs/dev-environment/issues/06-desktop-probes.md` (results under `## Comments`)

- [ ] Preview probe: in a desktop worktree session on the integration branch, with no target file, the builder calls `preview_start` with `worktree`. A serve reason means the session read the worktree's launch file; the ticket then records that a worktree session may use `dev` for itself. "No such entry" means the main checkout's launch file; the ticket records that the guidance stays.
- [ ] Packages probe: in that session, `node_modules` is a link to the main checkout's folder (`ls -l` output in the ticket).
- [ ] Trailer probe: one desktop commit in a scratch branch ends with `Co-Authored-By: Claude Code <noreply@anthropic.com>`. If a `Claude-Session:` line remains, the ticket records it, and the checks spec's prepare-commit-msg hook removes it on a second commit.
- [ ] The ticket names the steering-cut ticket that takes the preview result into its guidance lines (steering-cut/06, which blocks on this ticket).

**Verify:** the three probes above in a desktop worktree session; `git log -1 --format=%B` for the trailer; `npm test` stays green
