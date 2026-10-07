// Art-script test (workshop-finish/11). It runs the real script in a linked worktree of a
// temporary repository. The figure sources lie only in the main folder's art-source workshop
// folder; the cast list in the worktree names each figure by id only.
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { afterEach, describe, expect, it } from 'vitest';
import { tempRepo } from './lib/temp-repo.mjs';

const script = join(dirname(fileURLToPath(import.meta.url)), 'prepare-workshop-art.mjs');
const id = 'test-figure';
const repos: { cleanup(): void }[] = [];
afterEach(() => { while (repos.length) repos.pop()!.cleanup(); });

// A paired sheet, 200×120 on a clear ground: a 40×40 red square in the ivory (left) half,
// a 30×50 blue square in the charcoal (right) half.
async function pairedSheet() {
  const box = (width: number, height: number, r: number, g: number, b: number) =>
    sharp({ create: { width, height, channels: 4, background: { r, g, b, alpha: 1 } } }).png().toBuffer();
  return sharp({ create: { width: 200, height: 120, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: await box(40, 40, 220, 30, 30), left: 30, top: 40 }, { input: await box(30, 50, 30, 30, 220), left: 140, top: 35 }])
    .png().toBuffer();
}

async function setUp() {
  const repo = tempRepo({ hooks: false });
  repos.push(repo);
  repo.write('docs/visual-design/workshop/cast.json', JSON.stringify([{ id, name: 'Test Figure', tags: ['Fast'] }]));
  repo.git('add', '-A');
  repo.git('commit', '-q', '-m', 'cast');
  const worktree = join(repo.root, 'linked');
  const added = repo.git('worktree', 'add', '-q', worktree, '-b', 'art');
  expect(added.status, added.stderr).toBe(0);
  const sources = join(repo.dir, 'art-src', 'workshop');
  mkdirSync(sources, { recursive: true });
  writeFileSync(join(sources, `${id}.png`), await pairedSheet());
  writeFileSync(join(sources, `${id}.prompt.txt`), 'A test figure, ivory and charcoal.\n');
  const runScript = () => repo.run('node', [script], { cwd: worktree });
  return { repo, worktree, sources, runScript };
}

describe('prepare-workshop-art', () => {
  it('reads a cast list that names each figure by id, name and tags only, with no source path', () => {
    const cast = JSON.parse(readFileSync('docs/visual-design/workshop/cast.json', 'utf8')) as object[];
    expect(cast.length).toBeGreaterThan(0);
    for (const figure of cast) expect(Object.keys(figure)).toEqual(['id', 'name', 'tags']);
  });

  it('finds the source by id in the main checkout and writes the two webp into the linked worktree', async () => {
    const { repo, worktree, runScript } = await setUp();
    const result = runScript();
    expect(result.status, result.stderr).toBe(0);
    const shipped = join(worktree, 'public', 'ui', 'workshop');
    expect(readdirSync(shipped).sort()).toEqual([`${id}-b.webp`, `${id}-w.webp`]);
    const ivory = await sharp(join(shipped, `${id}-w.webp`)).metadata();
    const charcoal = await sharp(join(shipped, `${id}-b.webp`)).metadata();
    expect([ivory.format, ivory.width, ivory.height]).toEqual(['webp', 40, 40]);
    expect([charcoal.format, charcoal.width, charcoal.height]).toEqual(['webp', 30, 50]);
    expect(repo.exists('public')).toBe(false);
  }, 30_000);

  it('stops with a non-zero exit and names the id when the PNG is missing', async () => {
    const { worktree, sources, runScript } = await setUp();
    rmSync(join(sources, `${id}.png`));
    const result = runScript();
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain(id);
    expect(result.stderr).toContain('.png');
    expect(readdirSync(worktree)).not.toContain('public');
  }, 30_000);

  it('stops with a non-zero exit and names the id when the prompt is missing', async () => {
    const { worktree, sources, runScript } = await setUp();
    rmSync(join(sources, `${id}.prompt.txt`));
    const result = runScript();
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain(id);
    expect(result.stderr).toContain('.prompt.txt');
    expect(readdirSync(worktree)).not.toContain('public');
  }, 30_000);
});
