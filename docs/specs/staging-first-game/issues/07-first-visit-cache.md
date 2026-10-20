# First-visit account cache proof

Status: implemented; hosted verification remains with the main task.

## Plan and checks

1. Read the deployed worker and each public precache response. Measure its serial network path. Check status, redirects and cache headers without an account.
2. Keep the private-send proof and its deadline. Remove the measured install bottleneck with a small bounded fetch pool if the evidence supports it. Keep install validation, complete-cache checks and takeover ordering.
3. Test bounded concurrency, an unsafe/missing file and activation ordering with the existing worker harness. Add a clear retry action if the unavailable entry has none. Check its loading and retry behavior.
4. Run the focused privacy tests when the shared test lane is free. The main task owns staging deployment and hosted browser verification.

## Evidence and change

- The deployed worker version `00fd63476700` lists 187 public files (8,921,583 bytes). All responses are HTTP 200, at the requested URL, without redirects or `no-store`. Serial Node fetches take 33,041 ms. The page proof has one 8,000 ms deadline. The hosted page later reaches sign-in after installation completes.
- Eight concurrent public fetches take 1.7–9.5 seconds in follow-up Node measurements. These are network checks, not browser CacheStorage timings; network variation can still exceed the proof deadline.
- Installation now has eight fetch/write slots. Each response still passes `cacheable`; the complete cache check still precedes `skipWaiting`. Failed installation cannot take over or grant a private-send proof. The proof deadline and every private path rule stay in place.
- The unavailable/error entry now has a Try again button that reloads the page and requests a fresh proof. It does not start sign-in before access succeeds.
- The build already starts its version hash with the worker template. A worker-only change therefore changes its cache name; a real-build regression checks this.
- Focused `npm test`: 6 files and 222 tests pass, plus typecheck and 53 artwork checks; zero skips. This includes install concurrency, complete-cache takeover, unsafe/missing responses, failed installation, private path refusal, fresh proofs, entry retry and worker-only cache-version changes.
- Independent review of the worker and entry changes finds no defects.
- The main task owns the rebuilt preview and fresh-browser hosted check.
