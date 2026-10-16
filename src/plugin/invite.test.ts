import { afterEach, expect, it, vi } from 'vitest';
import { copyText } from '../clipboard';
import { DEFAULT_OPTIONS } from '../match/setup';
import { inviteText, sendInvite } from './invite';

vi.mock('../clipboard', () => ({ copyText: vi.fn() }));
afterEach(() => { vi.unstubAllGlobals(); vi.resetAllMocks(); });
const status = () => ({ textContent: '' }) as HTMLElement;

it('names each enabled rule in the full invite', () => {
  expect(inviteText('K7QX2M', { ...DEFAULT_OPTIONS, fairy: true, arrangement: true, classic: true, cards: true, kingPowers: true })).toBe('Join King Down game K7QX2M. Rules: Fairy pieces, Arrangement, Classic chess, Cards, King powers.');
  expect(inviteText('K7QX2M', { ...DEFAULT_OPTIONS, fairy: false, arrangement: false, classic: true, cards: false, kingPowers: false })).toBe('Join King Down game K7QX2M. Rules: Classic chess.');
  expect(inviteText('K7QX2M', null)).toBe('Join King Down game K7QX2M. Rules: Standard pieces.');
});
it('shares the full text through the device share sheet', async () => {
  const share = vi.fn().mockResolvedValue(undefined), result = status();
  vi.stubGlobal('navigator', { share });
  await sendInvite('Full invite', result);
  expect(share).toHaveBeenCalledWith({ text: 'Full invite' });
  expect(copyText).not.toHaveBeenCalled();
  expect(result.textContent).toBe('Shared');
});
it('copies when Share is absent or refuses', async () => {
  vi.mocked(copyText).mockResolvedValue(true);
  for (const navigator of [{}, { share: vi.fn().mockRejectedValue(new Error('Denied')) }]) {
    vi.stubGlobal('navigator', navigator);
    const result = status(); await sendInvite('Full invite', result);
    expect(copyText).toHaveBeenLastCalledWith('Full invite');
    expect(result.textContent).toBe('Copied');
  }
});
it('leaves the clipboard alone when the player cancels Share', async () => {
  vi.stubGlobal('navigator', { share: vi.fn().mockRejectedValue(new DOMException('Cancelled', 'AbortError')) });
  const result = status(); await sendInvite('Full invite', result);
  expect(copyText).not.toHaveBeenCalled();
  expect(result.textContent).toBe('');
});
it('Copy copies the full text even when Share is present', async () => {
  const share = vi.fn(); vi.stubGlobal('navigator', { share });
  vi.mocked(copyText).mockResolvedValue(true);
  const result = status(); await sendInvite('Full invite', result, false);
  expect(share).not.toHaveBeenCalled();
  expect(copyText).toHaveBeenCalledWith('Full invite');
  expect(result.textContent).toBe('Copied');
});
