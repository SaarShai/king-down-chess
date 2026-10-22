# Staging support operator

Use the existing support commands through a checked compiled artifact. This tool accepts only a disposable loopback test database or the separate staging project `puhspsyjyzaghmgtkzqd`. It rejects production. No web endpoint or new support service is added.

## Build and check

Run `npm run mod:build:staging` to produce `moderation-dist/mod.mjs`, `supabase-ca.crt` and `manifest.json`. Keep these files together. The manifest records their SHA-256 hashes. Preserve the source commit and passing receipt beside them. Building does not connect to a database or deploy the game.

Run the existing selected tests with `PLUGIN_TEST_DATABASE_URL` set to a disposable loopback database and `KINGDOWN_TEST_FILE='{tools/{mod-config,plugin-db-config}.test.ts,src/online/accounts.db.test.ts}' npm test`. No required database case may be skipped. The compiled journey checks intake, action, appeal, private notices and remote-target refusal.

## Use the checked artifact

The operator supplies `KINGDOWN_ADMIN_DATABASE_URL` through the approved private environment. Do not put it in command arguments, a ticket, chat or a log. The hosted connection must use the exact staging admin identity and `sslmode=require`; the bundled CA verifies TLS. No runtime-player connection or arbitrary remote database is accepted. Source `npm run mod` remains restricted to disposable local databases.

Start with `node moderation-dist/mod.mjs list`. This reads private support records, so do not publish its output. Use `show REPORT_ID` to inspect one case. The remaining command arguments are documented at the top of [the shared command](../tools/mod.ts). Replace all example IDs with verified values before any later authorized action.

For an actual handling rehearsal:

1. Use explicitly designated staging test accounts and a synthetic report. Verify the reporter separately from the reported player. Keep one private evidence reference; copy no passwords, sign-in codes or unrelated conversation.
2. Use `intake` to record the case and keep the returned report ID. Inspect that case with `show`.
3. Record the chosen action, facts and rule with `act`. Verify the affected account receives the staging help link and the reporter receives no private notice.
4. Use `appeal` to record the request and decision. Verify the affected account sees the outcome and the report/action identities remain linked.
5. Separately verify mailbox receipt, the owner's first-response handling and manual delivery for a player who cannot sign in. Database tests do not establish those facts.

The current preparation performs none of these hosted actions. The owner remains the handler under the approved seven-day first-response target. No email sender, public matching activation or production operator path is included.

[Implementation and checks](specs/staging-first-game/issues/32-compiled-staging-operator.md).
