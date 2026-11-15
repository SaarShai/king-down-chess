# Confirm a completed account deletion by email

Status: ready-for-human
Type: task

## Why

A deletion request starts a seven-day grace; the daily job deletes the account later. Apple's
account deletion page asks the app to say how long the deletion takes and to confirm it when it
is complete (guideline 5.1.1(v); https://developer.apple.com/support/offering-account-deletion-in-your-app/).
The receipt in the app gives the date. Before this change, nothing confirmed the completion: the
server had no mail path (migration 0015 removed the old email reader; the deploy tool refused the
mail settings).

Rejected: an immediate deletion (it removes the grace that the owner chose, changes the policy
texts and still waits under a report hold); an in-app notice (the person can delete the app, and a
signed-out device cannot ask for the state without a new public route).

## Implementation

- `supabase/migrations/0026_deletion_notice.sql`: `kingdown_jobs.deletion_email(uuid)`, security
  definer. It gives the address only for a due deletion (grace over, not cancelled, not done, no
  report hold), on the database clock. Block 15 of `plugin-deploy/runtime-role.sql` grants it to the
  runtime role. Browser roles get nothing.
- `src/online/mail.ts`: the Resend sender over fetch (the house sender of the removed alert emails)
  and the one message.
- `src/online/jobs.ts`, `runDeletions(games, send?, deadline?)`: with a sender, read the address
  before `delete_account`; after all the deletions, send one email for each deleted account, with the
  idempotency key `kingdown-deletion-<user id>`, one at a time, until the deadline. The daily request
  gives the job 25 s (`DAILY_BUDGET_MS`; the function stops at 30 s): a slow mail service cannot hold
  back a deletion, and at the deadline the job stops the send in progress and logs how many emails did
  not go. A failed read or send logs the fault (no address) and never stops or undoes a deletion.
  With no sender, the job does not call the helper, so a deploy before 0026 keeps working.
- `src/api/http.ts`, `tools/plugin-server.mjs`: the daily job gets the sender when
  `RESEND_API_KEY` and `KINGDOWN_MAIL_FROM` are both set.
- `tools/deploy-plugin-env.mjs`: accept both mail settings or neither; the key starts `re_`; the
  sender is `King Down <name@kingdown.dev>`.
- The privacy and delete-data pages (default and launch copies) say that one email confirms the
  deletion and that Resend sends it.

## Release order

1. Apply 0026 on production before you set the mail settings.
2. Set `RESEND_API_KEY` and `KINGDOWN_MAIL_FROM` in project `kingdown` (Production) before the deploy that carries this change. With the owner's word.
   The key is a Resend key with sending access for `kingdown.dev` (the domain is verified for the
   sign-in codes); the sender is `King Down <hello@kingdown.dev>`. Until this change is on main, the
   deploy tool on main refuses these values: use the Vercel dashboard (Sensitive), or
   `tools/deploy.sh --configure <private-env-file>` from this branch.
3. Deploy after you set them: a deployment keeps the values that it was made with, so a value set later reaches only the next deployment. If the server is already deployed, deploy it again.
4. Check with a disposable account: request deletion, let the grace pass, see the email.

`tools/deploy.sh --configure` sets the values and deploys nothing. The pages and the in-app receipt
say that the email goes, so steps 1 and 2 come before the deploy that publishes them.

## Verification

- `src/online/mail.test.ts`, `src/online/jobs.test.ts` (fake pool; 50 accounts with slow failed sends), `src/online/jobs.db.test.ts`
  (PostgreSQL: due, early, held, cancelled; browser roles; a failed send keeps the deletion; the
  runtime role reads only a due address), `tools/deploy-plugin-env.test.ts`, `tools/deploy.test.ts`.
