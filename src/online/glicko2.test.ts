import { describe, expect, it } from 'vitest';
import { GLICKO2, growRd, provisional, rateGame, update, type Rating } from './glicko2';

const start: Rating = { rating: GLICKO2.rating, rd: GLICKO2.rd, volatility: GLICKO2.volatility };
const at = (rating: number, rd: number): Rating => ({ rating, rd, volatility: 0.06 });

describe('Glicko-2', () => {
  it("reproduces the worked example of Glickman's paper (one period of three games, tau 0.5)", () => {
    const r = update(at(1500, 200), [
      { opp: at(1400, 30), score: 1 },
      { opp: at(1550, 100), score: 0 },
      { opp: at(1700, 300), score: 0 },
    ], 1, { ...GLICKO2, tau: 0.5 });
    expect(r.rating).toBeCloseTo(1464.06, 1); // the paper rounds mu' to 4 places first
    expect(r.rd).toBeCloseTo(151.52, 1);
    expect(r.volatility).toBeCloseTo(0.05999, 4);
  });

  it('starts at 1500, RD 350, volatility 0.06, tau 0.75 and marks RD 110 or more as provisional', () => {
    expect(start).toEqual({ rating: 1500, rd: 350, volatility: 0.06 });
    expect(GLICKO2.tau).toBe(0.75);
    expect(provisional(350)).toBe(true);
    expect(provisional(110)).toBe(true);
    expect(provisional(109.99)).toBe(false);
  });

  it('a win raises the rating, a loss lowers it, a draw between equals leaves it', () => {
    const [w, b] = rateGame(at(1500, 100), at(1500, 100), 1);
    expect(w.rating).toBeGreaterThan(1500);
    expect(b.rating).toBeLessThan(1500);
    const [dw, db] = rateGame(at(1500, 100), at(1500, 100), 0.5);
    expect(dw.rating).toBe(1500);
    expect(db.rating).toBe(1500);
  });

  it('a draw moves the weaker player up and the stronger player down', () => {
    const [strong, weak] = rateGame(at(1800, 100), at(1500, 100), 0.5);
    expect(strong.rating).toBeLessThan(1800);
    expect(weak.rating).toBeGreaterThan(1500);
  });

  it('RD falls after a game and grows with idle time', () => {
    const [w, b] = rateGame(start, start, 1);
    expect(w.rd).toBeLessThan(350);
    expect(b.rd).toBeLessThan(350);
    const settled = at(1500, 60);
    expect(growRd(settled, 0)).toEqual(settled);
    expect(growRd(settled, 30).rd).toBeGreaterThan(60);
    expect(growRd(settled, 60).rd).toBeGreaterThan(growRd(settled, 30).rd);
    expect(growRd(settled, 365).rd).toBeCloseTo(110, 0); // Lichess calibration: about 60 to 110 in a year
    expect(growRd(settled, 365).rating).toBe(1500); // inactivity never moves points
    expect(growRd(settled, 100_000).rd).toBe(350); // the top equals the start RD
  });

  it('a player back from a long break moves further than one who plays every day', () => {
    const settled = at(1500, 60);
    const daily = rateGame(settled, settled, 1, { idle: [0.1, 0.1] })[0];
    const back = rateGame(settled, settled, 1, { idle: [200, 200] })[0];
    expect(back.rating - 1500).toBeGreaterThan(daily.rating - 1500);
    expect(back.rd).toBeGreaterThan(daily.rd);
  });

  it('applies the colour term to the expected score only, and 0 is the default', () => {
    const none = rateGame(start, start, 1);
    expect(rateGame(start, start, 1, { colour: 0 })).toEqual(none);
    const edge = rateGame(start, start, 1, { colour: 30 });
    expect(edge[0].rating).toBeLessThan(none[0].rating); // White was favoured, so a White win pays less
    expect(edge[1].rating).toBeGreaterThan(none[1].rating); // and Black loses less
    const blackWins = rateGame(start, start, 0, { colour: 30 });
    expect(blackWins[1].rating - 1500).toBeGreaterThan(1500 - rateGame(start, start, 0)[0].rating); // a Black win pays more
    expect(rateGame(start, start, 0.5, { colour: 30 })[0].rating).toBeLessThan(1500); // White draws below expectation
  });

  it('keeps the floor, the RD range, the volatility cap and the change cap', () => {
    expect(rateGame(at(410, 350), at(2400, 45), 0)[0].rating).toBeGreaterThanOrEqual(GLICKO2.floor);
    const lowRd = at(1500, 45);
    expect(rateGame(lowRd, lowRd, 1)[0].rd).toBeGreaterThanOrEqual(GLICKO2.minRd);
    expect(rateGame(start, start, 1, { idle: [1e6, 1e6] })[0].rd).toBeLessThanOrEqual(GLICKO2.maxRd);
    expect(rateGame(start, start, 1, {}, { ...GLICKO2, maxVolatility: 0.05 })[0].volatility).toBeLessThanOrEqual(0.05);
    expect(rateGame(start, start, 1, {}, { ...GLICKO2, maxChange: 10 })[0].rating).toBe(1510);
  });

  it('refuses a score outside 0 to 1', () => {
    expect(() => rateGame(start, start, 2)).toThrow(RangeError);
    expect(() => rateGame(start, start, NaN)).toThrow(RangeError);
  });
});
