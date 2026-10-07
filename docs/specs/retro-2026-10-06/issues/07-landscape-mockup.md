# Landscape phone layout mockup (568×320)

Type: prototype
Status: resolved
Blocked by: 05

## Question

How do the two boards and the card sit on a 568×320 screen without scroll? The owner chose side-by-side boards with smaller cells. Make two static mockups (568×320 and 390×844 for contrast), send them with SendUserFile, and get the owner's yes before the Workshop finish spec is approved.

## Answer

Made 2026-10-07 with the dev server and an injected stylesheet; no source changed.

- `mockups/landscape-568x320-mockup.png`: the proposal. Header 44 px, footer 49 px; a 120 px card column (figure 84 px, name, pen and eye, worth and band; the thermometer hidden) and the two boards side by side at 27 px cells (197 px each), titles 14 px, the "Tap squares" and "forward" lines hidden. Both boards and Try it are in view; the Apply-to select, the sliding directions and the properties scroll below (348 px).
- `mockups/landscape-568x320-today.png`: today, the card fills the screen and the boards start about 555 px down.
- `mockups/portrait-390x844.png`: the portrait layout, unchanged.
- `mockups/landscape.css`: the stylesheet of the mockup (a prototype; the build takes its numbers, not its text).

Waits for the owner's yes. Open choice: the thermometer is hidden in landscape (the worth line carries the number); the owner may prefer a 150 px card with a small thermometer and 25 px cells.

Owner-approved: 2026-10-07 mockups/landscape-568x320-mockup.png (owner: "yes" to the five specs and their picks).
