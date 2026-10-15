import type { InboxEntry, View } from '../match/protocol';
import { ICONS } from '../account/profile';
import { art } from './art';

// Every date in the English UI: the device locale when it is English, else en-US.
export const DATE_LOCALE = /^en(-|$)/i.test(navigator.language) ? navigator.language : 'en-US';
/** A date in DATE_LOCALE; a non-breaking space keeps AM or PM with its time. */
export const formatDate = (at: string, options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(DATE_LOCALE, options).format(new Date(at)).replace(/\s(?=[ap]\.?m\b)/i, '\u00a0');
export const waitingLine = (entry: InboxEntry) => entry.kind === 'friend' ? 'Waiting for a friend' : 'Waiting for an opponent';

export function gameDetail(entry: InboxEntry): string {
  return `${entry.seat === 0 ? 'White' : 'Black'} ·\u00a0${formatDate(entry.created_at, {month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}`;
}

export function gamesList(target: HTMLElement, entries: InboxEntry[], call: (name: string, args: Record<string, unknown>) => Promise<View | undefined>, routeView: (view: View) => unknown, now = Date.now()) {
  const icon = (name: string) => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  target.replaceChildren(...entries.map(entry => {
    const waiting = entry.status === 'waiting', yours = !waiting && entry.action === 'ready';
    const button = document.createElement('button'); button.type = 'button'; button.className = `menu-row has-lead${yours ? ' game-row' : ''}`; button.dataset.gameId = entry.game_id;
    const lead = document.createElement('span'); lead.className = waiting ? 'row-ico' : 'portrait';
    if (waiting) lead.innerHTML = icon('clock');
    else { const image = document.createElement('img'); image.alt = ''; image.src = art(ICONS[entry.opponent?.icon ?? 'spirit']); lead.append(image); }
    const title = document.createElement('span'); title.className = 'row-title';
    title.textContent = waiting ? waitingLine(entry) : entry.opponent?.computer ? `Computer · ${entry.level[0].toUpperCase() + entry.level.slice(1)}` : entry.opponent?.deleted ? 'Deleted player' : entry.opponent?.handle ?? 'Player';
    const line = document.createElement('span'); line.className = 'line';
    const hours = Math.max(0, Math.floor((now - Date.parse(entry.created_at)) / 3600000));
    line.textContent = waiting ? hours === 0 ? 'Just opened' : `Open for ${hours} ${hours === 1 ? 'hour' : 'hours'}` : entry.status === 'setup' ? yours ? 'Choose your side' : 'Waiting for the other player' : yours ? `Move ${entry.move}` : `Their turn ·\u00a0move ${entry.move}`;
    const feats = document.createElement('span'); feats.className = 'feats';
    for (const [field, name, label] of [['fairy', 'fairy', 'Fairy pieces'], ['arrangement', 'arrange', 'Arrangement'], ['classic', 'classic', 'Classic'], ['cards', 'cards', 'Cards'], ['kingPowers', 'powers', 'King powers']] as const) {
      if (entry.options?.[field]) { const feat = document.createElement('span'); feat.title = label; feat.innerHTML = icon(name); feats.append(feat); }
    }
    const detail = document.createElement('span');
    detail.textContent = `·\u00a0${gameDetail(entry)}`;
    line.append(' ', detail, feats); button.append(lead, title, line);
    if (yours) { const mark = document.createElement('b'); mark.className = 'turn-mark'; mark.textContent = 'Your turn'; button.append(mark); }
    else { const end = document.createElement('i'); end.setAttribute('aria-hidden', 'true'); end.textContent = '›'; button.append(end); }
    button.onclick = async () => { const view = await call('kingdown_resume', { game_id: entry.game_id }); if (view) routeView(view); };
    return button;
  }));
}
