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

Five additional assertions connect the two slices in the existing support case. Independent review finds no should-fix. The combined focused run passes 194 tests in ten files, full typecheck and 54 art checks, without skips. Selection: `{src/{api/{http,http.db},online/{accounts.db,client,runtime},plugin/{http,server}}.test.ts,tools/{plugin-db-check,plugin-profile,plugin-screen-lifecycle}.test.ts}`. Log: `/tmp/kingdown-u07-integrated-source.log`. The compiled journey remains required before deployment.

## Staging preflight

Only project `puhspsyjyzaghmgtkzqd` is used. Before the grant, runtime notice ID/date reads are false and the existing payload read is true. The applied SQL grants SELECT on `id, created_at` only, to the existing `kingdown_plugin_runtime` role. The result then shows all three reads true. No game, player, notice content or production project is changed.

The parent evidence folder retains `notices-staging-grant.png`. The notice feature is not deployed yet. The current staging artifact contains temporary startup diagnostics, which are already removed from development source and must be absent from the next accepted build.
