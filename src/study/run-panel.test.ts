import { expect, it, vi } from 'vitest';
import { mountRunPanel } from './run-panel';
import { exampleStudies } from './examples';
import type { ResearchDocument } from './evidence';
import type { StudyClient } from './client';
function panel() {
  const listeners = new Map<string, (event: Event) => void>();
  const body = { ownerDocument: { activeElement: null }, innerHTML: '', classList: { add() {} }, setAttribute() {}, removeAttribute() {},
    addEventListener: (name: string, fn: (event: Event) => void) => listeners.set(name, fn), removeEventListener: (name: string) => listeners.delete(name) };
  return { body: body as unknown as HTMLElement, click(action: string) { listeners.get('click')!({ target: { closest: () => ({ disabled: false, dataset: { runs: action } }) } } as unknown as Event); } };
}
const settle = async () => { for (let i = 0; i < 15; i++) await Promise.resolve(); };
it('blocks a second approval and ignores a late reply after close', async () => {
  let reply!: (response: Response) => void;
  const fetcher = vi.fn().mockResolvedValueOnce(Response.json({ studioId: 'studio', token: 'token', transportVerification: 'unverified' }))
    .mockResolvedValueOnce(Response.json([{ id: 'run', recipe: 'activity', source: 'source', commit: 'commit', bundleHash: 'bundle', planFingerprint: 'plan', phase: 'prepared', study: { title: 'Study', version: 1 }, games: 2, blocks: 1, parts: [], validation: { state: 'pending', message: '' }, backup: { state: 'pending', message: '' }, approvalText: 'Exact approval' }]))
    .mockImplementationOnce(() => new Promise<Response>(resolve => { reply = resolve; }));
  vi.stubGlobal('fetch', fetcher);
  const p = panel(), error = vi.fn();
  const document: ResearchDocument = { schema: 'kingdown-research/1', document: exampleStudies('test')[0], plan: null, evidence: [] };
  const cleanup = mountRunPanel(p.body, { document, saved: true, studyClient: {} as StudyClient, close: vi.fn(), error, clearError: vi.fn(), link: vi.fn(), openDocument: vi.fn() });
  await settle(); p.click('approve'); p.click('approve');
  expect(fetcher).toHaveBeenCalledTimes(3);
  cleanup(); const html = p.body.innerHTML;
  reply(Response.json({})); await settle();
  expect(p.body.innerHTML).toBe(html); expect(error).not.toHaveBeenCalled();
  vi.unstubAllGlobals();
});
