# Compare the current production and staging builds

Status: in progress. Parent: U09. Type: research.

The owner asks for a proper comparison with current production, reuse of existing evidence, an honest scorecard and prioritized fixes. Production must stay untouched.

## Plan and acceptance

1. Identify the current production deployments and public asset hashes. Pin the staging candidate and distinguish reported source ancestry from verified artifact identity.
2. Map shared and changed features, architecture and operational behavior. Reuse exact-source mechanics, recovery and host evidence. Do not credit inherited features as new work.
3. Run comparable checks against isolated artifacts where practical: public/local journeys, startup and assets, deterministic mechanics, resource lifetime and relevant account journeys. Use public read-only production requests only; no production player commands, authentication changes, data writes or deployments.
4. Record better, equivalent, worse, intentional difference and unverified outcomes. Separate direct measurements, source findings and prior evidence. Identify benchmark conditions and limits.
5. Deliver a scorecard with prioritized fixes, release blockers and a clear promotion recommendation. Link evidence and update the reconciled blueprint checkpoint. No feature work or deployment belongs to this comparison.

## Verification criteria

- Both build identities are explicit; a stale handoff is not the production baseline.
- Equivalent checks use the same device, browser, workload and cache conditions. No broad speed claim from unlike metrics.
- Every claim has a source/artifact/check reference. Missing proof stays unverified.
- Existing production games, accounts, settings and deployment aliases are unchanged.

## Comparison method

Production deployment `dpl_7v1QcQTHnNTjDP2xpCP5fjNy1Wdm` still matches the latest handoff's `cc1081b2`. An isolated rebuild matches the current live HTML, worker and seven startup JavaScript/CSS files byte for byte. Staging serves `b7a5c82c` on `dpl_BUXmzAAJXU6R7ZU79csxwYGMCmCk`.

The named `production-comparison` browser check accepts two saved static artifact folders. It uses the same loopback server, gzip, browser, saved position and cache rules for each. Thirty cold/warm pairs per build alternate order. It blocks service workers and denies remote connections with CSP; warm means HTTP cache only. It records a two-frame board-ready proxy, raw resource rows, static bytes and mobile/desktop saved-game continuation. These measures cannot establish hosted, account, ChatGPT or physical-phone speed. The existing Home, lesson-return, powers, special-moves and link checks supply the broader common journey comparison. Any changed assertions are disclosed.
