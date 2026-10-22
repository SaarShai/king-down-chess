import { expect, it } from 'vitest';
import { AUTH_KEY } from './session';

it('shares the existing website auth key without browser startup', () => {
  expect(AUTH_KEY).toBe('kingdown.auth');
});
