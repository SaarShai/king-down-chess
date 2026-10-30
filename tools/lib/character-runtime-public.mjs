/** Public files used by the character runtime. */
export const isCharacterRuntimePublic = file => /^character-runtime\/(?:manifest\.json|assets\/[a-f0-9]{64}\.webp|effects\/[a-f0-9]{64}\/(?:effect\.(?:mjs|json)|smoke\.mjs|assets\/[\w.-]+\.(?:png|webp)))$/.test(file);
