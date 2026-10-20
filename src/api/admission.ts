import { MatchServiceError } from '../match/store';

export function createAdmission(): (actor: string) => () => void {
 let active = 0;
 const users = new Map<string, number>();
 return actor => {
  const count = users.get(actor) ?? 0;
  if (count >= 3) throw new MatchServiceError('RATE_LIMITED', 429, 'Too many active requests for your account. Wait for a request to finish, then try again.');
  if (active >= 4) throw new MatchServiceError('UNAVAILABLE', 503, 'This server instance is busy. Retry.');
  active++;
  users.set(actor, count + 1);
  let released = false;
  return () => {
   if (released) return;
   released = true;
   active--;
   const remaining = users.get(actor)! - 1;
   if (remaining) users.set(actor, remaining);
   else users.delete(actor);
  };
 };
}
