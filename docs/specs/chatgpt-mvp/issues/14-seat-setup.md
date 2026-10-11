# 14 · The seat setup step: king and arrangement

Status: ready-for-agent
Type: AFK
Size: M
Blocked by: 12

## Scope

- The board in setup mode: the player's back rank with the drawn pieces; tap two pieces to swap; Shuffle; the legality messages (bishops, guard next to the king).
- The king coin (the same sheet as ticket 12) when king powers are on.
- Ready, then "Waiting for the other player" (polling), then the game starts.
- The opponent's rank stays hidden until both are ready.

## Acceptance

- Browser check: arrange and Ready for both personas; an illegal order shows its message and blocks Ready; a computer game starts after the player's Ready.

## Notes

- The board UI part of branch `claude/arrange-mode` (`src/arrange.ts`) is a reference only; it was written for the old `main.ts`.
