// The rules of the people screens that need no page (docs/specs/people-screens, issue 01): the ready name, the lines
// of each server answer, the landing state, the email step and the share way.
import { afterEach, expect, it, vi } from 'vitest';
import { handleProblem } from '../../../account/profile';
import { forgetEmailCode } from '../../../account/email-code';
import { INVITE_NOTICES } from '../../../match/invite-notices';
import { OnlineError } from '../../../online/client';
import type { JoinPreview } from '../../../match/protocol';
import { memoryStorage } from '../fake-server';
import { faultOf, inviteKey } from '../server';
import { againLine, personText, recoveryText, signInText } from './copy';
import { landingState } from './landing';
import { ADJECTIVES, NAME_TRIES, PICTURES, freeName, readyName, saveName } from './names';
import { shareWay } from './person';
import { emailProblem, inviteProblem, limitCount } from './problems';
import { CODE_LIFE_MS, EMAIL_STEP_KEY, rememberedEmail } from './sign-in';

afterEach(() => vi.unstubAllGlobals());
const sequence = (...values: number[]) => () => values.shift() ?? 0;
const taken = () => new OnlineError('HANDLE_TAKEN', 409, 'This handle is in use');

it('states the random pieces before the host makes a link', () => {
  expect(personText.time).toBe('Each player has 3 days for each move. Your pieces are random.');
});

it('makes only ready names that the server accepts: adjective-picture-number in the handle format', () => {
  for (const adjective of ADJECTIVES) for (const icon of PICTURES) for (let n = 10; n < 100; n++) {
    const handle = `${adjective}-${icon}-${n}`;
    expect(handleProblem(handle), handle).toBeNull();
    expect(handle.length).toBeLessThanOrEqual(20);
  }
  expect(readyName(sequence(0, 0, 0))).toEqual({ handle: `${ADJECTIVES[0]}-${PICTURES[0]}-10`, icon: PICTURES[0] });
  expect(readyName(sequence(.9999, .9999, .9999))).toEqual({ handle: `${ADJECTIVES.at(-1)}-${PICTURES.at(-1)}-99`, icon: PICTURES.at(-1) });
  // The noun is the picture.
  const name = readyName(); expect(name.handle.split('-')[1]).toBe(name.icon);
});

it('shows a free name: a taken name gives the next one, and a failed check does not stop the sheet', async () => {
  const random = sequence(0, 0, 0, .5, .5, .5);
  const check = vi.fn(async (handle: string) => handle !== `${ADJECTIVES[0]}-${PICTURES[0]}-10`);
  const name = await freeName(check, random);
  expect(check).toHaveBeenCalledTimes(2); expect(name.handle).not.toBe(`${ADJECTIVES[0]}-${PICTURES[0]}-10`);
  expect(await freeName(async () => { throw new TypeError('Failed to fetch'); }, sequence(0, 0, 0))).toEqual(readyName(sequence(0, 0, 0)));
});

it('saves the next ready name with no message when another player took the name, and stops after the last try', async () => {
  const first = readyName(sequence(0, 0, 0));
  const save = vi.fn().mockRejectedValueOnce(taken()).mockResolvedValueOnce(undefined);
  const saved = await saveName(save, first, sequence(.5, .5, .5));
  expect(save).toHaveBeenCalledTimes(2); expect(saved).not.toEqual(first); expect(save.mock.calls[1][0]).toEqual(saved);
  const always = vi.fn().mockRejectedValue(taken());
  await expect(saveName(always, first)).rejects.toMatchObject({ code: 'HANDLE_TAKEN' });
  expect(always).toHaveBeenCalledTimes(NAME_TRIES);
  // A lost connection is not a taken name: the sheet shows its line at once.
  const lost = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
  await expect(saveName(lost, first)).rejects.toThrow('Failed to fetch'); expect(lost).toHaveBeenCalledTimes(1);
});

it('gives one line for each refusal of a link or an invite', () => {
  const refuse = (code: string, message = '') => new OnlineError(code as never, 409, message);
  expect(inviteProblem(refuse('OPEN_INVITE_LIMIT'), null)).toBe(personText.openLimit);
  expect(inviteProblem(refuse('FRIEND_INVITE_LIMIT'), 'dana-r')).toBe('You sent dana-r 2 invites. Wait until dana-r accepts one.');
  expect(inviteProblem(refuse('FRIEND_GAME_LIMIT', INVITE_NOTICES.gameLimit(6, 'dana-r')), 'dana-r')).toBe('You have 6 games with dana-r. Finish one of them first.');
  expect(inviteProblem(new OnlineError('FORBIDDEN', 403, INVITE_NOTICES.permission), 'dana-r')).toBe('dana-r does not take invites now.');
  expect(inviteProblem(new OnlineError('NOT_FOUND', 404, INVITE_NOTICES.notFound), 'zz')).toBe(personText.none);
  expect(inviteProblem(new OnlineError('RATE_LIMITED', 429, ''), 'dana-r')).toBe(personText.tooMany);
  expect(inviteProblem(new OnlineError('UNAVAILABLE', 503, ''), null)).toBe(recoveryText.service);
  expect(inviteProblem(new TypeError('Failed to fetch'), null, false)).toBe(recoveryText.offline);
  expect(inviteProblem(new TypeError('Failed to fetch'), null, true)).toBe(recoveryText.service);
  // The client drops the details of a limit: the count comes from the server's text, else the server's limit.
  expect(limitCount(faultOf(refuse('FRIEND_GAME_LIMIT', INVITE_NOTICES.gameLimit(7, null, true))))).toBe(7);
  expect(limitCount(faultOf(refuse('FRIEND_GAME_LIMIT', 'other words')))).toBe(5);
});

it('says the email code faults as the old form does', () => {
  expect(emailProblem({ code: 'user_banned', status: 403 }, true)).toBe(signInText.suspended);
  expect(emailProblem({ status: 429 }, false)).toBe(signInText.tooMany);
  expect(emailProblem(new TypeError('Failed to fetch'), true)).toBe(signInText.noReach);
  expect(emailProblem({ status: 500 }, true)).toBe(signInText.serviceFault);
  expect(emailProblem({ status: 400 }, true)).toBe(signInText.badAddress);
  expect(emailProblem({ status: 400 }, false)).toBe(signInText.badCode);
});

it('keeps the code step for 1 hour in the old form\'s record, so a reload on either page keeps it', () => {
  const storage = memoryStorage(), at = Date.parse('2026-11-14T12:00:00Z');
  storage.setItem(EMAIL_STEP_KEY, JSON.stringify({ address: 'jo@example.com', at }));
  expect(rememberedEmail(storage, at + CODE_LIFE_MS - 1)).toBe('jo@example.com');
  expect(rememberedEmail(storage, at + CODE_LIFE_MS)).toBe('');
  storage.setItem(EMAIL_STEP_KEY, '{not json'); expect(rememberedEmail(storage, at)).toBe('');
  // The old form's own clean-up removes this record: it is the same key.
  storage.setItem(EMAIL_STEP_KEY, JSON.stringify({ address: 'jo@example.com', at }));
  vi.stubGlobal('sessionStorage', storage); forgetEmailCode();
  expect(storage.getItem(EMAIL_STEP_KEY)).toBeNull();
});

it('opens the share list only on a touch device that has one, and copies the link on a computer', () => {
  const share = async () => {};
  expect(shareWay({ share, coarse: true })).toBe('share');
  expect(shareWay({ share, coarse: false })).toBe('copy');
  expect(shareWay({ coarse: true })).toBe('copy');
});

it('says a Play again row as "{result}, {when}"', () => {
  const day = 86_400_000;
  expect(againLine('dana-r', 'won', 2 * day)).toBe('You win, 2 days ago');
  expect(againLine('dana-r', 'lost', 3 * 3_600_000)).toBe('dana-r wins, 3 hours ago');
  expect(againLine('dana-r', 'drawn', day)).toBe('Draw, 1 day ago');
  expect(againLine('dana-r', null, null)).toBe('');
});

it('gives one landing state for each answer of the server', () => {
  const key = inviteKey('k'.repeat(43))!;
  const preview = (handle: string, colour: 'white' | 'black' = 'black'): JoinPreview => ({ code: 'ABCDEF', options: { kingPowers: true, cards: false } as JoinPreview['options'], colour, kind: 'friend', creator: { handle, icon: 'frost' }, expires_at: '2026-11-20T00:00:00Z' });
  const fault = (code: string, message: string) => faultOf(new OnlineError(code as never, 409, message));
  // A game code is parked: only the link token opens a game.
  expect(landingState(inviteKey('ABCDEF'), 'jo', undefined).kind).toBe('bad');
  expect(landingState(key, null, faultOf(new OnlineError('UNAUTHENTICATED', 401, '')))).toMatchObject({ kind: 'plain', inviter: null, facts: [] });
  expect(landingState(key, 'jo', preview('alex'))).toEqual({ kind: 'valid', inviter: 'alex', icon: 'frost', facts: ['With powers', '3 days for each move', 'You play Black'] });
  expect(landingState(key, 'alex', preview('alex'))).toMatchObject({ kind: 'own', facts: [] });
  expect(landingState(key, 'jo', fault('INVITE_UNAVAILABLE', INVITE_NOTICES.expired)).kind).toBe('ended');
  expect(landingState(key, 'jo', fault('INVITE_UNAVAILABLE', INVITE_NOTICES.closed)).kind).toBe('ended');
  expect(landingState(key, 'jo', fault('INVITE_UNAVAILABLE', INVITE_NOTICES.unavailable)).kind).toBe('bad');
  expect(landingState(key, 'jo', fault('FRIEND_GAME_LIMIT', INVITE_NOTICES.gameLimit(5, 'alex', true)), preview('alex'))).toMatchObject({ kind: 'limit', count: 5, inviter: 'alex' });
  // A join that fails after a preview keeps the inviter, so "Invite alex to a new game" can show.
  expect(landingState(key, 'jo', fault('INVITE_UNAVAILABLE', INVITE_NOTICES.closed), preview('alex'))).toMatchObject({ kind: 'ended', inviter: 'alex' });
});
