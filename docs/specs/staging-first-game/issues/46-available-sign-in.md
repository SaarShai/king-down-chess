# Offer only available sign-in methods

Status: in progress. Parent: U07/U09. Follows ticket 45.

The owner asks for the next unblocked player improvement, reuse of evidence and staging only. The comparison leaves advertised sign-in providers unproved. A fresh public staging settings read confirms GitHub enabled, Google and Facebook disabled; the website and connection page still advertise Google. This is a concrete dead end before play, independent of a second identity.

## Plan and acceptance

1. Read the existing public auth settings when a signed-out player reaches sign-in. Offer only supported, enabled providers. Reuse one small reader across account play, local Account and the ChatGPT connection page. Keep Facebook behind its existing local-only flag and preserve the approved review password flow.
2. No provider request on local board startup or an already signed-in game. Keep safe retry and local-play escape on failure; never guess a provider is enabled. Do not change provider configuration, credentials, grants, account authority or game rules.
3. Check enabled/disabled/unknown/malformed/failed settings, retry, signed-in bypass and the three compiled sign-in surfaces. Retain PKCE/callback, cancellation, offline save and account-game resume checks. Use synthetic provider responses on loopback; no real provider sign-in or second account is needed.
4. Publish the checked artifact to the guarded staging project. Confirm real public provider choices and entry locally/hosted as available. Match unchanged game runtime, embedded board and archives to existing mechanics evidence. Record remaining host/identity release gates.

Supabase's public settings contract lists enabled external providers: [official implementation](https://github.com/supabase/auth/blob/master/internal/api/settings.go), [official setup example](https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/self-hosting/self-hosted-oauth.mdx). The installed client has no public settings reader. Use the public endpoint with the existing publishable key; no new service, config flag or dependency is needed.
