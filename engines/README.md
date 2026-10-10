# Engine archive

Each `<hex>.mjs` is a released match worker bundle. `<hex>` is the SHA-256 hash of the bundle while it held the build's placeholder stamp; the save fingerprint is `sha256:<hex>`. Each `<hex>.save.json` is a small fixture game that `npm test` reloads on that bundle.

- The build (`tools/plugin-runtime-build.mjs`) adds a new engine here. Commit both files with the engine change.
- Do not edit a bundle. Delete one only when no unfinished game uses it (`tools/engines-check.mjs`).

See [save compatibility](../docs/match-foundation.md#save-compatibility-and-limits).
