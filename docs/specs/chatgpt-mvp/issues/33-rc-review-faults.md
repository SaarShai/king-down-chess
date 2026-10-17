# 33 Release candidate review faults

Status: claimed
Branch: claude/rc-fixes
Base: 4692477c1669db14782e0058126ad291e1664ba8

The owner asks for R1, R2 and R3 in the source ticket at
`/private/tmp/claude-501/-Users-za-Documents-king-down-chess/b7cd01b9-9824-4854-8a44-29f55a926d5b/scratchpad/tickets/issues/33-rc-review-faults.md`.

## Plan and checks

1. Add tests with no product change. Show each fault on the base code.
2. R1: show the first enemy lesson before the general note. Record a lesson only when its text shows. Check Black's first turn, a later swap, a hidden lesson and White's first note on the board.
3. R2: keep a long token in the invitation preview. Check Open, preview and Join with a fixed long token. Keep the short-code check.
4. R3: correct the P5 review note. Check the other prompts against both packet copies. Keep the other words.
5. Run `npx tsc --noEmit` and `npm test` with the local test database. Commit before both browser checks. Run `plugin-ui` and `plugin-ui-http` through the owner's check runner. Record the results here.

Do not change `src/plugin/app.css` or the zoom checks. Do not push, merge or deploy.

## Evidence

Pending.
