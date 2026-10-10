/** Glicko-2 (Glickman's paper), one game at a time. Pure: no I/O, no clock. Settings: multiplayer report part 02, section 2.2. */
export interface Rating { rating: number; rd: number; volatility: number }
export interface RatedGame { opp: Rating; score: number; edge?: number }

/** Every constant in one place; each function takes it as its last argument, so a stored `rating_config` can replace it. */
export const GLICKO2 = {
  rating: 1500, rd: 350, volatility: 0.06, tau: 0.75, // start values; tau limits volatility swings
  minRd: 45, maxRd: 350, maxVolatility: 0.1,          // Lichess clamps; the top RD equals the start RD
  floor: 400, maxChange: 700,                         // lowest rating; largest change in one game (safety cap)
  provisionalRd: 110,                                 // "?" while RD is at least this
  periodsPerDay: 0.21436,                             // RD growth: RD 60 becomes 110 in a year (Lichess)
  colour: 0,                                          // White's edge in rating points; 0 until fitted on human games (D7)
};
export type Glicko2Config = typeof GLICKO2;

const Q = 400 / Math.LN10; // 173.7178: the Glicko-2 scale
const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
const periods = (days: number, cfg: Glicko2Config) => days > 0 ? days * cfg.periodsPerDay : 0; // NaN and negative days count as 0

export const provisional = (rd: number) => rd >= GLICKO2.provisionalRd;

/** Step 5 of the paper: the new volatility, by the Illinois root finder. */
function newVolatility(phi: number, sigma: number, delta: number, v: number, tau: number): number {
  const a = Math.log(sigma ** 2), p2 = phi ** 2, d2 = delta ** 2;
  const f = (x: number) => { const e = Math.exp(x), s = p2 + v + e; return e * (d2 - s) / (2 * s * s) - (x - a) / tau ** 2; };
  let A = a, B: number;
  if (d2 > p2 + v) B = Math.log(d2 - p2 - v);
  else { let k = 1; while (k < 100 && f(a - k * tau) < 0) k++; B = a - k * tau; } // bounded: a bad tau cannot hang the caller
  let fA = f(A), fB = f(B);
  for (let i = 0; i < 100 && Math.abs(B - A) > 1e-6; i++) {
    const C = A + (A - B) * fA / (fB - fA), fC = f(C);
    if (fC * fB <= 0) { A = B; fA = fB; } else fA /= 2;
    B = C; fB = fC;
  }
  return Math.exp(A / 2);
}

/**
 * One rating period of `games` for one player. `opp` is the opponent's rating at game time; `edge` is a rating-point bonus
 * for this player's expected score only (the colour term). `periodLength` is 1 for the paper's whole period; for a
 * game-by-game update it is the fractional periods since the player's last game, so RD grows with idle time.
 * With no games, only RD grows.
 */
export function update(r: Rating, games: RatedGame[], periodLength = 1, cfg: Glicko2Config = GLICKO2): Rating {
  const phi = r.rd / Q;
  let sv = 0, sd = 0; // sum of g^2 E (1-E), and sum of g (s - E)
  for (const { opp, score, edge = 0 } of games) {
    const g = 1 / Math.sqrt(1 + 3 * (opp.rd / Q / Math.PI) ** 2);
    const E = 1 / (1 + Math.exp(-g * (r.rating + edge - opp.rating) / Q));
    sv += g * g * E * (1 - E); sd += g * (score - E);
  }
  const v = 1 / sv, volatility = games.length ? Math.min(cfg.maxVolatility, newVolatility(phi, r.volatility, v * sd, v, cfg.tau)) : r.volatility;
  const phiStar = Math.min(Math.hypot(phi, Math.sqrt(periodLength) * volatility), cfg.maxRd / Q);
  const phiNew = games.length ? 1 / Math.sqrt(1 / phiStar ** 2 + 1 / v) : phiStar;
  const change = games.length ? clamp(Q * phiNew ** 2 * sd, -cfg.maxChange, cfg.maxChange) : 0;
  return { rating: Math.max(cfg.floor, r.rating + change), rd: clamp(Q * phiNew, cfg.minRd, cfg.maxRd), volatility };
}

/** The rating after `days` without a game: only RD grows. Also the RD an opponent has at game time. */
export const growRd = (r: Rating, days: number, cfg: Glicko2Config = GLICKO2): Rating => update(r, [], periods(days, cfg), cfg);

/**
 * One game: both new ratings. `whiteScore` is 1, 0.5 or 0 (any 0 to 1). `idle` is the days since each player's last
 * rated game. `colour` is White's edge in rating points: White gains half of it and Black loses half in the expected score.
 */
export function rateGame(white: Rating, black: Rating, whiteScore: number, o: { idle?: [number, number]; colour?: number } = {}, cfg: Glicko2Config = GLICKO2): [Rating, Rating] {
  if (!(whiteScore >= 0 && whiteScore <= 1)) throw new RangeError('score must be from 0 to 1');
  const { idle = [0, 0], colour = cfg.colour } = o;
  const [w, b] = [growRd(white, idle[0], cfg), growRd(black, idle[1], cfg)];
  return [
    update(white, [{ opp: b, score: whiteScore, edge: colour / 2 }], periods(idle[0], cfg), cfg),
    update(black, [{ opp: w, score: 1 - whiteScore, edge: -colour / 2 }], periods(idle[1], cfg), cfg),
  ];
}
