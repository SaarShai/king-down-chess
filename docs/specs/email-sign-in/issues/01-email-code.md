# Sign in with an email code

Status: ready-for-human. The code is on `claude/email-code-sign-in`. Production is unchanged.

The owner asks that players can sign up with their email. A player types an address and gets a six-digit code. A new address makes a new account. There is no password.

## Plan and acceptance

1. Settings → Account and `/play/` show the form only when the public auth settings enable Email. The parked ChatGPT consent page does not change.
2. A wrong code, a rate limit and a network fault each give a clear message and keep the step. No upstream detail shows.
3. The Before User Created hook lets email sign-ups in. The access token hook still refuses every password session whose address is not in `kingdown_auth.password_accounts`.
4. The privacy and terms pages name email sign-in and Resend.

## Setup before merge

Do these steps in this order. Merge only after step 6. Production Supabase has Email on today, so a deploy before the setup shows a form that fails.

1. The owner makes a Resend account, adds `kingdown.dev`, and adds its DNS records at Porkbun.
2. The owner makes a Resend API key. In Supabase, Authentication → Emails → SMTP Settings: host `smtp.resend.com`, port `465`, user `resend`, the key as password, sender `King Down <signin@kingdown.dev>`.
3. In Authentication → Email Templates, change **Magic Link** and **Confirm signup**. Each body is the code only, with no link:

   ```html
   <h2>Your King Down sign-in code</h2>
   <p>Your code is <strong>{{ .Token }}</strong>. It stops working soon. If you did not ask for it, ignore this email.</p>
   ```

4. In Authentication → Rate Limits, set the email limit to 30 an hour. Resend Free sends 100 emails a day.
5. Paste `plugin-deploy/oauth-audience-hook.sql` in the SQL Editor, then `plugin-deploy/review-signup-hook.sql`. Keep both hooks on.
6. Send one real code to a test address with the staging or preview build, and sign in. This is the only check of real mail and the real hooks.

## Risks

- There is no CAPTCHA. A script can ask for codes up to the rate limit, so it can use the Resend daily limit. Add Turnstile if this occurs.
- Supabase links an email code account and a Google, GitHub or Facebook account with the same verified address. This is the same player.
- To bring the ChatGPT plugin back, its review password path still works through the list. An email code account can also get an app token now.
