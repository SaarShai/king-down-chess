#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const KAGGLE = '/Users/za/.local/bin/kaggle';
const source = fileURLToPath(new URL('./run.py', import.meta.url));
export function metadata(user, part, parts) {
  if (!/^[a-z0-9-]+$/.test(user) || !Number.isInteger(part) || !Number.isInteger(parts) || part < 0 || part >= parts || parts > 2) throw Error('Invalid user or part');
  const name = `kd-anim-inbetween-20261030-${part + 1}of${parts}`;
  return { id: `${user}/${name}`, title: name, code_file: 'run.py', language: 'python', kernel_type: 'script', is_private: true, enable_gpu: true, enable_tpu: false, enable_internet: false, dataset_sources: [`${user}/kd-anim-movement-keys-20261030`], kernel_sources: [], competition_sources: [], model_sources: ['google/film/tensorFlow2/film/1'] };
}
export function validateArchives(status, archives) {
  if (status.exit === 0 && archives.length !== Math.ceil(status.entries / 32)) throw Error('A results archive is missing');
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [action, user, partText, partsText, directory] = process.argv.slice(2);
  const part = Number(partText), parts = Number(partsText);
  if (!['push', 'status', 'pull'].includes(action) || !user || !partText || !partsText || !directory) throw Error('Usage: node tools/anim/kaggle/kaggle.mjs push|status|pull <user> <part, zero-based> <parts> <directory>');
  const m = metadata(user, part, parts), dir = resolve(directory);
  mkdirSync(dir, { recursive: true });
  if (action === 'push') {
    const script = `import os\nos.environ['KD_PART'] = '${part}'\nos.environ['KD_PARTS'] = '${parts}'\n` + readFileSync(source, 'utf8');
    writeFileSync(join(dir, 'run.py'), script);
    writeFileSync(join(dir, 'kernel-metadata.json'), JSON.stringify(m, null, 2) + '\n');
    console.log(execFileSync(KAGGLE, ['kernels', 'push', '-p', dir], { encoding: 'utf8' }));
  } else if (action === 'status') {
    console.log(execFileSync(KAGGLE, ['kernels', 'status', m.id], { encoding: 'utf8' }));
  } else {
    console.log(execFileSync(KAGGLE, ['kernels', 'output', m.id, '-p', dir], { encoding: 'utf8' }));
    const statusPath = join(dir, 'status.json');
    if (!existsSync(statusPath)) throw Error('No completed status was pulled');
    const status = JSON.parse(readFileSync(statusPath, 'utf8'));
    const archives = readdirSync(dir).filter(name => /^results-\d+\.tar$/.test(name)).sort();
    validateArchives(status, archives);
    for (const file of archives) execFileSync('tar', ['-xf', join(dir, file), '-C', dir]);
    if (status.exit === 0 && readdirSync(join(dir, 'results')).length !== status.entries) throw Error('Extracted entry count does not match');
    if (status.exit !== 0) throw Error(`Kernel failed: ${status.error ?? 'unknown error'}`);
  }
}
