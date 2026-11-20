# Change classes: a shorter path from a request to the live game

**Status:** approved by the owner

## Problem

Each change paid the full CI two times, each repair was its own PR, and the review loop had no stop rule. A repair of two lines took about 55 minutes to reach the live game. One release had four review rounds.

## Decisions (the owner said yes to each)

1. Three classes of change (tweak, feature, risky) and five rules that stop the loops. [CHANGES.md](../../CHANGES.md) holds them.
2. For a tweak, the lead's read of the diff and the pictures is the independent review. A tweak that the lead writes gets a reader that did not write it.
3. A tweak can go to a preview address before CI. The preview is not staging and not the live site.
4. Four agent skills (`tdd`, `diagnosing-bugs`, `pr`, `retro`) are in use.
5. Machine work: a faster CI, one CI run for each change, one release command.
6. Groundwork: a driver for browser checks, text as data, scene pages, one state for the layers of the play screen, the end of the old page.

## Tickets

- [01: the rules](issues/01-rules.md)
