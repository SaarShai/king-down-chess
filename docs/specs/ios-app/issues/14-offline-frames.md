# Show bundled frames offline and check effects on old iOS

Type: task
Status: open
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
4. On the iOS 16.4 simulator runtime (install it first: this Mac has only iOS 27) or an iPhone on iOS 16.4 to 26, check the Maester and Archer effects and the Archer smoke. If a module fails, write `effect.js` and `smoke.js` in place of `.mjs` (`tools/character-runtime-effects.mjs:60,66`, and the tests that name the files): `.js` gets a JavaScript type from `UTType` or from Capacitor's fallback map. A `router()` change cannot fix it, because the type comes from the URL's extension. This is animation pipeline code: coordinate it with the animation work.

## Done when

The app shows painted figures in Airplane Mode, and the effects play on the oldest supported iOS.
