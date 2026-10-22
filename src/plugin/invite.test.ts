import { afterEach, expect, it, vi } from 'vitest';
import { copyText } from '../clipboard';
import { DEFAULT_OPTIONS } from '../match/setup';
import { inviteText, sendInvite } from './invite';
import * as invites from './invite';

vi.mock('../clipboard', () => ({ copyText: vi.fn() }));
afterEach(() => { vi.unstubAllGlobals(); vi.resetAllMocks(); invites.friendInvites.clear(); });
const invite = () => ({ code: 'ABC234', expires_at: new Date(Date.now() + 1000).toISOString() });
const text = 'Join King Down game ABC234. Rules: Standard pieces.';
const status = () => ({ textContent: '' }) as HTMLElement;

it('names each enabled rule in the full invite', () => {
  expect(inviteText('K7QX2M', { ...DEFAULT_OPTIONS, fairy: true, arrangement: true, classic: true, cards: true, kingPowers: true })).toBe('Join King Down game K7QX2M. Rules: Fairy pieces, Arrangement, Classic chess, Cards, King powers.');
  expect(inviteText('K7QX2M', { ...DEFAULT_OPTIONS, fairy: false, arrangement: false, classic: true, cards: false, kingPowers: false })).toBe('Join King Down game K7QX2M. Rules: Classic chess.');
  expect(inviteText('K7QX2M', null)).toBe('Join King Down game K7QX2M. Rules: Standard pieces.');
});
it('shares the full text through the device share sheet', async () => {
  const share = vi.fn().mockResolvedValue(undefined), result = status();
  vi.stubGlobal('navigator', { share });
  await sendInvite(invite(), null, result);
  expect(share).toHaveBeenCalledWith({ text });
  expect(copyText).not.toHaveBeenCalled();
  expect(result.textContent).toBe('Shared');
});
it('copies when Share is absent or refuses', async () => {
  vi.mocked(copyText).mockResolvedValue(true);
  for (const navigator of [{}, { share: vi.fn().mockRejectedValue(new Error('Denied')) }]) {
    vi.stubGlobal('navigator', navigator);
    const result = status(); await sendInvite(invite(), null, result);
    expect(copyText).toHaveBeenLastCalledWith(text);
    expect(result.textContent).toBe('Copied');
  }
});
it('leaves the clipboard alone when the player cancels Share', async () => {
  vi.stubGlobal('navigator', { share: vi.fn().mockRejectedValue(new DOMException('Cancelled', 'AbortError')) });
  const result = status(); await sendInvite(invite(), null, result);
  expect(copyText).not.toHaveBeenCalled();
  expect(result.textContent).toBe('');
});
it('Copy copies the full text even when Share is present', async () => {
  const share = vi.fn(); vi.stubGlobal('navigator', { share });
  vi.mocked(copyText).mockResolvedValue(true);
  const result = status(); await sendInvite(invite(), null, result, false);
  expect(share).not.toHaveBeenCalled();
  expect(copyText).toHaveBeenCalledWith(text);
  expect(result.textContent).toBe('Copied');
});

it.each([true, false])('does not share or copy an expired code (Share: %s)', async sharing => {
  const share = vi.fn(), result = status(); vi.stubGlobal('navigator', { share });
  await sendInvite({ code: 'OLD234', expires_at: new Date(Date.now() - 1).toISOString() }, null, result, sharing);
  expect(share).not.toHaveBeenCalled(); expect(copyText).not.toHaveBeenCalled();
  expect(result.textContent).toContain('expired');
});

it.each([true, false])('blocks a retained invite action after a server read reports replacement (Share: %s)', async sharing => {
  const saved = { ...invite(), invite_id: 'old' }, share = vi.fn(), result = status();
  invites.friendInvites.set('friend', saved); vi.stubGlobal('navigator', { share });
  invites.syncFriendInvites([{ game_id: 'friend', invite_id: 'new' }]);
  await sendInvite(saved, null, result, sharing);
  expect(share).not.toHaveBeenCalled(); expect(copyText).not.toHaveBeenCalled();
  expect(result.textContent).toContain('replaced');
});

it('keeps the current code through missing metadata and invalidates only its own game', () => {
  const saved = { ...invite(), invite_id: 'current' };
  invites.friendInvites.set('friend', saved);
  const sync = invites.syncFriendInvites;
  sync([{ game_id: 'other', invite_id: 'changed' }, { game_id: 'friend' }, { game_id: 'friend', invite_id: 'current' }]);
  expect(saved).not.toHaveProperty('replaced');
  sync([{ game_id: 'friend', invite_id: null }]);
  expect(saved).toHaveProperty('replaced', true);
});
