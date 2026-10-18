# Choose sign-in and account continuity

Type: grilling
Status: resolved
Blocked by: 03, 05
Parent: [Web adaptation map](../map.md)
Labels: wayfinder:grilling

## Question

How does a browser player enter the same account and resume the intended game?

## Rule

The same service user ID owns the account in the browser and in ChatGPT.

## Options

1. Reuse the existing website sign-in client and providers, and use its session for the API.
2. Make a separate web game account system.
3. Make every web player pass through the ChatGPT consent flow.

Recommended: 1. Main already has website sign-in. The API verifier already separates website sessions from MCP tokens. A second identity system splits accounts.

On yes: expose a small session-token getter from the existing account client. Add a sign-in screen only where account play needs it. Keep an allowlisted return target through sign-in, so the player comes back to the join preview or the game. Cancel and failure keep local play available. Public identity uses the preset pictures, never a provider photo or email.

## Facts from research

[Prove one account across the web and ChatGPT](05-one-account.md) supplies the identity facts. If the two surfaces make separate users for one person, stop this part and record a specific account-link decision. Never link accounts by matching email alone.

## Open sub-question

Token-expiry latency: a website token can stay valid after sign-out or a ban until it expires. Is that window acceptable, or do sensitive actions read the account status each time? (Survey: SRV-20, CRIT-12.)

## Acceptance

Test sign-in success, cancel, a stale callback, an expired session, token refresh, sign-out, the deletion grace, an account switch and two tabs. A saved return cannot redirect to another site. A different account cannot inherit an earlier account's draft, screen data or pending write.

## Evidence

`src/account/account.ts`, `src/account/client.ts`, `src/api/http.ts` (`sessionVerifier`), `src/account/profile.ts`. Inventory row C02.

## Answer

Decided by delegation (owner, 2026-10-18: "regarding \"my decisions\" - please use your best judgement. i trust you to make the decisions."). Three independent reviews (security, product, smallest change) checked the draft; their changes are in. Reviews: `docs/research/web-adaptation-2026-10-18/decision-review-*.md`.

- **Option 1.** The existing website sign-in (Google, GitHub) and its session. The root and the account page share the auth storage key, so one sign-in covers both. Never link or merge accounts by email; if the live check finds two users for one test person, that gets its own decision. The review account's password sign-in stays plugin-only. Opponents see only the handle and the preset picture.
- **Session interface.** The existing account client exposes the current access token **with its user ID**, and a change event for sign-out and account switch. Each queued job, pending command and retry is bound to the user ID at its start. After each wait and token read, the client sends only if the user ID is the same; on a change it closes the old queue, clears its private state and drops late replies.
- **Return contract: one fixed callback.** Sign-in redirects to `<origin>/play/` only. Before it leaves, the tab saves a flow record in session storage: the SDK flow ID (so two tabs that sign in at once do not use the wrong PKCE verifier), the return target (a same-origin path in the account route family, with query and hash) and a creation time. On return, the page exchanges the code for that flow once, checks the target against the route patterns, consumes the record and replaces the URL. With no valid record it shows Retry and takes no game action. The invite token never goes to the auth provider inside a redirect URL. Implementation checks the flow-ID support of the pinned SDK (2.117.2); if it is absent, a stale or crossed callback gets Retry.
- **Write order on the API.** Local token checks, the shared admission slot, the current-user check (the same provider call as the MCP verifier), bounded input, the operation budget, then service work. A ban or a revoked session stops writes at verification. Reads accept a valid token until it expires; seat and visibility checks still apply. The game GET becomes read-only; seat activity becomes its own protected write.
- **Pending deletion, in the shared game service (both surfaces).** The account cannot enter a new game through Create, Find, Accept, Join, an invite renewal, or a rematch offer or acceptance. A rematch and a seat admission check both human accounts. A host whose deletion is pending (or who is suspended) drops out of the lobby, and the seat is refused at commit. Current-game play, resign, abort, decline, cancel and deletion cancellation stay available. A retry that reads a completed receipt returns that result and creates nothing.
- **Refusal messages.** Separate messages for a verified suspension, an expired or revoked session, and a temporary verification failure. A suspension date appears only from a trusted status record (a narrow server status read, never general access to Auth user rows). Every refusal screen links Support. When the cause is not known, the screen gives Retry and Support, not "sign in again".
