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
2. Owner: decide that the ChatGPT plugin stops on production ([production runbook](../production-runbook.md), part 0). Then make the production OAuth client "Muse" (part 1), run the SQL (part 2: 0023, the resource check, the audience row, the password list) and make the two review accounts (part 2.5). Remove the old addresses from the list first ([ticket 15](15-review-accounts.md)).
3. Agent: the code change that turns `MUSE_CONNECTOR` on for production and adds a Muse branch to the plugin live check (runbook part 3). Owner: set the server value (part 4), then give the word to deploy (parts 5 and 6). Agent: the unsigned checks after the deploy (part 7, checks 1 to 6).
4. Owner: type each review account and its password in one portal test-account entry. Then run the portal sign-in test with each account, the second account included (runbook part 7, checks 7 to 9). On a fault: runbook part 8.
5. Owner: submit in the portal ("Existing MCP", `https://kingdown.dev/muse/mcp`).
6. Agent: record the portal status here. Meta does not answer status emails.
