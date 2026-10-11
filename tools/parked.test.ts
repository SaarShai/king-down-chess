// The parked clay look (docs/specs/park-clay): nothing in the game names it, the build ships none of it,
// and old data that asks for it opens the painted board. This file is the one code file of src/ and tools/
// that may name the parked folder; the repo gate's size allowlist and its test name two parked sculpts as data.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, sep } from 'node:path';
import { build } from 'vite';
import { afterAll, describe, expect, it } from 'vitest';

const root = join(import.meta.dirname, '..');
const parked = join(root, 'parked/clay');
const walk = (dir: string): string[] => readdirSync(dir).flatMap(name => {
  const path = join(dir, name);
  return statSync(path).isDirectory() ? walk(path) : [path];
});
const rel = (from: string, path: string) => relative(from, path).split(sep).join('/');

describe('the parked clay look', () => {
  it('no file of src/ or tools/, vite.config.ts or index.html names a path under parked/', () => {
    const r = spawnSync('git', ['grep', '--untracked', '-nI', '-e', 'parked/', '--', 'src', 'tools', 'vite.config.ts', 'index.html', ':!tools/parked.test.ts', ':!tools/gate/size-allowlist.txt', ':!tools/gate.test.ts'], { cwd: root, encoding: 'utf8' });
    expect(r.status, r.stderr).toBe(1); // 1: no match
  });

  const out = mkdtempSync(join(tmpdir(), 'kingdown-parked-'));
  afterAll(() => rmSync(out, { recursive: true, force: true }));
  it('the production build holds no parked asset and no three.js', async () => {
    await build({ root, logLevel: 'silent', build: { outDir: out, emptyOutDir: true } });
    const assets = walk(join(parked, 'public')).map(path => rel(join(parked, 'public'), path));
    expect(assets.length).toBeGreaterThan(0);
    const files = walk(out).map(path => rel(out, path));
    expect(files).toContain('index.html');
    expect(files.filter(f => assets.includes(f))).toEqual([]);
    const named = files.filter(f => /\.(js|css|html|json|webmanifest)$/.test(f)).flatMap(f => {
      const text = readFileSync(join(out, f), 'utf8');
      return [...assets.filter(a => text.includes(a)), ...(/THREE\./.test(text) ? ['three.js'] : [])].map(a => `${f}: ${a}`);
    });
    expect(named).toEqual([]);
  }, 180_000);
});

describe('old data that asks for the clay look', () => {
  const sources = walk(join(root, 'src')).filter(f => /\.ts$/.test(f) && !f.endsWith('.test.ts'));
  it('no source reads the saved look or the ?look= parameter, so neither can change the board or throw', () => {
    expect(sources.filter(f => /kingdown\.look|get\(\s*['"]look['"]\s*\)/.test(readFileSync(f, 'utf8'))).map(f => rel(root, f))).toEqual([]);
  });
  it('main.ts makes the painted board with no condition', () => {
    expect(readFileSync(join(root, 'src/main.ts'), 'utf8')).toMatch(/^const view: BoardView = new PaintedView\(\$\('board'\), \{ floor: null, webInk: true \}\);$/m);
  });
});
