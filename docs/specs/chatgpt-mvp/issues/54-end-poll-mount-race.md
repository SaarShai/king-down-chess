# End poll check: a hold catches the mount read

Status: in-progress
Type: task

## Fault

CI run 39260257547, attempt 1 (PR 66, branch `claude/resign-confirm`, a
server-side tool-description change only). Job `browser-webkit`,
`npm run check:browser plugin-ui`, 523 s:

```
AssertionError [ERR_ASSERTION]: An end poll leaves controls enabled
    at tools/plugin-ui-check.mjs:2542:7
```

The re-run of the same commit passed.

## Scope

Find if the fault is in the test or in the widget. Fix it at the cause.
Keep the assertion. Do not raise a time limit.

## Cause

It is a test race. The widget is correct.

The deleted-opponent loop runs `readGame()` after its first step.
`readGame()` sends the full read to the frame as a chat result
(`harnessShow`), then waits for `#reload` to be on (`idleBoard`).
`harnessShow` returns when the host sends the result, before the frame
mounts it. `#reload` is still on from the step before, so the wait can
pass before the mount starts. The next step then sets
`holdNext = 'kingdown_get'`. When the mount starts after that, the hold
catches the mount's own board read (`mountBody` in
`src/plugin/app.ts`), not the end poll. A mount keeps every control off
until it ends (`mounting` in `blocked`, `src/plugin/state.ts:50`,
design §2 and §3.3). So `#page-back` is off, as the design asks.

The failure dump shows this:

- `harnessView.opponent.deleted` is `false`: the failure is in the
  second step (`deleted = false`), directly after `readGame()`.
- The saved screen is `board`, not `end`: the mount had navigated to
  the board and had not yet routed the finished game to End.
- The last six frame calls are `get, block, get, block, get, get`.
  The test's own reads go to the fixture directly and do not show here.
  Each End render with a live opponent reads the Block setting
  (`kingdown_block`). There is no `block` after the fifth call (the held
  poll of the first step, deleted opponent), so the mount never rendered
  End. The sixth call is the held mount read.
- `#reload` is off: the page is blocked.

A held poll read alone sets none of `!connected`, `writing` or
`mounting`. A poll is a quiet read beside the lane.

## Change

`tools/plugin-ui-check.mjs`: a new helper `showFull()` for `readGame()`
and `joinedGame()`. It counts the frame's `kingdown_get` calls with no
`since_revision` (the mount read; a poll read has one), sends the
result, waits for one more such call, then waits for `#reload`. The
mount read proves that the frame took the result. The mount keeps
`#reload` off until it ends, so the `idleBoard` wait that follows is
exact. The assertion stays. No time limit changes.

## Checks

- [ ] `npm run check:browser plugin-ui` on WebKit, several runs, one at
  a time on this Mac through `tools/test-lock.sh`.
- [ ] `npm test`.
