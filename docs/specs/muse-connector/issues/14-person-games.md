# Decide voice play against a person

Type: grilling
Status: open
Blocked by: 12
Parent: [Muse connector map](../map.md)
Labels: wayfinder:grilling

## Question

Version 1 plays only games against the computer in chat; games against a person show the status and a link. Should Muse also play moves, invite and join in games against a person?

## Facts

- The blueprint keeps human-game positions, legal moves and opponent text out of model replies (projection rule). The parked ChatGPT app kept them in the widget only.
- Muse is itself an agent that can suggest moves. Casual games allow advice; ranked games forbid it.
- Without the position, voice play against a person is not possible.

## Options

1. Keep version 1 (status and link). Lowest risk.
2. Allow casual games against a person, with a line in the game for both players that says the opponent may use an assistant. Needs the owner's rule change.
3. Allow only friend games where both players chose "assistant allowed".
