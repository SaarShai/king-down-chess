# 17 · WebKit checks

Type: task
Status: in-progress

## Scope

Build part 17-a on `claude/real-host`. The owner asks for WebKit support and
checks on both engines. Part 17-b is outside this task.

Source: the owner's scratch ticket `tickets/issues/17-real-host.md`.

## Plan

1. Let `PLAYABLE_BROWSER=webkit` select WebKit in the shared launcher.
2. Use that launcher in the board and phone-size tests. Add unit tests for
   engine selection and launch options.
3. Add a separate CI job for the WebKit checks. Keep all current time limits.
4. Run typecheck and `npm test`. Run plugin-ui, plugin-board and
   plugin-ios-size on Chromium and WebKit on the M1. Fix each confirmed fault.
5. Check the diff and commit the change with both requested trailers.

## Verification criteria

- The launcher selects WebKit from one setting. Chromium channels still work.
- Tests cover both launch paths and option forwarding.
- CI installs WebKit and runs all three checks in its own job.
- All required checks pass with their current time limits.
- No dependency, game rule, visual design or server change is in scope.

## Results

Work is in progress.
