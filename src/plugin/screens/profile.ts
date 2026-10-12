import { call, client, navigate, routeView } from '../app';
import { art, symbols } from '../art';
import { gamesList } from '../games-list';
import { WHY } from '../ending';
import { BADGES, type Badge } from '../../match/badges';
import { ICONS, type Icon } from '../../account/profile';
import type { HistoryEntry, InboxEntry, PlayerRecord } from '../../match/protocol';
import './profile.css';
type Profile = { handle: string | null; icon: Icon | null; record: PlayerRecord; history: HistoryEntry[]; next_before: string | null };
const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id)! as T;
let request = 0;
let before: string | null = null;
const date = (at: string) => new Date(at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const fullDate = (at: string) => new Date(at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const GOALS: Record<Badge, string> = { first_win: 'Win a game.', friend_match: 'Finish a game with a friend.', stranger_match: 'Finish a game with a random player.', purist: 'Win a Classic game.', fairy_tale: 'Win with fairy pieces.', architect: 'Win with your own arrangement.', card_sharp: 'Win a game with cards.', crowned: 'Win with a king power.', royal_collection: 'Win with all six kings.', giant_slayer: 'Beat the Strong computer.' };
const badgeArt = (badge: Badge) => art(`assets/badge-${badge.replaceAll('_', '-')}.webp`);
export function profileScreen() { $('profile-name').onclick = () => navigate('handle'); $('profile-more').onclick = () => { if (before) void readProfile(before); }; void readProfile(); }
async function readProfile(cursor?: string) {
  const reading = ++request;
  if (!cursor) { before = null; $('profile-more').hidden = true; }
  // Keep the rollers in view while More waits.
  $('profile-status').textContent = cursor ? '' : 'Loading profile…';
  try {
    $('profile-more').setAttribute('disabled', '');
    const [result, games] = await Promise.all([client.call('kingdown_profile', cursor ? { before: cursor } : {}), cursor ? undefined : client.call('kingdown_games')]);
    if (reading !== request || client.state.screen !== 'profile') return;
    if (result.isError) throw new Error(result.content.filter(c => c.type === 'text').map(c => c.text).join(' '));
    if (games?.isError) throw new Error(games.content.filter(c => c.type === 'text').map(c => c.text).join(' '));
    const profile = result._meta as Profile, { record } = profile;
    $('page-title').textContent = profile.handle ?? 'Profile';
    $('profile-name').hidden = profile.handle !== null;
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
    renderBadges(record);
    $('profile-status').textContent = '';
  } catch (error) { if (reading === request && client.state.screen === 'profile') $('profile-status').textContent = String(error); }
  finally { if (reading === request) $('profile-more').removeAttribute('disabled'); }
}
function renderBadges(record: PlayerRecord) {
  $('profile-badge-count').textContent = `${record.badges.length} of 10`;
  $('profile-badges').replaceChildren(...(Object.keys(BADGES) as Badge[]).map(badge => {
    const earned = record.badges.find(item => item.badge === badge), detail = earned ? `Earned ${fullDate(earned.earned_at)}` : GOALS[badge];
    const figure = document.createElement('figure'); figure.className = `badge${earned ? '' : ' no'}`; figure.dataset.badge = badge;
    const button = document.createElement('button'); button.type = 'button'; button.setAttribute('aria-label', `${BADGES[badge]}. ${detail}`);
    const image = document.createElement('img'); image.src = badgeArt(badge); image.alt = ''; button.append(image); button.onclick = () => showBadge(badge, detail);
    const caption = document.createElement('figcaption'); caption.textContent = BADGES[badge];
    if (earned) { const when = document.createElement('time'); when.dateTime = earned.earned_at; when.textContent = fullDate(earned.earned_at); caption.append(when); }
    figure.append(button, caption); return figure;
  }));
  const selected = client.state.sheet?.startsWith('badge:') ? client.state.sheet.slice(6) : '';
  if (selected in BADGES) $('profile-badges').querySelector<HTMLButtonElement>(`[data-badge="${selected}"] button`)!.click();
}
function showBadge(badge: Badge, detail: string) {
  const dialog = $<HTMLDialogElement>('over');
  if (dialog.open && client.state.sheet === `badge:${badge}`) { $('badge-detail').textContent = detail; return; }
  if (dialog.open) dialog.close();
  const scrim = document.createElement('div'); scrim.className = 'scrim'; $('app-frame').append(scrim);
  dialog.className = 'over-sheet badge-sheet'; dialog.setAttribute('aria-labelledby', 'badge-title');
  dialog.innerHTML = '<header class="new-game-head"><h2 id="badge-title"></h2></header><div class="new-game-body"><img id="badge-art" alt=""><p id="badge-detail"></p></div><footer class="new-game-foot"><button id="badge-close">Close</button></footer>';
  $('badge-title').textContent = BADGES[badge]; $<HTMLImageElement>('badge-art').src = badgeArt(badge); $('badge-detail').textContent = detail;
  $('badge-close').onclick = () => dialog.close(); dialog.onclose = () => { scrim.remove(); client.state.sheet = undefined; client.save(); $('profile-badges').querySelector<HTMLButtonElement>(`[data-badge="${badge}"] button`)?.focus(); };
  client.state.sheet = `badge:${badge}`; client.save(); dialog.showModal();
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
