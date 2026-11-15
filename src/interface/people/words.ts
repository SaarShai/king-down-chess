/**
 * The time words of a game against a person (runs/people/people-spec.md section 4, "Time words", in the design
 * project). The controller gives milliseconds; the screens say them with these words.
 */
const MINUTE = 60_000, HOUR = 60 * MINUTE, DAY = 24 * HOUR;
const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** The time that is left: "{n} days" from 2 days, "1 day", "{n} hours" under 24 hours, "less than 1 hour". It rounds down. */
export function timeWords(ms: number): string {
  if (ms >= 2 * DAY) return `${Math.floor(ms / DAY)} days`;
  if (ms >= DAY) return '1 day';
  if (ms >= HOUR) return count(Math.floor(ms / HOUR), 'hour', 'hours');
  return 'less than 1 hour';
}
/** The time since a move, for "Moved {time} ago": minutes, hours or days. */
export function agoWords(ms: number): string {
  if (ms >= DAY) return count(Math.floor(ms / DAY), 'day', 'days');
  if (ms >= HOUR) return count(Math.floor(ms / HOUR), 'hour', 'hours');
  return count(Math.max(1, Math.floor(ms / MINUTE)), 'minute', 'minutes');
}
/** The last 24 hours of a move show in rust. */
export const urgent = (ms: number) => ms < DAY;
