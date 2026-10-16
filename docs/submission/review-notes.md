# Review notes

The text for the portal's **Review details** (Metadata & Skills → Review information → Review details). Never put it in the ZIP ([checklist.md](checklist.md), rows 15 and 46). Replace the two values in `<ANGLE BRACKETS>` in the portal only. The password goes only into the portal field. Do not write it in this file or in a commit.

## Text to paste

> **Sign-in.** King Down uses its own account page. Use the review account below. It needs no email code and no second factor.
>
> 1. In ChatGPT, connect King Down. ChatGPT opens the King Down page.
> 2. On the King Down page, select **Sign in with email and password** (under the Google and GitHub buttons).
> 3. Enter the email and the password below, then select **Sign in**.
> 4. Select **Continue**, then **Allow connection**.
>
> Email: `<REVIEW_EMAIL>`. Password: `<REVIEW_PASSWORD>`.
>
> **Sample data.** The account has one finished game against a friend (won), a rating, three badges, and one game against the computer where it is your move. Test case P5 resigns that game.
>
> **Surfaces.** King Down needs its board in the chat to play a move: the chat model does not see the position and does not choose moves. Please test King Down on the ChatGPT surfaces that show app screens: the website, the iOS app, the Android app and the desktop app. King Down does not claim Codex, because Codex shows no board. If the app can be limited to these surfaces, please limit it.

## Sources

- Sign-in: approval D8 a. The form is in `src/plugin/consent.html`; `plugin-deploy/review-signup-hook.sql` refuses every other password sign-up, and `plugin-deploy/oauth-audience-hook.sql` refuses a password sign-in for every other address; `npm run plugin:db:seed-review` adds the sample data (`tools/plugin-db/seed-review.ts`). The owner tests with a separate test account, so the review account keeps this data ([checklist.md](checklist.md), owner step 2).
- Surfaces: approval D15 a; checklist row 39 and open question 2. 16 of the 25 tools are for the board only (rehearsal R16).
