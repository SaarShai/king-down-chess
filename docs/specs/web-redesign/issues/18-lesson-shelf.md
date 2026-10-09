# 18 · Lessons: the piece shelf

Status: ready-for-agent (the owner approved [the spec](../spec.md) on 2026-10-09)
Blocked by: 02a (Show me), 05

## Scope

- Owner choice: Lessons A, the piece shelf ("four small boards for one piece"). Decision D10.
- Demo: `feat-lessons` option A (`index.html` 15–91; `lessons.js` 15–55 the Guard boards, 62–86 the order and lines, 112–128 the shelf, 304–309 Show me, 362–401 the learned card).
- Files: `src/lessons.ts` and test; `src/main.ts` (the lesson flow, `noteLesson`, the Guide; call lines only); `index.html` (the Guide, the lesson parts); `src/style.css`; `src/powers-ui.test.ts`; `tools/verify-lesson-return.mjs`; new `tools/verify-lessons.mjs`; `tools/verify-account.mjs`, `tools/verify-painted-game.mjs`, `tools/ux-defects/` d4 and d8.

## Plan

1. [ ] The lesson shape becomes a list of boards (key, name, position, task, how, done, retry, goal). The Guard gets the demo's four boards (move, block, the twist, choose). The other five pieces keep one board until the owner says yes to each new position.
2. [ ] The Archer lesson reads the Archer rule in force (spec rule 11). Today's position (`7k/8/8/4p3/3A4`) uses a diagonal shot at distance 1, which the far2 reading removes; give the lesson a position and a goal that work under each Archer reading, or one position for each reading.
3. [ ] The Guide sheet opens with the shelf at the top: six figures on a stone shelf in the order Archer, Beast, Maester, Ogre, Guard, Paladin; under each, its name, one line and its state ("Learned", "Next" on the first one not learned, "Bonus" on the Paladin). A main button "Learn the <piece>" ("Play a game" when all are learned). The line "Lessons never change your saved game." Any figure opens its lesson.
4. [ ] The lesson screen: a top bar (‹ back to the shelf, the piece icon and name, Play = back to the kept game), the task line, "Show me" (from ticket 02a: it marks the goal move from `hintMoves()` with the lesson goal), and a step track only for a lesson with more boards. On success: a "<Piece> learned" card with its rule line, "Play a game" and "Next: <piece>".
5. [ ] Lessons have no turn button and no Undo; each move is judged at once, and the lesson takes back a wrong move itself.
6. [ ] `noteLesson()` keeps every other field of `kingdown.lessons` (ticket 19 adds `tricks`). The account keeps the `done` list as today.
7. [ ] One verb for the Ogre: "shove" in all copy.
8. [ ] Remove `#lesson-progress`, `#next-lesson` and `#return-game` and the lesson actions of the context line.

## Verification

- [ ] `src/lessons.test.ts`: on every board a goal move is legal and reaches the goal, and a wrong move does not; the Archer lesson under each Archer reading; the order; the Guard has four boards.
- [ ] `src/powers-ui.test.ts`: "Show me" gives only goal moves (update the lesson index for the new order).
- [ ] New check `lessons`: the Guide opens on the shelf; "Learned" follows the store; a figure opens its lesson; Show me marks the goal; no Undo and no End turn in a lesson; Play returns to the kept game with no change.
- [ ] `lesson-return`, `account` (a learned lesson syncs), `npm test` and `npm run check:browser` pass.
- [ ] Rendered sample, 390×844 and 1440×900: the shelf; the Guard twist board; the learned card. The owner's yes, with the date, in Comments.

## Risks

- The kept game and a newer game from the account must stay safe during a lesson.
- The Paladin is not in the draw pool; its "Bonus" line must stay true to the rules in force.

## Does not do

- No four boards for the other five pieces yet. No path layout (B). No crowns.

## Comments
