import { client, memory, navigate, routeView, send } from '../../account-game/runtime';
import type { JoinPreview } from '../../match/protocol';
import type { Page } from '../../account-game/state';
import { $, onStop, portrait, row, showError, toolError } from './friend';
import { features } from '../../account-game/features';
let reading = false, joining = false, afterHandle = false;
let checked = '';
export function joinScreen() {
  $('join-help').textContent = 'Enter the game code.';
  $('join-game-head').hidden = $('join-preview').hidden = $('join-foot').hidden = true;
  $<HTMLInputElement>('join-code').value = memory.code;
  $('join-message').textContent = '';
  $('join-preview').replaceChildren();
  $('join-confirm').hidden = true;
  $('join-entry').hidden = !!memory.code || !!memory.preview;
  $('join-decline').onclick = () => { afterHandle = false; memory.code = ''; memory.preview = undefined; memory.joinError = undefined; checked = ''; navigate('play'); };
  $('join-entry').onsubmit = event => { event.preventDefault(); memory.code = $<HTMLInputElement>('join-code').value.trim(); memory.joinError = undefined; void preview(); };
  $<HTMLInputElement>('join-code').oninput = () => { memory.code = $<HTMLInputElement>('join-code').value; memory.joinError = undefined; $('join-message').textContent = ''; };
  $('join-confirm').onclick = () => void join();
  if (afterHandle && memory.me?.handle) { afterHandle = false; void join(); return; }
  if (memory.joinError) { $('join-message').textContent = toolError(memory.joinError.code, memory.joinError.message); $('join-entry').hidden = false; return; }
  const normalize = (code: string) => code.toUpperCase().replace(/[\s-]/g, '');
  if (memory.preview && normalize(memory.preview.code) === normalize(memory.code)) render(memory.preview);
  else if (memory.code && checked !== memory.code) void preview();
  else $('join-entry').hidden = false;
}
function render(value: JoinPreview) {
  $('join-entry').hidden = true;
  $('join-help').textContent = 'Review this game before you join.';
  $('join-game-head').hidden = $('join-preview').hidden = $('join-foot').hidden = false;
  $('join-preview').replaceChildren(row('Your opponent', portrait(value.creator.icon), [value.creator.handle ?? 'Your friend']));
  if (value.options) $('join-preview').append(row('Features', 'fairy', [features(value.options, true), `You play ${value.colour === 'white' ? 'White' : 'Black'}.`]));
  else $('join-preview').append(row('Your colour', 'clock', [`You play ${value.colour === 'white' ? 'White' : 'Black'}.`]));
  $('join-confirm').hidden = false;
  $('join-confirm').textContent = `Join and take ${value.colour === 'white' ? 'White' : 'Black'}`;
}
async function preview() {
  if (reading || !memory.code) return;
  reading = true; const code = memory.code; checked = code; memory.preview = undefined; $('join-message').textContent = 'Reading the game…';
  try {
    const result = await client.call('kingdown_join', { code, preview: true });
    if (client.state.screen !== 'join' || memory.code !== code) return;
    if (result.isError) { memory.joinError = { code: String(result._meta?.code ?? ''), message: result.content.filter(c => c.type === 'text').map(c => c.text).join(' ') }; joinScreen(); return; }
    memory.preview = result._meta?.preview as JoinPreview; $('join-message').textContent = ''; render(memory.preview);
  } catch (error) { showError(error, $('join-message')); $('join-entry').hidden = false; checked = ''; }
  finally { reading = false; if (client.state.screen === 'join' && memory.code && memory.code !== code) void preview(); }
}
async function join() {
  if (joining || !memory.preview) return;
  joining = true; $<HTMLButtonElement>('join-confirm').disabled = true;
  try {
    // A join is a selection: it goes on the queue, so a newer chat result detaches it (design §1.2).
    const outcome = await send('kingdown_join', { code: memory.preview.code });
    if (outcome.status === 'superseded') return;
    if (outcome.status !== 'done') {
      if (outcome.status === 'failed' && outcome.code === 'HANDLE_NEEDED') { afterHandle = true; navigate('handle'); return; }
      throw new Error(toolError(outcome.code ?? '', outcome.text));
    }
    const next = outcome.view as NonNullable<typeof memory.view> | undefined;
    memory.code = ''; memory.preview = undefined; memory.joinError = undefined; checked = '';
    if (next) routeView(next);
  } catch (error) { showError(error, $('join-message')); }
  finally { joining = false; $<HTMLButtonElement>('join-confirm').disabled = false; }
}
// Join keeps the code in page memory through Save; a remount needs the code again. An inline Join or name screen
// waits on the queue behind the home card, so the memory stays for its Resume.
export function joinSync(page: Page) { if (![page.screen, client.state.queued].some(screen => screen === 'join' || screen === 'handle')) { afterHandle = false; memory.code = ''; memory.preview = undefined; memory.joinError = undefined; checked = ''; } }
const back = () => { if (client.state.screen === 'handle') afterHandle = false; };
$('page-back').addEventListener('click', back, true);
onStop(() => { $('page-back').removeEventListener('click', back, true); });
