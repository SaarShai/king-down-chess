# Staging runtime

This copy uses the isolated Supabase project `puhspsyjyzaghmgtkzqd` and the Vercel project `kingdown-staging` (`prj_6iNibe34pA8ZSblH8DPAHyDTuz3j`). The public origin is `https://kingdown-staging.vercel.app`. A preview alias can point there. A production deploy is not needed.

## Build settings

Set these explicit public values before `npm run build:vercel`:

- `KINGDOWN_STAGE=staging`
- `VITE_KINGDOWN_STAGE=staging`
- `VITE_SUPABASE_URL=https://puhspsyjyzaghmgtkzqd.supabase.co`
- `VITE_SUPABASE_PUBLISHABLE_KEY`: the new project's publishable key

No account client is created without valid public settings. The local game can load without account settings. The old production account project is refused.

## Server settings

Set only in the staging project's **preview** environment:

- `KINGDOWN_STAGE=staging`
- `KINGDOWN_PLUGIN_ORIGIN=https://kingdown-staging.vercel.app`
- `SUPABASE_URL=https://puhspsyjyzaghmgtkzqd.supabase.co`
- `SUPABASE_PUBLISHABLE_KEY`: the staging publishable key
- `KINGDOWN_PLUGIN_DATABASE_URL`: staging PostgreSQL URL, with only `?sslmode=require`
- `KINGDOWN_INTERNAL_SECRET`: the internal job secret
- `KINGDOWN_PLUGIN_OAUTH_CLIENT_IDS`: the registered staging OAuth client IDs
- `KINGDOWN_PLUGIN_OAUTH_READY=1`: only after consent, registration, resource audience hook and discovery are ready

The database must use `db.puhspsyjyzaghmgtkzqd.supabase.co` with user `kingdown_plugin_runtime`, or a Supabase pooler with user `kingdown_plugin_runtime.puhspsyjyzaghmgtkzqd`. Administrator `postgres` connections are refused. The runtime role keeps only the existing restricted application grants. It must use database `postgres` and verified TLS. Stage checks run before provider discovery or a database connection. The Vercel function uses port 6543 for Supabase pooler hosts, even when the supplied URL uses the session port 5432. Transaction pooling releases the database connection after each transaction. The global `pg` pool remains capped at five clients and uses `attachDatabasePool` from `@vercel/functions` so idle connections can close before function suspension. Keep runtime locks transaction-scoped and avoid session state and named prepared statements. Standalone servers and database operator tools retain the supplied port; operator session locks need that distinction.

Staging opens the explicit operation list in `tools/plugin-server.mjs`. The database account switch, its five-second proof limit, website token verification, current-user provider check and per-user admission still apply. Browser sessions cannot use MCP OAuth tokens or anonymous sessions. HTTP and MCP use one player service. The local test identity hooks still require loopback, `NODE_ENV=test` and a disposable test database.

## Publish a checked preview

Run the shared required test, database and browser checks first. Build with the staging settings. The build records the public stage and project in `.vercel/output/staging.json`; the deploy guard refuses an artifact without that proof. Put the approved Vercel project metadata in `kingdown-deploy/.vercel/project.json` with the project ID above, team `team_mIlANWWDRbX1NT4jgJn9jAna` and name `kingdown-staging`.

Run `node tools/deploy-staging.mjs` to check the project and artifact without publishing. Run `node tools/deploy-staging.mjs --publish` only for the authorized preview deploy. It uses the pinned Vercel CLI, `--prebuilt` and `--target preview`. It accepts no project override or production target. Before publishing, it reads one deployment from the exact staging project and refuses an empty history. Vercel assigns a project’s first deployment to production even when the CLI receives `--target preview`. The wrapper then inspects the created deployment and requires the exact staging project, a preview target and `READY` before reporting success. It creates no bootstrap deployment and assigns no alias. Set the preview alias separately after the preview has passed its checks.

Keep the deploy JSON with the source, build and selected check receipts. It includes provider `createdAt`, `buildingAt` and `readyAt` in milliseconds since epoch; an absent value is `null`. `readyAt` comes from the provider's `ready` field, not container exit time. Record alias verification and the first successful web and host observations separately. Hosting readiness does not prove game readiness. Label local commit-to-preview measurements as checkpoint times; use merge-to-preview only with a recorded merge. Reuse accepted checks only with their source and artifact evidence. Do not rerun them to create a timing sample.

`tools/deploy.sh` is blocked in this independent staging repository. It belongs to the source project's production release flow.


## Fault reports

Five reviews test the recorder; reviews 3 and 4 find input in stack locations, and review 5 finds input in native event locations. The recorder sends and stores no code location, rejects unknown fields, and groups faults by fixed name, cleaned message, cleaned route and build. The operator reads stacks in host logs and browser tools; syntax errors with column zero and faults from open pages remain valid after an asset name change.

One counter row permits 1,000 new groups per UTC hour and keeps the last refused-group time across hour changes. The writer repeats a zero-row insert once; the report shows the limit time (with one extra minute, because the time moves at most once a minute) and states that later groups can be absent. WebKit aliases return fixed categories; the writer and fault cleanup use UTC, and each report day has 24 hours.
