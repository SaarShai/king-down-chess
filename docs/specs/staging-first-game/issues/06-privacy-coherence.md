# Match the privacy text to the current staging code

Status: in progress.

## Plan and checks

1. Check all current notification writers after the email worker removal.
2. Correct the policy and its exact notification-kind assertion together.
3. Keep the storage location accurate for the staging and original US database regions.
4. Leave runtime behavior and the coordinated test lane unchanged.

## Findings and change

- `src/match/service.ts` still queues `turn` notifications for Daily games.
- `src/online/safety.ts` still writes `moderation` and `appeal` notices.
- The removed reminder worker was the only `reminder` notification writer. The deadline helper's
  `reminder` value does not write a notification. Remove near-deadline alerts from the policy and
  from the expected writer list. Keep the exact discovered-kind comparison and all other checks.
- The policy now says Supabase servers are in the United States. It no longer names Ohio alone,
  because this staging database is in Oregon. No database or deployment changes are made here.

## Evidence

- Checked notification inserts, the match output writer and all `notify.push` calls in current code.
- The failed full-suite log reports actual kinds `appeal`, `moderation`, `turn`; it expected
  `reminder` as well. The updated policy and assertion name these three current kinds.
- `git diff --check`: pass.
- The parent task owns the full test lane. No tests or builds are launched in this task.
  Rerun `npm test` in that lane before this ticket is done.
