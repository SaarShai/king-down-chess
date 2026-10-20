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

The database must use `db.puhspsyjyzaghmgtkzqd.supabase.co` with user `postgres`, or a Supabase pooler with user `postgres.puhspsyjyzaghmgtkzqd`. It must use database `postgres` and verified TLS. Stage checks run before provider discovery or a database connection.

Staging opens the explicit operation list in `tools/plugin-server.mjs`. The database account switch, its five-second proof limit, website token verification, current-user provider check and per-user admission still apply. Browser sessions cannot use MCP OAuth tokens or anonymous sessions. HTTP and MCP use one player service. The local test identity hooks still require loopback, `NODE_ENV=test` and a disposable test database.

## Publish a checked preview

Run the shared required test, database and browser checks first. Build with the staging settings. The build records the public stage and project in `.vercel/output/staging.json`; the deploy guard refuses an artifact without that proof. Put the approved Vercel project metadata in `kingdown-deploy/.vercel/project.json` with the project ID above, team `team_mIlANWWDRbX1NT4jgJn9jAna` and name `kingdown-staging`.

Run `node tools/deploy-staging.mjs` to check the project and artifact without publishing. Run `node tools/deploy-staging.mjs --publish` only for the authorized preview deploy. It uses the pinned Vercel CLI, `--prebuilt` and `--target preview`. It accepts no project override or production target. Set the preview alias separately after the preview has passed its checks.

`tools/deploy.sh` is blocked in this independent staging repository. It belongs to the source project's production release flow.
