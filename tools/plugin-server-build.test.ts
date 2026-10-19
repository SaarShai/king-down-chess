import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { vercelRoutes } from './plugin-server-build.mjs';

it('routes only the site API boundary to the one MCP function for every method', () => {
  const site = mkdtempSync(join(tmpdir(), 'kingdown-api-routes-'));
  try {
    const routes = vercelRoutes(site), rule = { src: '^/api(?:/.*)?$', dest: '/mcp' };
    expect(routes.filter(route => new RegExp(route.src).test('/api'))).toEqual([rule]);
    for (const path of ['/api', '/api/', '/api/games/a', '/api/games/a/commands', '/api/unknown/deep']) {
      expect(routes.filter(route => new RegExp(route.src).test(path)), path).toEqual([rule]);
    }
    for (const path of ['/apix', '/apiary', '/API', '/', '/play/', '/g/a', '/j', '/mcp', '/authorize', '/plugin-art/a.webp', '/internal/tick', '/.well-known/oauth-protected-resource']) {
      expect(new RegExp(rule.src).test(path), path).toBe(false);
    }
    expect(routes).toContainEqual({ src: '^/internal/.+$', dest: '/internal' });
    expect(routes.filter(route => route.src.startsWith('^/plugin-art/'))).toEqual(vercelRoutes());
    expect(vercelRoutes().some(route => new RegExp(route.src).test('/api'))).toBe(false);
  } finally { rmSync(site, { recursive: true, force: true }); }
});

it('keeps every isolated operation set equal to the handler route keys', () => {
  const http = readFileSync(new URL('../src/api/http.ts', import.meta.url), 'utf8');
  const keys = [...http.matchAll(/^  '([A-Z]+ \/api[^']*)':/gm)].map(match => match[1]).sort();
  expect(keys.length).toBeGreaterThan(0);
  for (const file of ['./plugin-server.mjs', '../src/api/http.test.ts', '../src/api/http.db.test.ts']) {
    const source = readFileSync(new URL(file, import.meta.url), 'utf8');
    const set = /const (?:TEST_WEB_OPERATIONS|operations) = new Set\(\[([\s\S]*?)\]\);/.exec(source)![1];
    expect([...set.matchAll(/'([^']+)'/g)].map(match => match[1]).sort(), file).toEqual(keys);
  }
});
