import { randomUUID } from 'node:crypto';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { build } from 'vite';
import { expect, it } from 'vitest';

it('the site build keeps the domain challenge dot folder and exact bytes', async () => {
  const root = mkdtempSync(join(tmpdir(), 'kingdown-challenge-'));
  const challenge = '.well-known/openai-apps-challenge';
  const token = Buffer.from(`${randomUUID()}\r\n`);
  try {
    mkdirSync(join(root, 'public/.well-known'), { recursive: true });
    writeFileSync(join(root, 'public', challenge), token);
    cpSync(resolve('public/sw.js'), join(root, 'public/sw.js'));
    writeFileSync(join(root, 'index.html'), '<!doctype html><title>Build check</title>');
    await build({ configFile: resolve('vite.config.ts'), root, logLevel: 'silent', envFile: false });
    expect(readFileSync(join(root, 'dist', challenge))).toEqual(token);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
