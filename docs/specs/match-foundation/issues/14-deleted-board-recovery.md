# Recover an existing board after its selected match is deleted

Status: resolved

## Source

Independent review B, specification finding 1, confirmed by source inspection. See [review validation](12-independent-review.md).

## Defect

Deleting a match cascades its durable board row. Existing Create, Resume and Join controls first read that missing board and fail with FORBIDDEN. Reload fails too. A new model-side Open works, but the old board has no recovery control.

## Repair and checks

Let the same signed-in player start or select a valid game from the failed view. Preserve board ownership and seat isolation. A missing board must not permit another actor to claim an existing board or view a deleted game. Do not adopt the review's suggested upsert without checking those boundaries.

Add a database/protocol check that deletes the selected match, then starts or selects a game from the existing view. Verify that other actors remain blocked. Add a board check for the recovery path. Use the project pull request and approved release path for a repair. No implementation or release occurs in the review task.

## Answer

PR 22 keeps the board UUID and owner when its selected match is deleted. Migration 0004 clears only the match link. Create, Resume and Join accept this owned MATCH_REMOVED state. A foreign or missing board remains forbidden.

PostgreSQL, protocol, compiled HTTP and both board browser checks pass. They cover replacement in the same board, reload, remount and foreign-account rejection. Production migration returns `preserves_board_owner = true`; the restricted production startup check passes. [Ticket 15](15-review-repairs.md) holds the deployed repair record. No production test match is deleted for this check.
