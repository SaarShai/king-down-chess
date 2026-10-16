# Fault rounds 5 to 7

Status: ready-for-human

The owner's 7-hour run on 2026-10-15. Each round fixes the confirmed findings of the review before it, and two independent reviewers check each fix. The work collects on `claude/fault-round-2`. Do not merge to main without the owner.

## Round 5: the round 4 review (10 confirmed findings)

- Retry and the error stay on the screen where the command started, and they also show on each screen that the command locks (R4C-1, R4C-2, and the reviewer's RV5C-1).
- A start that waits for a name ends cleanly after Back, and the page sends no start by itself after a remount (R4C-3, T4).
- Three failed polls in a row show the connection sentence, and a good read clears it (R4C-4).
- Create and Find carry a command ID, so Retry and a resend after a remount make one game (R4C-5). No database migration: the game ID comes from the player and the command ID.
- Opponent and computer moves animate again (F35-1). The keyboard cursor now moves during that animation; only Enter waits (61afc00d).
- 200% zoom: the page title scales and keeps whole words, and the New game segments keep their own lower edge (L1, L2, L3).
- The W mark is 4.5:1 on every measured parchment, also after More (W-1). Profile dates use device time (DATE-1). Test gaps T1–T3, T5, T6 are closed.

## Round 6: the UX journey review (U1, U2, U4, U7, U8, U18, U21)

- A chat-made game opens the screen of its status, so a game in setup opens the seat (U1).
- Sheets and their scrims sit above the board controls (U2).
- The display check line is hidden; a long press on the Settings title shows it (U4, ticket 21).
- After a revision conflict the page reads the game again and says "Your opponent moved. Check the board." (U7; the words are approval item W7).
- After your own action in a live game against a person, the page polls every 3 s for 2 minutes (U8).
- Settings rows keep their height, and the sample arrow is an icon (U18). The Menu copies of the status-row actions have their own ids (U21).

## Round 7: the 200% zoom board and the round 5 notes

- Save on the name page hides Retry while the start goes again, and a good poll clears Try again (RV5-1, RV5-2). Two Profile tests open in UTC (DATE-1 tests).
- The 200% zoom board (device matrix M1) is on `claude/r7-zoom`, with a refix so the screen scrolls only when the board would be under about 200 px.

## Open, not merged

- `claude/r7-conn` commits 81a2c529, 863a5823 and cae29aa8 make a reused start command ID with other input give COMMAND_CONFLICT (RV5-3) and keep a receipt when Find reuses the player's own open game (RV5-4). The review found two faults in them: the conflict check misses the join and reuse paths (RV7-1), and the Find rows show the creator's times to the opponent even when the creator hides online status (RV7-2). These edge cases need a model that reuses an ID, or an opponent who joins in the seconds between a lost reply and Retry. They stay out until a simpler design exists.
- At 197 px with all features, two of the four card coins in each strip are off screen (seen in round 7). Wrap or smaller coins is a layout choice.
- At 197 px the end card covers the page head.
- The Collection tab hit layers overlap by about 3.5 px at 200% zoom (L4).
- plugin-ui check: one run in three failed when a late read of an aborted game moved the page to its end card after a chat result had opened a new game. A fix is in work on `claude/r8-race`.
