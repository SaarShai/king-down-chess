# Compare the current production and staging builds

Status: comparison complete. Release gates remain open. Parent: U09. Type: research.

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

## Result

The full report is in the parent workspace at `docs/specs/unified-blueprint/production-comparison.md`. Evidence is in `evidence/production-comparison/` there.

- All 183 website files present in the isolated production rebuild match provider file digests. The deployment also has 113 plugin-art files outside that website-only build; those are not included in its identity claim. All five deployed production engine files match the current archives.
- The five common browser checks pass on production `cc1081b2` and staging product `b7a5c82c` (checker commit `bc246193`). Home and links retain identical scripts. The staging lesson/special-move checks add button checks; the powers check follows the accepted focus-ring style. These are preserved gameplay expectations, not identical visual assertions.
- The new paired check passes 120 opens/reloads and four continuation journeys. Cold median/p95: production 242.3/255.7 ms; staging 216.8/244.8 ms. Warm: 86.2/91.2 ms versus 85.2/100.5 ms. This is one desktop loopback batch, not hosted or native-host speed.
- Total website JavaScript gzip grows 16.3%; raw public offline payload grows 5.4%. No dependency changes. Non-test source grows 6.5%. These costs accompany the cross-host capability; no universal performance win is claimed.
- Rules definitions and move generation are unchanged. Reuse the accepted 112 compiled mechanics executions, eleven archived paths and bounded actual two-way host evidence. Do not call these 112 native ChatGPT opens or a fresh full-suite pass.
- Stronger account journeys and game/search isolation justify the new architecture. Known Try-again startup, actual second-account privacy, physical-phone/network and operator/host gates prevent promotion. The local website home also lacks a clear account-play route; this is the next independent product improvement.

The comparison changes only checker code and records. Production receives public reads and provider metadata reads only. There is no account command, database access, configuration change or deployment. All game actions run in local copies; staging games remain unchanged.

Documentation verification passes all 161 checks in thirteen files. Report links and evidence counts pass; the source diff has no whitespace errors. The final review keeps the scope explicit: neither total JavaScript bytes nor local board timing measures actual ChatGPT startup, and no test count substitutes for a missing real identity or physical device.
