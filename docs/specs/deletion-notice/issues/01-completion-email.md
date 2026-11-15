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
- `src/online/jobs.ts`, `runDeletions(games, send?)`: with a sender, read the address before
  `delete_account`, then send once after the deletion, with the idempotency key
  `kingdown-deletion-<user id>`. A failed read or send logs the fault (no address) and never stops
  or undoes a deletion. With no sender, the job does not call the helper, so a deploy before 0026
  keeps working.
- `src/api/http.ts`, `tools/plugin-server.mjs`: the daily job gets the sender when
  `RESEND_API_KEY` and `KINGDOWN_MAIL_FROM` are both set.
- `tools/deploy-plugin-env.mjs`: accept both mail settings or neither; the key starts `re_`; the
  sender is `King Down <name@kingdown.dev>`.
- The privacy and delete-data pages (default and launch copies) say that one email confirms the
  deletion and that Resend sends it.

## Release order

1. Apply 0026 on production.
2. Deploy the server.
3. Set the mail pair with `tools/deploy.sh --configure` (owner's word). The key is a Resend key
   with sending access for `kingdown.dev` (the domain is verified for the sign-in codes).
4. Check with a disposable account: request deletion, let the grace pass, see the email.

The pages say that the email goes. Set the mail pair in the same release as the page text.

## Verification

- `src/online/mail.test.ts`, `src/online/jobs.test.ts` (fake pool), `src/online/jobs.db.test.ts`
  (PostgreSQL: due, early, held, cancelled; browser roles; a failed send keeps the deletion; the
  runtime role reads only a due address), `tools/deploy-plugin-env.test.ts`, `tools/deploy.test.ts`.
