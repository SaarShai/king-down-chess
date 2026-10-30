# 96 — Remove extra button text

Status: ready for review
Type: task

## Plan and checks

1. Check the local title, Home, New game, Menu, result and account entry for button sub-lines. Remove text that repeats a control. Keep choices, state and warnings.
2. Update the affected styles, browser checks and current docs. Leave account-game loading and the ChatGPT board alone.
3. Check title, Home, New game and Menu in Chromium and WebKit at phone and desktop sizes. Run the affected browser checks, full tests, docs tests and build.

## Copy decisions

- Remove the title's local-play note, A friend's Online line, and the New game, Guide and Resign menu descriptions. They repeat the controls or describe an obvious route.
- Keep the offline notice and status, Home turn and rematch details, the last move, selected level and army, New game summary and warning, Play again's setup and army detail, the new-game and resignation warnings, and the motion help. Each gives state, a choice, an effect or a warning.
- The account entry uses status and error text, not a button description. The result sheet has no button descriptions.

## Checks

- `npm run check:browser new-game game-screen ui-review-samples visual-design home menu-extra layout-title account-discovery`: five checks pass on the first run. The title measurements and a new phone-size assumption fail. Account discovery needs a disposable database. The next run with that database passes `ui-review-samples`, `layout-title` and `account-discovery`.
- `PLAYABLE_BROWSER=webkit npm run check:browser account-discovery`: passes with the disposable database. Chromium and WebKit check and capture the title, Menu and New game at 393×852 and 1366×768. The author inspected both sets of images.
- `npm test` with UTC and the disposable database: 303 files pass, 5,960 tests pass, 11 skip, and 67 artwork tests pass.
- `npm run test:docs`: 17 files and 187 tests pass. `npm run build`: passes.
- Review: the author checked the full diff and the rendered screens. Independent review remains open for the PR.
