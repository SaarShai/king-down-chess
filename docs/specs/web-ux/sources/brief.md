# Brief: independent UI/UX review of the King Down Chess web app

You are an independent senior product designer. Review the UI and UX of the King Down Chess web app (public at https://kingdown.dev) and write a report. The owner (the game's designer) asks: "Do a thorough review of the current UI and UX. Think, based on known UI and UX best practices and guidelines: how can we simplify? How can we improve the experience and the visual design to be minimal, clear and a joy, suitable for new players to the app and for experienced players?" Another reviewer works on the same brief in parallel. Do not read or look for their work: stay out of every folder under the parent `ux/` folder except `shots/`, `capture.mjs` and your own folder, and do not read Claude session or workflow transcripts.

## The game

King Down is a chess variant: random armies with six fairy pieces (Archer, Paladin, Guard, Maester, Beast, Ogre) beside the chess pieces, optional "Kings' powers" (six kings, each with two powers), a computer opponent at four levels, two-player play on one device or by a game link, lessons, a Guide, key-moment review after a game, and a Workshop where players design their own piece. The art is painted storybook figures on a stone board.

## Inputs (read-only)

- Screenshots: `../shots/` (relative to your working folder). Names are `<NN-screen>-<size>.png`. Sizes: desktop (1440x900), laptop (1280x720), tablet (820x1180, touch), phone (390x844, touch), landscape (844x390, touch). `-end` = the open dialog scrolled to its bottom; `-full` = a full-page capture. Screens: 01-title-first (first visit), 02-after-title-play (what a first-time player sees after Play), 03-title-returning (with a saved game), 04-game-idle, 05-game-selected (a pawn selected), 06-game-hint, 07-game-threats (Settings > Show threats on), 08-game-review (first move opened from the move list), 10-new-game, 11-new-game-powers, 11b-new-game-frost (Frost king picked), 12-new-game-two, 13-new-game-more (More options open), 14-settings, 15-guide, 16-lesson (first lesson), 17-powers-game, 18-powers-armed (power button pressed), 19-two-players (after 1.e4 in a two-player game), 20-workshop, 21-promotion, 22-capture-or-push (Ogre), 23-result (after Resign), 24-clay-selected (the Clay 3D look, desktop only). Look at every size relevant to a point, phone included.
- Visible text of each screen: `../shots/texts.json` (key = screen-size).
- The capture script, which shows how to drive the app: `../capture.mjs` (Playwright, imported by absolute path).
- A live dev server may answer at http://localhost:5173/ . If you need a state the screenshots do not show, you may write a small headless Playwright script in your own folder (copy the import line and helpers from capture.mjs; set sessionStorage `kingdown.title-seen` = `1` to skip the title). This is optional: if the sandbox blocks the browser or the network, work from the screenshots and the code. Never start or stop a server.
- Code, read-only, repo root `/Users/za/Documents/king down chess`: `index.html` (all dialogs and the panel markup), `src/style.css` (main styles), `src/main.ts` (game screen logic, panel, title, review, lessons, share link), `src/new-game.ts`, `src/powers-ui.ts`, `src/power-motion.ts` and `.css`, `src/lessons.ts`, `src/moment.ts`, `src/try-these.ts`, `src/move-text.ts`, `src/piece-icons.ts`, `src/dialog-dismiss.ts`, `src/account/account.ts`, `src/render/marks.ts` and `src/render/PaintedView.ts` (board markers), `src/workshop/dialog.ts` and `workshop.css` (Workshop), `public/` (art, manifest).
- Earlier design passes and owner decisions (respect them; propose to change one only with a clear reason, and say that it reverses an owner decision): `docs/visual-design/README.md` (rounds 1-4: title lineup, move markers, the simplified New game with three modes and the emblem king picker, piece icons), `docs/painted-game/README.md`, `docs/WORKSHOP.md`, `docs/PROGRESSION.md`, `docs/RULES.md` (rules, for context only).

Do not edit, create or delete any file outside your own working folder. Do not run git commands that change state. Another agent works in the repo.

## Cover all of these areas

1. **First run, onboarding and learning:** title screen (first and returning), where Play and Learn lead, the first game screen, lessons, the Guide, "Try these", how a new player learns the six fairy pieces, the kings' powers and the controls. The shortest path to a first fun moment.
2. **Core play loop:** board, selection and move markers, move-help line, Cancel selection, the selected piece's card, Hint, Undo, Resign, last move, check, move list and review, captured pieces, the turn header, threats, capture-or-push and promotion dialogs, the result dialog with key moments, two-player hand-off and the game link. Is the board the hero? What does an experienced chess player miss (density, shortcuts, flip, material, rematch speed)? Compare with lichess and chess.com.
3. **Setup, settings and navigation:** the New game dialog in all states, the king and power picker, More options (army codes such as MMSSNBNK), Settings, Account, the in-game navigation (New game, Guide, Workshop, Settings). Choice overload, defaults, progressive disclosure, information architecture: today's screen map and a simpler one.
4. **Visual design system:** typography (Cinzel and Alegreya Sans), colour tokens in `src/style.css`, spacing, borders, shadows, button variety, icons, dialogs, the header box, the desktop panel, empty states, the gap between the dark rich title screen and the plain light game screen, the Clay look. Propose a small token set and component rules grounded in what exists.
5. **Responsive layout and touch:** every screen at all five sizes. Board size, fit without scroll at 1280x720 and in landscape, wasted space, what falls below the fold on phone, thumb reach, target sizes, dialog fit, safe areas.
6. **Accessibility, feedback and copy:** WCAG 2.2 AA (contrast with measured colour pairs, focus, keyboard play, screen-reader announcements, target size 2.5.8, reduced motion, colour-only cues), the computer's thinking state, loading, error prevention (Resign, New game over a game in progress), and microcopy from texts.json. Propose shorter copy for the worst cases.
7. **Kings' powers in play, the Workshop, and delight:** how a player finds, understands and uses a power; passive powers; the opponent's power; whether the Workshop is clear and where it belongs; sound, motion, the win moment, the peak-end of the result dialog, personality.

## Rules

- Every finding needs evidence: a screenshot file name and/or a code reference `file:line`. Search the code before you say a feature is missing.
- Cite the principle behind each finding: a Nielsen heuristic, a Law of UX (Hick, Fitts, Jakob, Miller, Tesler, aesthetic-usability, Doherty, peak-end, Von Restorff, proximity, common region), a WCAG 2.2 AA criterion number, Apple HIG or Material (44 pt / 48 dp targets), progressive disclosure, or a convention of chess apps or casual-game onboarding.
- Prefer changes that remove, merge or hide things to changes that add. Say for each one whether it simplifies.
- Think of two audiences: a new player who knows some chess (or none) and has never seen King Down; an experienced chess player who wants speed, information density and no friction.
- Be specific: name the element, screen and size, and give the concrete change (copy, layout, size, colour token), not "improve X".
- Write in ASD-STE100 (Simplified Technical English): approved words, short sentences, active voice, present tense. The owner reads it.

## Output

Write your report in Markdown to `report.md` in your working folder. Structure:

1. Summary (5 to 8 sentences): the state of the UI today, the three biggest problems, the direction.
2. What to keep (the strengths, short).
3. Design principles for King Down's UI (5 to 7, each one line and testable).
4. The simplification: today's screen map and control count against the proposed one (what is removed, merged, hidden, moved), with numbers.
5. Proposed layouts, precise enough to mock up, for desktop/laptop, tablet, phone portrait and phone landscape: the game screen and the new-player first-run flow. ASCII wireframes where they help.
6. Visual direction: a compact token set (type scale, colour roles with hex values taken or adjusted from `src/style.css`, spacing, radii, elevation, motion durations) and component rules.
7. Ranked changes: a table of the top 20 to 30 changes with ID, screen, change, why (principle), audience, impact (H/M/L), effort (S/M/L), simplifies (yes/no), grouped into Quick wins, Next, Bigger redesign.
8. Full finding list by area: ID, title, screens, severity (critical/major/minor/polish), evidence, problem, principle, recommendation.
9. Owner decisions: each open decision as a one-sentence rule, two or three options with numbers where possible, your pick, and what happens on yes. Include every change that reverses an earlier owner decision.

Work thoroughly. When `report.md` is complete, end with a one-paragraph summary as your final message.
