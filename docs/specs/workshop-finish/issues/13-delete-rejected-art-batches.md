# 13: Remove the rejected art batches after the owner's yes

**What to build:** The Codex working copy holds about 90 MB of untracked art rounds. Once the 34 chosen sources are safe in the art-source folder (tickets 10 and 11 prove them), the untracked batch folders and the untracked figure-sample files can go. The agent asks the owner first, records the owner's yes with its date in this file, and only then moves them to the macOS Trash, so that the owner can still get them back. Tracked files stay. The owner empties the Trash.

**Blocked by:** 10, 11

**Status:** needs-info

- [ ] Before any move, this file holds a line `Owner-go: <date> "<the owner's words>"`. Without it, the ticket stops here.
- [ ] Before the move, the 34 sha256 values of ticket 10 match the files in the art-source workshop folder again.
- [ ] After the move, `git status --porcelain --untracked-files=all` in the Codex working copy lists no file under its Workshop visual-design folder.
- [ ] `git status` in the Codex working copy shows no tracked file deleted or changed.
- [ ] The list of moved folders and their total size is in Comments.

**Verify:** `git -C "/Users/za/Documents/king down chess/.claude/worktrees/agent-af146c2f91d80dc0b" status --porcelain --untracked-files=all docs/visual-design/workshop`

**Owns:** the untracked figure batch, swarm, final-run, machines-and-elements and figure-sample files in the Codex working copy (/Users/za/Documents/king down chess/.claude/worktrees/agent-af146c2f91d80dc0b/docs/visual-design/workshop/)
