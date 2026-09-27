# Unlocking the King Down pieces — design (2026-09-27, proposal)

Owner idea: players start with one or two King Down pieces and earn each next one. When two players play each other, a piece that either player has unlocked is in that game for both of them. This rewards progress, gives a reason to keep playing, and teaches one new piece at a time.

## Rules of the system

- **The random army draws from:** the seven chess pieces (Q R R B B N N) plus the King Down pieces you have unlocked, each with its usual count in the pool (A A, S S, M M, O, G). With nothing unlocked, a game is plain random chess (Chess960-style, no castling).
- **Starting pieces: Archer and Beast.**
  - Both move one square, and each has one clear trick: the Archer shoots without moving; the Beast chains bites.
  - The balance lab found that both make games *more* decisive: Archer presence +4.8 decisive points, Beast +3.0. So early games stay lively.
- **Unlock order: Maester → Ogre → Guard.**
  - The Maester and the Guard both lower decisiveness (−2.9 and −4.3 points).
  - The Guard ("cannot be captured") bends chess the most, so it comes last.
  - The Paladin stays out of the random pool (it gives White an edge) and remains available in custom armies.
- **Earning:**
  - Every win against the computer at Casual or stronger earns a crown.
  - The pieces unlock at 2, 5 and 9 crowns (2, then 3 more, then 4 more).
  - Losses and draws never take progress away.
  - A progress bar in the New game dialog shows the next piece.
- **Unlock moment:**
  - The piece's painted figure is revealed.
  - Then a one-minute lesson: its signature move in a tiny position.
  - The next random army includes the new piece.
- **Playing each other:**

  | Situation | Pool for the game |
  |---|---|
  | Against the computer | Your pieces. |
  | Pass-and-play on one device | That device's pieces. |
  | Play by link (market review, suggestion 2) | The union of both players' pieces. The invite carries the inviter's unlocked set; the friend's device adds its own and draws the army. |

  Seeing a piece in a friend's game does not unlock it.
- **Stays open to everyone:** "Chess starting army", "Custom army…" and "Example armies" are sandboxes with every piece. Progression applies to "Random King Down army" and to the daily board.
- **Storage:** local to the device (no accounts), plus an export/import code to move progress to another device.
- **After the pieces:** the kings' powers, and later the power cards, can be the next unlock tier. This ties the trailer's tease to the game.

## Checks before release

- **Balance of each stage's pool:**
  - The stages are A+S, then +M, then +O, then +G (the full pool).
  - Each needs decisiveness and White/Black fairness measured at depth 3, then confirmed at depth 4.
  - These runs go into `docs/QUEUE.md` and start only when the owner launches them.
- **Tests:**
  - A seeded draw never contains a locked piece.
  - The union rule is symmetric.
  - Progress survives a reload and an export/import round trip.

## Owner decisions

1. Starting pieces: **Archer + Beast** (recommended), or only one.
2. Pace: the 2 / 5 / 9 wins above, or faster.
3. Sandboxes open to all pieces (recommended), or gated too.
4. Daily board: from the full pool, as a preview of pieces you haven't unlocked (recommended), or from your own pieces.
