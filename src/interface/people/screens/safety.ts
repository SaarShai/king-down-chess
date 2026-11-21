/** Account and player safety use the existing online routes and the house sheet. */
import type { OnlineClient, Target } from '../../../online/client';
import { REPORT_REASONS } from '../../../plugin/screens/board-model';
import type { ReportCategory } from '../../../account/profile';
import { apiOrigin } from '../../../platform';
import { button, setButtonState } from '../../ui/kit.js';
import { node, peopleSheet, say, statusLine, type PeopleSheet } from './sheet';

const support = () => { const link = node('a', 'kd-button people-plain', 'Support'); link.href = apiOrigin + '/support.html'; link.target = '_blank'; link.rel = 'noopener'; return link; };

export type SafetyClient = Pick<OnlineClient, 'report' | 'block' | 'relate' | 'record'> & {
  onAccountChange(close: () => void): () => void;
};
function safetySheet(api: Pick<SafetyClient, 'onAccountChange'>, source: HTMLElement, onClose?: () => void) {
  let stop = () => {};
  let closed = false;
  const sheet = peopleSheet(source, () => { closed = true; stop(); onClose?.(); });
  stop = api.onAccountChange(sheet.close);
  if (closed) stop();
  return sheet;
}

export function reportPlayer(api: Pick<SafetyClient, 'report' | 'onAccountChange'>, target: Target, source: HTMLElement, onClose?: () => void) {
  const sheet = safetySheet(api, source, onClose), status = statusLine(), form = node('form', 'people-form');
  const reason = node('select'), note = node('textarea');
  reason.required = true; reason.add(new Option('Choose a reason', ''));
  for (const [value, label] of Object.entries(REPORT_REASONS)) reason.add(new Option(label, value));
  note.maxLength = 1000; note.rows = 3;
  const field = (label: string, control: HTMLElement) => { const row = node('label', 'people-field'); row.append(node('span', '', label), control); return row; };
  const send = button('Send report', { kind: 'main', onPress: () => form.requestSubmit() });
  form.append(field('Reason', reason), field('Note (optional)', note), status, send);
  form.addEventListener('submit', async event => {
    event.preventDefault(); if (!sheet.isOpen || send.getAttribute('aria-busy') === 'true') return;
    setButtonState(send, { busy: true }); say(status);
    try {
      const receipt = await api.report({ ...target, target: reason.value === 'offensive_handle' ? 'handle' : 'player', category: reason.value as ReportCategory, ...(note.value.trim() && { note: note.value.trim() }) });
      if (!sheet.isOpen) return;
      sheet.show({ title: 'Report sent', body: [node('p', '', `Reference ${receipt.id}. Keep this number if you contact Support.`), support(), button('Done', { kind: 'main', onPress: sheet.close })] });
    } catch { if (sheet.isOpen) { setButtonState(send, {}); say(status, 'The report has no reply. Try again. A second try can send a second report.'); } }
  });
  sheet.show({ title: 'Report player', body: [form, button('Cancel', { onPress: sheet.close })] });
  return sheet;
}

export function blockPlayer(api: Pick<SafetyClient, 'block' | 'relate' | 'onAccountChange'>, target: Target, source: HTMLElement, changed: () => void, onClose?: () => void) {
  const sheet = safetySheet(api, source, onClose), status = statusLine();
  const confirm = button('Block player', { kind: 'danger', onPress: async () => {
    if (!sheet.isOpen || confirm.getAttribute('aria-busy') === 'true') return;
    setButtonState(confirm, { busy: true }); say(status);
    try {
      if ('handle' in target) await api.relate('block', target);
      else { const reply = await api.block({ ...target, blocked: true }); if (!reply.blocked) throw new Error(); }
      if (!sheet.isOpen) return;
      changed();
      sheet.show({ title: 'Player blocked', body: [node('p', '', 'You can unblock this player in Account & settings. Any current game continues.'), button('Done', { kind: 'main', onPress: sheet.close })] });
    } catch { if (sheet.isOpen) { setButtonState(confirm, {}); say(status, 'The block has no reply. Try again.'); } }
  } });
  sheet.show({ title: 'Block player?', body: [node('p', '', 'You do not match again. This player cannot join your open games. Messages are hidden. Follows end both ways. Any current game continues.'), status, confirm, button('Cancel', { onPress: sheet.close })] });
  return sheet;
}

export function playerSafety(
  api: Pick<SafetyClient, 'report' | 'block' | 'relate' | 'onAccountChange'>, target: Target, changed: () => void,
  beforeOpen: (open: () => void) => void = open => open(), returnTo?: HTMLElement,
  openSheet: (open: (onClose?: () => void) => PeopleSheet) => void = open => { open(); },
) {
  const report: HTMLButtonElement = button('Report player', { onPress: () => beforeOpen(() => openSheet(onClose => reportPlayer(api, target, returnTo ?? report, onClose))) });
  const known = 'handle' in target ? null : target;
  let blocked = false;
  const block: HTMLButtonElement = button('Block player', { onPress: () => blocked ? void unblock() : beforeOpen(() => openSheet(onClose => blockPlayer(api, target, returnTo ?? block, changed, onClose))) });
  const show = (answer: { blocked: boolean }) => { blocked = answer.blocked; setButtonState(block, { label: blocked ? 'Unblock player' : 'Block player' }); };
  // The same call as Unblock in Account & settings (blockedPlayers).
  async function unblock() {
    setButtonState(block, { busy: true });
    try { const answer = await api.block({ ...known, blocked: false }); if (answer.blocked) throw new Error(); show(answer); changed(); }
    catch { setButtonState(block, { label: 'Unblock player' }); }
  }
  // A block with no `blocked` value only reads it. A failed read leaves Block player, which is safe to press again.
  if (known) { setButtonState(block, { busy: true }); api.block(known).then(show, () => setButtonState(block, {})); }
  return [report, block];
}

export function playerOptions(api: Pick<SafetyClient, 'report' | 'block' | 'relate' | 'onAccountChange'>, target: Target, source: HTMLElement, changed: () => void) {
  const sheet = safetySheet(api, source);
  sheet.show({ title: 'Player options', body: playerSafety(api, target, changed, open => { sheet.close(); open(); }, source) });
}

export function blockedPlayers(api: Pick<SafetyClient, 'record' | 'block' | 'onAccountChange'>, source: HTMLElement, onClose?: () => void) {
  const sheet = safetySheet(api, source, onClose), status = statusLine(), rows = node('div', 'people-form');
  let cursor: string | null = null, count = 0;
  const more = button('Load more', { onPress: () => void read() });
  async function read() {
    if (!sheet.isOpen || more.getAttribute('aria-busy') === 'true') return;
    setButtonState(more, { busy: true }); say(status);
    try {
      const page = await api.record(cursor ? { blocks_after: cursor } : {});
      if (!sheet.isOpen) return;
      for (const player of page.blocks) {
        const row = node('div', 'safety-block-row');
        const unblock = button('Unblock', { onPress: async () => {
          if (!sheet.isOpen || unblock.getAttribute('aria-busy') === 'true') return;
          setButtonState(unblock, { busy: true }); say(status);
          try { const answer = await api.block({ user_id: player.user_id, blocked: false }); if (answer.blocked) throw new Error(); if (!sheet.isOpen) return; row.remove(); if (!--count && !cursor) say(status, 'No blocked players.'); }
          catch { if (sheet.isOpen) { setButtonState(unblock, {}); say(status, 'The player cannot unblock. Try again.'); } }
        } });
        row.append(node('span', '', player.handle ?? 'Deleted player'), unblock); rows.append(row); count++;
      }
      cursor = page.next_blocks_after; more.hidden = !cursor;
      if (!count) say(status, 'No blocked players.');
      setButtonState(more, {});
    } catch { if (sheet.isOpen) { setButtonState(more, { label: 'Try again' }); more.hidden = false; say(status, 'Blocked players cannot load. Try again.'); } }
  }
  sheet.show({ title: 'Blocked players', body: [rows, status, more, button('Done', { onPress: sheet.close })] });
  void read();
  return sheet;
}

export function deleteAccount(source: HTMLElement, api: Pick<SafetyClient, 'onAccountChange'> & { remove(): Promise<{ runAfter: string; localCleared: boolean }> }, onClose?: () => void) {
  const sheet = safetySheet(api, source, onClose), status = statusLine();
  const confirm = button('Delete account', { kind: 'danger', onPress: async () => {
    if (!sheet.isOpen || confirm.getAttribute('aria-busy') === 'true') return;
    setButtonState(confirm, { busy: true }); say(status);
    try {
      const receipt = await api.remove();
      if (!sheet.isOpen) return;
      sheet.show({ title: 'Deletion requested', body: [node('p', '', `Your account is due for deletion after ${new Date(receipt.runAfter).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}. You are signed out.`),
        node('p', '', 'Sign in before deletion to cancel. A legal hold can delay deletion. When the deletion is done, we try to send one email to confirm it.'),
        ...(!receipt.localCleared ? [node('p', '', 'This device cannot clear all local account data. Clear site data on this device.')] : []),
        button('Done', { kind: 'main', onPress: sheet.close })] });
    } catch { if (sheet.isOpen) { setButtonState(confirm, {}); say(status, 'The request has no reply. Try again. A second request keeps the same date.'); } }
  } });
  sheet.show({ title: 'Delete account?', body: [node('p', '', 'After 7 days, we delete your account and private data. Active games end. Sign in before deletion to cancel.'),
    node('p', '', 'Opponents keep their game history with Deleted player as your name. Reports can stay for 12 months, or longer under a legal hold.'),
    status, confirm, button('Cancel', { onPress: sheet.close })] });
  return sheet;
}
