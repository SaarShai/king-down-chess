# Show bundled frames offline and check effects on old iOS

Type: task
Status: claimed
Blocked by: 09
Parent: [iOS app map](../map.md)
Labels: wayfinder:task

## Question

The store build bundles all character frames (ticket 09). Does the app show them with no network, and do the effect modules load on the oldest supported iOS?

## Context

[Character frames in the store build](../../../research/ios-app-2026-11-07/frames.md), section 6, items 1 and 3.

- The runtime asks for no frame while `navigator.onLine` is false (`src/render/painted/character-runtime.mjs:79`), so the app shows plain figures in Airplane Mode, also with all frames in the bundle.
- The effects are `.mjs` modules. Capacitor takes the MIME type from `UTType` of the request URL's extension, and its fallback map has no `mjs` key (`node_modules/@capacitor/ios/Capacitor/Capacitor/WebViewAssetHandler.swift:118-131,201`). iOS 27 gives `text/javascript`. iOS 16.4 to 26 are not checked. A wrong type turns the Maester effect, the Archer effect and the Archer smoke off; the runtime catches the import error, so the game goes on. The scene draws the Queen effect itself and never loads its module (`drawnEffects:['queen']`).

## Steps

1. At `character-runtime.mjs:79`, write `const connected=()=>globalThis.navigator?.onLine!==false||globalThis.location?.protocol==='capacitor:';` and update the comment at `:118`. This is animation runtime code: coordinate it with the animation work.
2. Add a unit test that stubs `navigator.onLine` false and a `capacitor:` location and expects frames to load.
3. Test on an iPhone in Airplane Mode with Wi-Fi off. The simulator has no Airplane Mode.
4. On iOS 16.4, the oldest supported iOS (install the simulator runtime first: this Mac has only iOS 27; or use an iPhone on 16.4), check the Maester and Archer effects and the Archer smoke. If a module fails, write `effect.js` and `smoke.js` in place of `.mjs`: the names come from the reviewed receipt `docs/specs/character-animation-samples/runtime-effects.json` (with their sha256 values), which `tools/character-runtime-effects.mjs:60,66` reads; then build the published `character-runtime` tree and its manifest again. `.js` gets a JavaScript type from `UTType` or from Capacitor's fallback map. A `router()` change cannot fix it, because the type comes from the URL's extension. This is animation pipeline code: coordinate it with the animation work.

## Progress

2026-11-08:

- Steps 1 and 2 (branch `ios-offline-frames`): `connected()` in `character-runtime.mjs` also returns true when `location.protocol` is `capacitor:`, and the module exports it (declared in `character-runtime.d.mts`). A second gate had the same fault: the clip gate in `scene.mjs:117` stopped the bundled Knight and Rook clips offline. It now calls the same `connected()`. No receipt or hash pins these source files. The animation session saw no clash.
- Tests: `src/render/character-runtime.test.ts` ("with no connection on %s loads bundled frames": `capacitor:` loads the manifest and a frame, `https:` requests nothing) and `src/render/scene-load.test.ts` ("loads bundled clips offline in the iOS app"). Each new test fails without the `capacitor:` clause.
- Independent review of `560900be7`: ship, no must-fix. `7c3444944` adds the type declaration that it asked for.
- Step 4, in part: Xcode 27.2 offers no older simulator runtime (`xcodebuild -downloadPlatform iOS -buildVersion 16.4` says "not available"; 16.0 to 18.0 the same). A static scan of the TestFlight bundle against iOS 16.4 finds nothing that breaks ([iOS 16.4 check](../../../research/ios-app-2026-11-08/ios-16-4-compat.md)). It does not answer the `.mjs` MIME type question.
- Step 4, the `.mjs` part (branch `ios-effects-js`): no source shows that iOS 16.4 to 26 map `mjs` to a JavaScript type (Capacitor PRs 5853 and 8154 show the lookup failing on iOS 16 Rosetta simulators). With the animation owner's yes, the published runtime now has all four effect modules as `.js`: the Maester and Queen effects, the Archer effect and its smoke. The receipt changes only the published names (`module`, `path`); the module bytes do not change. The tool rebuilt `public/character-runtime`: three effect folders get new hash names, the manifest's `effects` key changes, and the frames are byte-identical. No `.mjs` file is left in `public/character-runtime`, and no `.mjs` text is in `dist`. Independent review of `d520a459b`: ship.
- Open: step 3 (Airplane Mode on an iPhone) and a check that the effects play on an iPhone, both with the next TestFlight build.

## Done when

The app shows painted figures in Airplane Mode, and the effects play on the oldest supported iOS.
