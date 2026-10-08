# Honor an explicit new-game request

Status: claimed

## Reproduction and cause

After the solo game ends, ask ChatGPT to create one friend game and show the invitation. The plugin opens the completed solo game instead. The board's Games menu can create the friend game, so this is a launch-tool problem.

Only `kingdown_open` is visible to the model. Its description offers a solo or friend start, but its handler always resumes the latest saved game when one exists. The requested mode has no effect in this case.

## Plan and checks

Make an explicit mode mean a new game. With no mode or match ID, resume the latest game or create the first solo game. A match ID still opens that exact game. State these three choices in the tool description. Check each path through the MCP SDK, then check a real new-game request after publication. Preserve the private app-only move tools.

## Local result

The shared launch handler applies those three choices. The MCP SDK protocol check passes first solo creation, latest-game resume, explicit new friend and solo creation, and exact saved-game selection. It also retains move retry, stale revision, actor rejection and private tool visibility checks. A new game has a new match ID; the old game and its move remain available.
