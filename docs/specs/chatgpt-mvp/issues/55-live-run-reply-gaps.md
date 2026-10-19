# Website run 2: reply gaps in P1, P2 and P4

Status: in-progress
Type: task

## Scope

The second 2026-10-19 run of the eight review test cases on the ChatGPT
website (GPT-6, Medium), with the test account, after the dcf1a235 deploy.
Change only the `kingdown_open` reply and the model-facing descriptions of
`kingdown_open` and `kingdown_create` in `src/plugin/server.ts`, its test,
the run record in `docs/submission/checklist.md` row 48, the P4 row in
`docs/submission/test-cases.md` and this ticket.

## Results

- P3, P5 and N1–N3 pass. P5: the model asked which computer game, showed a
  "Confirm resignation" button, and then ChatGPT asked for approval. N2
  started ChatGPT's own browser tool and no King Down tool; the run stopped it.
- P1 partial: King Down opened at the Play hall, but the reply left out
  "Your move in 1 game.", which the tool sends.
- P2 partial: the model called `kingdown_create` but not `kingdown_open`, so
  the open board kept the Play hall. After "Open that game." the setup,
  Shuffle, Ready, a move, Undo, the move again and End turn all worked.
- P4 fails: the model called `kingdown_open` with screen "profile" in place
  of `kingdown_profile`. That reply had only "Your move in 2 games.", so the
  model said that the rating "wasn't returned".

## Change

- `kingdown_open` with screen "profile" replies with the same record text as
  `kingdown_profile` (rating, totals, badge count). One helper makes both.
- `kingdown_open`: give the player the reply text (the count, or the record).
- `kingdown_create`: with no board_id, then call `kingdown_open` with the new
  game_id, so the player makes the setup choices on the board.

## Checks

- [x] `src/plugin/server.test.ts`: the profile screen gives the record.
- [ ] `npm test` on the branch; CI green.
- [ ] Deploy (owner's go), then Refresh tools in ChatGPT.
- [ ] P1, P2 and P4 again on the website with the test account.
