import { client } from '../app';
import { art } from '../art';
import { ICONS, type Icon } from '../../account/profile';
import type { HistoryEntry, PlayerRecord } from '../../match/protocol';
import './profile.css';
type Profile = { handle: string | null; icon: Icon | null; record: PlayerRecord; history: HistoryEntry[]; next_before: string | null };
const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id)! as T;
let request = 0;
export function profileScreen() { void readProfile(); }
async function readProfile() {
  const reading = ++request;
  $('profile-status').textContent = 'Loading profile…';
  try {
    const result = await client.call('kingdown_profile');
    if (reading !== request || client.state.screen !== 'profile') return;
    if (result.isError) throw new Error(result.content.filter(c => c.type === 'text').map(c => c.text).join(' '));
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
    $('profile-status').textContent = '';
  } catch (error) { if (reading === request && client.state.screen === 'profile') $('profile-status').textContent = String(error); }
}
