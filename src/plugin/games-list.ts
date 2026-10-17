import type { InboxEntry, View } from '../match/protocol';
import { ICONS } from '../account/profile';
import { art } from './art';
import { friendInvites, inviteText, sendInvite } from './invite';
import { features } from './screens/friend';

// Every date in the English UI: the device locale when it is English, else en-US.
export const DATE_LOCALE = /^en(-|$)/i.test(navigator.language) ? navigator.language : 'en-US';
/** A date in DATE_LOCALE; a non-breaking space keeps AM or PM with its time. */
export const formatDate = (at: string, options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(DATE_LOCALE, options).format(new Date(at)).replace(/\s(?=[ap]\.?m\b)/i, '\u00a0');
export const waitingLine = (entry: Pick<InboxEntry, 'kind'>) => entry.kind === 'friend' ? 'Waiting for a friend' : 'Waiting for an opponent';

export function gameDetail(entry: InboxEntry): string {
  return `${entry.seat === 0 ? 'White' : 'Black'} ·\u00a0${formatDate(entry.created_at, {month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}`;
}

export const gameTitle = (entry: Pick<View, 'opponent' | 'level'>) => entry.opponent?.computer ? entry.level ? `Computer · ${entry.level[0].toUpperCase() + entry.level.slice(1)}` : 'Computer' : entry.opponent?.deleted ? 'Deleted player' : entry.opponent?.handle ?? 'Player';
export function gamesList(target: HTMLElement, entries: InboxEntry[], call: (name: string, args: Record<string, unknown>) => Promise<View | undefined>, routeView: (view: View) => unknown, now = Date.now()) {
  const icon = (name: string) => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  target.replaceChildren(...entries.map(entry => {
    const waiting = entry.status === 'waiting', yours = !waiting && entry.action === 'ready';
    const button = document.createElement('button'); button.type = 'button'; button.className = `menu-row has-lead${yours ? ' game-row' : ''}`; button.dataset.gameId = entry.game_id;
    const lead = document.createElement('span'); lead.className = waiting ? 'row-ico' : 'portrait';
    if (waiting) lead.innerHTML = icon('clock');
    else { const image = document.createElement('img'); image.alt = ''; image.src = art(ICONS[entry.opponent?.icon ?? 'spirit']); lead.append(image); }
    const title = document.createElement('span'); title.className = 'row-title';
    title.textContent = waiting ? waitingLine(entry) : gameTitle(entry);
    const line = document.createElement('span'); line.className = 'line';
    const hours = Math.max(0, Math.floor((now - Date.parse(entry.created_at)) / 3600000));
    line.textContent = waiting ? hours === 0 ? 'Just opened' : `Open for ${hours} ${hours === 1 ? 'hour' : 'hours'}` : entry.status === 'setup' ? yours ? 'Choose your side' : 'Waiting for the other player' : yours ? `Move ${entry.move}` : `Their turn ·\u00a0move ${entry.move}`;
    const feats = features(entry.options);
    const detail = document.createElement('span');
    detail.textContent = gameDetail(entry);
    const dot = document.createElement('span'); dot.textContent = '·';
    const info = document.createElement('span'); info.className = 'game-detail'; info.append(dot, ' ', detail);
    line.append(' ', info, feats); button.append(lead, title, line);
    if (yours) { const mark = document.createElement('b'); mark.className = 'turn-mark'; mark.textContent = 'Your turn'; button.append(mark); }
    else { const end = document.createElement('i'); end.setAttribute('aria-hidden', 'true'); end.textContent = '›'; button.append(end); }
    button.onclick = async () => { const view = await call('kingdown_resume', { game_id: entry.game_id }); if (view) routeView(view); };
    const invite = waiting && entry.kind === 'friend' ? friendInvites.get(entry.game_id) : undefined;
    if (invite && Date.parse(invite.expires_at) > now) {
      line.prepend(`${invite.code} · `);
      const group = document.createElement('div'); group.className = 'friend-invite-row';
      const share = document.createElement('button'); share.type = 'button'; share.textContent = 'Share';
      share.setAttribute('aria-label', `Share game ${invite.code}`);
      const status = document.createElement('p'); status.className = 'quiet-line'; status.setAttribute('role', 'status');
      share.onclick = () => void sendInvite(inviteText(invite.code, entry.options), status);
      group.append(button, share, status); return group;
    }
    return button;
  }));
}
