# Preview account drafts in the stored engine

Status: resolved

## Scope and plan

The page calculates account drafts with its current engine. Existing archive cases prove parity for their selected positions; no retained game is known to fail. U08 also requires a continuation path when the page and stored implementation differ.

1. Establish a failing continuity case with an existing archived worker and a deliberately divergent page calculator.
2. Add a bounded, nonpersisting draft-prefix read. Verify the actor, base revision and engine. Apply only that seat's prefix in a disposable stored-engine worker, then close it. Return public position and move data only.
3. Expose the read through private HTTP and an app-only MCP tool. Keep private data out of model-visible fields.
4. Stamp both compiled pages with the existing worker fingerprint. Keep the exact-identity local path; use server previews for other identities. Reuse draft scope and generation checks for Undo, remount and late replies.

No engine, gameplay, archive, database schema, registry, browser archive loader or deployment changes belong to this ticket.

## Verification criteria

- An archived Haste/free-continuation draft remains playable when the page calculator disagrees. First move, follow-up/pass, Undo, remount and final commit keep the stored semantics.
- Preview accepts an incomplete prefix. It does not write a save, receipt, command, outbox or activity record. Every opened worker closes on success and failure.
- Invalid actors, revisions, engines, oversized prefixes, wrong turns and extra actions after handover fail closed.
- HTTP and MCP carry only the permitted public projection. The MCP tool is app-only and puts draft details in `_meta` only.
- Late, superseded and disposed previews cannot change the current board or saved draft. Current exact-engine games keep local previews.
- Run focused `npm test` red/green after the shared check lane is free, then obtain independent review. The main task owns later compiled checks; the focused source-board test uses the existing npm test harness.

## Implementation

`previewDraft` checks the verified seat, exact game revision and stored engine identity. It accepts zero to four actions, refuses actions after handover, and closes the disposable `loadMatch` worker on success or failure. The response contains public positions and move descriptors. No save, receipt, command, outbox, profile, board selection or activity write is part of this read.

The website uses the private no-store API. The MCP tool is app-only; its fixed text contains no position, move or fingerprint, and `_meta.draft` carries the private response. Both adapters retain their existing admission bounds.

Both compiled pages receive the existing worker bundle hash from the same build helper as the runtime. The worker bytes and archive contract do not change. The source page has no inferred identity and uses the server. The synthetic board fixture explicitly declares its test identity through the harness build define; no product global or fallback exists.

The shared board uses supplied moves, positions, status and check state for mismatched drafts. It keeps the exact-identity local path. Undo uses the returned prefix positions. Remount revalidates the existing complete draft scope before requesting its prefix. Generation, account, game, revision, engine and disposal guards reject late results.

The existing readable history replay remains available only when it reaches the authoritative final FEN. An incompatible calculation returns no replay and cannot block the board. A newly accepted own turn can retain its verified server-prefix descriptions. For an automatic pass, the exact acknowledged command, the supplied pass descriptor and the authoritative final FEN supply the last description without a local move calculation. A fresh page cannot produce safe descriptions of older actions if their historical positions cannot be replayed; this existing limitation is explicit. This ticket adds no history API or blanket change to technical move notation.

## Verification and review

The regression uses the retained `bab22e94...` archive and deliberately changes only the test page calculator. No retained game is claimed to have different behavior today.

- Initial read-seam red: the archive offers Haste, the deliberately different page cannot stage it, and the preview operation is absent. Log: `/tmp/kingdown-u08-draft-preview-red.log`.
- Actual board-entry red: Home draws before navigation, so the new preview is not requested (zero calls, expected one). The fix starts a missing preview on active screen entry. Log: `/tmp/kingdown-u08-draft-preview-entry-red.log`.
- Actual accepted-history red: incompatible local replay plus an automatic pass leaves readable history empty. The narrow acknowledged-pass path restores the verified description. Log: `/tmp/kingdown-u08-draft-preview-history-red.log`.
- Final focused source: 15 files / 259 tests, typecheck and 54 art checks pass. This covers archived king/card Haste and free Freeze, prefix bounds, identity/seat/revision authority, worker closure, no writes, HTTP/MCP privacy, cancellation, existing draft behavior and build contracts. Log: `/tmp/kingdown-u08-draft-preview-final-focused.log`.
- Final source-board journey: three selected cases pass; 182 cases are skipped. It covers the archived mismatch through actual Use, piece selection, move choices, Undo, saved draft, a genuine SDK remount, exact Haste/pass commit, readable accepted history, and exact new-board FEN/draft state after a held late reply. The two existing selected Haste cases cover Undo and automatic pass. Typecheck and 54 art checks also pass. Log: `/tmp/kingdown-u08-draft-preview-ui-final.log`.

The final source selection is:

```
{src/match/{draft-preview,service}.test.ts,src/plugin/{server,http}.test.ts,src/api/http.test.ts,src/online/{client,runtime}.test.ts,src/plugin/screens/board-model.test.ts,tools/{plugin-runtime-build,plugin-server-build,dev-settings,offline-build,account-game-build,game-boundary,plugin-protocol-fixture}.test.ts}
```

The board selection is `tools/plugin-board.test.ts` with `KINGDOWN_TEST_NAME='keeps a stored-engine draft through undo|W7: undoes both Haste steps|W7: sends a mid-way Haste turn'`.

Independent read review finds the initial entry issue, then reports no remaining confirmed should-fix after the correction and final history/stale-state review. The main task owns integration and compiled checks, including one fixed archived Haste case on both surfaces. No database migration, staging write, archive publication or deployment is part of this candidate.
