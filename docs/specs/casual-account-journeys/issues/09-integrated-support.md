# Verify the combined support and account notice path

Type: integration task
Status: claimed
Parent: U07

## Plan and acceptance

1. Reuse reviewed support intake and private notices. Preserve all tests when their insertion points overlap.
2. Prove intake → operator decision → the affected player's notice → appeal outcome. The reporter must receive no private notice; support evidence must stay private.
3. Run the combined affected source checks and the existing compiled account journey. Keep U05's startup gate open until its separate repair and actual host checks pass.
4. Apply only the required notice ID/date read grant to the isolated staging role. Verify the existing payload read remains available.
5. After the checked build reaches staging, inspect the shared Profile and its Support navigation on both surfaces. Do not send email or claim operator mailbox handling from a source test.

## Integrated source

`2e050d79` reuses support intake candidate `b2aba8d4`. `35f5fd14` reuses notice candidate `f496c265`. The database test conflict is an adjacent insertion: both support cases and both notice cases remain. The client test keeps both the worker EventTarget double and the notice cursor mock.

Five additional assertions connect the two slices in the existing support case. Independent review finds no should-fix. The combined focused run passes 194 tests in ten files, full typecheck and 54 art checks, without skips. Selection: `{src/{api/{http,http.db},online/{accounts.db,client,runtime},plugin/{http,server}}.test.ts,tools/{plugin-db-check,plugin-profile,plugin-screen-lifecycle}.test.ts}`. Log: `/tmp/kingdown-u07-integrated-source.log`. The combined compiled run `app-g1E47d` on `2c94fa03` passes `web-online` (106.5 seconds) and `plugin-ui-http` (244.9 seconds), including the final browser-error gates. A fixed staging-help URL correction follows before publication; it requires the existing link regression in both environments.

## Staging preflight

Only project `puhspsyjyzaghmgtkzqd` is used. Before the grant, runtime notice ID/date reads are false and the existing payload read is true. The applied SQL grants SELECT on `id, created_at` only, to the existing `kingdown_plugin_runtime` role. The result then shows all three reads true. No game, player, notice content or production project is changed.

The parent evidence folder retains `notices-staging-grant.png`. The notice feature first deployed in `ce61e8d7` to the isolated staging preview. The website Profile loads the existing games and “No account notices” successfully. The artifact contains no temporary startup trace. The later accepted `d92991cb` release also passes actual fresh native ChatGPT Profile inspection: nine active games, rating and record, badges, blocked-player summary and “No account notices” render successfully. Evidence: the parent `evidence/staging-shared-mechanics/chatgpt-cdac-profile.png` and `live-cdac-presentation-release.json`. This closes the native empty-notice display gate; actual operator mailbox and appeal handling remain unverified.

## Staging help link

The shared Profile initially points to the production help page, while its new appeal instructions exist only in staging. The existing Profile test under `VITE_KINGDOWN_STAGE=staging` reproduces the wrong URL (one failure; 25 unrelated cases filtered). One module constant now selects the fixed approved URL from the existing build-stage setting and supplies the anchor, SDK request and refusal message. No new host configuration is added.

The same case passes under staging and the default environment, including keyboard activation and refused-link text. Each focused run passes one case, full typecheck and 54 art checks; 25 unrelated cases remain filtered. Logs: `/tmp/kingdown-u07-stage-link-{red,green}.log` and `/tmp/kingdown-u07-default-link-green.log`. The prior full compiled journey remains applicable to unchanged Profile rendering and navigation. The staged artifact must contain the staging URL in both clients.

## Compiled operator preparation

[Ticket 32](../../staging-first-game/issues/32-compiled-staging-operator.md) supplies a standalone staging-only build of the existing commands. Both source and compiled support journeys pass against disposable PostgreSQL; production/override refusal, private notices and the staging appeal link pass. The artifact and hashes are preserved with the parent evidence. This closes the compiled-path preparation gap. Actual mailbox and owner handling remain open; no hosted moderation action or email occurs.
