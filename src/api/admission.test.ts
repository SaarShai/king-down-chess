import { describe, expect, it } from 'vitest';
import { MatchServiceError } from '../match/store';
import { createAdmission } from './admission';

describe('shared request admission', () => {
 it('admits three calls for one account and restores its capacity on release', () => {
  const admit = createAdmission(), releases = [admit('ann'), admit('ann'), admit('ann')];
  expect(() => admit('ann')).toThrow(MatchServiceError);
  expect(() => admit('ann')).toThrow(expect.objectContaining({ code: 'RATE_LIMITED', status: 429 }));
  releases[1]();
  releases.push(admit('ann'));
  expect(() => admit('ann')).toThrow(expect.objectContaining({ code: 'RATE_LIMITED', status: 429 }));
  releases.forEach(release => release());
  expect(() => admit('ann')).not.toThrow();
 });

 it('admits four calls across accounts and restores the total capacity on release', () => {
  const admit = createAdmission(), releases = ['ann', 'bob', 'cy', 'dan'].map(admit);
  expect(() => admit('eve')).toThrow(expect.objectContaining({ code: 'UNAVAILABLE', status: 503 }));
  releases[0]();
  const release = admit('eve');
  expect(() => admit('ann')).toThrow(expect.objectContaining({ code: 'UNAVAILABLE', status: 503 }));
  release();
  releases.forEach(release => release());
  expect(() => admit('ann')).not.toThrow();
 });

 it('checks the account limit first when both limits apply', () => {
  const admit = createAdmission();
  [admit('ann'), admit('ann'), admit('ann'), admit('bob')];
  expect(() => admit('ann')).toThrow(expect.objectContaining({ code: 'RATE_LIMITED', status: 429 }));
  expect(() => admit('cy')).toThrow(expect.objectContaining({ code: 'UNAVAILABLE', status: 503 }));
 });

 it('keeps release idempotent after another call takes the slot', () => {
  const admit = createAdmission(), first = admit('ann');
  admit('ann'); admit('ann'); admit('bob');
  first();
  const next = admit('ann');
  first();
  expect(() => admit('ann')).toThrow(expect.objectContaining({ status: 429 }));
  expect(() => admit('cy')).toThrow(expect.objectContaining({ status: 503 }));
  next(); next();
  admit('cy');
  expect(() => admit('dan')).toThrow(expect.objectContaining({ status: 503 }));
 });

 it('keeps the counters of separate server instances independent', () => {
  const first = createAdmission(), second = createAdmission();
  for (const admit of [first, second]) {
   admit('ann'); admit('ann'); admit('ann'); admit('bob');
   expect(() => admit('ann')).toThrow(expect.objectContaining({ status: 429 }));
   expect(() => admit('cy')).toThrow(expect.objectContaining({ status: 503 }));
  }
 });
});
