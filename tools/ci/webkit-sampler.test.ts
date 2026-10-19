import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';

it('appends system data and only WebKit process rows, with 120 command characters, every five seconds', () => {
  const dir = mkdtempSync(join(tmpdir(), 'webkit-sampler-'));
  try {
    const names = ['WebKitWebProcess', 'WebKitNetworkProcess', 'WebKitGPUProcess', 'MiniBrowser'];
    const rows = names.map((name, i) => `${100 + i} 2048 1.5 00:10 /opt/webkit/${name} ${'x'.repeat(150)}`);
    rows.push('999 1024 0.0 00:01 /usr/bin/node unrelated');
    const command = (name: string, body: string) => writeFileSync(join(dir, name), `#!/bin/sh\n${body}\n`, { mode: 0o755 });
    command('ps', `test "$*" = '-eo pid=,rss=,pcpu=,etime=,args=' || exit 2\ncat <<'ROWS'\n${rows.join('\n')}\nROWS`);
    command('date', "test \"$1\" = '+%s' || exit 2\nprintf '1234567890\\n'");
    // Stop after one block. A wrong interval has a different exit code.
    command('sleep', 'test "$1" = 5 || exit 2\nexit 1');
    const log = join(dir, 'sampler.log');
    writeFileSync(log, 'prior data\n');
    const result = spawnSync('bash', [join(import.meta.dirname, 'webkit-sampler.sh'), log], {
      env: { ...process.env, PATH: `${dir}:${process.env.PATH}` }, encoding: 'utf8', timeout: 4_000,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toBe('');
    const text = readFileSync(log, 'utf8');
    expect(text).toMatch(/^prior data\nepoch: 1234567890\n/);
    expect(text.endsWith('\n\n')).toBe(true);
    const processes = text.split('\n').filter(line => /^10[0-3] /.test(line));
    expect(processes).toEqual(names.map((name, i) => `${100 + i} 2048 1.5 00:10 ${(`/opt/webkit/${name} ${'x'.repeat(150)}`).slice(0, 120)}`));
    expect(text).not.toContain('unrelated');
    expect(text.includes('loadavg: ')).toBe(existsSync('/proc/loadavg'));
    for (const field of ['MemAvailable:', 'SwapFree:']) {
      expect(text.includes(field)).toBe(existsSync('/proc/meminfo'));
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
