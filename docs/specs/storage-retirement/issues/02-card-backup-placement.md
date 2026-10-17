# Put backup copies and temporary work on the card
Status: resolved
Type: task

Owner asks that backup storage use the card, not the local disk.

Plan: require the known card UUID; retain Documents, Codex and Claude backups on the card before cloud upload; move SQLite, Git, collection and compression staging to the card. Keep schedules, source data and cloud destinations. No Marine cleanup.

Verification: shell/Python syntax, real card fixture backup with SQLite and Git, source/card hash checks, cloud-call routing checks, missing-card rejection and temporary directory placement. Start the first real retained card backup with a detached card log; report its status accurately.

## Verification and installation

Installed both tools. Fixtures pass: known-card identity, wrong-UUID rejection before writes, card copy hashes, a live-WAL SQLite snapshot query, Git connectivity and restored file, all card copies before any cloud upload, cloud reads only card copies, staging cleanup, and King Down temporary files on the card. Source app data is read only. No Marine cleanup.

The first retained full card backup is running detached. See `/Users/za/Documents/Codex/2026-10-10/the/outputs/storage-review/card-backup-placement-2026-10-13/initial-run.json`. Configuration and fixtures pass; this does not assert that the initial full copy has finished. Runtime backup logs and markers give its result.

## Independent review

A separate reader finds no fault in active backup copy paths or temporary placement. The review asks whether the old sidedisk archive upload was intentionally retired. It was: `/Volumes/sidedisk` no longer exists and that section was skipped on current runs. Existing cloud archive contents remain. This change does not add cloud feeds for other archived card folders. The first full retained card copy is still in progress.
