import type { InboxEntry } from '../match/protocol';

/** The first ready game against a person, then a computer game, other than `except`. */
export function nextGame(entries: InboxEntry[], except?: string) {
  const ready = entries.filter(entry => entry.status !== 'waiting' && entry.action === 'ready' && entry.game_id !== except);
  return ready.find(entry => !entry.opponent?.computer) ?? ready[0];
}
