# PR 61: Codex-class fault sweep

Status: done

Scope: the plugin client in `src/plugin/` (queue, board, start, screens).
Base: `ba2e775c`. One worktree and branch for each fix group,
`claude/rc-cx-<group>`.

## Plan and checks

1. Finders read the client by area and report P2/P3 faults like the
   Codex review comments.
2. A skeptic tries to refute each report. Only confirmed faults go on.
3. One agent fixes each group with a test for each fault. A reviewer
   checks each branch.
4. Merge the branches into `claude/release-candidate`, run `tsc` and the
   pre-push suite, and push once.

## Result

Nine reports, eight confirmed (one duplicate), one false: the settings
tool never took `show_online` from the live widget.

| Group | Fault | Commit |
| --- | --- | --- |
| queue | A refused Join put the raw server text on every screen. | `7dba93b7` |
| board | A board command that a newer chat result superseded sent a read that stopped the newer mount. | `47b4e7a2` |
| board | Rematch on End did nothing while a pending command of another game or start existed. | `87816af6` |
| start | The quick-start flag stayed on after a Play now that failed or was superseded. | `9cf0937f` |
| start | A start's Choose or Get step lost its Play scope after the player left Play. | `656708a4` |
| screens | An inline chat join lost its preview and code error before Resume. | `37c421ab` |

All four reviews passed. Merged at `65c7058f`; `tsc` passes.

## Codex comments after the merge

- 4307713202 (P2): a refusal stayed after a later Block, because only a
  retained write cleared it. `queue.ts` now exports `userCommand()`, the
  one rule for a user command, and `send()` clears the refusal for each
  user write. Test: 'clears a board refusal when the player then blocks
  the opponent' in `src/plugin/app.test.ts` (red before the fix).

A second sweep round runs on `65c7058f`.
