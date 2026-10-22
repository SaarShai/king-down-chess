import { afterEach, expect, it } from 'vitest';
import { parseSq, Q, type Position } from './engine';
import { fromFen, startPosition } from './setup';
import { parseKings, setRules } from './rules';
import { combine, positionKey } from './position-key';

afterEach(() => setRules());

function keyVectors(): number[] {
  setRules();
  const keys = [positionKey(startPosition('RALSKMOG'))];
  setRules({ classicChess: true });
  keys.push(positionKey(fromFen('r3k2r/8/8/3pP3/8/8/8/R3K2R w KQkq d6 0 1')));
  setRules({ hands: [['Mirror', 'Sacrifice', 'Freeze'], ['Salvation', 'Growth']] });
  const lost = Array<number>(32).fill(0); lost[Q] = 2; lost[16 + Q] = 1;
  const pos: Position = { ...fromFen('4k3/8/8/8/8/2N5/8/4K3 w - - 0 1'),
    used: [5, 2], lost, waiting: [2, 1], last: ['Haste', 'Freeze'], drawn: [3, 2],
    marks: [{ sq: parseSq('d4'), left: 2, ward: true, all: true }, { sq: parseSq('e5'), left: 0 }],
    free: true, haste: parseSq('c3'), rage: 3 };
  keys.push(positionKey(pos), positionKey({ ...pos, turn: 1 }));
  setRules({ kings: parseKings('frost:freeze,stratus:sacrifice') });
  keys.push(positionKey({ ...pos, used: [2, 1] }));
  return keys;
}

it('preserves fixed position keys from the pre-extraction implementation', () => {
  expect(keyVectors()).toEqual([3421094976247672, 947218477785984, 1224918064551721, 3435316818737690, 3828908314037375]);
});

it('writes the complete key into caller-owned scratch without changing another buffer', () => {
  const pos = startPosition('RALSKMOG'), first = new Int32Array(2), second = new Int32Array(2);
  const key = positionKey(pos, first), saved = first.slice();
  expect(combine(first[0], first[1])).toBe(key);
  expect(positionKey({ ...pos, turn: 1 }, second)).not.toBe(key);
  expect(combine(second[0], second[1])).toBe(positionKey({ ...pos, turn: 1 }));
  expect(first).toEqual(saved);
});
