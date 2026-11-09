# Approve and submit the connector

Type: task
Status: open
Blocked by: 10, 16
Parent: [Muse connector map](../map.md)
Labels: wayfinder:task

## Question

Is the connector ready for Meta's review?

## Steps

1. Owner: approve the tool set, the wording and the packet.
2. Owner: make the two review accounts on production and put them in the list, with steps 1 to 3 of [docs/MUSE.md, "Review accounts"](../../../MUSE.md#review-accounts). Remove the old addresses from the list first ([ticket 15](15-review-accounts.md)).
3. Owner: give the word to deploy to kingdown.dev with `MUSE_CONNECTOR` on, after the production OAuth client and hook row exist.
4. Owner: type each review account and its password in one portal test-account entry (MUSE.md step 4). Then run the portal sign-in test with each account, the second account included (MUSE.md step 5).
5. Owner: submit in the portal ("Existing MCP", `https://kingdown.dev/muse/mcp`).
6. Agent: record the portal status here. Meta does not answer status emails.
