/** Runtime files that load at startup: the package index, the parts of the figures (tools/lib/character-runtime-split.mjs),
 * the footprint table and the small effect modules that the index names. */
export const isCharacterRuntimeStartup = file => /^character-runtime\/(?:index\.json|parts\/[a-z][a-z-]*\.(?:white|black)\.json|footprints\.json|effects\/[a-f0-9]{64}\/(?:effect|smoke)\.js)$/.test(file);

/** Public files used by the character runtime. manifest.json (every bank in one file) is for pages of older builds. */
export const isCharacterRuntimePublic = file => isCharacterRuntimeStartup(file)
  || /^character-runtime\/(?:manifest\.json|assets\/[a-f0-9]{64}\.webp|effects\/[a-f0-9]{64}\/(?:effect\.json|assets\/[\w.-]+\.(?:png|webp)))$/.test(file);
