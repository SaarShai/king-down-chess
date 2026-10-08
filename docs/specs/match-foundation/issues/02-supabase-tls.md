# Trust the Supabase database certificate

Status: resolved

## Scope

The approved live setup fails with `SELF_SIGNED_CERT_IN_CHAIN`. Supabase uses its own root CA for the database pooler. Node does not trust that CA by default. Keep certificate and host checks on.

## Plan and checks

1. Include the official Supabase CA with the server. Pass explicit TLS settings and separate database fields to `pg`. Reject URL query options that can replace those settings. Keep local tests on a loopback database without TLS.
2. Test the actual `pg` connection settings, rejected query options and local mode. Check the CA in the built artifact and run the compiled HTTP check with local PostgreSQL.
3. Run `npm test` with the disposable database. Record the live TLS checks and submit the fix for review before release.

## Evidence

- The signed-in Supabase Database Settings page links to [the official CA](https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt). Its subject is `Supabase Root 2021 CA`; it expires on April 26, 2031. Its SHA-256 certificate fingerprint is `807025AD50D4ED219D2C9C7D299C004F824EB00CF7F65AFEF607D07B72E6CAFA`.
- The live restricted role can connect with that CA, `rejectUnauthorized: true` and the actual pooler host. Without the CA, the same check fails with `SELF_SIGNED_CERT_IN_CHAIN`.
- A PostgreSQL TLS probe with that CA and the actual SNI rejects `wrong.example` with certificate error 62 (host mismatch).
- The approved release script installs the six production settings through private standard input. It confirms the exact project and team and publishes nothing.

## Verified result

- `npm test` with local PostgreSQL passes: type check, 73 test files, 1,391 tests and 42 artwork tests. The three new cases check actual `pg` TLS settings, forbidden query options and local IPv4/IPv6 settings.
- Both standalone and Vercel builds pass the compiled HTTP check against local PostgreSQL. The check verifies the CA fingerprint in each copied artifact, then tests play, AI, retry, access, resume and friend join. The board resource is 4,291,913 JSON bytes.
- The compiled production server starts with the real private settings. Real OAuth discovery, verified Supabase TLS and the exact client audience mapping pass. This check creates no match or user.
- `git diff --check` passes. A read-only review confirms that separate fields prevent the `pg` URL parser from replacing the TLS settings. The fix adds no dependency.
- The service still needs release and real host checks under [the external-host ticket](01-external-host-check.md).

## Acceptance

- The server verifies the certificate chain and database host. URL options cannot turn either check off.
- The standalone and Vercel server artifacts carry the reviewed CA. The browser does not need it.
- Unit and compiled HTTP tests pass against the disposable local PostgreSQL database.
- No secret value enters the change. The live host flow stays open until the service is released and checked.
