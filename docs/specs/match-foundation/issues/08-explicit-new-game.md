# Honor an explicit new-game request

Status: resolved

## Reproduction and cause

After the solo game ends, ask ChatGPT to create one friend game and show the invitation. The plugin opens the completed solo game instead. The board's Games menu can create the friend game, so this is a launch-tool problem.

Only `kingdown_open` is visible to the model. Its description offers a solo or friend start, but its handler always resumes the latest saved game when one exists. The requested mode has no effect in this case.

## Plan and checks

Make an explicit mode mean a new game. With no mode or match ID, resume the latest game or create the first solo game. A match ID still opens that exact game. State these three choices in the tool description. Check each path through the MCP SDK, then check a real new-game request after publication. Preserve the private app-only move tools.

## Local result

The shared launch handler applies those three choices. The MCP SDK protocol check passes first solo creation, latest-game resume, explicit new friend and solo creation, and exact saved-game selection. It also retains move retry, stale revision, actor rejection and private tool visibility checks. A new game has a new match ID; the old game and its move remain available.

## Release

PR #13 passes its test and plugin checks. The duplicate push check stalls at checkout for eight minutes, before tests start. Cancel and restart that job; the repeated check passes. All three hosted checks pass before merge `c5954527843fe5130e398a169ec12eaa7c753ccc`.

The first release attempt stops before publication: the newly synced main checkout still has its older package installation, which lacks `pg`. Sync that installation from the approved lockfile with `npm ci`; `npm ls --depth=0` then passes. The second release tests the same commit and publishes `dpl_5gXgdZV9B8evqf3BbZ2ZZsSPHEFz`. All 1,391 unit tests, 42 artwork checks, compiled HTTP, worker, protocol and three browser checks pass. Unsigned live checks pass. The final release log is `/tmp/kingdown-game-launch-release.log`; the first attempt is retained in `/tmp/kingdown-game-launch-release-first.log`.

The main checkout is synced with the merged releases. Four pre-existing untracked research files are preserved before that sync at `/Users/za/.codex/backups/kingdown-main-sync-jhlh9345`; two differ from their published versions. No simulation data is moved.

## Live result

Refresh tools in the private plugin settings, reload the existing test chat and ask for one new friend game. ChatGPT creates a new friend game. The board shows the starting position and "Waiting for your friend. Share an invitation." A full chat reload restores that same waiting board. The previous completed solo boards retain checkmate. The rendered board and Invite friend control are visible in the expanded view.
