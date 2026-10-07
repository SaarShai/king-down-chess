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

## Comments

Builder, 2026-10-07: **stopped at the gate.** This file holds no `Owner-go:` line, so the agent moved nothing. Status stays `needs-info` until the owner gives the yes. No box is ticked: each box is about the move or its gate.

**Read-only pre-checks (no file moved, no file changed):**

- The 34 sha256 values of ticket 10 match `art-src/workshop/{id}.png` in the main checkout again: 34 match, 0 mismatch. The folder holds 68 files (34 `.png`, 34 `.prompt.txt`).
- `git -C "<Codex working copy>" status --porcelain --untracked-files=all docs/visual-design/workshop` lists 78 untracked files, total 91,724 KB (about 90 MB).
- The Codex working copy has 0 tracked changes. `figure-samples-2026-10-06/` holds 41 tracked files; they stay.

**The move list for the owner's yes** (under `docs/visual-design/workshop/` of the Codex working copy, `/Users/za/Documents/king down chess/.claude/worktrees/agent-af146c2f91d80dc0b`):

| Item | Size |
| --- | --- |
| `figure-batch-02/` | 13 MB |
| `figure-batch-03/` | 15 MB |
| `figure-batch-04/` | 10 MB |
| `figure-batch-05/` | 4.0 MB |
| `figure-final-run/` | 7.1 MB |
| `figure-swarms/` | 5.0 MB |
| `figures-machines-elements/` | 22 MB |
| 15 untracked files in `figure-samples-2026-10-06/`: `checks-fresh.json`, `covers.html`, `fast-fresh-guard.png`, `fast-fresh.png`, `fresh-overview.jpg`, `fresh-sources.json`, `fresh.html`, `magic-fresh.png`, `mixed-fresh.png`, `prompt-fresh-cape-framing.json`, `prompts-fresh-covers.json`, `prompts-fresh.json`, `ranged-fresh.png`, `support-fresh-cape.png`, `support-fresh.png` | rest of the 90 MB |

**Question for the owner:** Do you agree that the agent moves the 7 folders and the untracked sample files above to the macOS Trash? The 34 chosen sources are safe in `art-src/workshop/` (hashes checked today), and the prompt records are copied as `{id}.prompt.txt`. The batch JSON prompt records (for example `fresh-sources.json`) also go. You empty the Trash.

**To finish after the yes:** add the line `Owner-go: <date> "<your words>"` above, recheck the 34 hashes, move each item with Finder's Trash (for example `osascript -e 'tell application "Finder" to delete POSIX file "<path>"'`), then run the Verify command (expect empty output) and `git -C "<Codex working copy>" status --porcelain` (expect no ` M` or ` D` line).

**Tests.** No code changed. `git merge claude/retro-2026-10-06`: already up to date. `npm test`: the typecheck passes, vitest 61 files and 1108 tests pass, the node tests 42 pass.
