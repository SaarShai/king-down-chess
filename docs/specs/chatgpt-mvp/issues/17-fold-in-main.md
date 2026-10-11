# 17 · Fold in main

Status: ready-for-agent
Type: AFK
Size: S (repeats)
Blocked by: none

## Scope

After each merge to main from the rules session (`claude/game-marks`, `claude/park-clay`) and before the review:
- merge `origin/main` into the integration branch;
- run `npm test`, `plugin:build`, `plugin:server:check`, `plugin:smoke`, `check:browser plugin-ui plugin-ui-http`;
- add an engine bundle when the engine changed;
- record the page size and each merge below.

## Log

- (empty)
