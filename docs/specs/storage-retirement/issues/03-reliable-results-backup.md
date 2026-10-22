# Complete backups while results change
Status: claimed
Type: task

Owner asks to fix M1 collection and changing snapshots, and verify Documents, Codex and Claude on the card and Google Drive.

Plan: reproduce connection interruption and writes during cloud publication; retry interrupted M1 transfers without losing completed spools; freeze and verify files on the card before cloud publication. Preserve source results, card identity checks, maintenance locks and all old cloud snapshots. Check the running Mac backup before any new run.

Acceptance: injected transfer interruption recovers; one unavailable spool does not skip later spools and remains an explicit incomplete result; new or changed live results during upload do not invalidate a verified frozen backup; copied bytes and cloud checksums agree; real backup logs and receipts prove current completion. Report any pending verification precisely.

## Diagnosis and review

The regression adds a result in the first cloud call. Before the fix, `npm test` fails with `Results added during snapshot; retry`; 119 other test files pass. Publication used the live tree as its snapshot. The fix captures verified byte prefixes on the card before cloud work. M1 previously made one rsync attempt and abandoned all later spools on a reset. Transfers now retry in their existing stage with SSH keepalives and a timeout; exhausted failures remain explicit after later spools run.

An independent reader found no should-fix issues. Its coverage note is addressed by tests for appends and rewrites during capture, in addition to writes during cloud publication. Real completion evidence remains pending.
