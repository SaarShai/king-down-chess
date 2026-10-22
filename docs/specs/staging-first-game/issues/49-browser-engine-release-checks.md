# Verify the account website in the other supported browser engines

Status: complete for the registered website journey. Parent: U09. Follows ticket 48.

## Plan and pass criteria

1. Reuse the accepted staging product and the existing registered `web-online` check. Run it sequentially with `PLAYABLE_BROWSER=webkit` and `PLAYABLE_BROWSER=firefox` on a clean committed checkout and the existing disposable loopback database. Both browser engines are already installed. Use detached logs and an end report.
2. Keep the same assertions and normal local timeout limits. A failure needs its exact assertion, source and artifact receipt. Fix a demonstrated product or test defect at its cause; do not skip a failing journey or widen a timeout without evidence.
3. Credit only what the runner exercises: compiled website/account/local/cache behavior with synthetic authentication and local PostgreSQL. These are browser-engine checks, not actual Safari/Firefox provider sign-in, physical-phone or ChatGPT host acceptance.
4. Reuse the existing mechanics and actual-account proofs. Keep production and hosted game records untouched. Record results and then continue the next available release item.

## Evidence

The parent workspace's `evidence/staging-release-checks/` holds the source, detached run logs and final result. No new browser feature, dependency or hosting service is proposed.

## Result

Both runs pass on source `66824dc5`, macOS arm64, Node 26.0.0. WebKit 27.2 passes in 90.6 seconds; Firefox 157.0 passes in 108.1 seconds. These are check durations, not game startup times. Each run passes the built root, local move and End turn, saved reload, closed account/API routes, and the complete worker journey with 89 protected/bypass requests. Normal local timeouts and all existing assertions stay unchanged. The runner cleans up its browsers and temporary servers.

The receipts name a fixture recovery pair, not exact final-release rollback approval. Retain the prior exact recovery evidence separately. These checks close the selected browser-engine gap; they do not prove actual Safari/Firefox provider login, physical-phone behavior or an embedded host. No product code changes. Continue with [the shared embedded UI in WebKit](50-webkit-embedded-release-check.md).
