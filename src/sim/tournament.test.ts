import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  type Entrant, type TJob, type TRecord, type TournamentSpec,
  checkResume, drawOf, halfWidth, pairDraw, poolRounds, reportText, resampleArmies, schedule, scoreVsPowers, tFromZ,
} from './tournament';

const spec = (over: Partial<TournamentSpec> = {}): TournamentSpec => ({
  id: 't', entrants: ['Freeze', 'Haste', 'Flight', 'none'], pairs: 3, depth: 1, seed: 2222, rules: {},
  mirror: false, maxPlies: 300, openingRandomPlies: 4, ...over,
});
const hash = (x: unknown): string => createHash('sha256').update(JSON.stringify(x)).digest('hex').slice(0, 16);
const recorded = (id: string): TournamentSpec => JSON.parse(readFileSync(new URL(`../../sim/out/${id}.tournament.json`, import.meta.url), 'utf8'));
/** A game record for a job, with White's score. */
const play = (j: TJob, result: 1 | 0.5 | 0): TRecord => ({
  ...j, result, reason: 'mate', plies: 40, ms: 1, uses: [0, 0], firstUse: [null, null], checks: [0, 0], lans: [],
});

describe('tournament schedule', () => {
  it('every recorded round still schedules the games it played, so it can resume', () => {
    // A change here breaks resuming that round (runTournament refuses): give new runs a new id.
    const PLAYED: Record<string, string> = {
      'kp2-base-d2': 'dc26edfb38937fa9', 'kp2-base-d3': 'dc26edfb38937fa9', 'kp2-d4': 'a5c894e26af56799',
      'kp2-r2': '0a310b5e239ee749', 'kp2-r3': '9edd3b6bdff70ef1', 'kp2-r4': '4fc1f2459c1a5919', 'kp2-r5': 'c2a1383d24439eb9',
      'kp2-r6': 'dad29188a991dab6', 'kp2-r7': '927e30ef14763e2a', 'kp2-r8': '2e3bfbf2be1495c5', 'kp2-r9': 'fba42279c2de25aa',
      'kp2-r10': '0eed788c332ac1d9', 'kp2-r11': '93855049006bb50a', 'kp2-r12': 'e312f6310f1b5da8',
    };
    for (const [id, h] of Object.entries(PLAYED)) expect([id, hash(schedule(recorded(id)))]).toEqual([id, h]);
  });

  it('shared armies: pair p of every matchup plays army p', () => {
    const jobs = schedule(spec());
    for (const j of jobs) {
      const first = jobs.find(k => k.pairId % 3 === j.pairId % 3)!;
      expect([j.backRank, j.seed]).toEqual([first.backRank, first.seed]);
    }
    expect(new Set(jobs.map(drawOf)).size).toBe(3);
  });

  it('perPair: each pair has its own army and opening; its two games swap colours on it', () => {
    const jobs = schedule(spec({ armies: 'perPair' }));
    expect(jobs.length).toBe(6 * 3 * 2);
    for (let g = 0; g < jobs.length; g += 2) {
      const [x, y] = [jobs[g], jobs[g + 1]];
      expect(x.pairId).toBe(y.pairId);
      expect([x.backRank, x.seed]).toEqual([y.backRank, y.seed]);
      expect([x.white, x.black]).toEqual([y.black, y.white]);
    }
    expect(new Set(jobs.map(drawOf)).size).toBe(jobs.length / 2);
    expect(schedule(spec({ armies: 'perPair', seed: 2223 })).map(j => j.backRank)).not.toEqual(jobs.map(j => j.backRank));
  });

  it('perPair: round 13 as queued gets these draws, so it resumes on them', () => {
    const k13: TournamentSpec = { ...recorded('kp2-r12'), id: 'kp2-r13', pairs: 24, seed: 3333, armies: 'perPair' };
    const jobs = schedule(k13);
    expect([jobs.length, new Set(jobs.map(drawOf)).size, hash(jobs)]).toEqual([3744, 1872, 'f4b79b75ae8b6425']);
    expect([pairDraw(3333, 'Freeze', 'IceWall', 0), pairDraw(3333, 'none', 'Darkness', 23)]).toEqual([
      { backRank: 'NKMOMSGA', seed: 3440647443 }, { backRank: 'BMNKSAGM', seed: 1642207834 },
    ]);
  });

  it('perPair: a matchup keeps its armies when the entrant list changes', () => {
    const byMatchup = (jobs: readonly TJob[]): Map<string, string> =>
      new Map(jobs.map(j => [`${[j.a, j.b].sort().join('|')}|${j.pairId % 3}`, drawOf(j)]));
    const all = byMatchup(schedule(spec({ armies: 'perPair' })));
    const fewer = byMatchup(schedule(spec({ armies: 'perPair', entrants: ['none', 'Flight', 'Haste'] })));
    expect(fewer.size).toBe(3 * 3);
    for (const [k, d] of fewer) expect(all.get(k)).toBe(d);
  });

  it('perPair: a variant plays the armies its base power plays against the same opponent', () => {
    const jobs = schedule(spec({ armies: 'perPair', entrants: ['Haste', 'Haste~h100', 'Flight'] }));
    const vs = (a: Entrant): string[] => jobs.filter(j => j.a === a && j.b === 'Flight').map(drawOf);
    expect(vs('Haste~h100')).toEqual(vs('Haste'));
    expect(pairDraw(7, 'Haste', 'Flight', 1)).not.toEqual(pairDraw(7, 'Haste', 'Freeze', 1));
  });

  it('a resume refuses records that this code would schedule differently', () => {
    const t = spec();
    const jobs = schedule(t);
    const recs = jobs.slice(0, 6).map(j => play(j, 1));
    expect(() => checkResume(t, jobs, recs)).not.toThrow();
    expect(() => checkResume(t, jobs, [...recs, { ...play(jobs[7], 1), backRank: 'KQRRBBNN' }])).toThrow(/schedule changed/);
    expect(() => checkResume(t, jobs, [{ ...play(jobs[0], 1), gameId: jobs.length }])).toThrow(/no such game/);
  });
});

describe('intervals resampled over armies', () => {
  // X meets Y and Z on the same 10 armies; X wins both games on armies 0–4 and loses both on 5–9.
  const rec = (gameId: number, white: Entrant, black: Entrant, army: number, result: 1 | 0.5 | 0): TRecord => ({
    gameId, pairId: gameId >> 1, a: white, b: black, white, black, backRank: `ARMY${army}`, seed: army, result,
    reason: 'mate', plies: 40, ms: 1, uses: [0, 0], firstUse: [null, null], checks: [0, 0], lans: [],
  });
  const X = 'Freeze', Y = 'Haste', Z = 'Flight';
  const recs: TRecord[] = [];
  for (const opp of [Y, Z] as Entrant[]) {
    for (let k = 0; k < 10; k++) {
      const xWins = k < 5;
      recs.push(rec(recs.length, X, opp, k, xWins ? 1 : 0), rec(recs.length + 1, opp, X, k, xWins ? 0 : 1));
    }
  }

  it('use t quantiles: few armies give wider intervals', () => {
    // Exact Student t quantiles (97.5%: 9, 11 and 23 degrees of freedom; 99.5%: 23).
    expect(tFromZ(1.96, 9)).toBeCloseTo(2.2622, 3);
    expect(tFromZ(1.96, 11)).toBeCloseTo(2.2010, 3);
    expect(tFromZ(1.96, 23)).toBeCloseTo(2.0687, 3);
    expect(tFromZ(2.5758, 23)).toBeCloseTo(2.8073, 3);
    expect(tFromZ(1.96, 1871)).toBeCloseTo(1.96, 2);
  });

  it('widen the interval when results depend on the army', () => {
    const a = resampleArmies(recs, [X, Y, Z], true);
    expect(a.draws).toBe(10);
    const perGame = 1.96 * scoreVsPowers(recs, X).se;
    const armies = halfWidth(a, a.samples.get(X)!);
    expect([scoreVsPowers(recs, X).m, a.m.get(X)]).toEqual([0.5, 0.5]);
    // 20 pairs look independent per game, but there are only 10 armies: about √2 wider, and t with 9
    // degrees of freedom on top (2.26 standard errors, not 1.96).
    expect(armies / perGame).toBeGreaterThan(1.5);
    expect(armies).toBeCloseTo(2.262 * Math.sqrt(0.25 / 9), 2);
  });

  it('match the per-game interval when every pair has its own army', () => {
    // 200 pairs of X against Y, each on its own army; X wins about half of the pairs.
    const own = Array.from({ length: 200 }, (_, k) => {
      const xWins = (k * 7919) % 200 < 100;
      return [rec(2 * k, X, Y, k, xWins ? 1 : 0), rec(2 * k + 1, Y, X, k, xWins ? 0 : 1)];
    }).flat();
    const a = resampleArmies(own, [X, Y], true);
    expect(a.draws).toBe(200);
    expect(halfWidth(a, a.samples.get(X)!) / (1.96 * scoreVsPowers(own, X).se)).toBeCloseTo(1, 1);
  });

  it('leave out mirrors and, against powers, the plain king; read the same every time', () => {
    const extra = [...recs, rec(100, X, X, 3, 1), rec(101, X, 'none', 3, 1), rec(102, 'none', X, 3, 0)];
    const vsPowers = resampleArmies(extra, [X, Y, Z, 'none'], true);
    expect(vsPowers.samples.get(X)).toEqual(resampleArmies(recs, [X, Y, Z, 'none'], true).samples.get(X));
    // The plain king lost both its games, on army 3; a resample without army 3 has no score for it.
    expect(new Set(Array.from(vsPowers.samples.get('none')!, String))).toEqual(new Set(['0', 'NaN']));
    // Against the field, X's two wins over the plain king count: 22 of 42 games.
    expect([vsPowers.m.get(X), resampleArmies(extra, [X, Y, Z, 'none'], false).m.get(X)]).toEqual([0.5, 22 / 42]);
    expect(resampleArmies(recs, [X, 'Leap'], true).m.get('Leap')).toBeNaN();
  });

  it('pooled rounds keep their pairs apart, so the table and the resamples agree', () => {
    const a = spec({ entrants: ['Freeze', 'Haste', 'Flight'], pairs: 2, seed: 1 });
    const b = spec({ entrants: ['Freeze', 'Haste', 'Flight'], pairs: 5, seed: 2, armies: 'perPair' });
    // Freeze wins every game of round a as White; round b is all draws.
    const pooled = poolRounds([schedule(a).map(j => play(j, j.white === 'Freeze' ? 1 : 0.5)), schedule(b).map(j => play(j, 0.5))]);
    const r = resampleArmies(pooled, a.entrants, true);
    for (const e of a.entrants) expect(scoreVsPowers(pooled, e).m).toBeCloseTo(r.m.get(e)!, 12);
  });
});

describe('report', () => {
  // HolyLight draws every power and beats the plain king. Mercy beats Darkness, and beats DeathTouch
  // on armies 0–4 but loses on 5–9. Every other game is a draw. Ten shared armies.
  const t = spec({ entrants: ['HolyLight', 'Mercy', 'DeathTouch', 'Darkness', 'none'], pairs: 10, seed: 5 });
  const score = (j: TJob, p: number): 1 | 0.5 | 0 => {
    const win = (a: Entrant, b: Entrant): boolean =>
      (a === 'HolyLight' && b === 'none') || (a === 'Mercy' && b === 'Darkness') || (a === 'Mercy' && b === 'DeathTouch' && p < 5) || (a === 'DeathTouch' && b === 'Mercy' && p >= 5);
    return win(j.white, j.black) ? 1 : win(j.black, j.white) ? 0 : 0.5;
  };
  const games = schedule(t).map(j => play(j, score(j, j.pairId % 10)));

  it('prints the armies intervals, both off-centre readings and the kings', () => {
    const text = reportText([t], [games]);
    expect(text).toContain('200 of 200 games');
    expect(text).not.toContain('Partial');
    // Mercy: vs field (0.5 + 1 + 0.5 + 0.5) / 4, vs powers 2/3. Its armies interval: Mercy scores 5/6
    // on half the armies and 1/2 on the rest, so its spread is (1/3) · √(0.25/10) · √(10/9) = 0.0556,
    // times t(9 degrees of freedom) = 2.262: ±12.6 (12.5 from 10,000 resamples). Against the field ¾ of that.
    expect(text).toMatch(/\| Mercy \|[^|]+\|[^|]+\| 62\.5% \|[^|]+\| 9\.4 \| 66\.7% \|[^|]+\| 12\.5 \|/);
    expect(text).toContain('Outside 50% on its own armies interval (a screen: with 4 powers tested, about 0.2 would be flagged by chance if all were level): Mercy 66.7% ± 12.5, Darkness 33.3% ± 0.0.');
    expect(text).toMatch(/Off centre with all 4 tested together \(simultaneous 95% band, 2\.\d\d standard errors on 10 armies\): Mercy 66\.7% ± 12\.\d, Darkness 33\.3% ± 0\.0\./);
    expect(text).toContain('Kings (the mean of their two powers against the other powers): Spirit 58.3 ± 6.3, Shadow 41.7 ± 6.3; Spirit − Shadow 16.7 ± 12.5 points (4.1 to 29.2).');
    expect(text).not.toContain('NaN');
  });

  it('marks a round still being played, and shows no score for a power with no games yet', () => {
    const text = reportText([t], [games.filter(g => g.a !== 'Darkness' && g.b !== 'Darkness')]);
    expect(text).toContain('**Partial:** 80 games still to play');
    expect(text).toMatch(/\| Darkness \|.*\| - \| - \| - \|/);
    expect(text).not.toContain('NaN');
    expect(text).not.toContain('Shadow');
  });
});
