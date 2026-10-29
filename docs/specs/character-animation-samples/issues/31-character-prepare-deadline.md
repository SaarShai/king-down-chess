# Bound character preparation

Status: in-progress

## Plan

1. Bound move preparation and use the existing legacy-body fallback when art is late or missing.
2. Let slow successful assets serve later moves. Cancel stalled image requests and limit retries after failures.
3. Check loaded, missing, stalled, cancelled and disposed cases without changing artwork or the idle handoff.

## Candidate

A move gives optional character art one second in total to prepare. The limit is a finite compromise: ordinary local assets get time to decode, but one stalled request cannot hold a game indefinitely. It is not a measurement of a suitable deadline for every device. The scene already uses the legacy figure when preparation returns null.

The move deadline does not discard a later successful manifest, image or effect. A stalled image gets five seconds before its source is removed and its loader slot released. Failure or timeout permits another attempt after a five-second cooldown; manifest and effect failures use the same cooldown. Calls during the cooldown do not start new requests. A pending manifest remains shared. Pending effects are tracked per character, so an A → B → A sequence reuses the first A load. Memory accounting includes all pending and cached effect players. Completed effects remain available for later moves, including a late completion while another character is current. To fit the decoded budget, the least recently used completed effect is evicted; pending and current effects are protected. A new effect falls back if its reservation cannot fit. Failed effects release their reservation. After an effect loads, preparation checks its required body frames again. If a reservation displaced frames, it evicts enough unused completed effects, attempts one reload within the same deadline, and falls back if any required frame is still missing. This check does not pin the whole route after preparation. Disposal cancels active images and ignores late work.

Chromium verification uses a real local HTTP server that holds seven image responses open. It observes a peak of six underlying requests, confirms the first six close before the queued request is served, and confirms disposal closes the remaining request. Browser behavior can differ; removing an image source does not prove that a browser can interrupt every native decode or stop an already imported module. A browser that throttles timers or blocks its main thread can run the deadline late.

The game check holds a required turn image while a real move is entered. The move finishes with the legacy body, Undo restores the board, and a later move uses the recovered image. A second case uses Undo during preparation and releases the held image afterward; the board stays restored and no animation restarts.

## Checks

`KINGDOWN_TEST_FILE=src/render/character-runtime.test.ts npm test` passed type checks, 26 focused runtime tests and 67 existing node checks. Tests cover late successful manifest, frame and effect, cooldown and retry after failures, overlapping A → B → A effects with late completion, least-recently-used eviction, pending effect budget protection, required-frame recovery and fallback under pressure, effect memory accounting, stalled decode, image queue and disposal. This is not a full-suite pass.

`npm run check:browser character-prepare` passed in Chromium. Its run record is `/var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-check-runs/black-queen-turn-integration-nSkAiL/`. The game case exercises one white pawn route. It does not measure a slow real network, other browser timer policies or the Stratus idle handoff. The separate selected-idle exit remains open.

## Integration review

Independent review reproduced and verified the fixes for late asset recovery, overlapping effect loads, stalled effects and frame eviction under pressure. No actionable finding remains. The integrated runtime and test files match the reviewed versions; the existing Stratus check remains registered. In the integration worktree, the 26 focused runtime tests, type checks and 67 Node checks pass; `npm run test:docs` passes 183 cases. Registered browser checks pass: `character-prepare` 12.1 seconds, `character-runtime` 71.1 seconds, `effects-states` 14.0 seconds and `stratus-registration` 40.6 seconds. These do not replace a full-suite or other-browser check.
