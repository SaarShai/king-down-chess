# Choose save and settings ownership

Type: grilling
Status: resolved
Blocked by: 09, 10
Parent: [Web adaptation map](../map.md)
Labels: wayfinder:grilling

## Question

Which store owns local games, account games, unsent turns, pending writes and settings?

## Rule

A value has one authority, and a network retry never becomes a second user action.

## Options

1. Keep the local save and sync as they are. The server owns account games and account settings. Per-tab drafts and receipts go into browser session storage.
2. Replace the local save with the account game store.
3. Put all local and account state in the existing cloud-save row.

Recommended: 1. It keeps the offline product and the server's revision checks. Session storage survives a reload and separates tabs with no new lock service. Closing a tab can discard an unsent draft; a sent game still resumes from the server. The UI states this limit before release.

On yes: key account state by user ID, full game ID and the turn base (position and rules). Save the unchanged pending command ID and input before send. On reload, read the account and the game before a retry or a draft restore. Reject a stored shape that is not valid. Clear private session state on sign-out or an account change. Never store access tokens in the draft.

## Ownership table

| Value | Authority |
|---|---|
| Local game, lessons, local preferences | Existing local save and section sync |
| Account position, result, rating, badge, seat, deadline | Game service |
| Account handle, preset picture, visibility, block list | Account service |
| Account symbols, threats, last setup | Existing player-settings service |
| Unsent account turn and pending command | Current tab, scoped to the signed-in account |
| Sound and local device choices | Existing device preference; no new account write |

## Open sub-questions

- Do local and account settings with the same meaning (symbols only, threats) share one value later? Recommended: keep them apart at first; a later shared value needs its own ownership choice, not two writers. (Survey: DEC-19, CRIT-23.)
- Do the profile totals and badges count server games only? Recommended: yes; local wins stay local and are not counted backwards. (Survey: DEC-17, DEC-30.)

## Acceptance

Reload restores a legal draft for the same turn. A draw offer does not erase it when the turn base stays the same. A changed turn discards it with a clear message. Denied storage allows play but states that reload recovery is off. A stale reply, another tab or cloud sync cannot overwrite the shown account game. A new visit loads the server list before it offers a pending start as a new game.

## Answer

Decided by delegation (owner, 2026-10-18: "regarding \"my decisions\" - please use your best judgement. i trust you to make the decisions."). Three independent reviews (security, product, smallest change) checked the draft; their changes are in. Reviews: `docs/research/web-adaptation-2026-10-18/decision-review-*.md`.

- **Option 1.** The local save and its sync stay as they are. The server owns account games and account settings. Per-tab drafts and pending commands go into session storage. All requirements above (unchanged pending input, a fresh account and game read before recovery, shape checks, private-state removal) are part of the decision.
- **Keys.** The draft key holds the user ID, the full game ID, the turn base (position and rules) and the View's engine stamp. An unsupported engine stamp keeps no local draft, but it never erases a pending command receipt whose result is still unknown. Receipts and drafts stay separate records.
- **Copied tabs.** A new tab can start with a copy of another tab's session storage. It reconciles a copied pending command with the server under its original ID and never makes a new ID only because the tab is new. Each tab also handles the shared auth account-change event, because one tab's change does not clear another tab's session storage.
- **Settings.** Local and account settings with the same meaning (symbols only, threats) stay separate at first; a later shared value gets its own ownership decision.
- **Records.** Profile totals and badges count server games only. Local wins are not counted backwards.
