import { ruleNames } from '../account-game/features';
import { copyText } from '../clipboard';
import type { Options } from '../match/setup';

// Codes stay in page memory. A remount must not end an invite by making a new one.
export const friendInvites = new Map<string, { code: string; expires_at: string }>();
export const inviteText = (code: string, options: Options | null | undefined) => `Join King Down game ${code}. Rules: ${ruleNames(options)}.`;

export async function sendInvite(invite: { code: string; expires_at: string }, options: Options | null | undefined, status: HTMLElement, share = true) {
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
    if (invite && Date.parse(invite.expires_at) > now) {
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
