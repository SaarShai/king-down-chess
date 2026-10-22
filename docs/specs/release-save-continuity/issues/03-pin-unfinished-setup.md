# Pin unfinished account setup

Status: resolved

## Scope and plan

Pin the existing engine archive and a finite setup admission contract when an account game draws its army and hand. Keep the unfinished position private. Finish setup in a fresh worker from that archive. Do not infer a baseline for unstamped pending games or add a version registry.

1. Store the engine pin and allowed setup choices at creation. Reuse explicit draws, deals and seat defaults.
2. Validate later choices and build the final explicit setup from the stored contract. Create the final position in the pinned worker.
3. Include pending pins in the archive inventory. Prove continuation across two engine identities and fail closed for unknown pending state.

## Verification criteria

- Focused setup, match and archive-inventory checks pass through `npm test` after the shared test lane is free.
- A deterministic N/N+1 case partly prepares on N, forbids current-engine creation after the cutover, finishes setup, retries an accepted request, plays and reloads on N.
- Existing admission, hidden choices, cards/powers restrictions, arrangement rules and explicit defaults stay unchanged.
- Staging preflight reports zero unstamped pending games and four initialized games. This is evidence for staging only; no guessed backfill is permitted.
- Independent review precedes integration. No browser, build, deploy or legacy-save changes belong to this slice.

## Implementation and review

The draw stores `setup_admission` and the existing worker fingerprint. A short-lived worker resolves the explicit default setup, but its provisional rules and position are not projected or stored as play state. Final Ready creates a fresh worker from that archive. Without an archive, the current worker is accepted only when its exported fingerprint equals the pin exactly. Initialized games keep their existing state.

The preparation validator, remembered king, swaps, shuffle and king sheet read the stored finite contract. The shape decoder accepts bounded stable identifiers; the game contract makes the admission decision. New game settings still validate against the current released list. The public admission roster does not reveal a seat's selected choice.

Independent read review found that a custom Zod validator cannot emit MCP JSON Schema. The fix uses bounded string regex schemas with type-only annotations and adds a JSON Schema assertion. The review also required retained king IDs in the picker and both waiting and one-seat-ready cutover cases. These changes are present. The reviewer reports no remaining confirmed should-fix; focused checks pass.

## Verification

`npm test` passes with `PLUGIN_TEST_DATABASE_URL` set to the approved disposable loopback database and this focused include:

```
{src/match/{setup,setup.db,match,service,service.db}.test.ts,src/plugin/screens/{seat-model,setup-model}.test.ts,src/plugin/{server,server.db}.test.ts,src/api/http.db.test.ts,tools/{engines.test.ts,plugin-db/{release-order.docs,migrations.db}.test.ts}}
```

Result: typecheck, 13 files / 387 tests, and 54 art checks pass. Log: `/tmp/kingdown-u08-setup-pin-focused.log`. Both cutover cases use an existing archived worker, a seeded army, compatible no-card Haste, a reversed committed arrangement, a distinct current worker identity and forbidden current creation after N. They compare final rules, legal moves and future state to the archived worker and verify save/reload and same-ID retry. Missing pins/contracts fail closed; an accepted receipt still returns before new-command eligibility.

No engine, worker or archive bytes change. No browser/build/deploy runs in this slice. Root owns compiled release/rollback proof and integration.

## Compiled integration correction

The reviewed candidate is applied without conflict to accepted `0ace4ecb` as `b0ae3fe1`. Its first isolated `plugin-ui-http` run reaches the setup mixes, then fails at `tools/plugin-ui-check.mjs:942`: the cards-on Mud picker has no disabled Leap button. The stored contract correctly rejects Leap, but the displayed group incorrectly omits the existing unavailable choice and its explanation.

Keep all current displayed powers plus any admitted historical pairs. Continue to derive enabled choices only from the stored contract. This restores the existing disabled choice without broadening admission. Run focused preparation checks, then the same compiled journey on its dedicated disposable database. The first red run is `u08-setup-pin-compiled-agnH9C`, 110.3 seconds; the corrected compiled journey passes below.

Focused preparation verification passes: typecheck, three files / 21 tests, and 54 art checks. Log: `/tmp/kingdown-u08-picker-source.log`.

The corrected compiled `plugin-ui-http` run passes on clean `7f516cfa` in 247.9 seconds, including its final page-error gate. Run: `u08-setup-pin-compiled-6qwJEo`; log: `/tmp/kingdown-u08-setup-pin-compiled-green.log`. It covers actual HTTP/MCP/PostgreSQL setup, king picker, new game, both hidden seats, swaps, Ready lock/retry, remounts and the full shared UI journey. The database is a separate disposable `setuppincompiled` suffix copy. The shared disposable schema and staging database are untouched.

Independent root review confirms that the display union does not broaden admission. It finds one copy error: a restricted no-cards contract still describes every unavailable power as barred by cards. A new source/SDK UI case supplies a restricted authoritative contract and proves the disabled Holy Light option incorrectly says it has uses. This gives a targeted red (13 passed / 1 failed), then green after neutral unavailable-in-this-game copy. The cards explanation remains only for cards-on spendable powers. King tooltips now read the same displayed union, including retained pairs.

Focused follow-up passes typecheck, four files / 35 tests and 54 art checks. Logs: `/tmp/kingdown-u08-picker-copy-red.log` and `/tmp/kingdown-u08-picker-copy-green.log`. Per the root task, no full compiled journey repeats for this copy/title change. No production authorization or U05 closure is claimed.
