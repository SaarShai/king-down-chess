# Movement card flare

Status: ready-for-review

## Scope

Replace the diagram marks for Strike, FireStarter, Haste, Rally, March, Flight, Leap, Vault and SkyLift with short material effects. Keep the rules, figures and board state in the shared player. Own only `preview/cards/movement-effects.js` and this ticket.

## Plan and checks

1. Match each card to its checked fixture. Give each card a distinct material and motion.
2. Draw local trails, dust, wisps and bursts. Keep ground effects below figures. Do not draw route lines, arrows, target marks, screen shake or repeated flashes.
3. Check syntax, finite coordinates, deterministic seek, balanced canvas state and clean start/end frames for all nine cards and both layers. Check a local rendered sample if the preview is available. The parent checks the final integrated page.

## Rule

Card flare must show the card's action through its material and timing. It must not use a diagram of the legal route. Quiet moves must remain quiet; a nearby piece that the fixture leaves in place gets no damage effect.

## Result

`preview/cards/movement-effects.js` exports `MOVEMENT_IDS`, `MOVEMENT_DURATIONS` and `drawMovement(ctx, scene, id, event, layer)`.

- Strike: soft gold wake and a few quiet motes.
- FireStarter: a hot trailing plume and one local flame burst at the captured square.
- Haste: short amber speed fragments for each action by the same piece.
- Rally: rising gold wisps around each of the two movers.
- March: two low dust footfalls through the intermediate square.
- Flight: pale air clouds, a short wake and a soft landing.
- Leap: sage wisps with earth dust; the passed pawn has no effect.
- Vault: a compressed blue air wake and a stronger landing spray; the passed piece has no effect.
- SkyLift: two cloud wakes follow the two figures, with the same lift and lateral sway as the player.

The under layer draws ground clouds and the moving air shadows. The over layer draws local wisps and small material particles. There are no route lines, arrows, dotted arcs, target marks, screen shake or repeated flashes. The module changes no game data or figure art. All effects clear by the end of the action.

Durations in milliseconds: Strike 1500; FireStarter 1700; Haste 2600; Rally 2700; March 1650; Flight 1750; Leap 1600; Vault 1750; SkyLift 1850. Haste and Rally durations cover both actions.

## Evidence and limits

- `node --check` passes for the module.
- An assert check samples 7,272 frames twice: nine cards, both layers, both board orientations, action indices 0 and 1, and 101 times per case. All drawing coordinates are finite. Repeated seeks produce the same draw calls. Canvas state is balanced; start and end frames draw nothing; input event data stays unchanged.
- The parent received the stable module for the integrated browser check. No local `study.js` edits were made. The final render and owner approval are still required.
- No full test suite, live game change, commit or deploy.
