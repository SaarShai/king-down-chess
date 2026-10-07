# 12: Rehearse the gates before the owner merges

**What to build:** Before the first push of the integration branch and before the owner merges, the builder runs each gate once for real and records the results in this ticket, with no secret value. This shows the owner what the gates catch on the real repository and history, and what the merge does to the main checkout's disk.

**Blocked by:** 03, 07, 10, 11

**Status:** ready-for-human

**Owns:** this ticket file (results under `## Comments`)

**Verify:** `npm run gate -- history`; `npm run gate -- push origin <url>` with the branch's push lines on stdin; `tools/deploy.sh` with no flag; a bypass-mode probe in a Claude Code session

- [x] The history scan of origin ran; the ticket lists each secret file name with "found" or "not found". A "found" gets a line for the owner to rotate that key (as retro ticket 09).
- [x] A push-mode run on the integration branch ran before its first push; the ticket lists each fault line, and the owner saw them before the push.
- [x] A deploy rehearsal with no publish flag ran to the end; the ticket records each step's result and that the deploy worktree is gone.
- [ ] In a session in `bypassPermissions` mode, a harmless ask form (for example `vercel --version`) was refused with "ask the owner in chat"; the ticket records the refusal text.
- [x] Merge steps for the owner are in the ticket: save a copy of `sim/nnue/policy.bin` outside the checkout before the merge, restore it after, and confirm its hash equals the one in `sim/nnue/policy.json`.

## Comments

Rehearsal 2026-10-07, branch `build/secrets-and-public-gates-12`. No secret value is in this ticket, in a log or in an output. The status is `ready-for-human`: the owner reads the push result before the first push, does the merge steps and does the live bypass probe (item 4 is open).

**1. History scan of origin.** `git fetch origin` (04:10), then `npm run gate -- history` in this worktree: exit 0, about 5 s.

- `.secrets/kaggle_api_token`: not found
- `.secrets/oauth.json`: not found
- `.secrets/porkbun_api.json`: not found
- `typesafe key`: not found

No "found", so the scan gives no rotation line. Ticket 09 of the retro (rotate `TYPESAFE_API_KEY`) stays as it is: that key went into a session transcript, not into git. Control: with `GATE_SECRETS_DIR` on a temporary folder, a file that holds the first line of `origin/main:AGENTS.md` gives `found` and exit 1, and a random value gives `not found`. So the scan reads the history.

**2. Push mode on the integration branch, before its first push.** `origin` has no `claude/retro-2026-10-06` branch (`git ls-remote` gives no line). Input on stdin: one pre-push line, `refs/heads/claude/retro-2026-10-06 <tip> refs/heads/claude/retro-2026-10-06 <40 zeros>`. Command: `npm run gate -- push origin https://github.com/SaarShai/king-down-chess.git`.

| Tip | Commits that origin does not have | Fault lines | Exit |
|---|---|---|---|
| `743d3cd` | 228 | 0 | 0 |
| `ec5fd73` | 230 | 0 | 0 |
| `b216c68` | 245 | 0 | 0 |

At `743d3cd`, `GATE_TRACE` counts 544 blob reads (354 different blobs). The 77 transcript removals and the untrack of `sim/nnue/policy.bin` are deletions, so they pass. Control: with a fake secret file that holds a line of `tools/gate.mjs`, the same push gives 5 `secret` fault lines (one for each commit that changes that file) and exit 1, with the file name and no value. Owner: there is no fault line to read. Run the same command again on the tip of the day, just before the first push.

**3. Deploy rehearsal with no publish flag.**

- Real origin: `tools/deploy.sh`, exit 1 in 2 s. Steps: `fetch origin` pass; worktree of `origin/main` `dd34fa5` in `$TMPDIR/deploy.AKzVZH/tree` pass; `wt add` FAIL (`./tools/wt.sh: No such file or directory`). This is the expected stop: `origin/main` gets `tools/wt.sh` only with the merge. After the run the temp folder is gone and `git worktree list` holds no deploy worktree.
- Stand-in origin (the steps after the merge): a bare clone of the integration branch, with that branch named `main`, and a clone of it as the checkout (its `node_modules` is a link to the integration packages). `tools/deploy.sh`, exit 0 in 10 min 30 s at a load average near 25. Steps: `fetch origin` pass; worktree of `ec5fd73` pass; `wt add` pass (`linked`); `npm test` pass (type check; vitest 62 files, 1210 tests; node tests 42); `browser checks` pass (`check: all 14 passed`: account, cursor-adoption, king-effects, lesson-return, new-game, painted-game, playable-clay, powers, special-moves, visual-design, workshop, workshop-cast, qa, selftest); then "published nothing (no --publish flag)". After the run `$TMPDIR/deploy.T8nTTn` is gone and the stand-in's `git worktree list` shows only its checkout.
- Finding: my first stand-in was a shallow clone (`--depth 1`). There `npm test` failed in `tools/public-tree.docs.test.ts` ("each pinned path names a commit that holds it"): the 17 pinned `dd34fa5:docs/...` links need commit `dd34fa5`. The real deploy worktree shares the main checkout's objects, so it passes. A shallow clone (a CI or a cloud session) fails this test until it fetches `dd34fa5`.

**4. Bypass-mode probe. Not done in a live session.** I started `claude -p ... --permission-mode bypassPermissions --tools Bash` in this worktree with a prompt to run `vercel --version` one time. The session started in `bypassPermissions` mode (init event), but it stopped before a tool call: "Failed to authenticate: OAuth session expired and could not be refreshed". No command ran. (`vercel` is not on `PATH` on this Mac, so the probe is harmless.) Substitute evidence: the Bash hook command from `.claude/settings.json`, fed the JSON that Claude Code sends (`permission_mode`, `tool_name: Bash`, `tool_input.command: vercel --version`):

- `bypassPermissions`: deny, "Tool gate: vercel can change the production site, its domains or its environment. In bypassPermissions mode a hook ask can pass with no prompt, so the gate refuses it: ask the owner in chat."
- `dontAsk`: deny, the same text with "dontAsk mode".
- `default`: ask, "Tool gate: vercel can change the production site, its domains or its environment."

Owner: in a signed-in terminal, `cd` into a worktree of the integration branch, run `claude --permission-mode bypassPermissions`, ask it to run `vercel --version`, and compare the refusal with the text above. Then tick item 4.

**5. Merge steps for the owner (main checkout, branch `main`, now at `dd34fa5`).**

1. Move the untracked `docs/specs/retro-2026-10-06/retro.md` out of the checkout. The integration branch tracks the same file (byte-equal), and git refuses a merge that writes over an untracked file, also an equal one (tested with git 2.50.1 in a temporary repository). The 33 untracked files in `sim/out/` do not block: the branch does not track them.
2. Save the policy data: `cp sim/nnue/policy.bin ~/policy.bin.saved`. Check: `shasum -a 256 ~/policy.bin.saved` gives `e99256c894661798f1f521e4e07789798fe9ac398e4c937ebe751c5be8bcd390` (6,881,280 bytes, the same as `git ls-tree` of `dd34fa5` and ticket 11).
3. Merge. Git deletes `sim/nnue/policy.bin` and the 77 transcripts from the disk. The transcripts stay in history (`git show dd34fa5:<path>`).
4. Restore: `cp ~/policy.bin.saved sim/nnue/policy.bin`. Check: `shasum -a 256 sim/nnue/policy.bin` gives the hash of step 2, and `git status --short sim/nnue` gives nothing (the file is ignored now).
5. Run `npm run prepare` one time. It sets `core.hooksPath` to `.githooks`, so the gates run in the main checkout. No package install is necessary: the main checkout's packages already hold `sharp` 0.35.4, the one package that the branch adds.

Ticket and spec disagree on the hash: the ticket says "its hash equals the one in `sim/nnue/policy.json`". That cannot be true. `policy.json` describes the depth-4 pilot of `c960031` (5,000 positions, 350,000 bytes, SHA-256 starting `305b984f`). Later commits grew the file to 98,304 records (6,881,280 bytes) and did not change `policy.json`. The spec asks only to save and restore the file, so the steps above compare with the hash of the saved copy. To change `policy.json` is out of this ticket.

**Commands run:** `git fetch origin`; `npm run gate -- history` (also with a fake source); `npm run gate -- push origin <url>` at three tips (also with `GATE_TRACE` and a fake source); `tools/deploy.sh` on the real origin and on two stand-ins; one `claude -p` bypass session; the Bash hook command fed JSON in three modes; a merge test in a temporary repository; `npm test` in this worktree at the integration tip `b216c68` (this ticket changes only this file): type check clean, vitest 63 files and 1216 tests pass, node tests 42 pass. A first run at a load average near 42 failed only on a 5 s time-out in `tools/gate.test.ts`; that file alone passes (31 tests), and the second full run is green.

**Bypass probe, second try, 2026-10-07.** A desktop session in `bypassPermissions` mode, whose folder moved to a worktree of the integration branch during the session, ran `vercel --version`: the shell gave "command not found" and no hook ran. That session reads the main checkout's `.claude/settings.json`, which has no tool gate (0 matches for `tool-gate`; the worktree's file has 2). So this probe says nothing about the gate. Item 4 stays open for a session that starts in a worktree of the branch, or for the main checkout after the merge.

**Bypass probe, third try, 2026-10-07.** `claude -p ... --permission-mode bypassPermissions` in the worktree stopped again with "OAuth session expired and could not be refreshed". An app-managed worktree (`EnterWorktree`, made from main, then the integration tip checked out in it) ran `vercel --version` in bypass mode with no hook: the app loaded the worktree's settings when it made it, before the branch content came in. Item 4 stays for a session that starts in a worktree of the branch, or in the main checkout after the merge.
