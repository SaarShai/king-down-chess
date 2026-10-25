import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { sourceErrorForms } from './error-forms.mjs';

it('reads source error literals and replaces template holes without reading tests', () => {
 const dir = mkdtempSync(join(tmpdir(), 'error-forms-'));
 try {
  mkdirSync(join(dir, 'child'));
  writeFileSync(join(dir, 'child/source.ts'), "throw new Error('Fixed error'); throw new TypeError(`bad FEN ${fen}`); throw failure('INVALID_INPUT', 400, 'Bad input'); const error = new Error('Promise fault'); fail('INVALID_INPUT', 400, 'Invalid game setup'); throw failure('DYNAMIC_CODE', 400, value); throw new Error('Fixed error', { cause });");
  writeFileSync(join(dir, 'source.test.ts'), "throw new Error('Private fixture');");
  expect(sourceErrorForms(dir)).toEqual([['bad FEN ', ''], ['Bad input'], ['Fixed error'], ['Invalid game setup'], ['Promise fault']]);
 } finally { rmSync(dir, { recursive: true, force: true }); }
});
