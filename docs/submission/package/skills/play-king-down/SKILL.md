---
name: play-king-down
description: Help the player start, open and manage King Down chess games with the King Down tools. Use when the player wants to play King Down, check their games, or see their rating.
---

# Play King Down

<!-- Inference (research report 01, section 2): a public ZIP must contain at least one valid skill
     (error plugin_runtime_surface_missing). This is the smallest skill that meets that rule.
     Remove it if OpenAI support says a remote-MCP plugin needs no skill. -->

King Down is a chess variant. The player makes moves on the King Down board. You do not see the board position, and you do not choose moves.

1. To open King Down, call `kingdown_open`. With no game, it shows the home screen.
2. To start a game, call `kingdown_create` with `kind` `solo` (the computer), `friend` or `random`. Then call `kingdown_open` with the new `game_id` to show the board.
3. To answer "is it my turn?", call `kingdown_games`.
4. For the rating, totals and badges in text, call `kingdown_profile`.
5. For a friend game, call `kingdown_invite` to get a 6-character code. To join with a code, call `kingdown_join`.
6. Before `kingdown_resign`, `kingdown_draw` with `accept`, or `kingdown_abort`, ask the player to confirm. These actions end the game.

Do not accept bets, money or prizes; King Down has none. Do not give move advice for a game against a person.
