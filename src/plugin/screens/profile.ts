import { call, client, routeView } from '../app';
import { art, symbols } from '../art';
import { gamesList } from '../games-list';
import { WHY } from '../ending';
import { ICONS, type Icon } from '../../account/profile';
import type { HistoryEntry, InboxEntry, PlayerRecord } from '../../match/protocol';
import './profile.css';
type Profile = { handle: string | null; icon: Icon | null; record: PlayerRecord; history: HistoryEntry[]; next_before: string | null };
const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id)! as T;
let request = 0;
let before: string | null = null;
const date = (at: string) => new Date(at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
export function profileScreen() { $('profile-more').onclick = () => { if (before) void readProfile(before); }; void readProfile(); }
async function readProfile(cursor?: string) {
  const reading = ++request;
  $('profile-status').textContent = 'Loading profile…';
  try {
    $('profile-more').setAttribute('disabled', '');
    const [result, games] = await Promise.all([client.call('kingdown_profile', cursor ? { before: cursor } : {}), cursor ? undefined : client.call('kingdown_games')]);
    if (reading !== request || client.state.screen !== 'profile') return;
    if (result.isError) throw new Error(result.content.filter(c => c.type === 'text').map(c => c.text).join(' '));
    if (games?.isError) throw new Error(games.content.filter(c => c.type === 'text').map(c => c.text).join(' '));
    const profile = result._meta as Profile, { record } = profile;
    $('page-title').textContent = profile.handle ?? 'Profile';
    $<HTMLImageElement>('profile-picture').src = art(ICONS[profile.icon ?? 'spirit']);
    $('profile-rating').querySelector('b')!.textContent = String(Math.round(record.rating.rating));
    $('profile-rating').querySelector<HTMLElement>('.q')!.hidden = !record.rating.provisional;
    $('profile-rating-help').textContent = record.rating.provisional ? 'Rating · new until you play more games with people' : 'Rating';
    $('profile-totals').replaceChildren(...Object.entries(record.totals).map(([label, total]) => {
      const cell = document.createElement('div'), number = document.createElement('b'), name = document.createElement('span');
      number.textContent = String(total); name.textContent = label; cell.append(number, name); return cell;
    }));
    $('profile-sheet').querySelector<HTMLElement>('.scroll')!.style.borderImageSource = `url("${art('assets/scroll.webp')}")`;
    if (games) gamesList($('profile-open'), games._meta!.games as InboxEntry[], (name, args) => call(name, args, false, false, false), routeView);
    if (!cursor) { $('profile-history').replaceChildren(); $('profile-sheet').querySelector('.registry')!.scrollTop = 0; }
    $('profile-history').append(...profile.history.map(historyRow));
    before = profile.next_before; $('profile-more').hidden = before === null;
    $('profile-status').textContent = '';
  } catch (error) { if (reading === request && client.state.screen === 'profile') $('profile-status').textContent = String(error); }
  finally { if (reading === request) $('profile-more').removeAttribute('disabled'); }
}
function historyRow(entry: HistoryEntry) {
  const row = document.createElement('li'); row.dataset.gameId = entry.game_id;
  const when = document.createElement('time'); when.className = 'when'; when.dateTime = entry.finished_at; when.textContent = date(entry.finished_at);
  const colour = document.createElement('img'); colour.className = 'pi'; colour.alt = `${entry.colour} king`; colour.src = entry.colour === 'white' ? art('ui/icons/king.svg') : symbols['../../public/ui/icons/king.svg'][1];
  const player = document.createElement('span'); player.className = 'grow';
  const name = document.createElement('b'); name.textContent = entry.opponent.computer ? `Computer${entry.opponent.level ? ` · ${entry.opponent.level[0].toUpperCase()}${entry.opponent.level.slice(1)}` : ''}` : entry.opponent.deleted ? 'Deleted player' : entry.opponent.handle ?? 'A player';
  const reason = document.createElement('small'); reason.textContent = WHY[entry.reason]; player.append(name, reason);
  const feats = document.createElement('span'); feats.className = 'feats';
  const labels: string[] = [];
  for (const [field, icon, label] of [['fairy', 'fairy', 'Fairy pieces'], ['arrangement', 'arrange', 'Arrangement'], ['classic', 'classic', 'Classic'], ['cards', 'cards', 'Cards'], ['powers', 'powers', 'King powers']] as const) {
    if (entry.features[field]) { labels.push(label); feats.insertAdjacentHTML('beforeend', `<svg class="icon" aria-hidden="true"><use href="#i-${icon}"/></svg>`); }
  }
  feats.setAttribute('aria-label', labels.join(', '));
  const res = document.createElement('span'), letter = { won: 'W', drawn: 'D', lost: 'L' }[entry.result]; res.className = `res res-${letter.toLowerCase()}`; res.textContent = letter; res.setAttribute('aria-label', entry.result);
  row.append(when, colour, player, feats, res); return row;
}
