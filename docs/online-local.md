# Local online stack

The local online stack runs real online games on one machine without real accounts, email delivery or hosted infrastructure.

## Commands

Run all commands in the repository root:

- `npm run online:local`: starts a private PostgreSQL 17 cluster in `.local-online/pg` on a free loopback port, creates a `_test` database, runs all migrations with `tools/plugin-db/bootstrap-test.mjs`, opens `public.web_account_access`, seeds four test accounts, and starts the loopback sign-in stand-in, the real API server and the local Vite page.
- `npm run online:local:stop`: stops the processes recorded in `.local-online/pids.json` by exact PID.
- `npm run online:local:reset`: stops the stack and removes `.local-online/` data.
- `node tools/online-local-smoke.mjs`: runs two Playwright browser contexts (`test-a` and `test-b`) through link invite, join, moves, reload, resign, result and game list verification.

## Test accounts

The fixture file [tools/online-local-accounts.json](../tools/online-local-accounts.json) defines four accounts in `auth.users` and `public.profiles`:

| Handle | Email | Sign-in method | Picture |
| --- | --- | --- | --- |
| `test-a` | `test-a@example.test` | Social (`github`) | None |
| `test-b` | `test-b@example.test` | Social (`github`) | None |
| `test-c` | `test-c@example.test` | Social (`google`) | `/interface/computer-king-1-96.webp` |
| `test-d` | `test-d@example.test` | Email (`email`) | None |

## How players and scripts sign in

1. Open the printed `/next.html?as=<handle>` URL (for example `/next.html?as=test-a`), select `Play a person` (or `Join the game` on an invite link) and press a provider button such as `Continue with GitHub`. The stand-in completes the PKCE redirect immediately for that handle.
2. Without `?as=` in the address, the sign-in button opens a local chooser page on the stand-in listing the four test accounts.
3. For email sign-in (`test-d`), press `Continue with email`, enter `test-d@example.test` and enter any six-digit code such as `123456`.

## Limits

This local stack does not verify:

- Real sign-in providers (Google, GitHub and Facebook).
- Real email delivery or spam filters.
- Hosted PostgreSQL or hosted database auth roles, triggers and quotas.
- Production hosting, TLS, CDN headers or Vercel function deployment.
