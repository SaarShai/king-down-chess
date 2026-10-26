# Card casting continuity

Status: ready for owner feedback. Preview only. Mode: Experience.

Scope: this folder owns the source-to-board study for Freeze and Firewall. It changes no game code, art, rules or other preview.

The sample uses the existing card fixtures with four-card hands. The crowded board follows six legal moves from the normal starting board. GameRules produces each result. CardPlayback supplies the frame position. The imported Freeze and Firewall materials draw through the scene decoration layers. This study replaces the king-source travel with a local release from the selected card.

Normal timing: 125 ms of source preparation; approved board material grows at release; source light drains by 500 ms. Freeze lasts 1,600 ms. Firewall lasts 1,300 ms and stops at the cast, before the normal move. The optional narrow wisp lasts 175 ms. One slot becomes spent. Three cards remain ready. No card enters the hand.

Checks pass: legal actions and result assertions; 22 rendered frames; 390 × 844, 1440 × 768 and 1440 × 900 layouts; replay to completion; pause; keyboard buttons and timeline; normal/slow speed; flip; deterministic board and source canvas seek; reduced motion on load and change; offscreen and visibility stop handlers; no browser errors. The 390 px board, hand and controls fit the viewport. Full game tests remain with the parent.

Evidence: casting-check/verification.json and PNGs in the assigned motion-concepts output folder. The mechanical design check reports the inherited cream palette and gold text shadow. The owner requires the current warm palette and typography.

Review: the scene owns all figures and overlap. The preview owns only timing, source material and controls. Shared effects remain unchanged. The local treatment is the default; both treatments wait for owner feedback.

Limits: checked in desktop Chrome at phone and laptop sizes, not on phone hardware. Visibility is checked through the visibility event handler. Firewall uses its existing rule picture because its released card has no separate painted card art. No game integration, full test suite, commit, push or deploy.

Serve: http://127.0.0.1:5291/docs/specs/effects-animation/preview/concepts/cards/
Server: PID 94797, port 5291. Leave it running for the parent.
