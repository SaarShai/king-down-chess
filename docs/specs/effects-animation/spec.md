# Effects animation studies

Status: approved samples integrated and verified; five later interface studies await feedback.

## Goal

Make an effects library for the painted game. Show working motion early. The owner asks for the full list, parallel development and frequent samples on 2026-10-23. This authorizes the studies. The owner now authorizes game integration of the approved samples, without combat animations and with the excluded indications static.

Keep character motion in its own workstream. Effects attach to scene coordinates and contact events. They do not stretch the painted figures. Use Canvas for board effects and CSS/SVG for interface effects. Use existing art and no paid image service.

## Plan

1. Check the current rules, released cards, effects and the character-animation chat.
2. Build three independent sample groups in isolated worktrees: interface; states and indications; card actions.
3. Join the groups in one review page. Show first samples before the full pass is complete.
4. Check actual playback, replay, pause, scrub, reduced motion, hidden tabs, phone layout, both board directions and legal fixtures. Record the limits.
5. Revise from the owner's feedback. Integrate approved effects through the existing renderer and UI lifecycle. [Ticket 13](issues/13-game-integration.md) records the completed checks and independent review; [coverage](coverage.md) records the remaining feedback.

## Motion rules

- Action has a clear source, travel or change, contact, and result. Shapes and labels carry meaning as well as colour.
- Selection rings and all ground marks draw below the characters. Do not add animations for selection, extra-move availability, legal destinations, capture targets, Beast bite order, threats, reserve drop or last move. Keep their production indications. Persistent states remain readable without continuous motion. Avoid screen shake, flashing and effects which hide legal targets.
- Do not develop combat animations. Keep combat and character action work outside this effects workshop.
- Ice effects must read as ice material, with visible volume and a distinct silhouette. Freeze builds an irregular ice crust; Ice Wall makes a substantial barrier. Do not use repeated crystal posts or thin shield outlines as the finished effect. Firewall must read immediately as living fire: irregular curling tongues, hot cores, translucent orange edges and rising embers. Repeated flame icons, triangular posts and a glowing ring are insufficient. The Guard has no permanent shield effect, ring or state badge. The owner requests this removal in F-106. Keep the rule text: only a king can take a Guard, and a Guard cannot take a piece. Temporary protection still shows on a Guard.
- Freeze blocks movement, not attacks. Protection is not damage. Archer shots leave the Archer on its square and can pass over a blocker.
- Use the engine fixture and production board/marks. The preview must not invent legal moves.
- All 21 released cards get a sample. Lab variants do not appear as released content. Rule context can change card restrictions.
- Preserve art aspect ratio. Attach effects through the scene's square/foot transforms. Review on both armies and at board size.
- Pause, speed, replay and scrub share one clock. Actor replacement and its crossfade use the same time window, so the figure does not pop into a partly completed change. Reduced motion gives a clear still result. Hidden tabs stop the sample clock. Only the active sample runs.

## Inventory

Each semicolon separates a motion study or a related state sequence. The existing motion can be reused where it already meets the intent.

| Group | Proposed studies | Treatment |
| --- | --- | --- |
| Match UI | Game/army reveal; turn handoff; timer start, warning and expiry; check alert; victory; defeat; draw; abort/no-start | Refine current ceremony; new clock/feedback samples |
| Controls and cards | Card deal; select; use; refill; power-use counter; promotion choice; move confirmation; undo/replay; dialog transition; button feedback; connection lost/recovered; card coin cast/spent; draw offer/reply; opponent found; both players ready; invite copy | Reuse visual tokens and existing card transitions, develop gaps |
| Piece states | Freeze onset/hold/thaw; ward onset/hold/expiry; whole-army ward; king shelter | Keep the state readable at rest; optional rules labelled |
| Board indications | Distant Archer targets; hover/keyboard ghost; swap pair; shove and landing; check and cause; hint | Use engine state and the current mark language |
| Released cards | Freeze; Ice Wall; Strike; Haste; Flight; Sacrifice; March; Leap; Salvation; Mirror (MirrorB); Firewall; Earth Quake; Burn; Fire Starter; Control; Rally; Morph (MorphP); Mimic; Vault; Curse; Sky Lift | One selectable action sample per card |
| King effects | Frost; Flame; Stratus wind; Mud earth; Spirit; Shadow | Existing idle/capture effects form the baseline; do not rebuild them without a reason |

The following use still production indications: selection, extra-move availability, legal destinations, capture targets, Beast bite order, threats, last move and reserve drop.

## Source of truth

- `src/content/cards.ts`: 21 released card IDs and display names.
- `tools/fixtures/shared-mechanics.ts`: real FEN, setup and legal actions.
- `src/rules/engine.ts`: marks, continuation turns and rule meaning.
- `src/render/PaintedView.ts`, `src/render/marks.ts`, `src/render/effects/`: production rendering, shared effect art and indications.
- `docs/2d-first-pieces/board/scene.mjs`, `king-effects.mjs`, `king-captures.mjs`: existing painted action effects.
- `src/ceremony.ts`, `src/ceremony.css`, `src/plugin/screens/board.css`: current interface motion.

## Acceptance

The studies load with real art and no browser errors. Each released card resolves to its fixture result. Controls are operable with keyboard and touch. Pause and reduced motion do what their labels say. At 390 px there is no horizontal overflow and the stage and result remain reachable. The owner has watched playback before any claim of visual approval.

## Review direction

The owner likes the interface effects, Shove and Hint. The revised Freeze and Ice Wall are good or okay. Firewall keeps its approved fire material. The owner removes the permanent Guard shield in F-106. Keep the other approved samples. Swap must feel magical, with less of a diagram. Check must have a dramatic entrance, then settle into a clear cause and warning. Selection rings stay below characters.

The owner rejects the first card effects as too much of a diagram and too little flare. Revise Burn, Freeze and Earth Quake first: gather energy, travel, impact and material response. Remove diagram paths and legal-target marks from the card presentation. Use sparks, smoke, frost, light and debris with a clear contact point. Preserve the real legal action and result. Revise the remaining cards in two isolated groups while the owner reviews these three samples: movement (Strike, Fire Starter, Haste, Rally, March, Flight, Leap, Vault, Sky Lift) and spells (Sacrifice, Salvation, Morph, Control, Mimic, Curse, Ice Wall, Firewall, Mirror). Both groups are joined and the old diagram drawing code is removed. These revisions remain subject to visual review.

The active signal set is Freeze, Distant Archer shot, Ice Wall, Firewall, Holy Light, Mercy, Hovered move, Swap pair, Shove, Check and Hint. The Guard rule sample has no permanent effect. Eight rejected animation proposals stay in the inventory as still production indications. Approval of the interface direction is not approval of each remaining sample.

Game integration is tracked in ticket 13. Preserve engine rules and the separate character-animation work. A passing sample check does not prove production integration.

## Second sample batch

The owner approves the revised direction and asks for more categories in parallel. Preserve the accepted samples and the eight still-only indications.

1. Keep the approved Firewall material. The Guard rule sample shows no permanent shield, as the owner requests in F-106. The owner cancelled the Combat category; remove it from the active workshop and do not develop it further.
2. States and protection: keep Archer targeting, Holy Light, Mercy and Swap in the existing studies. Keep the Guard rule sample without a shield. Preserve the other reviewed materials, Shove, Hint and Check samples.
3. Interface objects: add four to six real interaction gaps after checking the shipped UI; retain the existing eighteen samples. Show the first two early.

Each worker uses an isolated worktree. Root copies stable early output into the workshop, checks fixture outcomes and visual playback, and expands the browser check for the completed groups. This batch remains local review work.
