# Sky Lift: select either piece first

Status: done
Type: task

Owner request: fix the confirmed Sky Lift highlight issue on staging and verify it with the test accounts. Keep the playtest going.

## Plan and acceptance

1. Trace canonical swap choices through board selection, source marks, target marks and held confirmation.
2. Present each legal symmetric card swap from either piece while keeping the canonical server action unchanged. Preserve directional swaps and all legality constraints.
3. Test both selection orders, held confirmation, preview choices and excluded moves. Run a compiled board browser check.
4. Deploy only to staging after checks. Coordinate fresh saved-account desktop and phone checks after active players stop. Verify source/target hints, second-tap stage, Undo/Cancel and unchanged saved game. Preserve prior verified fixes and production.

## Root cause

The account board uses only the canonical move.from for sources and selection. Sky Lift legal moves enumerate each pair once. Reversed source selection must orient the UI choice, not add engine moves or change the submitted LAN.

## Implementation and checks

Both ends of a symmetric Sky Lift pair feed source marks, target marks, choices and held confirmation. The UI orients a copy and keeps the canonical LAN. The armed-card filter matches that LAN, not object identity. Directional swaps stay directional. No engine/server rule changes.

88 selected board-model/card tests and54 artwork checks pass with npm test. The compiled plugin-skylift HTTP check passes at393px touch and1280px mouse, both source orders, choices, held second tap, Undo and one canonical Send. The coordinator views the captured marks in both orders. Full plugin-ui stops before this test in an unrelated Android stale-view sample; no full-suite pass is claimed. Dedicated check uses disposable loopback identities and removes them.

Coordinator review checks canonical identity, preview refresh, legality exclusions, unchanged directional moves and scope. No remaining should-fix found. Staging release and saved-account verification pass.

## Staging acceptance

Sourcefcde7a5e deploys as previewdpl_9vytQ3oVhbCEJaakiAW468cyUmJn. Only the staging alias changes. Artifact checks and live byte checks pass; server/runtime/archive hashes remain unchanged.

Saved desktop account: Guard g8 and Beast b6 mark each other in both selection orders. Both orders hold, then stage one canonical swap. Undo and reload restore53 turns/rows and the unspent card.

Saved phone account: real touch on Guard d8 and Archer h7 marks the partner in both orders. Both orders hold, stage and Undo. Reload preserves71 turns/rows and the unspent card. A normal opponent reply to check precedes this test; no card action is sent.

All owned browsers stop and return to the playtest. Full evidence: ../../../../../playtest/reports/f007-fix/verification.md. Production unchanged.
