# Claude local-record recovery — 2026-09-14

Follow-up review: [deep assessment](</Users/za/Documents/king down chess/docs/TAKEOVER-REVIEW-2026-09-14.md>), [current task ledger](</Users/za/Documents/king down chess/docs/claude-recovery/review/TASK-LEDGER.md>) and [unstarted takeover plan](</Users/za/Documents/king down chess/docs/TAKEOVER-PLAN.md>). These supersede the initial status/gap interpretation below. Per the owner, assume no additional cloud-only documents or records.

The main conversation is **Chess960 with fairy pieces web app**. Its original transcript and continuation are present locally. Dates below use America/Los_Angeles (PDT).

| Session | First record | Last record | Size | Records | Agent transcripts |
|---|---|---|---|---|---|
| [af00383a-be3c-43af-8c39-b2e17188dc55](af00383a-be3c-43af-8c39-b2e17188dc55.md) | Sep 13 03:56:15 | Sep 14 03:05:24 | 92.18 MB | 4984 | 74 |
| [1b13f053-b37e-481e-a963-54b0069234f9](1b13f053-b37e-481e-a963-54b0069234f9.md) | Sep 14 00:47:12 | Sep 14 07:22:51 | 2.27 MB | 1118 | 11 |
| [f5e7735f-db7d-4f6c-8bfc-b0516df3356a](f5e7735f-db7d-4f6c-8bfc-b0516df3356a.md) | Sep 14 05:37:08 | Sep 14 05:40:29 | 0.55 MB | 147 | 0 |

The af00383a session contains the original build request and almost 23 hours of recorded activity. The 1b13f053 session begins with a continuation summary and is the current CLI session named by the Desktop record. Their timestamps overlap; they are not a strictly disjoint chronological split. The f5e7735f session is the separate “Update stale \"killerMove invalid\" notes in Q4 docs” task.

## Sources

- Original transcripts, 85 subagent transcripts, 66 saved tool-result files (recursive count, including five PDF-page images), agent metadata, and 8 memory files: `/Users/za/.claude/projects/-Users-za-Documents-king-down-chess`.
- File-history backups: `~/.claude/file-history/af00383a-be3c-43af-8c39-b2e17188dc55/` (133 files) and `~/.claude/file-history/1b13f053-b37e-481e-a963-54b0069234f9/` (52 files).
- Two Desktop session metadata files: exact paths and selected fields in [inventory.json](inventory.json). Both report `isArchived: false`.
- Session hook files, process session metadata, and matching Desktop main.log are indexed. Shared logs are not copied into the project.
- Shadow directory: `~/Library/Application Support/Claude/git-shadow/42aacf79eba3bbda/`; only small metadata remnants, and `git log` does not recognize it as a repository. Do not rely on it as a code backup.
- Existing project documentation: `TASKS.md`, `LESSONS.md`, `docs/STATUS-2026-09-13.md`, `docs/QUEUE.md`, `docs/RUNS.md`, `docs/RULES.md`, `docs/SIM-PLAN.md`, `docs/KINGS-POWERS-PLAN.md`, research reports, styleboard/dashboard assets, and `art-src/MANIFEST.md`. Full file paths and hashes are in the inventory.

## Last known state

The continuation records work on Ogre/Catapult, setup-liveliness mining, procedural board tiles, kings’ powers, and Q6 AI data/training. Its tail contains repeated subscription-access errors. These historical progress statements do not establish that background work completed; inspect current outputs before resuming or rerunning anything. The separate short session reports correcting the stale Q4 killer-move analysis documentation.

## Verification and limits

Parsed every project JSONL (88 files): 0 parse errors. Inventoried 697 files with SHA-256 hashes. The raw Claude project directory contains 339,232,647 bytes; it remains in place. Readable exports include message text only and are not substitutes for the raw records.

Searched Claude projects, Desktop code-session and Cowork/local-agent metadata, plans, tasks, file history, session environments, process metadata, shell snapshots, logs, shadow directories, IndexedDB and Local Storage for the project name/path and session IDs. Other-project transcript matches were incidental references and are not claimed as additional King Down sessions.

Not recovered or established:

- No extra cloud-only records are in scope: the owner explicitly asked to assume none. The local search is not itself proof of their absence.
- No additional matching Cowork session, standalone Claude plan/task record, or matching IndexedDB/Local Storage record was found by the targeted search.
- No usable shadow Git history was found. The working project appeared entirely untracked at inspection, so existing files should be preserved before Git operations.
- Follow-up established that the “rules FINAL” target returns 404 (not proof of deletion); the recovered Classic PDF and other source drafts cover the current game. The seven missing website-folder files are card images, not code. Neither gap blocks takeover. The raw 51 GB Drive download was deliberately deleted after curation.
- The transcript error says the organization disabled subscription access for Claude Code. This is evidence of the failure message, not proof of why the Desktop project list disappeared.

Recovery changes: this index, inventory, three readable transcript exports, and the recovery checklist in TASKS.md. No application source or original Claude records were changed.
