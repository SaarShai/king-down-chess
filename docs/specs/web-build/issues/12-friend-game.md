# Finish a friend game across the two surfaces

Type: task
Status: needs-info
Blocked by: 11
Starts: after ticket 18 approval
Parent: [Web build](../README.md)

## What to build

A player creates a friend game and shares the full invite. The other player previews a fragment link or code, signs in, chooses a public identity and selects Join. A browser seat and a plugin seat finish one game and can rematch. Block, deadlines and the accepted end actions are usable before this path opens.

Use the phase 5 row and common push gate in [the test gate][gate]. Keep future operations closed. The [build index](../README.md) holds the approval and source gates.

## Acceptance criteria

- [ ] [Test gate: T1/T3/T5; phase 5][gate]. Use fragment invites and codes, with explicit Join and a 404 for path-token links. A preview for an actor who already holds the seat returns its game ID. Join replaces the URL; a creator reload offers explicit Make a new invite, never rotation on read.
- [ ] [Test gate: T3; phase 5][gate]. Check Share cancel, Copy failure/manual selection, rule/expiry text, expired or taken codes, reload and a lost reply. Check invite/sign-in redaction in logs, provider requests and Referer, including redaction of a probed path-token form.
- [ ] [Test gate: T1/T3; phase 5][gate]. Check preset identity, latest handle availability, a seat race and both-way Block. Prove that pending deletion/suspension blocks new admission and rematches and that rematch offers/acceptance share the create budget.
- [ ] [Test gate: T1/T3; phase 5][gate]. Finish a real HTTP/MCP game with whole turns, deadlines, draw offer/accept/decline, abort, resign, claim and swapped-colour human rematch. Count one result, rating and badge effect across retries.
- [ ] [Test gate: T3/T4; phase 5][gate]. Run affected link-game, their-turn, end and account. Record native Share/Copy and the exact-candidate phone/cross-surface journey; old local game links still open the local app.
- [ ] [Test gate: T5; compatible recovery proof][gate]. Continue both seats and waiting/setup states on the named recovery output; preserve archives, receipts and committed results.
- [ ] [Test gate: common push gate and evidence record][gate]. Record the exact source/tree, commands, exits, counts, skips (no required skip), affected selectors and device evidence. An independent reader checks this diff; fix each confirmed fault. Obtain the owner's merge word for its exact scope.
- [ ] [Test gate: applicable phase and release stops][gate]. Name the current live source (from the last deploy record) and repeat the [source checks](../README.md#owner-and-branch-gates). Prepare and review the [release packet][route], including the compatible recovery source/output. Obtain a separate owner publish go for this exact main source and public scope. Use the one deploy path; record the post-publish probes and applicable job outcomes before closure.

## Notes

- [Adaptation answer 03](../../web-adaptation/issues/03-http-contract.md).
- [Adaptation answer 05](../../web-adaptation/issues/05-one-account.md).
- [Adaptation answer 10](../../web-adaptation/issues/10-account-entry.md).
- [Adaptation answer 12](../../web-adaptation/issues/12-scope-picks.md).
- [Adaptation answer 13](../../web-adaptation/issues/13-routes.md).
- [Adaptation answer 15](../../web-adaptation/issues/15-public-safety.md).
- [Adaptation answer 16](../../web-adaptation/issues/16-test-gate.md).
- [Adaptation answer 17](../../web-adaptation/issues/17-release-route.md).
- [Spec](../../web-adaptation/spec.md), [test gate][gate] and [release route][route].
- The five parked branches stay [later work](../../shared-screens-later/README.md). Use a codex/web-* branch from the accepted main base. Keep one writer for shared files.

[gate]: ../../web-adaptation/test-gate.md
[route]: ../../web-adaptation/release-route.md
