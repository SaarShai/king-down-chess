import { expect, it, vi } from 'vitest';
import type { StudyClient } from './client';
import { exampleStudies } from './examples';
import { mountResultPicker } from './result-picker';
import type { ResultCatalogue } from './measurement-service';

function panel() {
  const listeners = new Map<string, (event: Event) => void>();
  const body = { innerHTML: '', classList: { add() {} }, setAttribute() {}, removeAttribute() {},
    addEventListener: (type: string, callback: (event: Event) => void) => listeners.set(type, callback),
    removeEventListener: (type: string) => listeners.delete(type),
  };
  return { body: body as unknown as HTMLElement, change(file: Blob) {
    listeners.get('change')!({ target: { matches: () => true, files: [file] } } as unknown as Event);
  } };
}
it('clears the worker at close and ignores a late open reply', async () => {
  const p = panel();
  let resolve!: (catalogue: ResultCatalogue) => void;
  const client = { openResults: vi.fn(() => new Promise<ResultCatalogue>(done => { resolve = done; })),
    clearResults: vi.fn(async () => {}), resultRows: vi.fn(),
  } as unknown as StudyClient;
  const save = vi.fn(), error = vi.fn(), clearError = vi.fn();
  const cleanup = mountResultPicker(p.body, { client, document: exampleStudies('test')[0], save, error, clearError, close: vi.fn() });
  p.change(new Blob(['{}']));
  expect(clearError).toHaveBeenCalledOnce();
  cleanup();
  expect(client.clearResults).toHaveBeenCalledOnce();
  const html = p.body.innerHTML;
  resolve({ token: 'old', source: { path: 'old.json', sha256: 'a'.repeat(64) }, total: 1, runCount: 1, runs: [{ run: 'old', count: 1 }] });
  await Promise.resolve(); await Promise.resolve();
  expect(client.resultRows).not.toHaveBeenCalled();
  expect(save).not.toHaveBeenCalled();
  expect(error).not.toHaveBeenCalled();
  expect(p.body.innerHTML).toBe(html);
  cleanup();
  expect(client.clearResults).toHaveBeenCalledOnce();
});
it('keeps the last valid catalogue when the next file fails', async () => {
  const p = panel();
  const cat = { token: 'valid', source: { path: '<valid>.json', sha256: 'a'.repeat(64) }, total: 0, runCount: 0, runs: [] };
  const client = { openResults: vi.fn().mockResolvedValueOnce(cat).mockRejectedValueOnce(new Error('Bad JSON')),
    clearResults: vi.fn(async () => {}),
  } as unknown as StudyClient;
  const error = vi.fn();
  const cleanup = mountResultPicker(p.body, { client, document: exampleStudies('test')[0], save: vi.fn(), error, clearError: vi.fn(), close: vi.fn() });
  p.change(new Blob(['{}']));
  await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
  expect(p.body.innerHTML).toContain('&lt;valid&gt;.json');
  p.change(new Blob(['bad']));
  await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
  expect(error).toHaveBeenCalledOnce();
  expect(p.body.innerHTML).toContain('&lt;valid&gt;.json');
  cleanup();
});
