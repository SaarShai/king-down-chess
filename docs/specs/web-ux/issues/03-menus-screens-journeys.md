# Menus, screens and user journeys

Status: ready-for-agent

## The owner's request, 2026-10-08

> it's all good and you should work on these.
> but i want the next focus to be on the menus and screens and user journeys and interface. i wanted the known UI and UX best practices and guidelines and the motion graphics to be used for simplification, engagement and clarity of the GUI.
>
> on a specific note - the play by play transcript - we don't need that to be so dominant. it can be a collapsible section. also, it can be made more more engaging and fun to read, with icons and/or animations rather than just static "code" text".
>
> i also want a lot of the "optional" features to be removed and for now placed in an "extra" menu, but to clear as much as possible from the available options and declutter the screen.

## Scope

Every screen, menu, sheet and dialog of the web app, and the journeys through them. The rules: the known UI and UX guidelines (Nielsen's heuristics, the Laws of UX, WCAG 2.2 AA, the Apple and Material guidelines, progressive disclosure) and the motion rules of the [review](../review.md#motion), used to simplify, to make the screens clear and to make them a joy. It builds on the [review](../review.md) and its picks, and on the [game screen sample](02-game-screen-sample.md).

- **Extra.** Each option that a player does not need for a normal game moves to one "Extra" menu, or goes. The designer's tools stay behind `?lab=1` (pick W6).
- **Moves.** The move list is a closed section by default. Open, it reads as a story, with piece icons and plain words in place of notation, and a short motion when a move joins it.

## Plan

1. Inventory: each control, option, setting, mode, sheet and screen, with its use and its new home: the main screen, Menu, Extra, `?lab=1`, or gone. Count the controls before and after.
2. Journeys: first visit, returning player, chess player, two players, powers game, daily game, Workshop, review of a finished game, a settings change. Count the taps and screens before and after.
3. Design: the screen map, each screen and sheet, the Extra menu, the moves section, and the motion of each screen. Each choice names the guideline it follows.
4. Rendered sample: each screen and sheet at phone and desktop sizes, the game screen at the five sizes, a storyboard for each journey, and motion prototypes (video and frame strips) for the moves section, the sheets and the result.
5. Critique and polish.

## Verification

- [ ] The inventory lists every control of `index.html` and the screens that `src/main.ts` builds, each with its home.
- [ ] The game screen shows fewer controls than the sample of ticket 02; the moves section is closed by default.
- [ ] Each journey has a storyboard and its tap count before and after.
- [ ] Measured on each render: no sideways scroll, controls inside the screen, 44 px targets on touch sizes, body text 16 px, contrast AA.
- [ ] Each motion ends on a still frame that keeps its information; Animations Off shows that frame.
- [ ] The owner's yes on the sample.
