import { ruleNames } from '../account-game/features';
import { copyText } from '../clipboard';
import type { Options } from '../match/setup';

// Codes stay in page memory. A remount must not end an invite by making a new one.
type PageInvite = { code: string; expires_at: string; invite_id?: string; replaced?: boolean };
export const friendInvites = new Map<string, PageInvite>();
/** Only accepted server reads can revoke a page's cached code. Keep the entry so entry never renews it. */
export function syncFriendInvites(entries: { game_id: string; invite_id?: string | null }[]) {
  for (const entry of entries) {
    const invite = friendInvites.get(entry.game_id);
    if (invite?.invite_id && entry.invite_id !== undefined && invite.invite_id !== entry.invite_id) invite.replaced = true;
  }
}
export const inviteText = (code: string, options: Options | null | undefined) => `Join King Down game ${code}. Rules: ${ruleNames(options)}.`;

export async function sendInvite(invite: PageInvite, options: Options | null | undefined, status: HTMLElement, share = true) {
  if (invite.replaced) { status.textContent = 'This code was replaced. Open the game to make a new code.'; return; }
  if (!(Date.parse(invite.expires_at) > Date.now())) { status.textContent = 'This code has expired. Open the game to make a new code.'; return; }
  const text = inviteText(invite.code, options);
  status.textContent = '';
  if (share && navigator.share) {
    try { await navigator.share({ text }); status.textContent = 'Shared'; return; }
    catch (error) { if (error instanceof Error && error.name === 'AbortError') return; }
  }
  if (await copyText(text)) { status.textContent = 'Copied'; return; }
  const message = document.createElement('span'); message.textContent = text;
  status.append('Select the invite and copy it: ', message);
  const range = document.createRange(); range.selectNodeContents(message);
  const selection = getSelection(); selection?.removeAllRanges(); selection?.addRange(range);
}

/** Add the current invite to each waiting friend row. */
export function decorateFriendRows(entries: import('../match/protocol').InboxEntry[], now = Date.now()) {
  const rows = new Map(Array.from(document.querySelectorAll<HTMLButtonElement>('#games-list [data-game-id]'), row => [row.dataset.gameId, row]));
  for (const entry of entries) {
    const button = rows.get(entry.game_id);
    if (!button || button.parentElement?.classList.contains('friend-invite-row')) continue;
    const line = button.querySelector<HTMLElement>('.line')!;
    const waiting = entry.status === 'waiting';
    const invite = waiting && entry.kind === 'friend' ? friendInvites.get(entry.game_id) : undefined;
    if (invite && !invite.replaced && Date.parse(invite.expires_at) > now) {
      line.prepend(`${invite.code} · `);
      const group = document.createElement('div'); group.className = 'friend-invite-row';
      const share = document.createElement('button'); share.type = 'button'; share.textContent = 'Share';
      share.setAttribute('aria-label', `Share game ${invite.code}`);
      const status = document.createElement('p'); status.className = 'quiet-line'; status.setAttribute('role', 'status');
      share.onclick = () => void sendInvite(invite, entry.options, status);
      button.replaceWith(group); group.append(button, share, status);
    }
  }
}
