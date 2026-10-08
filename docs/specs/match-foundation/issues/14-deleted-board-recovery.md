# Recover an existing board after its selected match is deleted

Status: open

## Source

Independent review B, specification finding 1, confirmed by source inspection. See [review validation](12-independent-review.md).

## Defect

Deleting a match cascades its durable board row. Existing Create, Resume and Join controls first read that missing board and fail with FORBIDDEN. Reload fails too. A new model-side Open works, but the old board has no recovery control.

## Repair and checks

Let the same signed-in player start or select a valid game from the failed view. Preserve board ownership and seat isolation. A missing board must not permit another actor to claim an existing board or view a deleted game. Do not adopt the review's suggested upsert without checking those boundaries.

Add a database/protocol check that deletes the selected match, then starts or selects a game from the existing view. Verify that other actors remain blocked. Add a board check for the recovery path. Use the project pull request and approved release path for a repair. No implementation or release occurs in the review task.
