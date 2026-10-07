# 12: Rehearse the gates before the owner merges

**What to build:** Before the first push of the integration branch and before the owner merges, the builder runs each gate once for real and records the results in this ticket, with no secret value. This shows the owner what the gates catch on the real repository and history, and what the merge does to the main checkout's disk.

**Blocked by:** 03, 07, 10, 11

**Status:** ready-for-agent

**Owns:** this ticket file (results under `## Comments`)

**Verify:** `npm run gate -- history`; `npm run gate -- push origin <url>` with the branch's push lines on stdin; `tools/deploy.sh` with no flag; a bypass-mode probe in a Claude Code session

- [ ] The history scan of origin ran; the ticket lists each secret file name with "found" or "not found". A "found" gets a line for the owner to rotate that key (as retro ticket 09).
- [ ] A push-mode run on the integration branch ran before its first push; the ticket lists each fault line, and the owner saw them before the push.
- [ ] A deploy rehearsal with no publish flag ran to the end; the ticket records each step's result and that the deploy worktree is gone.
- [ ] In a session in `bypassPermissions` mode, a harmless ask form (for example `vercel --version`) was refused with "ask the owner in chat"; the ticket records the refusal text.
- [ ] Merge steps for the owner are in the ticket: save a copy of `sim/nnue/policy.bin` outside the checkout before the merge, restore it after, and confirm its hash equals the one in `sim/nnue/policy.json`.
