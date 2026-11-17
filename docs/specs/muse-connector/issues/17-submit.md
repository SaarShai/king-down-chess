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
2. Owner: read part 0 of the [production runbook](../production-runbook.md) (the ChatGPT plugin stays on; the deploy freeze). Then make the production OAuth client "Muse" (part 1), run the SQL (part 2: 0023, the resource check, the audience row, the password list) and make the two review accounts (part 2.5). Remove the old addresses that are not in use first, but keep the OpenAI review address ([ticket 15](15-review-accounts.md)).
3. Agent: the code change that turns `MUSE_CONNECTOR` on for production (runbook part 3; PR 354 already added the Muse branch of the live check). Owner: set the server value, both client IDs (part 4), then give the word to deploy (parts 5 and 6). Agent: the unsigned checks after the deploy (part 7, checks 1 to 6).
4. Owner: type each review account and its password in one portal test-account entry. Then run the portal sign-in test with each account, the second account included (runbook part 7, checks 7 to 9). On a fault: runbook part 8.
5. Owner: submit in the portal ("Existing MCP", `https://kingdown.dev/muse/mcp`).
6. Agent: record the portal status here. Meta does not answer status emails.
