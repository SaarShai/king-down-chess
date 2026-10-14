import { expect, it, vi } from 'vitest';
import { createRunClient, MAX_RUN_RESULT_BYTES } from './run-client';
import type { StudyRunSummary } from './run-types';
const receipt = (bytes: number, sha256 = '0'.repeat(64)) => ({ id: 'run-1', result: { bytes, sha256, filename: 'results.json' } }) as StudyRunSummary;
it('keeps the token in the request header and never repeats a lost approval', async () => {
  const fetcher = vi.fn().mockResolvedValueOnce(Response.json({ studioId: 'studio', token: 'private', transportVerification: 'unverified' }))
    .mockRejectedValueOnce(new Error('Reply lost'));
  const client = createRunClient(fetcher);
  await client.connect();
  await expect(client.approve('run-1', 'approval-key')).rejects.toThrow('Reply lost');
  expect(fetcher).toHaveBeenCalledTimes(2);
  const request = fetcher.mock.calls[1][1];
  expect(request.headers['x-king-down-studio']).toBe('private');
  expect(JSON.parse(request.body)).toEqual({ action: 'approve', id: 'run-1', key: 'approval-key' });
  client.close(); expect(request.signal.aborted).toBe(true);
});
it('uses the server error without discarding its message', async () => {
  const client = createRunClient(vi.fn(async () => Response.json({ error: 'Plan is stale.' }, { status: 409 })));
  await expect(client.connect()).rejects.toThrow('Plan is stale.');
});
it('cancels a streamed download as soon as it passes the size limit', async () => {
  const cancel = vi.fn(); let sent = false;
  const stream = new ReadableStream({ pull(controller) {
    if (!sent) { sent = true; controller.enqueue(new Uint8Array(MAX_RUN_RESULT_BYTES + 1)); }
  }, cancel });
  const client = createRunClient(vi.fn(async () => new Response(stream)));
  await expect(client.result(receipt(MAX_RUN_RESULT_BYTES + 1))).rejects.toThrow('at most 64 MiB');
  expect(cancel).toHaveBeenCalledOnce();
});
it('rejects corrupt results and returns only a verified export', async () => {
  const text = '{"rows":[]}';
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  const hash = Array.from(new Uint8Array(digest), value => value.toString(16).padStart(2, '0')).join('');
  const client = createRunClient(vi.fn(async () => new Response(text)));
  await expect(client.result(receipt(text.length))).rejects.toThrow('hash');
  await expect(client.result(receipt(text.length + 1, hash))).rejects.toThrow('size');
  expect(await (await client.result(receipt(text.length, hash))).text()).toBe(text);
});
it('rejects a malformed studio session', async () => {
  const client = createRunClient(vi.fn(async () => Response.json({ token: 123 })));
  await expect(client.connect()).rejects.toThrow('invalid session');
});
