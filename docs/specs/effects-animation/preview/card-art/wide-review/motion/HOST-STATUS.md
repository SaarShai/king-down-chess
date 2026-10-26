# Wide motion host

Status: ready for integration and the merged browser check. No commit or production change.

Plan: build the single-card comparison with the existing game tokens, a cached current frame and cached renderers. Fetch the ready catalog and artwork manifest. Keep full wide art, the approved top crops, matching card titles/rules, phone Animated first, and visible playback controls.

Checks: module syntax, paths and static controls/API; no new dependency or production integration. Parent supplies catalog and remaining renderer groups, then runs the merged browser check. No server or browser runs in this lane.

## Result

The host fetches `catalog.json` and `../manifest.json`. The catalog controls which cards appear; the manifest controls names and artwork. Both views use matching live game rules from the seven-level `src` imports. Hop therefore displays the manifest name while keeping the `vault` id.

Wide images use contain preparation in a 512 × 288 canvas. March keeps its top crop. Freeze uses the accepted raw-image renderer directly, and its Original uses the same top crop as that renderer. Other groups receive the prepared canvas.

Only the selected renderer draws. Each card's image, prepared original and renderer are cached. Original paints once on selection. Animated draws into one cached frame, then copies that frame to its one visible canvas. Playback caps at 30 fps and stops on hidden, offscreen, reduced-motion and page-hide events. It does not resume on its own after those stops. Default initial selection plays when motion is allowed.

Previous/Next wrap through the ready catalog. The named chooser starts collapsed. Play/Pause, Replay, both modes, scrub, half speed and reduced motion work through the public API. Initial hashes and later hash changes select cards. Stale loads cannot replace the current selection. A failed load offers Try again. A new selection clears previous artwork while it loads.

Desktop shows Original left and Animated right. Phone shows Animated first. The toolbar remains at the top while the comparison scrolls. The game palette, fonts, native controls and focus style remain in use.

`window.wideCardMotion` exports `getState`, awaitable `select`, deterministic paused `seek(progress)`, `setMode`, `setReduced`, `replay`, `setPlaying` and `frame()` (the current PNG data URL). State includes the required `ready,id,time,playing,mode,reduced,frames`, plus speed and progress.

## Evidence and limits

`node --check main.js` and `git diff --check` pass. Static assertions pass for unique DOM ids, every literal control reference, the seven-level game import paths, API names, both top-crop branches, phone ordering and the 30 fps cap.

The Impeccable context and mechanical detector ran. This is a precise extension of the existing card review surface; the supplied brief settles its composition and the game tokens settle its visual system. The detector reports the incumbent cream palette, an unrelated game-wordmark glow in imported CSS, and a padding shorthand warning. The toolbar has explicit 8 px bottom padding. No new palette or visual system was introduced.

The current isolated worktree does not contain the parent's `catalog.json`, `air.js`, `magic.js`, accepted Freeze module or source art. Those files are integration inputs, not host mocks or placeholders. No browser/server was started, so continuous playback, responsive layout and merged assets remain for the parent's browser check. The movement renderer is unchanged during this host task.
