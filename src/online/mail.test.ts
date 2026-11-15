import { afterEach, describe, expect, it, vi } from 'vitest';
import { deletionMail, resendSender } from './mail';

afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('deletion notice email', () => {
 it('says that the account is deleted, in short copy with no link to the deleted account', () => {
  const mail = deletionMail('p@example.com');
  expect(mail.to).toBe('p@example.com');
  expect(mail.subject).toBe('Your King Down account is deleted');
  expect(mail.text).toContain('We deleted your King Down account');
  expect(mail.text).not.toMatch(/sign in|\/g\//i);
 });

 it('posts to Resend with the key, the sender address and an idempotency key, and fails on a refusal without the address', async () => {
  expect(() => resendSender({})).toThrow('RESEND_API_KEY');
  expect(() => resendSender({ RESEND_API_KEY: 're_test' })).toThrow('KINGDOWN_MAIL_FROM');
  const fetch = vi.fn().mockResolvedValueOnce(new Response('{"id":"x"}', { status: 200 })).mockResolvedValueOnce(new Response('{"message":"to p@example.com"}', { status: 422 }));
  vi.stubGlobal('fetch', fetch);
  const send = resendSender({ RESEND_API_KEY: 're_test', KINGDOWN_MAIL_FROM: 'King Down <hello@kingdown.dev>' });
  const mail = { ...deletionMail('p@example.com'), key: 'kingdown-deletion-7' };
  await send(mail);
  const [url, init] = fetch.mock.calls[0];
  expect(url).toBe('https://api.resend.com/emails');
  expect(init.headers).toEqual({ authorization: 'Bearer re_test', 'content-type': 'application/json', 'idempotency-key': 'kingdown-deletion-7' });
  expect(JSON.parse(init.body)).toEqual({ from: 'King Down <hello@kingdown.dev>', to: ['p@example.com'], subject: mail.subject, text: mail.text });
  // The error names the status only, never the address that the body echoes.
  await expect(send(mail)).rejects.toThrow(/^Resend refused the email \(422\)$/);
  // The job's stop signal reaches the request.
  fetch.mockResolvedValueOnce(new Response('{"id":"y"}', { status: 200 }));
  const stop = new AbortController(); stop.abort();
  await send(mail, stop.signal);
  expect(fetch.mock.calls[2][1].signal.aborted).toBe(true);
  expect(fetch.mock.calls[0][1].signal.aborted).toBe(false);
 });

 // From PR 363 review 3: the provider's 10 s timeout and the job's stop signal, in both orders and at the same time.
 it.each([9999, 10_000, 10_001])('rejects once and leaves no timer when the job stops the send at %i ms', async jobMs => {
  vi.useFakeTimers();
  // The provider timer uses the test clock (the real AbortSignal.timeout uses real time).
  vi.spyOn(AbortSignal, 'timeout').mockImplementation(ms => { const c = new AbortController(); setTimeout(() => c.abort(new DOMException('timeout', 'TimeoutError')), ms); return c.signal; });
  vi.stubGlobal('fetch', vi.fn(async (_url: unknown, init: RequestInit) => new Promise<Response>((_, reject) => init.signal!.addEventListener('abort', () => reject(init.signal!.reason), { once: true }))));
  const stop = new AbortController(), timer = setTimeout(() => stop.abort(), jobMs);
  const send = resendSender({ RESEND_API_KEY: 're_test', KINGDOWN_MAIL_FROM: 'Test <test@example.com>' });
  const failed = send(deletionMail('test@example.com'), stop.signal).then(() => false, () => true);
  await vi.advanceTimersByTimeAsync(10_001);
  expect(await failed).toBe(true);
  clearTimeout(timer);
  expect(vi.getTimerCount()).toBe(0);
 });
});
