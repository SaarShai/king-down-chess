# Animate the approved wide card artwork

Status: preview complete; all 23 animations verified and available for owner review

The owner asks for an animation for every approved artwork, in the style of the six approved card-art studies. Preview first. Keep character bodies and the painting composition stable. Use source-painted frost, mist, cloth, leaves, wind, dust, embers and light. No combat or attack motions. The owner also asks to revise Sacrifice, Mirror and Rescue, chooses Hop as the new display name for Vault, and asks for two Rally concepts (banner and war horn). Pending artwork enters the animation set after approval.

## Plan and checks

1. Finish and show the three requested revisions and two Rally concepts. Preserve prior drafts and prompts. Apply the Hop display name in the shared card catalog while retaining its stable internal identity and rules.
2. Develop the currently approved set in three isolated effect groups. Parent owns the shared preview and approved Freeze adapter. Each renderer takes a prepared512 ×288 painting and draws deterministic8-second loops and3.2-second awakenings. Cache source masks/textures; preserve the base; stop under reduced motion, hidden and offscreen states. Show early groups for feedback.
3. Check source fidelity, deterministic seeks, loop endpoints, bounded canvas state, reduced/settled frames, actual card framing and desktop/phone browser behavior. Visually inspect early and final samples. Complete the all-card static overview checks left by the interrupted turn. No game animation integration is part of these previews.

## Initial approved set

Freeze, Ice Wall, Strike, Haste, Flight, March, Leap, Salvation, Firewall, Earth Quake, Burn, Fire Starter, Control, Morph, Mimic, Hop and Sky Lift, plus Curse. Sacrifice, Mirror, Rally and Rescue await revised-art feedback. Card back is awaiting specific feedback. Freeze's accepted effect stays intact.

## Result and current decisions

All 23 paintings now have living card previews in motion/index.html, including Sacrifice, Mirror, Rally, Rescue and the card back. The three isolated groups provide source-painted cold/air, cloth/wind/dust, and magic/fire motion. The accepted Freeze renderer is reused unchanged, with the actual card's top crop. The wide paintings use their complete16:9 source. March uses its retained top crop. No attack, strike, shove or capture action is animated; figure and weapon geometry stays fixed.

Hop is the owner’s final name for the card with stable internal ID Vault. The shared catalog name and artwork manifest use Hop; Leap stays separate. Only the display name changes.

Sacrifice now shows an ivory pawn breaking open to reveal an ivory rook of the same color. Mirror now has one hand presenting a card and the other reaching into the mirror to take its reflection. Rescue retains its scene but simplifies the human hand into painted planes. Prior paintings are preserved under previous/. Rally has two new concepts, Answer the banner and The war horn, in corrections.html. CORRECTIONS.json records exact prompts and generated paths. The final set uses the approved Rally banner and Mirror option 2. All revised sources are in the motion catalog under the current owner direction below.

The host resolves art through Vite's asset glob. Initial browser inspection catches that a directory URL used as an asset base loses its trailing slash after Vite rewriting, returning HTML instead of an image. The shared asset mapping fixes that cause. Follow the existing all.ts pattern for asset references. One cached active frame supplies the preview; rendering is capped at30fps, with reduced-motion, hidden-page and offscreen stops.

## Verification

Registered `npm run check:browser wide-card-motion card-art-wide` passes in run effects-integration-QCZ1F8. The animation check validates all18 source frames, deterministic reverse seeks, seamless8-second loops,3.2-second awakening endpoints, reduced/settled originals within two channel levels of cached-canvas rounding, meaningful moving paint, finite draw calls/opacity, names/rules, controls, keyboard access, half speed, replay, one-shot completion, hidden/offscreen stops, desktop/phone16:9 framing and no overflow/browser errors. It saves54 canvas frames and36 page captures. The parent inspects cold, sky, cloth, cloud, fire and teal-magic samples and the live Sky Lift playback.

Final static check effects-integration-KaB9PG also verifies the overview and its animation links after assembly:21 released cards,2 extras, complete image links, all frame geometry and Hop labels at desktop/phone sizes, plus all5 revision images. `npm run test:docs` passes166 checks in13 files. Focused `KINGDOWN_TEST_FILE=src/content/cards.test.ts npm test` passes typecheck,3 catalog cases and51 existing painted-piece checks after the shared test lock clears; this is not a full-suite pass.

Durable animation evidence is in external card-art-wide/motion-verified. The preview is open for feedback. Source-art integration and animation integration into the live game remain separate work.

## Current owner direction

The owner selects Rally A, Answer the banner. The owner asks Mirror's real card to face the glass, with the reflection card still inside the mirror. This supersedes the partly extracted reflected-card composition. The owner explicitly asks for animations for each artwork in parallel, including current revised drafts, and asks existing accepted animations to keep their motion when retargeted to the new framing. The motion catalog therefore expands to all23 review entries. Sacrifice, Mirror, Rescue and the card back receive animation previews without waiting for another artwork gate. These previews remain subject to visual feedback.

The owner approves Mirror option2, the second orientation/depth revision (Mirror revision4), and asks to continue all remaining work. The real card presents its front to the mirror, showing its navy/gold back to the camera. The reflected card and grasping fingers remain behind a visible glass sheen and wrist boundary. Both rejected orientation drafts remain in previous/. Rally stays on the approved banner concept.

## Recovery checkpoint

The previous chat is idle after an interrupted turn. Its last completed command assembles all 23 catalog entries and passes both registered browser checks. Continue in the existing effects-integration worktree. Verify the complete catalog, inspect the five final samples, open the preview, and record the final evidence here. Do not repeat artwork generation or group implementation. Completion requires 23 passing motion entries, desktop and phone checks, and a working review URL.

## Final recovery result

Both registered checks pass in effects-integration-XelKRH: `npm run check:browser wide-card-motion card-art-wide`. The report contains 23 motion entries, 46 desktop/phone layouts and no browser errors. It verifies source fidelity, deterministic seeks, loop and awakening endpoints, moving paint, finite canvas calls, controls and motion stops. The recovery pass inspects the live Mirror preview and the final Rally, Sacrifice, Rescue and card-back frames. The retained Mirror option 2 and Rally banner match the owner decisions.

Evidence: `/Users/za/Documents/king down chess (new)/evidence/effects-wide-final-XelKRH/`. The working preview is `http://127.0.0.1:5199/docs/specs/effects-animation/preview/card-art/wide-review/motion/index.html#mirrorb`. It is open in the takeover chat. No new rendering code is needed during recovery. The full unit suite is not rerun; these are preview checks. Live-game integration and deployment remain outside this ticket.
