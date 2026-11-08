/** Runtime files that load at startup: the manifest, its footprint table and the small effect modules it names. */
export const isCharacterRuntimeStartup = file => /^character-runtime\/(?:manifest\.json|footprints\.json|effects\/[a-f0-9]{64}\/(?:effect|smoke)\.js)$/.test(file);

/** Public files used by the character runtime. */
export const isCharacterRuntimePublic = file => isCharacterRuntimeStartup(file)
  || /^character-runtime\/(?:assets\/[a-f0-9]{64}\.webp|effects\/[a-f0-9]{64}\/(?:effect\.json|assets\/[\w.-]+\.(?:png|webp)))$/.test(file);
