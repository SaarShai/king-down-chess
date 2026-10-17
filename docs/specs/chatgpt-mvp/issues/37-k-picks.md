# 37 Owner picks: card names and Resume

Status: claimed
Branch: claude/k-picks
Base: 4692477c1669db14782e0058126ad291e1664ba8

The owner approves K1 a and K2 a on 2026-10-17. The build uses the ticket in the task brief.

## Plan and checks

1. Add built-page checks. Show both failures on the base code before the build.
2. Extend the card strip rules to 440 px. Check both player names, the second coin row, and the bar at 402 × 714, 412 × 790, and 440 × 760. Check cards with and without king powers.
3. Put Resume and its detail on two lines in one button. Check full text, the accessible name, a 48 px height, and two buttons in one row at 390 × 844, 402 × 714, and 440 × 760. Keep the column below 340 px.
4. Run `npx tsc --noEmit`, `npm test`, and `plugin-ui` through the named runner. The existing checks cover 320 × 568 and desktop layout.
5. Record the results and taste choices. Commit each complete part. Do not push or merge.

## Evidence

The final base check uses commit `63767598`. The app CSS and markup match `4692477c` (`git diff --exit-code 4692477c -- src/plugin/app.ts src/plugin/app.css` passes). The M1 runner exits 1 in 109.5 s. Both K1 and K2 fail before the build.

- K1: at 402 px without powers, the opponent name needs 81 px but gets 66 px. Your name needs 109 px but gets 86 px. With powers, your name gets 56 px. The coins stay in the name row. All six card cases have the expected four or five coins.
- K2: Resume stays on one line and is cut at 390, 402, and 440 px. The 48 px button height and the 320 px column pass.
- The first two base runs expose faults in the new test data. The final test waits for the host read and uses the valid always-on March power with cards.
- Base runner log: `scratchpad/lanes/k-picks/checks-base-3.txt` in the task scratch folder.

## Build

K1 merges the three existing card-row rules into one rule through 440 px. It applies to both strips. The base check shows that both names need the change. The zoom rules below 320 px and the desktop rules stay in place.

K2 and final check results follow.
