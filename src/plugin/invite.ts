import { ruleNames } from '../account-game/features';
import { copyText } from '../clipboard';
import type { Options } from '../match/setup';
import { accountPath } from '../online/routes';

// Codes stay in page memory. A remount must not end an invite by making a new one. `url`: the web API's invite link.
type PageInvite = { code: string; expires_at: string; invite_id?: string; replaced?: boolean; url?: string };
export const friendInvites = new Map<string, PageInvite>();
/** Only accepted server reads can revoke a page's cached code. Keep the entry so entry never renews it. */
export function syncFriendInvites(entries: { game_id: string; invite_id?: string | null }[]) {
  let changed = false;
  for (const entry of entries) {
    const invite = friendInvites.get(entry.game_id);
    if (invite?.invite_id && !invite.replaced && entry.invite_id !== undefined && invite.invite_id !== entry.invite_id) { invite.replaced = true; changed = true; }
  }
  return changed;
}
/**
 * The invite link: the web API's `url`, else this site's `/j#<code>`. Code typing and code tiles are parked
 * (docs/PARKED.md), so the code reaches the friend only inside this link.
 */
export const inviteLink = (invite: Pick<PageInvite, 'code' | 'url'>, origin = globalThis.location?.origin ?? '') =>
  invite.url ?? `${origin}${accountPath({ screen: 'join', key: invite.code })}`;
export const inviteText = (link: string, options: Options | null | undefined) => `Join my King Down game: ${link} Rules: ${ruleNames(options)}.`;

export async function sendInvite(invite: PageInvite, options: Options | null | undefined, status: HTMLElement, share = true) {
  if (!(Date.parse(invite.expires_at) > Date.now())) { status.textContent = 'This invite link has expired. Start a new game to invite your friend.'; return; }
  if (invite.replaced) { status.textContent = 'This invite link was replaced. Open the game to make a new link.'; return; }
  const text = inviteText(inviteLink(invite), options);
  status.textContent = '';
  if (share && navigator.share) {
    try { await navigator.share({ text }); status.textContent = 'Shared'; return; }
    catch (error) { if (error instanceof Error && error.name === 'AbortError') return; }
  }
  if (await copyText(text)) { status.textContent = 'Copied'; return 'copied' as const; }
  const message = document.createElement('span'); message.textContent = text;
  status.append('Select the invite link and copy it: ', message);
  const range = document.createRange(); range.selectNodeContents(message);
  const selection = getSelection(); selection?.removeAllRanges(); selection?.addRange(range);
}

/** Add the current invite to each waiting friend row. */
export function decorateFriendRows(entries: import('../match/protocol').InboxEntry[], now = Date.now()) {
  const rows = new Map(Array.from(document.querySelectorAll<HTMLButtonElement>('#games-list [data-game-id]'), row => [row.dataset.gameId, row]));
  for (const entry of entries) {
    const button = rows.get(entry.game_id);
    if (!button || button.parentElement?.classList.contains('friend-invite-row')) continue;
    const waiting = entry.status === 'waiting';
    const invite = waiting && entry.kind === 'friend' ? friendInvites.get(entry.game_id) : undefined;
    if (invite && !invite.replaced && Date.parse(invite.expires_at) > now) {
      const group = document.createElement('div'); group.className = 'friend-invite-row';
      const share = document.createElement('button'); share.type = 'button'; share.textContent = 'Share';
      share.setAttribute('aria-label', 'Share the invite link');
      const status = document.createElement('p'); status.className = 'quiet-line'; status.setAttribute('role', 'status');
      share.onclick = () => void sendInvite(invite, entry.options, status);
      button.replaceWith(group); group.append(button, share, status);
    }
  }
}
