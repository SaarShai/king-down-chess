import { describe, expect, it } from 'vitest';
import { metadata, validateArchives } from './kaggle/kaggle.mjs';

describe('private Kaggle animation run', () => {
  it('sets the private GPU and input sources', () => {
    const m = metadata('example', 0, 2);
    expect(m.is_private).toBe(true);
    expect(m.enable_gpu).toBe(true);
    expect(m.enable_internet).toBe(false);
    expect(m.dataset_sources).toEqual(['example/kd-anim-movement-keys-20261030']);
    expect(m.model_sources).toEqual(['google/film/tensorFlow2/film/1']);
    expect(() => metadata('example', 2, 2)).toThrow();
  });

  it('rejects a pull that misses a results archive', () => {
    expect(() => validateArchives({ exit: 0, entries: 33 }, ['results-00.tar'])).toThrow();
    expect(() => validateArchives({ exit: 0, entries: 33 }, ['results-00.tar', 'results-01.tar'])).not.toThrow();
  });
});
