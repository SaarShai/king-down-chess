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

Checks are written before the CSS and markup change. Results follow after each check run.
