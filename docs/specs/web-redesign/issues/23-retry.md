# 23 · Retry after a loss

Status: ready-for-agent (the owner approved [the spec](../spec.md) on 2026-10-09)
Blocked by: 14; decision D13

## Scope

- Owner choice: the path step "King Down: the king lies down; Retry" stays (the owner changed other path steps, not this one). The chosen Ceremony demo shows "Retry from move 22" after a loss, and its recommendation adds Retry "in both options". Decision D13: Retry is practice, not Undo; the lost game stays lost.
- Demo: `feat-king-down` (the `loss` and `retry` states; its notes: "Retry rewinds to move 22. You try first.").
- Files: `src/main.ts` (the result pane action; call lines only); a pure `retryPoint(history, moments)` and its test (from the key-moment analysis of `src/moment.ts`); `index.html` and `src/style.css` (the result pane row); `tools/verify-end.mjs` (extended).

## Plan

1. [ ] After a loss against the computer, the key-moment analysis looks for the costly move (in the background, after the end frame). When it finds one, the result pane shows a quiet "Retry from move N" under Rematch. With no costly move, no Retry shows.
2. [ ] Retry starts a practice game from the position before that move: the same rules, army and level; `turnStart` is the length of that history, so Undo cannot go before it. The lost game stays lost: Retry does not change its result, and the practice is a new game.
3. [ ] The context line says "Practice from move N." for the first turn. The practice plays as a normal game under the turn rule.
4. [ ] No "Show a better move": the owner removed Hint from the game screen.
5. [ ] Not after a win, a draw, Resign, a game on one device or a link game.

## Verification

- [ ] `retryPoint` test: the costly move of a recorded loss; none for a game with no costly move.
- [ ] `end` check, extended: a scripted loss shows Retry; Retry opens the practice at the right position; Undo stops at the practice start; the practice is a new game with its own result.
- [ ] `npm test` and `npm run check:browser` pass.
- [ ] Rendered sample: one phone video of a loss, Retry and the first practice move; stills at 390×844 and 1440×900. The owner's yes, with the date, in Comments.

## Risks

- The key-moment search uses the one engine worker: it runs only after the end frame and stops on Rematch or a new game.

## Does not do

- No ghost of a better move, no crowns.

## Comments
