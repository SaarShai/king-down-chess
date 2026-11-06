# WebKit leaves timed-out image requests open

Status: needs-triage

## Fault

`PLAYABLE_BROWSER=webkit npm run check:browser character-prepare` reaches the
actual HTTP cancellation case after fallback, image recovery and stalled Undo
pass. The local HTTP server holds each image response open. At the 12-second
wait limit, it records six requests and zero closes. The seventh request never
reaches the server. The disposal step is not reached.

The runtime has a five-second image timeout. Its `pump()` completion path calls
`art.removeAttribute('src')` before it frees a queue slot. In this WebKit case,
that action does not close the held HTTP responses. The same case passes in
Chromium: peak six, all seven requests closed after timeout and disposal.

## Scope

The preparation deadline still bounds the move, and both Undo cases pass in
WebKit. This fault concerns the underlying HTTP requests. Keep its assertion.
Do not replace a real HTTP check with runtime counters.

An abortable transport needs a separate loader change. That change must preserve
CORS, image decode, object URL cleanup, shared loads and memory limits. It is
beyond this small check repair.

## Evidence and next check

The retained log is `~/kd-runs/fix-prepare-check/webkit-cases.log`.
The browser check fails with `request wait timed out: started=6, closed=0`.
After a loader fix, all seven requests must reach the server, peak underlying
concurrency must stay at six or less, and disposal must close the last request.
