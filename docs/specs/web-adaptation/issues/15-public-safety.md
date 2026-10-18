# Choose the public play and alert scope

Type: grilling
Status: resolved
Blocked by: 03, 10
Parent: [Web adaptation map](../map.md)
Labels: wayfinder:grilling

## Question

Which account safety controls and service limits must exist before public web matching?

## Rule

Direct web calls must not get around the protections of plugin play.

## Options

1. Keep email, push and chat off. Carry Block, Unblock, visibility, limits and support to the web. Random play goes public only with a working report path and the owner's handling process.
2. Publish the private plugin scope unchanged and add public controls later.
3. Launch alerts, chat and more social features with the adaptation.

Recommended: 1. It carries the existing safety work and does not turn dormant services into new features. This is a product release gate, not a legal conclusion.

On yes: per-account budgets apply at the shared service or HTTP boundary from the first served write route (phase 3), not only at matching. Keep the short-code attempt limit and the engine cap. Check bans and the deletion state on sensitive actions. The MCP endpoint does not protect `/api`.

Block keeps the active game and its deadlines, removes follows and stops future matching. Visibility keeps the three choices and the friends-only default. A shared move time stays visible; say so.

## Open sub-questions

- **Report control.** An in-app Report (the existing report schema and safety service), or a staffed support contact only? Random play stays off until the owner picks and staffs one. The owner's moderation command (`tools/mod.ts`) already exists (CRIT-04).
- **Account notices.** Moderation and appeal notices are stored, but no player reads them (CRIT-08). Recommended: a small actor-scoped notice read and view before public matching, or a documented support delivery path. It does not turn on mail.
- **One budget.** One per-player budget across MCP and the API, or separate budgets per surface? Recommended: one budget, so two surfaces do not double a player's limit.

## Acceptance

A blocked pair cannot Find or join each other through either client. Rapid handle checks do not fill every slot. Web computer, create and report calls meet the accepted budgets. A signed-out, banned, deleting or wrong-seat actor gets the intended refusal. Reports have an owner, a response process and a tested route. Email and reminder cron jobs stay absent.

## Answer

Decided by delegation (owner, 2026-10-18: "regarding \"my decisions\" - please use your best judgement. i trust you to make the decisions."). Three independent reviews (security, product, smallest change) checked the draft; their changes are in. Reviews: `docs/research/web-adaptation-2026-10-18/decision-review-*.md`.

- **Option 1.** Email, push and chat stay off. Block, Unblock, visibility, limits and support carry to the web.
- **One budget.** One per-player budget across both surfaces: one admission gate per server instance (4 total, 3 per account; an instance bound, not a bound across instances) and the same database counter rows. Create, Find and rematch offers and acceptance charge the create budget once per attempt on both surfaces; decline does not. The slot comes before the provider check, so verification work is bounded too.
- **Report.** No in-app Report control in the first web release (the owner's first-submission record keeps Report for a later update). Support by email is the report path, made complete: a small operator intake step in the existing moderation command turns a support case into a normal report row (target account or game, handle, category, evidence reference, note) and returns its ID; the existing act and appeal commands follow. The support procedure names the owner as the handler and a first-response target of 7 days. Add an in-app Report before any free-text or chat feature, or when support cases show the need.
- **Notices.** One shared notice service and view for players who can sign in: an actor-scoped, bounded, dated page of moderation and appeal rows, with the needed server-role column grants and a startup probe, and both an HTTP read and a plugin read. For a suspended player who cannot sign in, the owner delivers the reason and the appeal reply through support by hand. The public Support page gets real appeal steps; stored notices point there, not to the unpublished safety page.
- **Gate for public random matching on the web.** The tested support path (intake, action, notice, appeal), the notice view, the shared limits, shared service readiness and the owner's web publish go. The plugin's release date is not a gate. These items are phase 6 prerequisites, not phase 7 profile work.
