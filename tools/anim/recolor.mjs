#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('./recolor.py', import.meta.url));
const result = spawnSync(process.env.KINGDOWN_ANIM_PYTHON || '/usr/bin/python3', [script, ...process.argv.slice(2)], { stdio: 'inherit' });
if (result.error) { console.error(result.error.message); process.exit(1); }
process.exit(result.status ?? 1);
