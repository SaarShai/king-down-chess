# Game-owned rules and preserved turns

Status: resolved. Parent: U04 in the reconciled development blueprint.

The owner requests the next blueprint ticket and staging verification of fairy pieces, cards and king powers across the website and ChatGPT. Preserve gameplay, art, computer budgets and accepted turn order. Keep production unchanged.

Use the current integrated source `e044bf82` and product `01cbe379` as the baseline. Reuse existing engine workers, account runtime, mechanics fixtures and browser checks.

## Plan

1. Map current rule ownership and existing preservation checks. Record a representative real-host game with fairy pieces, a card and a king power.
2. Establish a differential baseline against the existing implementation. Test the smallest game-owned boundary with interleaved configurations, nested calls, exceptions, helpers and fixed-budget search.
3. Integrate the proven boundary at product callers. Keep preview nonmutating, human turns atomic and computer action budgets unchanged. Enforce the import boundary.
4. Run the relevant mechanics, state/save, worker, database and browser checks. Review independently and fix confirmed faults.
5. Publish only an isolated staging preview if product code changes. Verify actual fairy-piece, card and king-power actions across the website and ChatGPT, including saved-state continuation.

## Acceptance

- Game configuration cannot leak between two differently configured games.
- Preview and rejected complete turns do not mutate accepted state or spend uses.
- Turn progress and next actor follow engine state, including multi-action powers.
- Existing mechanics, saved state, computer budgets and action sequence agree with the baseline.
- Each of the three signature feature families has deterministic coverage and a real web–ChatGPT action/continuation record. A visible toggle alone is not feature proof.
- Product callers cannot bypass the chosen game boundary.
- Exact source, preview, checks, remaining limits and cleanup are recorded. No production operation.

## Work

[Ticket 01](issues/01-ownership-and-mechanics.md) is resolved: the differential/isolation baseline and the [real staging mechanics journey](staging-proof.md) pass. The experiment finds shared search-state contamination across incompatible rules. A private rules scope can cover helpers, but search must retain game ownership.

[Ticket 02](issues/02-owned-game-boundary.md) is resolved. Each game owns immutable rules and a search lifetime. Product callers use the private synchronous boundary, and the import guard prevents bypasses. Compiled worker checks preserve multi-action budgets, order, warm state and cancellation.

Source `be0786da` is deployed only to staging preview `dpl_Tx6SkvtZnmT7R15NumP1Srp8owM6`. The [integrated staging journey](owned-staging-proof.md) proves March, Maester swap and Morph across the website and actual ChatGPT app with matching eight-action histories. U04 is complete. U05 retains broader mechanic and interaction coverage. One unexplained ChatGPT startup error remains open despite three later clean native opens; it is not part of the ownership fix.
