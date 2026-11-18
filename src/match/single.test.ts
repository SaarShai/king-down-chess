import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { lastSetupSchema } from '../plugin/settings';
import { mulberry32 } from '../sim/rng';
import { createMatch, loadMatch, type MatchSave, type MatchSetup } from './index';
import { createSchema } from './protocol';
import { GameService } from './service';
import { optionsSchema } from './setup-schema';
import { DEFAULT_OPTIONS, RANKED_OPTIONS, draw, setupAdmission, validate, type Choice, type Draw, type Options, type SetupAdmission } from './setup';
import type { Game, PostgresMatchStore } from './store';

// Options come from 59843005f. The save comes from its archived compiled engine.
const base = JSON.parse(readFileSync(new URL('./fixtures/options-before-single.json', import.meta.url), 'utf8')) as {
  seed: number; options: Options; drawn: Draw; choices: [Choice, Choice]; admission: SetupAdmission; setup: MatchSetup; save: MatchSave;
  played: { lan: string; fen: string; turn: number };
  cases: { options: Options; error: string | null; accepted: boolean; draws?: (Draw & { seed: number })[] }[];
};
const actor = '11111111-1111-4111-8111-111111111111', gameId = '22222222-2222-4222-8222-222222222222';
afterEach(() => vi.restoreAllMocks());

/** Keep the service and engine real; replace only the database boundary. */
function memory(initial?: Game) {
  let game = initial;
  const client = { query: async () => ({ rows: [] }) };
  const store = {
    pool: client, transaction: async (work: (client: object) => unknown) => work(client), lockAccounts: async () => {},
    insert: async (next: Game) => { game = structuredClone(next); return true; },
    load: async () => structuredClone(game!), receipt: async () => false, commands: async () => [], canSwitch: async () => false,
    privacy: async () => ({ presets: true, online: true, unblocked: true }),
    save: async (_client: unknown, _before: Game, next: Game) => { game = structuredClone(next); },
  };
  return { service: new GameService(store as unknown as PostgresMatchStore), get game() { return game!; } };
}

describe('single-copy pool options', () => {
  it.each<[string, object]>([
    ['unknown kind', { single: ['Z'] }],
    ['repeated kind', { single: ['N', 'N'] }],
    ...['Q', 'O', 'L', 'G', 'S'].map((kind): [string, object] => [`one-copy kind ${kind}`, { single: [kind] }]),
    ['kind outside pool', { pool: ['Q', 'R', 'B', 'A'], single: ['N'] }],
    ['fewer than seven pieces after singles', { pool: ['Q', 'R', 'B', 'N'], single: ['N'] }],
    ['Fairy pieces off', { fairy: false, arrangement: false, single: ['N'] }],
    ['Classic chess', { fairy: false, arrangement: false, classic: true, single: ['N'] }],
    ['null list', { single: null }], ['string list', { single: 'N' }], ['non-string kind', { single: [1] }],
  ])('refuses %s with INVALID_INPUT on Create and Find', async (_name, over) => {
    const service = new GameService({} as PostgresMatchStore), options = { ...DEFAULT_OPTIONS, ...over };
    await expect(service.create(actor, { kind: 'solo', options })).rejects.toMatchObject({ code: 'INVALID_INPUT', status: 400 });
    await expect(service.find(actor, options)).rejects.toMatchObject({ code: 'INVALID_INPUT', status: 400 });
  });

  it.each(['R', 'B', 'N', 'A', 'M'])('deals one %s and one of each other selected kind', kind => {
    const other = kind === 'R' ? 'N' : 'R', pool = ['Q', 'O', 'L', 'G', 'S', kind, other];
    const options = { ...DEFAULT_OPTIONS, pool, single: [kind, other] };
    expect(validate(options)).toBeNull();
    for (let seed = 1; seed <= 20; seed++) {
      const { army } = draw(options, mulberry32(seed));
      expect([...army].sort()).toEqual([...pool, 'K'].sort());
    }
  });

  it('stores and deals a valid single-copy request through the service', async () => {
    const db = memory(), options = { ...DEFAULT_OPTIONS, arrangement: false, pool: ['Q', 'O', 'L', 'G', 'S', 'N', 'M'], single: ['N', 'M'] };
    const created = await db.service.create(actor, { kind: 'solo', options });
    expect(created.status).toBe('playing');
    expect([...created.draw!].sort().join('')).toBe('GKLMNOQS');
    expect(db.game.options).toEqual(options);
    expect(db.game.snapshot?.fen.split('/').at(-1)?.split(' ')[0]).toBe(created.draw);
    const { single: _single, ...withoutSingle } = options, other = memory();
    await other.service.create(actor, { kind: 'solo', options: withoutSingle });
    const engine = JSON.parse(other.game.state!).engine;
    expect(JSON.parse(db.game.state!).engine).toBe(engine);
    expect(db.game.engine_fingerprint).toBe(engine);
    expect(other.game.engine_fingerprint).toBe(engine);
    expect(created.setup_admission).toEqual(setupAdmission(options));
  });

  it('keeps every captured validation result and fixed-seed draw for requests with no field', () => {
    for (const test of base.cases) {
      expect(validate(test.options)).toBe(test.error);
      expect(optionsSchema.safeParse(test.options).success).toBe(test.accepted);
      if (test.accepted) expect(optionsSchema.parse(test.options)).toEqual(test.options);
      for (const { seed, ...expected } of test.draws ?? []) {
        expect(draw(test.options, mulberry32(seed))).toEqual(expected);
        expect(draw({ ...test.options, single: [] }, mulberry32(seed))).toEqual(expected);
      }
    }
  });

  it.each([undefined, []])('stores the old options when single is %j', async single => {
    vi.spyOn(Math, 'random').mockImplementation(mulberry32(base.seed));
    const db = memory(), options = { ...base.options, ...(single === undefined ? {} : { single }) };
    const reply = await db.service.create(actor, { kind: 'solo', options });
    expect(reply.draw).toBe(base.drawn.army);
    expect(db.game.options).toEqual(base.options);
    expect(db.game.options).not.toHaveProperty('single');
    expect(db.game.setup_admission).toEqual(base.admission);
    const current = await createMatch(base.setup);
    try { expect(db.game.engine_fingerprint).toBe(JSON.parse(await current.exportSave()).engine); }
    finally { await current.close(); }
    expect(optionsSchema.parse({ ...base.options, fairy: false, arrangement: false, single: [] })).not.toHaveProperty('single');
  });

  it('keeps settings and the tool JSON schema optional, with empty lists removed', () => {
    const settings = { kind: 'solo', options: base.options, colour: 'white', level: 'casual', king: null };
    expect(lastSetupSchema.parse(settings)).toEqual(settings);
    expect(lastSetupSchema.parse({ ...settings, options: { ...base.options, single: [] } })).toEqual(settings);
    expect(lastSetupSchema.parse({ ...settings, options: { ...base.options, single: ['N'] } }).options.single).toEqual(['N']);
    const schema = z.toJSONSchema(optionsSchema);
    expect(schema.properties?.single).toMatchObject({ type: 'array', items: { type: 'string' } });
    expect(schema.required).not.toContain('single');
    expect(DEFAULT_OPTIONS).not.toHaveProperty('single');
  });

  it('keeps the fixed ranked family free of single-copy overrides', () => {
    expect(createSchema.safeParse({ kind: 'random', mode: 'ranked', options: { ...RANKED_OPTIONS, single: [] } }).success).toBe(true);
    expect(createSchema.safeParse({ kind: 'random', mode: 'ranked', options: { ...RANKED_OPTIONS, single: ['N'] } }).success).toBe(false);
  });
});

describe('games saved before single-copy options', () => {
  it('loads and plays the base save on its archived engine', async () => {
    const old = await loadMatch(JSON.stringify(base.save)), current = await createMatch(base.setup);
    try {
      expect(JSON.parse(await old.exportSave())).toEqual(base.save);
      // The current engine starts the same game from the same setup; only its development fingerprint can differ.
      expect({ ...JSON.parse(await current.exportSave()), engine: base.save.engine }).toEqual(base.save);
      const played = await old.apply({ id: 'old-save-move', expectedRevision: 0, lan: base.played.lan });
      expect(played).toMatchObject({ fen: base.played.fen, turn: base.played.turn, revision: 1 });
      // The current engine also plays the same move to the same position. The compiled worker identity is the gate's runtime hash check.
      const now = await current.apply({ id: 'current-move', expectedRevision: 0, lan: base.played.lan });
      expect(now).toMatchObject({ fen: base.played.fen, turn: base.played.turn, revision: 1 });
    } finally { await old.close(); await current.close(); }
  });

  it('finishes a stored online setup and plays without changing its old options or admission', async () => {
    const at = new Date(0);
    const player = (seat: 0 | 1): Game['players'][number] => ({ seat, user_id: seat === 0 ? actor : '33333333-3333-4333-8333-333333333333', computer: false, choice: base.choices[seat], ready: seat === 1,
      handle: null, handle_at_start: null, power: 'none', action: seat === 0 ? 'ready' : 'waiting', turns_played: 0, draw_offers: 0, said: [],
      last_seen_at: null, last_seen_ms: null, last_surface: null, active: true, ended_at: null });
    const game: Game = {
      id: gameId, kind: 'random', rating_policy: 'casual', speed: 'daily', days_per_move: 3, category: 'daily-3d/no-powers/no-cards', readings: null,
      colour_rule: 'white', engine_fingerprint: base.save.engine, options: base.options, draw: base.drawn.army, deal: base.drawn.hand,
      setup_admission: base.admission, setup: {}, rules: null, state: null, snapshot: null, status: 'setup', turn: 0, revision: 0,
      result: null, end_reason: null, draw_offer: null, rematch_offer: null, rematch_game_id: null, level: 'club', moves: null,
      deadline_at: null, deadline_kind: null, setup_deadline_at: null, created_by: actor, created_at: at, started_at: null, finished_at: null, updated_at: at,
      players: [player(0), player(1)],
    };
    const db = memory(game);
    const ready = await db.service.command(actor, gameId, { command_id: 'old-ready', expected_revision: 0, action: { type: 'choose', choice: base.choices[0], ready: true } });
    expect(ready).toMatchObject({ status: 'playing', revision: 1, engine_fingerprint: base.save.engine });
    expect(db.game.setup).toEqual(base.setup);
    expect(JSON.parse(db.game.state!)).toEqual(base.save);
    const next = new GameService(db.service.store);
    expect(await next.view(actor, gameId)).toMatchObject({ status: 'playing', revision: 1 });
    const played = await next.command(actor, gameId, { command_id: 'old-turn', expected_revision: 1, action: { type: 'turn', actions: [base.played.lan] } });
    expect(played).toMatchObject({ fen: base.played.fen, turn: base.played.turn, revision: 2 });
    expect(db.game).toMatchObject({ options: base.options, setup_admission: base.admission, engine_fingerprint: base.save.engine, draw: base.drawn.army, deal: base.drawn.hand });
    expect(db.game.options).not.toHaveProperty('single');
  });
});
