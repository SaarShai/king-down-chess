// Ticket 55 measurement. Use NODE_OPTIONS=--import with this file. Sample only the plugin-ui check.
// The process RSS method comes from ticket 53 (2e5a1dae). Read process names, never environments.
import { execFileSync } from 'node:child_process';

if ((process.argv[1] ?? '').endsWith('plugin-ui-check.mjs')) {
  const start = Date.now(), peak = {};
  const log = console.log;
  console.log = (...args) => log(`[measure ${((Date.now() - start) / 1000).toFixed(1)}s]`, ...args);
  const sample = () => {
    const mem = {};
    const rows = execFileSync('ps', process.platform === 'linux' ? ['-eo', 'rss=,comm='] : ['-axo', 'rss=,comm='], { encoding: 'utf8' });
    for (const row of rows.split('\n')) {
      const match = row.match(/^\s*(\d+)\s+(.+)$/);
      if (!match || !/WebKit|WebProcess|NetworkProcess|GPUProcess|WPE/.test(match[2])) continue;
      const name = match[2].split('/').pop();
      mem[name] = (mem[name] ?? 0) + Math.round(Number(match[1]) / 1024);
    }
    for (const [name, mb] of Object.entries(mem)) peak[name] = Math.max(peak[name] ?? 0, mb);
    console.log(`WebKit RSS MiB: ${JSON.stringify(mem)} peak=${JSON.stringify(peak)}`);
  };
  setInterval(sample, 5000).unref();
}
