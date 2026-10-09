import { describe, expect, it } from 'vitest';
import { assessBand, assessGame, oddsWorth, type Band, type Estimate } from './criteria';

const band: Band = { id: 'card-worth', min: 0.7, max: 3, approval: 'proposed' };
const estimate: Estimate = { id: 'card-result', value: 1.2, low: 0.8, high: 1.6 };

describe('balance decisions', () => {
  it('uses the whole interval and retains approval state', () => {
    expect(assessBand(band, estimate)).toMatchObject({ status: 'pass', approval: 'proposed' });
    expect(assessBand(band, { ...estimate, low: 0.6 }).status).toBe('no-data');
    expect(assessBand(band, { ...estimate, value: 0.3, low: 0.1, high: 0.6 }).status).toBe('fail');
    expect(assessBand(band, { ...estimate, state: 'pending' }).status).toBe('no-data');
    expect(assessBand(band, { ...estimate, state: 'stale' }).status).toBe('no-data');
    expect(assessBand(band, { ...estimate, high: null }).status).toBe('no-data');
  });
  it('holds the draw gate even if another outcome passes', () => {
    const pass = assessBand(band, estimate);
    const unknown = assessBand(band);
    expect(assessGame(unknown, pass)).toMatchObject({ status: 'no-data', reason: 'Draw gate: No matching measurement.' });
    expect(assessGame(unknown, assessBand(band, { ...estimate, value: 4, low: 3.5, high: 4.5 })).status).toBe('fail');
  });
  it('keeps odds out of range as a bound and includes scale error', () => {
    const scale = { id: 'pawn-odds', value: 64, low: 48, high: 80 };
    expect(oddsWorth({ id: 'guard', value: -200, low: -230, high: -170 }, scale, 3.16)).toMatchObject({ value: null, relation: 'less-than', bound: 1.6600000000000001 });
    const worth = oddsWorth({ id: 'piece', value: 32, low: 16, high: 48 }, scale, 3.16)!;
    expect(worth.value).toBeCloseTo(3.66);
    expect(worth.interval).toEqual([3.3600000000000003, 4.16]);
    expect(oddsWorth({ id: 'pending', value: 32, low: 16, high: 48, state: 'pending' }, scale, 3.16)).toBeNull();
  });
});
