# Choose the review test accounts

Type: grilling
Status: open
Blocked by: 11
Parent: [Muse connector map](../map.md)
Labels: wayfinder:grilling

## Question

The portal needs two test accounts that sign in with a username and a password. kingdown.dev signs in with Google, GitHub or an email code. How do reviewers sign in?

## Options

1. **Allow-listed password accounts** (recommended): the existing review-signup hook and `kingdown_auth.password_accounts` (plugin-deploy/review-signup-hook.sql), with `REVIEW_PASSWORD_SIGNIN` on for the consent page only. The same choice serves iOS [ticket 10](../../ios-app/issues/10-review-sign-in.md).
2. A review mailbox for the email code. Reviewers would need the mailbox password, which is the same risk with more steps.

The owner adds the accounts to the list; agents never see the passwords in chat.

## Progress

- 2026-11-08, option 1 is built on branch `muse-review-signin`:
  - The consent page shows "Sign in with email and password" only in a build that serves the Muse connector. `REVIEW_PASSWORD_SIGNIN` in `src/plugin/consent.ts` follows `KINGDOWN_MUSE`, which `tools/plugin-server-build.mjs` now also gives to the consent script. A staging build shows the form when `MUSE_CONNECTOR` is on for staging (PR 340). Production shows it when the Muse release turns the switch on. The ChatGPT tree still hides it.
  - The guard stays in the database hooks. The Before User Created hook lets in each `email` account that has an address. The access token hook refuses a password session for each address that is not in `kingdown_auth.password_accounts`, also on a refresh. `tools/plugin-db/review-signup-hook.db.test.ts` passes on the local test database (3 tests).
  - The public Auth settings of staging and production (read 2026-11-08) show Email on, Confirm email on (`mailer_autoconfirm: false`) and sign-ups on. So an account that the dashboard makes with **Auto Confirm User** can sign in with a password. The staging test account of [staging-first-game ticket 47](../../staging-first-game/issues/47-account-privacy-and-host-startup.md) already signs in with a password through the same list.
  - iOS [ticket 10](../../ios-app/issues/10-review-sign-in.md), option 1, uses the same list and hooks: its App Review account is one more address in the list.
  - Tests: the new case in `tools/plugin-server-build.test.ts` builds the consent script with and without the connector. It fails without the new build value.
- Owner steps on staging: [docs/MUSE.md, "Review accounts"](../../../MUSE.md#review-accounts). Not done yet: the two addresses in the list, the two accounts, the portal entries and the sign-in test.
