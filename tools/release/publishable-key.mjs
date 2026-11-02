#!/usr/bin/env node
// Usage: node tools/release/publishable-key.mjs <site origin>
// Prints the public Supabase publishable key that the live site at that origin ships in its bundle.
// Each build needs this public value in VITE_SUPABASE_PUBLISHABLE_KEY; the live bundle is its one source of truth.
const [origin, ...extra] = process.argv.slice(2);
if (extra.length > 0 || !/^https:\/\/[a-z0-9.-]+$/.test(origin ?? '')) { console.error('usage: node tools/release/publishable-key.mjs <https origin>'); process.exit(2); }
const fetchText = async path => { const response = await fetch(origin + path); if (!response.ok) throw new Error(`${response.status} for ${path}`); return response.text(); };
try {
  // The page names the entry scripts; each script names the lazy chunks it loads (`assets/<name>-<hash>.js`).
  const page = await fetchText('/');
  const queue = [...page.matchAll(/["'](\/assets\/[^"']+\.js)["']/g)].map(match => match[1]);
  if (queue.length === 0) throw new Error('the page names no script');
  const seen = new Set(queue);
  for (const script of queue) {
    const source = await fetchText(script);
    const key = /sb_publishable_[A-Za-z0-9_-]+/.exec(source)?.[0];
    if (key) { console.log(key); process.exit(0); }
    for (const [, chunk] of source.matchAll(/["'](?:\.\/|assets\/)([^"']+\.js)["']/g)) {
      const path = `/assets/${chunk}`;
      if (!seen.has(path)) { seen.add(path); queue.push(path); }
    }
  }
  throw new Error('no publishable key in the page scripts');
} catch (error) {
  console.error(`publishable-key: ${error.message}`);
  process.exit(1);
}
