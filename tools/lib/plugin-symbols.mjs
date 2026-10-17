import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';

/** Keep the two army images the same in the build and the source-page harness. */
export function pluginSymbols() {
  let building = false;
  return {
    name: 'plugin-symbols', enforce: 'pre',
    configResolved(config) { building = config.command === 'build'; },
    async load(id) {
      if (!id.endsWith('.svg?symbol')) return;
      const source = await readFile(id.slice(0, -7), 'utf8');
      const urls = ['color:#2b2621;--pi-disc:#fffcf4', 'color:#2b2621;--pi-disc:#4a4850;--pi-ring:#6e6a74;--pi-glyph:#f3ead7'].map((style, side) => {
        const svg = source.replace('<svg ', `<svg style="${style}" `);
        if (!building) return `data:image/svg+xml,${encodeURIComponent(svg)}`;
        const ref = this.emitFile({ type: 'asset', name: `${basename(id.slice(0, -11))}-${side}.svg`, source: svg });
        return `__VITE_ASSET__${ref}__`;
      });
      return `export default ${JSON.stringify(urls)};`;
    },
  };
}
