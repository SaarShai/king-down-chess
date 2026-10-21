# Prepare the first ranked-policy decision

Status: proposal prepared; owner decision and U09 gates remain open. Parent: U10. No ranked activation or production release.

## Plan and verification

1. Read current eligibility, configuration, assistance, time and rating behavior. Reuse the existing algorithm and tests. Separate implemented facts from product choices.
2. Propose one small ranked family that preserves fairy pieces, cards and king powers. State which settings are fixed before the draw and how existing games and ratings retain their treatment.
3. Name the decisions that require the owner's choice. Do not make them through a migration, default change or rating reset.
4. Review the proposal against actual code and U09's remaining gates. Record a concrete next implementation boundary; do not add a second ladder or speculative policy framework.

This is useful preparation while actual-device performance and operator handling remain open. No new engine or product code is required to write the decision.

## Source findings and proposal

Current finished human games update the single Glicko-2 pool regardless of configuration (`src/match/results.ts`). The existing `games.rated` column is unused by that eligibility path. Current account setup already pins the draw, rules and engine; cards permit only the five always-on powers. Human play is correspondence-only, with the existing 1/3/7-day choices. Current matching compares five switches or accepts Any rules, so it cannot provide a ranked-family boundary unchanged.

The parent `docs/specs/unified-blueprint/ranked-policy-proposal.md` records a concrete first family: random opponents, three days, the full fairy pool, the existing four-card shared deal, current always-on king choice, drawn arrangement, built-in guidance allowed, outside active-position advice prohibited and existing rating values retained. New custom/friend/rematch games are Casual under the proposal. Existing games and finished history retain their treatment.

After owner selection, the smallest implementation is one immutable policy value through creation, exact-policy matching, shared view and result eligibility. Reuse the algorithm, transaction, receipts and screens. No policy framework, second ladder, reset, new clock or host fork is proposed. Source inspection supplies these findings; no new test run or product change is claimed.

Independent read review finds no should-fix in the proposal's facts, scope or preservation rules. The combined documentation check passes 161 tests in 13 files. The owner decision remains pending; no selection is inferred from elapsed time.
