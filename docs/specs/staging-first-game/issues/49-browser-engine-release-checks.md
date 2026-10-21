# Verify the account website in the other supported browser engines

Status: in progress. Parent: U09. Follows ticket 48.

## Plan and pass criteria

1. Reuse the accepted staging product and the existing registered `web-online` check. Run it sequentially with `PLAYABLE_BROWSER=webkit` and `PLAYABLE_BROWSER=firefox` on a clean committed checkout and the existing disposable loopback database. Both browser engines are already installed. Use detached logs and an end report.
2. Keep the same assertions and normal local timeout limits. A failure needs its exact assertion, source and artifact receipt. Fix a demonstrated product or test defect at its cause; do not skip a failing journey or widen a timeout without evidence.
3. Credit only what the runner exercises: compiled website/account/local/cache behavior with synthetic authentication and local PostgreSQL. These are browser-engine checks, not actual Safari/Firefox provider sign-in, physical-phone or ChatGPT host acceptance.
4. Reuse the existing mechanics and actual-account proofs. Keep production and hosted game records untouched. Record results and then continue the next available release item.

## Evidence

The parent workspace's `evidence/staging-release-checks/` holds the source, detached run logs and final result. No new browser feature, dependency or hosting service is proposed.
