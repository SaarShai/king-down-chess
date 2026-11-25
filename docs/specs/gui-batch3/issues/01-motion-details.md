# Four small motion details and one text repair

Status: ready-for-human (the owner approves the rendered sample)

Each motion runs one time after a player action. Reduced motion shows the end state at once. Light theme, web app.

- **History.** The newest line goes from brown to dark ink in 160 ms (`renderHistory` in `main.ts`, `newLine` in `history.ts`). A redraw in the 160 ms goes on from its place; a reload, a resize, Replay and an opened History move nothing. The newest record of the wide rail now rests in dark ink. Portrait has no strip: the line shows there only when History is open.
- **Main button.** On press the lower bronze edge rises 2 px over a light lip, in 90 ms (`components.css`). Box, outline and layout do not change. The old press of the whole plate (`motion.ts`, `turn-controls.ts`: owner choices) stays.
- **Power.** A use that the player stages fills its notch with wax in 180 ms (`markUses` in `main.ts`). A full notch is a teal diamond; a spent notch is a round drop of wax. The emblem is grey when the power is spent; the wax keeps its colour. The opponent's notch changes with no motion.
- **Guide.** A short rule draws under the entry title in 180 ms when the player opens another entry (`guide.ts`, `menus.css`). It stays at rest. The first page, the same entry and a resize draw nothing.
- **Checkmate text.** A mate that waits for End turn keeps "End turn, or undo." When the game is over, the words are "Checkmate." alone, also after a redraw.
- **Home after a turn.** A turn of a touch device leaves the film on and shows it whole, with both kings. After the film, the still for the new shape comes (`reframe` in `home-reveal.ts`; `home_resize` in `verify-next-menus.mjs`).

Not built: the portrait idle clip. `portrait-idle.ts` has no caller now, so the clip needs a new caller in a different file and loads the figure package in that place.

Tests: `history.test.ts`, `menus.test.ts`, `power-notch.test.ts`, `guide-rule.test.ts`, `mate-hold.test.ts`.
