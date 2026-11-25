// Guard (guards-b): the model-name tests take their cases from MODEL_NAMES, so a name that someone
// removes from the list takes its own test with it and the lints stay green. This file pins each
// name outside the module. The words are split so that this file holds no model name.
import { expect, it } from 'vitest';
import { findModelNames, MODEL_NAMES } from './lib/model-names.mjs';

const PINNED = [
  'op' + 'us', 'son' + 'net', 'hai' + 'ku', 'fa' + 'ble', 'myth' + 'os',
  's' + 'ol', 'ast' + 'ra', 'ar' + 'gon', 'g' + 'pt', 'gem' + 'ini', 'gem' + 'ma', 'gr' + 'ok',
  'lla' + 'ma', 'mis' + 'tral', 'deep' + 'seek', 'q' + 'wen', 'ki' + 'mi',
];

it('MODEL_NAMES holds each pinned name, and the matcher finds it', () => {
  const missing = PINNED.filter(name => !MODEL_NAMES.includes(name) || findModelNames(`Ask ${name} 5.5.`).length !== 1);
  expect(missing, `tools/lib/model-names.mjs: put these names back in MODEL_NAMES (or remove a name from PINNED in tools/model-names-pinned.test.ts only by decision): ${missing.join(', ')}`).toEqual([]);
});
