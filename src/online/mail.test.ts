import { afterEach, describe, expect, it, vi } from 'vitest';
import { alertMail, resendSender } from './mail';

const now = new Date('2026-10-10T12:00:00Z'), gameId = '11111111-1111-4111-8111-111111111111';
afterEach(() => vi.unstubAllGlobals());

describe('alert emails', () => {
 it('names the opponent, the time left and the game link, in short copy', () => {
  const turn = alertMail('turn', { to: 'p@example.com', gameId, opponent: 'ann_the_longest_hdl1', deadline: new Date(now.getTime() + 52 * 3_600_000), now });
  expect(turn.subject).toBe('Your move against @ann_the_longest_hdl1');
  expect(turn.subject.length).toBeLessThanOrEqual(60);
  expect(turn.text).toContain('2 days 4 h'); expect(turn.text).toContain(`https://kingdown.dev/g/${gameId}`);
  expect(turn.html).toContain(`<a href="https://kingdown.dev/g/${gameId}">`);
  const reminder = alertMail('reminder', { to: 'p@example.com', gameId, opponent: null, deadline: new Date(now.getTime() + 30 * 60_000), now });
  expect([reminder.subject, reminder.text.split('\n')[0]]).toEqual(['Time almost up against your opponent', 'Your move against your opponent in King Down: less than 1 h left.']);
 });

 it('posts to Resend with the key, the sender address and an idempotency key, and fails on a refusal', async () => {
  expect(() => resendSender({})).toThrow('RESEND_API_KEY');
  const fetch = vi.fn().mockResolvedValueOnce(new Response('{"id":"x"}', { status: 200 })).mockResolvedValueOnce(new Response('{"message":"to p@example.com"}', { status: 422 }));
  vi.stubGlobal('fetch', fetch);
  const send = resendSender({ RESEND_API_KEY: 're_test', KINGDOWN_MAIL_FROM: 'King Down <alerts@kingdown.dev>' });
  const mail = { to: 'p@example.com', subject: 'Your move', text: 'text', html: '<p>html</p>', key: 'kingdown-outbox-7' };
  await send(mail);
  const [url, init] = fetch.mock.calls[0];
  expect(url).toBe('https://api.resend.com/emails');
  expect(init.headers).toEqual({ authorization: 'Bearer re_test', 'content-type': 'application/json', 'idempotency-key': 'kingdown-outbox-7' });
  expect(JSON.parse(init.body)).toEqual({ from: 'King Down <alerts@kingdown.dev>', to: ['p@example.com'], subject: 'Your move', text: 'text', html: '<p>html</p>' });
  // The error names the status only, never the address that the body echoes.
  await expect(send(mail)).rejects.toThrow(/^Resend refused the email \(422\)$/);
 });
});
