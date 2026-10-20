# Website run: P4 and P5 faults

Status: done
Type: task

## Scope

The 2026-10-19 run of the eight review test cases on the ChatGPT website,
with the test account, after the PR 63 deploy. Change only the model-facing
descriptions of `kingdown_profile` and `kingdown_resign`, the run record in
`docs/submission/checklist.md` row 48, the P5 note in
`docs/submission/test-cases.md` and this ticket.

## Results

- P1–P3 and N1–N3 pass. N2 started ChatGPT's own browser tool and no
  King Down tool; the run stopped it before it acted on Chess.com.
- P4 fails: the reply gave the rating and the totals, but not the badge
  count. The tool text has it (`src/plugin/server.ts`, `kingdown_profile`).
- P5 fails: ChatGPT asked which computer game to resign, then resigned it
  with no confirmation. King Down has ChatGPT's default "Allow low-risk
  tools" permission, and with it ChatGPT asked for no approval, although
  `kingdown_resign` has destructiveHint true.

## Change

- `kingdown_profile`: give the rating, the totals and the badge count.
- `kingdown_resign`: ask the player in the chat to confirm, and call the
  tool only after a yes. The board's own Resign dialog does not change.

## Checks

- [x] `npm test` on the branch: one fail, the known `judge.test.ts` time
      limit under load; it passed in the pre-push run with the load paused.
- [x] CI green on PR 66 (one WebKit rerun; the race is ticket 54).
- [x] Deploy (dcf1a235), then Refresh tools in ChatGPT.
- [x] P4 and P5 again on the website with the test account, 2026-10-19:
      P5 passes (the model asked which game and showed a confirm button,
      then ChatGPT asked for approval). P4 fails for a new reason: ticket 55.
