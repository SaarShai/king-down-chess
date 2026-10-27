import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';

it.each([
  ['forward release', '\n6. ', '\n7. '],
  ['restore', 'Open links keep the old behavior:', '\n\n'],
])('stops and drains old-server requests before the %s enables the new server', (_name, start, end) => {
  const guide = readFileSync(join(import.meta.dirname, '..', 'supabase/README.md'), 'utf8');
  const step = guide.split(start)[1].split(end)[0];
  const actions = [
    'Stop incoming game requests.',
    'Let all old-server requests finish.',
    'Enable the new server.',
  ];
  const positions = actions.map(action => step.indexOf(action));
  expect(positions.every(position => position >= 0)).toBe(true);
  expect(positions).toEqual([...positions].sort((a, b) => a - b));
});

it('drains the new server and clears named invitations before old-server traffic', () => {
  const guide = readFileSync(join(import.meta.dirname, '..', 'supabase/README.md'), 'utf8');
  const step = guide.split('\n7. After all writers use the new account locks,')[1].split('\n\n')[0];
  const actions = [
    'Stop new requests to the new server.',
    'Let all new-server requests finish.',
    'update public.game_invites set expires_at=',
    'select count(*) from public.games g',
    'Enable old-server traffic.',
  ];
  const positions = actions.map(action => step.indexOf(action));
  expect(positions.every(position => position >= 0)).toBe(true);
  expect(positions).toEqual([...positions].sort((a, b) => a - b));
  expect(step.match(/update public\.game_invites set expires_at=/g)).toHaveLength(1);
});
