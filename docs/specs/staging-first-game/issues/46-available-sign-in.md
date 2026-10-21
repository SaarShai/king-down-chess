# Offer only available sign-in methods

Status: complete in staging. Parent: U07/U09. Follows ticket 45. Production is unchanged.

The owner asks for the next unblocked player improvement, reuse of evidence and staging only. The comparison leaves advertised sign-in providers unproved. A fresh public staging settings read confirms GitHub enabled, Google and Facebook disabled; the website and connection page still advertise Google. This is a concrete dead end before play, independent of a second identity.

## Plan and acceptance

1. Read the existing public auth settings when a signed-out player reaches sign-in. Offer only supported, enabled providers. Reuse one small reader across account play, local Account and the ChatGPT connection page. Keep Facebook behind its existing local-only flag and preserve the approved review password flow.
2. No provider request on local board startup or an already signed-in game. Keep safe retry and local-play escape on failure; never guess a provider is enabled. Do not change provider configuration, credentials, grants, account authority or game rules.
3. Check enabled/disabled/unknown/malformed/failed settings, retry, signed-in bypass and the three compiled sign-in surfaces. Retain PKCE/callback, cancellation, offline save and account-game resume checks. Use synthetic provider responses on loopback; no real provider sign-in or second account is needed.
4. Publish the checked artifact to the guarded staging project. Confirm real public provider choices and entry locally/hosted as available. Match unchanged game runtime, embedded board and archives to existing mechanics evidence. Record remaining host/identity release gates.

Supabase's public settings contract lists enabled external providers: [official implementation](https://github.com/supabase/auth/blob/master/internal/api/settings.go), [official setup example](https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/self-hosting/self-hosted-oauth.mdx). The installed client has no public settings reader. Use the public endpoint with the existing publishable key; no new service, config flag or dependency is needed.

## Result and evidence

Source `25978776` is live in staging as preview `dpl_3v6SVGnfk5mzXrH4XaKo9hCNNmZu`. All three sign-in screens use one public settings reader. Only GitHub is enabled in staging. A failed or empty response offers retry; web account play keeps the local-play link. The connection page keeps the approved review password path. The request has a five-second timeout and sends no player token or cookies.

- Focused source checks pass: 97 tests in six files, typecheck and 54 artwork checks. The selected files cover providers, Account HTML, client, account entry, sign-in return and consent configuration. This is not a full-suite result.
- Compiled `account-discovery`, `plugin-oauth` and `menu-extra` pass. Coverage includes provider failure/retry, all three screens, PKCE return, review password, account switch, signed-in bypass, unchanged local saves, offline move/reload, existing account-game resume and four layout sizes.
- The initial OAuth check fails because two fixtures answer the new settings request with authorization data. Both now supply explicit settings. All original assertions remain; no product patch is needed for this failure.
- A fresh anonymous browser checks the hosted title-to-account journey, GitHub-only choice, local return and local Account. Only allowed GET requests occur. No sign-in or hosted game command is sent. Screenshots pass visual review.
- Exact release checks pass. Hosted `/`, `/play/`, `/sw.js` and `/consent.mjs` match the checked artifact. Server, embedded board, runtime, search worker and all eleven archives remain byte-identical to ticket 45. Reuse the accepted mechanics and real two-way host evidence.

[Verification and receipts](../../../../../evidence/staging-sign-in-options/verification.md) identify each source and artifact. Existing first-open, actual second-account privacy, physical-phone/network, operator and Codex interruption gates remain open. Provider configuration and credentials do not change. A real provider login is not repeated.

Implementation review: one small reader, existing screen states and existing test harnesses are sufficient. No new provider registry, service, dependency, game rule or auth authority is added.
