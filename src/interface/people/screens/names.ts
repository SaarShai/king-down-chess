/**
 * The ready name of the name sheet (account spec S3): adjective-noun-number, in the handle format. The noun is the
 * name of the picture (`ICONS`), so "brave-ogre-42" plays with the Ogre. The words are a short, checked list: a test
 * proves that `handleProblem` accepts each name that this module can make.
 */
import { ICONS, type Icon } from '../../../account/profile';
import { faultOf } from '../server';

export const ADJECTIVES = ['brave', 'bold', 'calm', 'keen', 'kind', 'wise', 'swift', 'quick', 'bright', 'merry',
  'proud', 'noble', 'steady', 'loyal', 'clever', 'gentle', 'lucky', 'sunny', 'quiet', 'warm'] as const;
export const PICTURES = Object.keys(ICONS) as Icon[];
export interface ReadyName { handle: string; icon: Icon }

const pick = <T>(list: readonly T[], random: () => number) => list[Math.min(list.length - 1, Math.floor(random() * list.length))];
/** One ready name: the number is 10 to 99. */
export function readyName(random: () => number = Math.random): ReadyName {
  const icon = pick(PICTURES, random);
  return { handle: `${pick(ADJECTIVES, random)}-${icon}-${10 + Math.min(89, Math.floor(random() * 90))}`, icon };
}

/** The most names that the sheet tries before it shows the save line. */
export const NAME_TRIES = 5;

/** A free ready name. A failed check does not stop the sheet: the save checks the name again. */
export async function freeName(check: (handle: string) => Promise<boolean>, random: () => number = Math.random, first: ReadyName = readyName(random)): Promise<ReadyName> {
  let name = first;
  for (let i = 1; i < NAME_TRIES; i++) {
    try { if (await check(name.handle)) return name; } catch { return name; }
    name = readyName(random);
  }
  return name;
}

/** Save the name. When another player took it, take the next ready name and save again, with no message. */
export async function saveName(save: (name: ReadyName) => Promise<void>, first: ReadyName, random: () => number = Math.random): Promise<ReadyName> {
  let name = first;
  for (let i = 1; ; i++) {
    try { await save(name); return name; } catch (error) {
      if (faultOf(error).code !== 'HANDLE_TAKEN' || i >= NAME_TRIES) throw error;
      name = readyName(random);
    }
  }
}
