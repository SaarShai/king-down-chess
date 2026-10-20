# Web account access: operator procedure

Saar is the operator until he names another person. This procedure uses the approved privileged
Supabase SQL Editor path. Each live migration, grant, close or reopen needs the owner's specific
database-write go. A spec, merge or publish approval alone does not give that go. Do not use a
browser player role, the runtime login, a `tsx` script or a public management route.

The switch controls web account service access. It does not control local files, MCP, consent,
public art or internal jobs. Assess a shared service fault under the
[release route](../web-adaptation/release-route.md). The page and direct API closure checks below
remain release gates until the later slices supply their wiring and proof.

## Prepare the schema before account exposure

1. Record the target project, database, operator, owner's exact go, source commit and deploy ID.
2. Check which migrations and runtime-role blocks are present. Record the exact applied and
   missing numbers. Stop if the order or target is uncertain.
3. Apply only missing migrations in order. The web change is
   `supabase/migrations/0016_web_account_access.sql`, after 0001–0015.
4. Apply required missing grants in order. Apply block 12 of `plugin-deploy/runtime-role.sql`
   after 0016 and the existing runtime blocks 1–11. Do not rerun the role-creation block against
   an existing role. The guarded release paste includes email removal at 0015; it stops before
   the web account migration.
5. Confirm one row, `singleton = true`, and the expected value. The new switch stays off.
   A repeat preserves an existing value; it does not turn an existing open switch off.
6. Check RLS and effective grants: the runtime has SELECT and a SELECT policy only. It has no
   INSERT, UPDATE or DELETE. PUBLIC, `anon` and `authenticated` have no direct read or write.
   Record the result of the web-only read probe as the runtime role. Missing web schema or a
   missing grant closes web access; it must not stop the plugin's start check.

Use a separate database-write go for this exact list. Apply nothing live from a test or build.

## Close account access

Run this transaction in the approved SQL Editor:

```sql
begin;
update public.web_account_access set enabled = false
where singleton = true returning enabled;
commit;
select enabled, clock_timestamp() as checked_at
from public.web_account_access where singleton = true;
```

Require exactly one returned row from the update and the final read, both with `enabled = false`.
If either has zero rows or an unexpected result, stop the procedure and account exposure. Do not
insert or upsert a row to hide the fault. Record the commit time and the final SQL probe time.

Probe `GET /api/status` and a phase-enabled protected API path on the exact deployed source.
Status must report `{"account_access":"closed","valid_for_ms":0}`. The protected path must return
503, JSON code `UNAVAILABLE`, `Retry-After: 5` and `Cache-Control: no-store`. A phase-disabled
operation stays 404; that response alone does not prove the switch. Record route, status and time
only. Do not print session tokens or private payloads.

Check the actual account page too: retry, poll and background paths make no new private call
after the checked status lease closes. Check that `/`, local saves, lessons, Workshop and public
offline assets still work. Ticket 07 supplies this page proof. Status tests alone do not supply it.

The designed bound is five seconds after commit for new service admission in each instance.
An unexpired prior proof can admit work during that interval. A cold instance reads the off
value. Each proof expires five seconds after its database query starts; a late result or a query
error cannot renew an open proof. Recheck the proof after a wait before service work starts.
A request that starts service work before closure can finish. Do not undo its committed work.

## Reopen account access

First pass the compatible-fix or recovery checks and the authorization checks in the release
route. Obtain the owner's specific reopen and database-write word for the exact target. Run the
same one-row procedure with `enabled = true`. Require one true row from both the update and
the final read. Confirm the status lease, protected routes and account page on the approved
source. A prior merge or publish word does not authorize this SQL write.

## Evidence for the release packet

| Field | Required record |
|---|---|
| Authority and target | Operator, exact owner words/date, database/project, source commit, deploy ID |
| Schema | Applied/missing migration numbers and runtime blocks, RLS, effective grants, runtime web read probe |
| Close | SQL commit time and final probe time; one false row from each statement |
| Service bound | Two independently primed instances; last allowed admission and first refused call; observed duration for each |
| API and page | Exact status and protected paths/times; page private-request counts after closure; no private data |
| Local recovery | Local game/save, lesson, Workshop and public offline results |
| Reopen | Separate authority, compatible source/checks, one true row and status/API/page results |

No live bound or operator drill is measured by this document. The source cache tests and the
ordered disposable-database test prove the store and getter only. Later slices supply the
HTTP, compiled-output and page evidence before account exposure.
