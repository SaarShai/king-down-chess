# Share the final Create slot across HTTP and MCP

Type: task
Status: resolved

## Plan and scope

Extend the existing real HTTP/MCP/PostgreSQL fixture with a signed-in actor whose shared Create counter is at 59 of 60. Race a website HTTP create and an MCP `kingdown_create`, using separate command IDs. Prove only one call succeeds and the other receives `RATE_LIMITED`, with one game created and one shared counter at 61 because refused calls retain their charge.

Both transports already call the same `PluginService.toolTry` atomic PostgreSQL upsert. This slice proves that existing contract without a product change, new counter or quota redesign. It excludes other quotas, rematches and browser behavior. U05 remains a separate gate.

## Verification

- Use the website API's real HTTP session verification and the MCP SDK client/server pair with the runtime database role.
- Seed only the dedicated actor's `kingdown_create` bucket to 59; race valid independent friend-game requests.
- Accept either winner, but require exactly one success, one rate-limited transport response, exactly one stored game matching the successful response and exactly one shared counter at 61.
- Run the focused API tests through the shared `npm test` lock after the main task gives a slot.

## Evidence

At base `61faa141ed2266b774fe8c49f6ee00cb89f68379`, the existing atomic counter satisfies the cross-transport contract. Racing two independent valid creates from the actor at 59 admits exactly one request and returns `RATE_LIMITED` from the other transport. The database contains only the successful game's ID and one `kingdown_create` counter at 61, including the refused call's charge.

`KINGDOWN_TEST_FILE='src/api/{http,http.db}.test.ts' npm test` against the disposable loopback database passes all 70 focused HTTP/API tests, typecheck and 54 artwork checks. Log: `/tmp/kingdown-u07-transport-quota.log`. No product edit, build, browser check or deployment was needed. The main task owns integration and staging/browser checks; U05 remains a separate gate.
