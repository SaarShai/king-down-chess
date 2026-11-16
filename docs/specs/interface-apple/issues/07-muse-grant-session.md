# Bind the Muse grant removal to the confirmed session

Status: ready-for-agent

## Problem

Disconnect Muse checks the confirmed session before each step, and its two database requests carry that session's token. The grant removal (`sb.auth.oauth.revokeGrant` in `src/account/client.ts`) reads its own session inside the auth library. If another tab signs in as B in the short gap after the check, the grant removal can run as B. Muse is off in the production build, so this does not block the release.

## Scope

Send the grant removal with the confirmed session's token (for example, call the auth endpoint that the library uses, with that token), or stop when the session changes inside that gap. Keep the checks between steps.

## Checks

The review case from PR 361 round 7 (`the muse grant request cannot select another account after the bound read`, in `runs/launch/release/review-join14/review14.test.ts`) passes in `src/account/account-requests.test.ts`.

Do this before Muse is on for players.
