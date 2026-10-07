# 06: Desktop probes for the preview folder, the package link and the trailer

**What to build:** The builder confirms, once and before the merge, three things that `npm test` cannot see, and writes the results into this ticket. Preview: which launch file a desktop worktree session reads. Packages: a desktop worktree session gets the package link. Trailer: a desktop commit ends with the neutral trailer and holds no `Claude-Session:` line. The preview result decides one guidance line for the steering spec. No probe starts a run. This ticket adds no dependency.

**Blocked by:** 02, 04, 05; checks-and-hooks/03 (the prepare-commit-msg hook that removes a `Claude-Session:` line)

**Status:** ready-for-human

**Owns:** `docs/specs/dev-environment/issues/06-desktop-probes.md` (results under `## Comments`)

- [ ] Preview probe: in a desktop worktree session on the integration branch, with no target file, the builder calls `preview_start` with `worktree`. A serve reason means the session read the worktree's launch file; the ticket then records that a worktree session may use `dev` for itself. "No such entry" means the main checkout's launch file; the ticket records that the guidance stays.
- [ ] Packages probe: in that session, `node_modules` is a link to the main checkout's folder (`ls -l` output in the ticket).
- [x] Trailer probe: one desktop commit in a scratch branch ends with `Co-Authored-By: Claude Code <noreply@anthropic.com>`. If a `Claude-Session:` line remains, the ticket records it, and the checks spec's prepare-commit-msg hook removes it on a second commit.
- [x] The ticket names the steering-cut ticket that takes the preview result into its guidance lines (steering-cut/06, which blocks on this ticket).

**Verify:** the three probes above in a desktop worktree session; `git log -1 --format=%B` for the trailer; `npm test` stays green

## Comments

**Builder, 2026-10-07.** Two probes are done. Two need a desktop worktree session, and an agent cannot start one: the owner must do these.

**Why the agent cannot do the preview and packages probes.** The builder runs as a helper inside a desktop session whose folder is the main checkout (session `cwd` and `originCwd` are `/Users/za/Documents/king down chess`, no worktree). `EnterWorktree` with the build worktree's path refuses: "switching is only available to sessions whose working directory is inside a worktree of this repository". No session tool starts a new desktop session in a worktree.

**Preview probe, control only (box stays open).** From the main-checkout desktop session, with no `.claude/preview-target` file, `preview_start` with `worktree` gives:

    No server named "worktree" found in .claude/launch.json. Available servers: "dev", "playable", "painted-2d", "previews", "workshop".

That list is the main checkout's launch file (it still has `workshop`; the integration branch has `worktree`). So a main-checkout session reads the main checkout's file, as expected. The worktree question stays open. Until the owner runs the probe, the guidance stays: preview any worktree but the main checkout with the `worktree` entry and the target file.

**Packages probe (box stays open).** The build worktree has the link that the brief tells the builder to make by hand, so it proves nothing about the desktop app:

    lrwxr-xr-x  1 za  staff  83 Oct  7 04:49 node_modules -> /Users/za/Documents/king down chess/.claude/worktrees/retro-2026-10-06/node_modules

**Trailer probe (done).** In the build worktree, on the scratch branch `probe/dev-environment-06-trailer` (deleted after the probe), this desktop session made two empty commits.

1. Commit `1f3fa55`, hooks off: `git log -1 --format=%B` ends with `Co-Authored-By: Claude Code <noreply@anthropic.com>` and holds no `Claude-Session:` line. Note: the harness text of this main-checkout session still asks for a trailer that names a model, because the main checkout's settings have no `attribution` key yet. The builder followed the brief.
2. Commit `2521fde`, with `git -c core.hooksPath=.githooks` and a `Claude-Session:` line in the message: the prepare-commit-msg hook removed the line and added the neutral trailer. `git log -1 --format=%B` gives the subject, a blank line and `Co-Authored-By: Claude Code <noreply@anthropic.com>` only.

Note: `core.hooksPath` is not set in this repository's git config, so the hooks run only after `npm install` runs the `prepare` script in a checkout that has `.githooks`. The probe passed `-c core.hooksPath=.githooks` for one command; the shared config stays unchanged.

**Steering cut.** steering-cut/06 (`docs/specs/steering-cut/issues/06-agents-standing-rules.md`) takes the preview result into the Worktrees section; it lists this ticket under **Blocked by**.

**Owner steps for the two open probes** (after the merge of the integration branch, or on the branch `claude/retro-2026-10-06`):

1. Make sure `/Users/za/Documents/king down chess/.claude/preview-target` does not exist.
2. In the desktop app, start a new session with the worktree option on, on the integration branch.
3. Ask the agent there: call `preview_start` with the name `worktree` and paste the result; run `ls -l node_modules` and paste the result.
4. A reason such as `wt: no target file: ...` means the session read the worktree's launch file: steering-cut/06 then says a worktree session may use `dev` for itself. "No server named worktree" means the main checkout's file: the guidance stays.
5. If `node_modules` is missing or is a folder, the desktop worktree option does not use `worktree.symlinkDirectories`; the startup session hook should then make the link (dev-environment/04). Record which one did it.

**Tests.** `npm test` in the build worktree: exit 0; vitest 64 files, 1235 tests passed; node tests 42 passed, 0 failed. After the merge of the integration tip (e040d59): exit 0; vitest 64 files, 1236 tests passed; node tests 42 passed, 0 failed. This ticket changes no code.

