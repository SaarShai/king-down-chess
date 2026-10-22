# Verify available physical-phone staging journeys

Status: available functional checks complete; phone layout follow-up open. Parent: U09. Follows ticket 50.

## Plan and pass criteria

1. Use the owner's physical iPhone through the supported iPhone Mirroring UI. The owner has unlocked its Mac authentication prompt. Record the device/network facts actually visible; do not invent a model, OS version, measured latency or touch-finger precision.
2. Keep all game pages in staging. Start from the observed first-visit Safari screen. Check local play, a legal turn and computer reply, card and king-power controls, important board targets and background/return. Preserve any existing user data; the observed first visit has no retained local game.
3. Try the available ChatGPT phone route and shared account game through ordinary authorized sign-in. Use existing connections when available. Do not retrieve passwords, change credentials or grant new access. Reuse the retained seven-action account fixture; avoid a committed move unless the test needs one.
4. Keep phone network settings unchanged. Its current status bar shows Wi-Fi and airplane mode. No cellular or offline-phone claim follows from desktop throttling. Do not call one mirrored interaction a p50/p95 timing baseline or a finger-touch test.
5. Capture only relevant game evidence. Close only test tabs and return the phone to its prior Home state. Fix demonstrated defects with a minimal cause-specific change and repeat the failed journey. Keep production untouched.

## Evidence

The parent workspace's `evidence/staging-release-checks/` holds phone screenshots and results. Reuse tickets 48–50 and existing complete mechanics checks.

## Result

The physical iPhone opens staging in Safari. Local e2-e4 receives f7-f5. The position and two-action history survive Home, app return and reload. A new disposable powers game commits a Maester d1/e1 swap; the computer's Ogre shoves g7 to h6 and steps f8-g7. The Holy Light explanation is reachable. These are pointer inputs through iPhone Mirroring, not measured finger accuracy. The model and OS version are not recorded; the visible network is Wi-Fi with airplane mode, unchanged.

The website account link reaches GitHub sign-in with no existing session. No credentials are entered. Native phone ChatGPT already has the staging connection: its plugin opens retained game `02207813-587c-867d-99be-7d448c5e30b0` without Try again or Internal error. Ice Wall details, target a5, draft, Home/app return and Undo pass. The same seven history actions remain, March reads Always on, and Settings loads. No account move is committed. The host conversation drawer must be collapsed to reach the bottom controls; after app return it is collapsed again before Undo. The captured native screen is distinct from the WebKit harness.

The phone board has a large empty gap above the opponent and is smaller than the available frame suggests. This does not close phone usability. Continue [ticket 52](52-phone-board-safe-area.md) with a geometry reproducer before changing layout. Phone cellular/offline behavior, measured latency, physical finger ergonomics and website provider sign-in remain unproved.

The one owned Safari tab closes (132 tabs to 131); unrelated tabs stay open. The phone returns to Home. The test ChatGPT conversation remains as evidence. No production, account, credential or network-setting change occurs.
