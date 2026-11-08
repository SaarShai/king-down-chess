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
