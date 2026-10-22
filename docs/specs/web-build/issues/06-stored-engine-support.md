# Prove stored-engine continuation on both surfaces

Type: task
Status: needs-info
Blocked by: 05
Starts: after ticket 18 approval and the recorded src/plugin/ handover; shared-file ownership stays with one writer
Parent: [Web build](../README.md)

## What to build

A player can identify and continue each supported stored game without changing its saved engine or rules. Every View gives its engine stamp. The common board permits local drafts and history only for proved stamps. An unsupported stamp keeps server facts and unknown receipts; a refusal alone does not close the active-game release gate.

Use the phase 2 row and common push gate in [the test gate][gate]. Keep future operations closed. The [build index](../README.md) holds the approval and source gates.

## Acceptance criteria

- [ ] [Test gate: T1/T2; engine gap and phases 3–4][gate]. Return the saved engine stamp, or null before engine start, through both transports. Test the supported-stamp gate and alias-to-base rule. Draft restore includes the stamp; unsupported drafts do not erase unknown command receipts.
- [ ] [Test gate: T1/T3; engine continuation gap][gate]. Continue each used stamp, bab22e94 and e668782a included, in the browser or a named tested supported client. Check whole turns, history/results and relevant Classic/cards/powers states. Keep server stored-engine validation. Assess the bounded server preview only if evidence requires it; add no browser archive loader.
- [ ] [Test gate: T5; engine gap and release stops][gate]. Extend the existing report/checks for release and recovery runtime folders, full stamps, zero missing engines, save/column agreement and both game-table coverage where needed. Keep alias/base byte comparison and save fixtures. Do not rewrite stamps or remove review games. The release login reads only `games (engine_fingerprint, status)` by design, so a report that reads `games.state` or `plugin_matches` directly stops with SQLSTATE 42501 (PR 71, 2026-10-20). Read the save-level counts through one SECURITY DEFINER function, and keep the login's direct rights as they are. The function: fixed queries on fully qualified tables; `SET search_path = pg_catalog, pg_temp`; `STABLE`; one snapshot; owned by a dedicated non-login role with only the needed reads and an all-row SELECT policy (a hidden row must not give a false zero); created, revoked from `PUBLIC`, `anon` and `authenticated`, and granted to the release login in one transaction. It returns only counts and validated full stamps, from the save and the column: unfinished, empty waiting/setup (state and column both null), initialized, missing or malformed save, malformed stamp, agreement and disagreement (null-safe), for `games` and for `plugin_matches` while that table exists. Malformed JSON gives a count, never its text; no game id, account id or save leaves the database. The checker calls it, fails on a missing function, a denied call or any nonzero bad count, and keeps the runtime folder, bundle hashes and alias checks. Tests run as the narrow login: the call succeeds while direct `games.state` and `plugin_matches` reads still fail; cover both tables, disagreement, empty setup, malformed data, zero rows, row-policy coverage and hostile temporary objects. The owner applies the reviewed migration. This report is a prerequisite of any publish that changes engine, archive or server write code (ticket 04's protected write included), whatever the ticket order. The stricter report of `f24dee47:tools/engines-check.mjs` and its tests is the reference for the counts.
- [ ] [Test gate: T1/T5; compatible recovery proof][gate]. Check the exact production migration list, in order, on the test database. Recovery reads and continues representative post-slice games with all used archives and aliases.
- [ ] [Test gate: T5; engine/release gap][gate]. Guard the existing release/operator paths against live writes through tsx. Any compiled game creator needs its stamped archive/fixture before live use. Use only isolated test services here; this ticket gives no rule-change or live-write authority.
- [ ] [Test gate: common push gate and evidence record][gate]. Record the exact source/tree, commands, exits, counts, skips (no required skip), affected selectors and device evidence. An independent reader checks this diff; fix each confirmed fault. Obtain the owner's merge word for its exact scope.
- [ ] [Test gate: scoped phase and release stops][gate]. This preparation has no publish of its own. Its later carrier publish needs the [source checks](../README.md#owner-and-branch-gates) and a reviewed [release packet][route], the owner's separate publish go and the applicable live probes. The merge word alone gives no publish or database-write go.

## Notes

- [Adaptation answer 07](../../web-adaptation/issues/07-engine-compatibility.md).
- [Adaptation answer 11](../../web-adaptation/issues/11-save-ownership.md).
- [Adaptation answer 17](../../web-adaptation/issues/17-release-route.md).
- [Spec](../../web-adaptation/spec.md), [test gate][gate] and [release route][route].
- The five parked branches stay [later work](../../shared-screens-later/README.md). Use a codex/web-* branch from the accepted main base. Keep one writer for shared files.

[gate]: ../../web-adaptation/test-gate.md
[route]: ../../web-adaptation/release-route.md
