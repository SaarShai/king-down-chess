# Sign in with an email code

Status: ready-for-human. The code is on `claude/email-code-sign-in`. Production is unchanged.

The owner asks that players can sign up with their email. A player types an address and gets a six-digit code. A new address makes a new account. There is no password.

## Plan and acceptance

1. Settings → Account and `/play/` show the form only when the public auth settings enable Email. The parked ChatGPT consent page does not change.
2. A wrong code, a rate limit and a network fault each give a clear message and keep the step. No upstream detail shows.
3. The Before User Created hook lets email sign-ups in. The access token hook still refuses every password session whose address is not in `kingdown_auth.password_accounts`.
4. The privacy and terms pages name email sign-in and Resend.

## Setup before merge

Do steps 1 and 2 once. Do steps 3 to 6 on production (`utqzovjmclfyojedmwok`) and on staging (`puhspsyjyzaghmgtkzqd`), with SMTP on each. Merge only after step 8. Production Supabase has Email on today, so a deploy before the setup shows a form that fails.

1. In the Resend account that the owner already uses for other sites, the owner adds `kingdown.dev` and adds its DNS records at Porkbun. The free plan allows 3 domains. Its email limits are shared across the account.
2. The owner makes a Resend API key.
3. In Supabase, Authentication → Emails → SMTP Settings: host `smtp.resend.com`, port `465`, user `resend`, the key as password, sender `King Down <signin@kingdown.dev>`.
4. In Authentication → Email Templates, change **Magic Link** and **Confirm signup**. Each body is the code only, with no link:

   ```html
   <h2>Your King Down sign-in code</h2>
   <p>Your code is <strong>{{ .Token }}</strong>. It stops working soon. If you did not ask for it, ignore this email.</p>
   ```

5. In Authentication → Rate Limits, set the email limit to 30 an hour. Resend Free sends 100 emails a day.
6. Paste `plugin-deploy/oauth-audience-hook.sql` in the SQL Editor, then `plugin-deploy/review-signup-hook.sql`. Keep both hooks and **Confirm email** on. The public settings must show `mailer_autoconfirm: false`.
7. Test production, because a staging build cannot reach it: run `npm run preview` on a build with the production URL and the stage unset, then sign in with a code at a test address. Also sign in at a confirmed address with a code on staging.
8. Check the password gate on production. Give the test account a password, then call `/auth/v1/token?grant_type=password`. The answer must be 403 with `Sign in with Google, GitHub or an email code.` A good code sign-in does not show this.

## Risks

- A suspended player can return at once with a new address, and one person can make many accounts. The hook accepts any address. Google and GitHub raise this cost, but a second mailbox defeats any address check. Ratings are not live, so this is an accepted risk now. Decide again before rated play.
- There is no CAPTCHA. A script can ask for codes up to the rate limit, so it can use the Resend daily limit. Add Turnstile if this occurs.
- Supabase links an email code account and a Google, GitHub or Facebook account with the same verified address. This is the same player.
- To bring the ChatGPT plugin back, its review password path still works through the list. An email code account can also get an app token now.

## Review

An independent review ran on `3da261c4c`, with a skeptic for each finding. It found no new way to get a session without the mailbox. The `otp` values in the token hook match Supabase Auth. Fixed: a name and picture that a stranger sets on an email account, the code step lost on a reload or on a failed new send, a stale form after sign-out, a suspended player told that the code is wrong, wrong text for server faults, the signed-out data line, the deletion page, iOS field zoom, and these setup steps. Accepted: the first item under Risks. The review ran no real mail and no real hooks.
