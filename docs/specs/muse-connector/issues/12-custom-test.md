# Test with a Muse custom connector

Type: task
Status: open
Blocked by: 11
Parent: [Muse connector map](../map.md)
Labels: wayfinder:task

## Question

How does Muse really call and show the connector?

## Steps

1. Owner: in Muse, add a custom connector with the staging URL (Settings > Connectors, or ask Muse to "connect a custom connector"). Muse keeps its credentials; Meta does not review it.
2. Agent and owner: play a game by text and by voice mode. Record: the MCP era in the server log (`initialize` or the 2026-07-28 envelope), the time of each call, how the text shows (does the letter grid stay monospace? do links show?), how approval prompts show, and whether a refreshed token arrives after an hour.
3. Agent: turn each finding into a fix ticket or a spec change.

## Done when

The capability matrix in [spec.md](../spec.md) has a tested, unsupported or unverified mark for each row.
