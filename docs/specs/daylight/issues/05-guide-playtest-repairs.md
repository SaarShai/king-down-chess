# Guide and You playtest repairs

Status: claimed

Correct the notes for the four game types and for a free action. Keep the Ribbon sample inside its button at larger text sizes. Keep the reading position when a Guide entry reloads.

The web router and iOS router both send a path such as `/g/abc` to the old page. The router check requires the same page from both. Keep this item open for a change that includes both routers.

## Check results

- The unit checks compare the four Home notes with the New game rules. They check the free-action text in the overview and the five entries.
- The Ribbon sample fits at 100% to 200%. The desktop reload keeps Maester at 293 pixels from the top. The phone reload keeps the same text in view within 3 pixels.
- The Ribbon and Guide reload checks pass at 390 × 844 and 1280 × 800. The older Guide and You cases report faults that also occur on the live site.
- The type check, 385 selected tests, and both Vercel build modes pass. The files that overlap PR 390 combine without a conflict.

## Merge checks for PR 394

- TypeScript and all 533 Play tests pass. The Daylight tab check passes on WebKit and Chromium.
- At 1280 × 800, the Maester entry stays at 293 pixels after reload. You stays at 219 pixels after Back from Privacy. All three tabs work with New game open.
- Chromium drops the history update on reload. Guide uses session storage. You uses the history entry. Both use the same code to restore scroll.
