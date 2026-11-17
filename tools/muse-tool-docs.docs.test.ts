// Muse connector ticket 16, step 2: the committed tool documentation is the one that the tool listing gives.
import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import { PUBLIC_TOOL_DOCS, publicToolDocs, TOOL_DOCS, toolDocs } from './muse-tool-docs';

test('the Muse tool documentation agrees with the tool listing (after a tool change, run npm run muse:docs)', async () => {
  expect(readFileSync(TOOL_DOCS, 'utf8')).toBe(await toolDocs());
});

test('the public Muse page agrees with the tool listing and shared reference (run npm run muse:docs)', async () => {
  const html = readFileSync(PUBLIC_TOOL_DOCS, 'utf8');
  expect(html).toBe(await publicToolDocs());
  expect(html).toContain('OAuth 2.1');
  expect(html).toContain('PKCE S256');
  expect(html).toContain('public client');
  expect(html).toContain('<code>openid</code>');
  expect(html).toContain('https://utqzovjmclfyojedmwok.supabase.co/auth/v1');
  expect(html).toContain('https://kingdown.dev/.well-known/oauth-protected-resource/muse/mcp');
  expect(html).toContain('Streamable HTTP');
  expect(html).toContain('Authorization: Bearer &lt;access_token&gt;');
  expect(html).toContain('Disconnect Muse');
  expect(html).toContain('30 days');
  expect(html).toContain('mailto:hello@kingdown.dev');
  expect(html.match(/<h3>/g)).toHaveLength(6);
  expect(html.match(/<script\b|<iframe\b|https?:\/\/[^"<\s]*staging|(?:src|tools|docs)\/[^<\s]+\.(?:ts|md|mjs)|client_id|review account/i)).toBeNull();
  const support = readFileSync('public/support.html', 'utf8');
  expect(html.match(/<nav>.*<\/nav>/)?.[0]).toBe(support.match(/<nav>.*<\/nav>/)?.[0]);
});
