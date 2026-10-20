# Engine archive

Each `<hex>.mjs` is a released match worker bundle. `<hex>` is the SHA-256 hash of the bundle while it held the build's placeholder stamp; the save fingerprint is `sha256:<hex>`. Each `<hex>.save.json` is a small fixture game that `npm test` reloads on that bundle.

- Ordinary builds verify and copy these files. To publish a new pair, run `npm run plugin:archive:runtime`, then commit both files with the engine change. Publication never overwrites an existing pair; repeating the exact pair only verifies it.
- A game made under tsx (the review seed) carries the source-tree stamp of `src/match/worker.ts` instead. Its bundle is an alias: the compiled bundle of the same source with that stamp swapped in, listed in `sourceAliases` in `tools/engines.test.ts`.
- Never edit a published pair. Retain each supported pair until a reviewed retirement decision checks supported server saves, pinned setups and the offline/local-save policy. An empty current server inventory alone does not permit deletion (`tools/engines-check.mjs`).

See [save compatibility](../docs/match-foundation.md#save-compatibility-and-limits).
