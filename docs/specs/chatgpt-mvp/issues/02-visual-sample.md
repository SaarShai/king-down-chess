# 02 · The visual sample

Status: ready-for-agent
Type: HITL (the owner's yes on the rendered sample)
Size: M
Blocked by: none

## Scope

A static, clickable mock of the MVP screens with the real art, for the owner's yes before the visual build (AGENTS.md: "A visual build waits for the owner's yes on a rendered sample"; spec decision Q18).

- Screens: the inline home card (Play, Your games); Play (computer, friend, random, Join with a code); Setup (the five toggles with their one-line texts, colour, level; the pieces "all" sheet with locks at 7; the cards "all" sheet; the king-coin sheet: six kings, then two powers, with the cards-on filter); Seat setup (king coin + arranging the back rank on the board, Shuffle, Ready, "waiting for the other player"); the board in a game with cards (both hands, spent cards, the power coin) and the action row (Resign, Draw, Abort/Claim when they apply); the end card with Rematch; Lobby (open games list with features and Accept, Find an opponent, the wait with "Play the computer while you wait", "Opponent found. Switch now?"); Profile (the scroll registry with totals, rating with "?", the 10 badges, earned and not earned); Collection; Settings (Symbols only, Show threats); the handle and picture screen (17 presets).
- Sizes: phone 390 × 844 (DPR 2) and desktop 1440 × 900; the side panel at about 400 × 900. Fullscreen screens leave room at the bottom for the ChatGPT composer.
- ChatGPT UI rules (explorer note F, §8): system fonts for all UI text; brand colour only on primary buttons, accents and badges; decorative lettering only inside images; WCAG AA contrast.
- Art: existing art first (king portraits and emblems in `public/ui/kings`, `public/ui/emblems`; piece art; `public/ui/icons/*.svg`; the 10 card faces and the back in `public/ui/cards`). New art with Codex image_gen only (global rule): the scroll, the king-coin frame, 10 badges, toggle icons. Keep the masters and `.prompt.txt` files in `art-src/` with manifest rows.

## Plan

1. Read the spec, explorer notes E (art) and F (host), and the redesign style (`docs/specs/web-redesign/`).
2. Generate the new art with Codex image_gen; cut it to web sizes (WebP).
3. Build the mock as one HTML file under `docs/specs/chatgpt-mvp/sample/` with the screens as states.
4. Render each state at the three sizes with Playwright; save the PNGs beside it; make one contact sheet.
5. Send the sheet to the owner. Record the answer here.

## Acceptance

- Every screen above renders at the three sizes with no horizontal scroll and no text over the composer zone.
- The owner says yes (quote and date here), or the changes are listed and done.

## Notes

- Explorer notes: `../notes/e-art.md`, `../notes/f-host.md`.
