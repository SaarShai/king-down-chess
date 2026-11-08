# Choose how the app reaches /api

Type: grilling
Status: resolved
Blocked by: 01
Parent: [iOS app map](../map.md)
Labels: wayfinder:grilling

## Question

The bundled page runs at `capacitor://localhost`, but every `/api` call is relative and the server refuses cross-origin calls. How does the app reach `/api`?

## Answer

An exact-origin CORS allowance on the server and one origin seam on the client. Decided 2026-11-07.

- `src/platform.ts` gives `apiOrigin`: empty on the website, the site of the build's stage in the app. The online client, the account status and the fault reports use it.
- `src/api/http.ts` allows only `APP_ORIGIN` (`capacitor://localhost`): exact `Access-Control-Allow-Origin`, `Vary: Origin`, a 204 preflight with the enabled methods, no credentials header. It accepts `Sec-Fetch-Site: cross-site` only for that origin. The host check, the bearer check and the refusal of every other origin do not change.
- The bearer token is the real control: every Capacitor app shares `capacitor://localhost`, and CORS adds no ambient authority because `/api` uses no cookies.
- Rejected: CapacitorHttp (patches every fetch, Supabase included, with unproved Origin behavior) and a remote page (App Review 4.2 risk).
- The app origin is fixed: a different scheme or host makes a new web storage area, so local saves and the session would be lost. Do not change `server.hostname` or `iosScheme`.

Probe (iOS 27 simulator, 2026-11-07): the app sends `Origin: capacitor://localhost` and `Sec-Fetch-Site: cross-site`; a bearer call sends a preflight for `authorization,content-type`.
