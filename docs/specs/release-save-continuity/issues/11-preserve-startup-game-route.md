# Preserve the selected game route during startup

Status: source verified; parent compiled acceptance pending

## Cause

The passive trace in `app-mn0UUh` at `f1d935d1` records `/g/<selected>` changing to `/play/` before the first click. The retained `runtime-CLeIvK5H.js` stack maps to `connection.then` → `hostContext` → restored `navigate` → browser host `route`.

The fullscreen restoration opens the saved board before its first authoritative view arrives. The shared runtime correctly has no view game ID yet. The browser host treats this incomplete game-screen route as Play and replaces the selected URL. Later drawing the view can keep the board visible while the URL is already wrong; reload then loads Play.

## Plan and verification

- Add focused browser-host route checks and an actual source UI bootstrap with its first game read held. Assert the selected URL before release, after drawing, after reload, and after an explicit Back to Play.
- Preserve the selected route when a game screen has no game ID yet. Keep explicit Play/Home and identified game navigation unchanged. Change no shared plugin runtime or gameplay code.
- Run the focused red before the product change, then the affected host/UI checks after it. Wait for the shared compute lane before commands.
- Obtain independent read review. The parent owns the final registered `shared-mechanics` and `web-online` checks.

## Evidence

- The focused red fails six cases and passes one, with 146 cases filtered. The actual source UI fails before the first view is released: the selected `/g/<id>` has already become `/play/`. All five game-screen mapping checks fail for the same route loss. Log: `/tmp/kingdown-startup-game-route-red.log`.
- The browser host now returns before changing its route generation when a game screen has no game ID. Explicit Play/Home, Profile, Settings and identified game routes keep their existing behavior. No shared runtime change is needed.
- The focused green passes 14 cases, with 139 filtered: six host checks and eight actual source UI checks. The new UI check holds the first view on both startup and reload, verifies the same selected game after release, and then clicks the phone's Back to Play control. The first green attempt reaches its final Back check at desktop width, where that phone control is hidden; the test now uses the phone viewport. The product guard is unchanged. Log: `/tmp/kingdown-startup-game-route-green.log`.
- The complete `src/online/runtime.test.ts` passes all 18 tests without a name filter, including the existing route, invitation, preview and cancellation checks. Log: `/tmp/kingdown-startup-game-route-runtime-full.log`.
- Both green commands pass full typecheck and all 54 artwork checks. The focused selection uses `KINGDOWN_TEST_FILE='{src/online/runtime.test.ts,tools/plugin-app.test.ts}'` and `KINGDOWN_TEST_NAME='keeps the selected game URL|still routes explicit|preserves the website game URL|opens a chat route|keeps an inline.*route|leaves fullscreen|reads the selected board'` with `npm test`.

The parent independently reviews the regression and minimal guard and finds no should-fix. It owns the final registered `shared-mechanics` and `web-online` runs. The passive stack plus deterministic UI red/green establish the startup route cause; this is not a promotion rule change. The earlier driver staging repair remains separate: it waits for an accepted remote prefix to close its choice sheet before the animation check.
