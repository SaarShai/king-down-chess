/** Runtime files that load at startup: the manifest and the small effect modules it names. */
export const isCharacterRuntimeStartup = file => /^character-runtime\/(?:manifest\.json|effects\/[a-f0-9]{64}\/(?:effect|smoke)\.mjs)$/.test(file);

/** Public files used by the character runtime. */
export const isCharacterRuntimePublic = file => isCharacterRuntimeStartup(file)
  || /^character-runtime\/(?:assets\/[a-f0-9]{64}\.webp|effects\/[a-f0-9]{64}\/(?:effect\.json|assets\/[\w.-]+\.(?:png|webp)))$/.test(file);
