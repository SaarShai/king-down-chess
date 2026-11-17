/** The six Muse tools over the game port. Every result is speakable text plus structuredContent; no widget, no image. */
import { createHash } from 'node:crypto';
import { McpServer, type CallToolResult, type StandardSchemaWithJSON } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { GameRules } from '../game-rules';
import type { PublicMatchRules } from '../match';
import { MAX_REVISION, TURN_ACTIONS, type InboxEntry, type View } from '../match/protocol';
import { MatchServiceError, type GameService } from '../match/service';
import { DEFAULT_OPTIONS } from '../match/setup';
import { describeMove } from '../move-text';
import { diagnostic } from '../plugin/diagnostics';
import { endReason, ending, WHY } from '../plugin/ending';
import type { TOOL_LIMITS } from '../plugin/service';
import { DEFAULT_RULES, LETTERS, typeOf, type PieceType } from '../rules/engine';
import { POOL } from '../rules/setup';
import { backRankWords, boardWords, checkWords, explainWords } from './board-words';
import { matchMove, moveChoices, type MoveChoice } from './match-words';
import { board } from './position';

/** The per-user limit (TOOL_LIMITS) that a counted tool uses before it works: a move can make the computer's turn, so it
 *  counts as one. The reads count nothing. tools/muse-tool-docs.ts documents these limits. */
export const COUNTERS = { kingdown_new_game: 'kingdown_create', kingdown_move: 'kingdown_computer' } as const satisfies Record<string, keyof typeof TOOL_LIMITS>;

export interface MuseGames {
  create: GameService['create'];
  command(actor: string, gameId: string, input: unknown): Promise<View>;
  view: GameService['view'];
  inbox: GameService['inbox'];
  previewDraft: GameService['previewDraft'];
  toolTry(actor: string, tool: (typeof COUNTERS)[keyof typeof COUNTERS]): Promise<void>;
}

/** Computer commands after one turn: the computer plays one action for each call, so a Haste turn takes two. */
const COMPUTER_CALLS = 8;
const NEXT_CHOICES = 6;
/** Fixed sentences for service refusals; the service text never reaches the model. INVALID_MOVE and INVALID_INPUT are the plugin's words. */
export const REFUSED: Record<string, string> = {
  STALE_REVISION: 'The game changed. Read the game again, then move.', INVALID_MOVE: 'This move is not available. Choose another move.',
  WRONG_TURN: 'It is not your turn.', MATCH_TERMINAL: 'This game is over.', RATE_LIMITED: 'Too many requests. Wait one minute, then try again.',
  UNAVAILABLE: 'The game server is busy. Try again.', NOT_FOUND: 'There is no game with this ID.', FORBIDDEN: 'You do not have a seat in this game.',
  INVALID_INPUT: 'Invalid input: check the tool fields.', COMMAND_CONFLICT: 'This request ID belongs to another request. Use a new request ID.',
  NOT_ALLOWED: 'The game does not allow this now.', MATCH_LIMIT: 'This game reached its length limit.', MATCH_INCOMPATIBLE: 'This game uses an older version. Play it on the website.',
};
/** A refusal of this layer: a fixed sentence (it never repeats the input) and its code. */
class Refusal extends Error { constructor(readonly code: string, message: string) { super(message); } }

const commandId = (gameId: string, revision: number, what: string) => `muse:${createHash('sha256').update(`${gameId}:${revision}:${what}`).digest('hex')}`;
const colourOf = (seat: number) => seat === 0 ? 'white' as const : 'black' as const;
const moveOf = (fen: string) => fen ? Number(fen.split(' ')[5]) : null;

/** One line about whose turn it is, for a list entry or a view. */
function turnLine(g: { kind: View['kind']; status: View['status']; action: View['action']; move: number | null }): string {
  const against = g.kind === 'solo' ? 'the computer' : 'a person';
  if (g.status === 'waiting') return 'Waiting for a person to join.';
  if (g.status === 'setup') return g.action === 'ready' ? `Your setup against ${against}.` : `Waiting for ${against} to set up.`;
  return g.action === 'ready' ? `Your turn against ${against}, move ${g.move}.` : `Waiting for ${against}, move ${g.move}.`;
}

/** "Checkmate. You win." for a decisive result; the plugin's ending words otherwise. */
function endWords(view: View): string {
  const r = view.result!;
  if (r.winner !== null) return `${WHY[r.reason]}. ${r.winner === view.seat ? 'You win.' : 'You lose.'}`;
  return endReason(view) || (r.reason === 'abort' ? 'Game aborted. No result.' : ending(view));
}

/** Sentences for `lans` played in order from `fen`; the first `skip` actions are only replayed. */
function sentences(rules: PublicMatchRules, fen: string, lans: readonly string[], skip = 0): string[] {
  const { context } = board(rules, fen), out: string[] = [];
  let { pos } = board(rules, fen);
  lans.forEach((lan, i) => {
    const move = context.legalMoves(pos).find(m => context.toLan(pos, m) === lan);
    if (!move) throw new Error('A game action is not legal in its position');
    if (i >= skip) out.push(describeMove(context, pos, move, true));
    pos = context.makeMove(pos, move);
  });
  return out;
}

/** The last turns, at most two and oldest first, as "You: ..." and "Computer: ...", from a full read.
 *  shortcut: replays the whole history to reach the position before them; keep each command's FEN if long games get slow. */
function lastTurns(view: View): string[] {
  if (!view.history || !view.rules) return [];
  const turns = view.last_commands.flatMap(({ action: a }) => (a.type === 'turn' || a.type === 'computer') && 'actions' in a && a.actions.length ? [a] : []).slice(-2);
  const { initial_fen, actions } = view.history, said = sentences(view.rules, initial_fen, actions, actions.length - turns.reduce((n, t) => n + t.actions.length, 0));
  return turns.map(t => `${t.type === 'computer' ? 'Computer' : 'You'}: ${said.splice(0, t.actions.length).join(' ')}`);
}

const gameShape = { game_id: z.string(), against: z.enum(['computer', 'person']), colour: z.enum(['white', 'black']), status: z.string(), your_turn: z.boolean(), move: z.number().int().nullable(), link: z.string() };
const positionShape = {
  level: z.string(), revision: z.number().int(), fen: z.string(), legal_count: z.number().int(), status_line: z.string(), last_move: z.string().nullable(), check: z.string().nullable(),
  white: z.string(), black: z.string(), grid: z.string(), legend: z.string(), ending: z.string().nullable(),
};
const boardShape = z.object({ ...gameShape, ...positionShape }).partial().shape;
const choiceShape = z.object({ number: z.number().int(), words: z.string(), move_ids: z.array(z.string()) });
const revision = z.number().int().min(0).max(MAX_REVISION).describe('The revision of the last result for this game.');
const gameId = z.uuid().optional().describe('The game, from kingdown_games or an earlier result. Default: your most urgent game against the computer.'), writeGameId = z.uuid().describe('The game, from kingdown_games or an earlier result.');

type Out = { lead: string; lines?: string[]; data: Record<string, unknown> };

export function createMuseServer({ games, actorId, publicOrigin }: { games: MuseGames; actorId: string; publicOrigin: string }): McpServer {
  const server = new McpServer({ name: 'kingdown', version: '1.0.0' });
  const origin = new URL(publicOrigin).origin, host = new URL(origin).host, link = (id: string) => `${origin}/g/${id}`;

  function tool<I extends z.ZodObject, O extends z.ZodObject>(name: string, title: string, description: string, kind: 'read' | 'write' | 'destructive', input: I, output: O, run: (args: z.infer<I>) => Promise<Out & { data: z.infer<O> }>) {
    server.registerTool<StandardSchemaWithJSON, StandardSchemaWithJSON>(name, { title, description, inputSchema: input, outputSchema: output, annotations: { readOnlyHint: kind === 'read', destructiveHint: kind === 'destructive', idempotentHint: true, openWorldHint: false } },
      async (args): Promise<CallToolResult> => {
        try {
          const { lead, lines = [], data } = await run(args as z.infer<I>);
          return { content: [{ type: 'text', text: [lead, ...lines].join('\n') }], structuredContent: data };
        } catch (error) {
          const known = error instanceof Refusal || error instanceof MatchServiceError;
          if (!known || error instanceof MatchServiceError && error.status >= 500) console.error('King Down Muse tool failed', { tool: name, ...diagnostic(error) });
          const code = known ? error.code : 'INTERNAL_ERROR';
          return { isError: true, content: [{ type: 'text', text: error instanceof Refusal ? error.message : REFUSED[code] ?? 'Could not update the game. Try again.' }], structuredContent: { code } };
        }
      });
  }

  const row = (v: View) => ({ game_id: v.game_id, against: v.kind === 'solo' ? 'computer' as const : 'person' as const, colour: colourOf(v.seat), status: v.status, your_turn: v.action === 'ready', move: moveOf(v.fen), link: link(v.game_id) });
  /** A computer game's position as words: the status first, then the pieces, the grid and the revision. */
  function summary(v: View, rules: PublicMatchRules, last: string | null = null) {
    const words = boardWords(rules, v.fen, v.seat), check = checkWords(rules, v.fen, v.seat), end = v.result ? endWords(v) : null;
    const data = { ...row(v), level: v.level ?? 'club', revision: v.revision, fen: v.fen, legal_count: v.legal.length, status_line: end ?? words.status, last_move: last, check,
      white: words.white, black: words.black, grid: words.grid, legend: words.legend, ending: end };
    const lines = [data.status_line, ...(check ? [check] : []), words.white, words.black, words.grid, ...(words.legend ? [`Letters: ${words.legend}.`] : []),
      `Revision ${v.revision}. ${v.legal.length} legal moves. ${link(v.game_id)}`];
    return { data, lines, check, end };
  }
  /** Your most urgent game against the computer: your turn first, then the newest. */
  async function urgent(): Promise<InboxEntry | undefined> {
    return (await games.inbox(actorId)).filter(g => g.kind === 'solo').sort((a, b) => Number(b.action === 'ready') - Number(a.action === 'ready') || b.updated_at.localeCompare(a.updated_at))[0];
  }
  async function pick(id?: string): Promise<View | null> { const chosen = id ?? (await urgent())?.game_id; return chosen ? games.view(actorId, chosen) : null; }
  /** A game against the computer that has a position; else a refusal. Positions of games against a person never leave this layer. */
  async function computerGame(id?: string): Promise<View> {
    const v = await pick(id);
    if (!v) throw new Refusal('NO_GAME', 'You have no game against the computer. Start a new game first.');
    if (v.kind !== 'solo') throw new Refusal('PERSON_GAME', `This game is against a person. Play it on ${host}: ${link(v.game_id)}`);
    if (!v.fen || !v.rules) throw new Refusal('NOT_STARTED', 'This game has not started yet.');
    return v;
  }
  /** Computer commands while the computer is to move; each command ID derives from its revision, so a resend replays the receipt. */
  async function computerTurn(v: View, rules: PublicMatchRules): Promise<{ view: View; words: string[] }> {
    const words: string[] = [];
    for (let i = 0; i < COMPUTER_CALLS && v.status === 'playing' && v.turn !== v.seat; i++) {
      const before = v.fen;
      v = await games.command(actorId, v.game_id, { command_id: commandId(v.game_id, v.revision, 'computer'), expected_revision: v.revision, action: { type: 'computer' } });
      const last = v.last_commands.at(-1)?.action;
      if (last?.type === 'computer' && 'actions' in last) words.push(...sentences(rules, before, last.actions));
    }
    return { view: v, words };
  }
  const changed = (v: View) => {
    const turns = lastTurns(v), s = summary(v, v.rules!, turns.at(-1) ?? null);
    return { lead: ['The game changed, so nothing was played.', ...turns].join(' '), lines: s.lines, data: { result: 'changed' as const, you: [] as string[], computer: [] as string[], ...s.data } };
  };
  const numbered = (list: MoveChoice[], prior: string[]) => list.map((c, i) => ({ number: i + 1, words: c.words, move_ids: [...prior, c.id] }));
  const listed = (choices: { number: number; words: string }[]) => choices.map(c => `${c.number}. ${c.words}`);

  tool('kingdown_games', 'Your games', 'Lists your unfinished King Down games, your turn first. Each game has its ID, whether it is against the computer or a person, whether it is your turn, the move number, your colour, the computer level and a link to the game on the website. It gives no opponent name.',
    'read', z.object({}), z.object({ games: z.array(z.object({ ...gameShape, level: z.string().optional() })) }), async () => {
      const rows = await games.inbox(actorId);
      const list = rows.map(g => ({ game_id: g.game_id, against: g.kind === 'solo' ? 'computer' as const : 'person' as const, colour: colourOf(g.seat), status: g.status, your_turn: g.action === 'ready', move: g.move, link: link(g.game_id), ...(g.kind === 'solo' && { level: g.level }) }));
      const lines = rows.map((g, i) => `${i + 1}. ${turnLine(g)} You play ${list[i].colour}${g.kind === 'solo' ? `, level ${g.level}` : ''}. ${list[i].link}`);
      const count = rows.length ? `You have ${rows.length} game${rows.length === 1 ? '' : 's'}.` : 'You have no unfinished games.';
      return { lead: rows.length ? `${count} ${turnLine(rows[0])}` : count, lines, data: { games: list } };
    });

  tool('kingdown_view', 'Show a game', 'Shows one King Down game. Without game_id, it shows your most urgent game against the computer. A game against the computer gives the status, the last move, the check line, the pieces of each side, a letter grid with its legend, the revision, the FEN, your colour, the number of legal moves and a link. A game against a person gives only its status, the move number and a link.',
    'read', z.object({ game_id: gameId }), z.object({ found: z.boolean(), ...boardShape }), async ({ game_id }) => {
      const v = await pick(game_id);
      if (!v) return { lead: 'You have no game against the computer. Start a new game first.', data: { found: false } };
      if (v.kind !== 'solo') {
        const { status, your_turn, move, ...rest } = row(v), line = v.result ? endWords(v) : turnLine({ ...v, move });
        return { lead: `This game is against a person. Play it on ${host}: ${rest.link}`, lines: [line], data: { found: true, ...rest, status, your_turn, move } };
      }
      if (!v.fen || !v.rules) return { lead: `${turnLine({ ...v, move: null })} This game has not started yet.`, lines: [link(v.game_id)], data: { found: true, ...row(v) } };
      const last = lastTurns(v).at(-1) ?? null, s = summary(v, v.rules, last);
      return { lead: `${s.data.status_line}${last ? ` Last move: ${last}` : ''}`, lines: s.lines.slice(1), data: { found: true, ...s.data } };
    });

  tool('kingdown_explain', 'Explain a rule', 'Explains a King Down piece (by name or letter), a square, a king power or a card. Without game_id, it uses your most urgent game against the computer, if any. In a game against the computer, a square names its piece, and your piece also gets the moves it can make now. An unknown topic gives the names of the pieces in play.',
    'read', z.object({ topic: z.string().min(1).max(60).describe('A piece name or letter, a square, a king power or a card.'), game_id: gameId }), z.object({ known: z.boolean(), pieces: z.array(z.string()).optional() }), async ({ topic, game_id }) => {
      const v = await pick(game_id), solo = v?.kind === 'solo' && !!v.fen && !!v.rules ? v : null;
      const words = explainWords(v?.rules ?? null, topic, solo ? { fen: solo.fen, viewer: solo.seat, legal: solo.legal } : undefined);
      if (words) return { lead: words, data: { known: true } };
      const context = new GameRules(v?.rules ?? DEFAULT_RULES);
      const types = solo ? [...board(solo.rules!, solo.fen).pos.board].filter(Boolean).map(typeOf) : [...`KQRBNP${POOL}`].map(l => LETTERS.indexOf(l) as PieceType);
      const pieces = [...new Set(types)].map(t => context.nameOf(t));
      return { lead: 'That is not a piece, square, king power or card of King Down.', lines: [`Pieces in play: ${pieces.join(', ')}.`], data: { known: false, pieces } };
    });

  tool('kingdown_new_game', 'New game', 'Starts a new King Down game against the computer, with fairy pieces unless classic is true. A new request_id makes a new game; the same request_id on a retry returns the same game. The result gives your colour, the back rank, the computer\'s first move when it plays White, and the board.',
    'write', z.object({
      request_id: z.string().regex(/^[A-Za-z0-9_-]{8,64}$/).describe('A new ID for each new game; the same ID on a retry.'),
      colour: z.enum(['white', 'black', 'random']).optional().describe('Your colour. Default: white.'),
      level: z.enum(['beginner', 'casual', 'club', 'strong']).optional().describe('The computer level. Default: casual.'),
      king_powers: z.boolean().optional().describe('King powers on, with your default king. Default: false.'),
      classic: z.boolean().optional().describe('Classic chess pieces only, with no fairy pieces. Default: false.'),
    }), z.object({ back_rank: z.string(), computer: z.array(z.string()), ...gameShape, ...positionShape }), async ({ request_id, colour = 'white', level = 'casual', king_powers = false, classic = false }) => {
      await games.toolTry(actorId, COUNTERS.kingdown_new_game);
      const options = { ...DEFAULT_OPTIONS, arrangement: false, kingPowers: king_powers, classic, fairy: !classic };
      let v = await games.create(actorId, { kind: 'solo', level, colour, options }, `muse:${request_id}`);
      // King powers need a seat choice: the default king, as the board's Ready does with no change.
      if (v.status === 'setup' && v.action === 'ready') v = await games.command(actorId, v.game_id, { command_id: commandId(v.game_id, v.revision, 'choose'), expected_revision: v.revision, action: { type: 'choose', choice: v.choices![v.seat]!, ready: true } });
      const full = await computerGame(v.game_id), rules = full.rules!, { view, words } = await computerTurn(full, rules), s = summary(view, rules);
      const lead = `New game against the computer. You are ${colourOf(view.seat) === 'white' ? 'White' : 'Black'}.${words.length ? ` Computer: ${words.join(' ')}` : ''} ${s.end ?? 'Your move.'}`;
      const back = backRankWords(rules, full.history?.initial_fen ?? full.fen);
      return { lead, lines: [back, ...s.lines], data: { back_rank: back, computer: words, ...s.data } };
    });

  tool('kingdown_move', 'Play a move', 'Plays your move in a King Down game against the computer, from words (said) or from exact move IDs of earlier choices (move_ids), or both: the IDs first, then the words. Words that fit several moves give numbered choices and play nothing; words that fit none give the reason and some legal moves. A turn with more actions (a power or a card) gives the next choices and plays nothing until it is complete. A complete turn plays, and the computer replies in the same call. When expected_revision is not the game\'s revision, nothing is played and the current state comes back.',
    'write', z.object({
      expected_revision: revision, said: z.string().min(1).max(200).optional().describe('The move in the player\'s words, for example "knight to f3".'),
      move_ids: z.array(z.string().min(1).max(120)).min(1).max(TURN_ACTIONS).optional().describe('Exact move IDs from earlier choices, in order.'), game_id: writeGameId,
    }), z.object({ result: z.enum(['played', 'computer', 'choices', 'refused', 'pending', 'changed']), you: z.array(z.string()), computer: z.array(z.string()), reason: z.string().optional(), move_ids: z.array(z.string()).optional(), choices: z.array(choiceShape).optional(), ...boardShape }),
    async ({ expected_revision, said, move_ids: prior = [], game_id }) => {
      if (said === undefined && !prior.length) throw new Refusal('INVALID_INPUT', 'Say a move, or send move IDs.');
      await games.toolTry(actorId, COUNTERS.kingdown_move);
      const v = await computerGame(game_id), rules = v.rules!;
      if (v.revision !== expected_revision) return changed(v);
      if (v.result) throw new Refusal('MATCH_TERMINAL', `This game is over. ${endWords(v)}`);
      // The computer is to move only when an earlier call stopped early: it plays now, and the words wait for the new position.
      if (v.status === 'playing' && v.turn !== v.seat) {
        const { view, words } = await computerTurn(v, rules), s = summary(view, rules);
        return { lead: `Computer: ${words.join(' ')} ${s.check ?? ''} ${s.end ?? 'Your move. Say it again.'}`.replace(/ +/g, ' '), lines: s.lines, data: { result: 'computer' as const, you: [], computer: words, ...s.data } };
      }
      const draft = (actions: string[]) => games.previewDraft(actorId, v.game_id, { expected_revision, engine_fingerprint: v.engine_fingerprint, actions });
      let actions = prior;
      if (said !== undefined) {
        const at = prior.length ? (await draft(prior)).positions.at(-1)! : { fen: v.fen, turn: v.seat, status: 'playing', moves: v.legal.map(lan => ({ lan })) };
        const legal = at.status === 'playing' && at.turn === v.seat ? at.moves.map(m => m.lan) : [];
        const found = matchMove(rules, at.fen, legal, said), base = { you: [], computer: [], ...row(v), revision: v.revision, move_ids: prior };
        if (found.kind === 'many') {
          const choices = numbered(found.choices, prior);
          return { lead: found.count === 1 ? 'Only this move fits. Is it the one you mean?' : found.count > choices.length ? `That fits ${found.count} moves. Here are ${choices.length}. Which one?` : `That fits ${found.count} moves. Which one?`, lines: listed(choices), data: { result: 'choices' as const, choices, ...base } };
        }
        if (found.kind === 'none') {
          const choices = numbered(found.options, prior);
          return { lead: found.reason, lines: choices.length ? ['Some legal moves:', ...listed(choices)] : [], data: { result: 'refused' as const, reason: found.reason, choices, ...base } };
        }
        actions = [...prior, found.move.id];
      }
      const preview = await draft(actions), end = preview.positions.at(-1)!, mine = sentences(rules, v.fen, actions);
      if (end.status === 'playing' && end.turn === v.seat) {
        const all = moveChoices(rules, end.fen, end.moves.map(m => m.lan)), pass = end.moves.find(m => m.move.pass)?.lan;
        const choices = numbered([...all.filter(c => c.id !== pass).slice(0, pass ? NEXT_CHOICES - 1 : NEXT_CHOICES), ...all.filter(c => c.id === pass)], actions);
        return { lead: `${mine.join(' ')} Your turn goes on. Say the next move${pass ? ', or pass' : ''}.`, lines: listed(choices),
          data: { result: 'pending' as const, you: mine, computer: [], ...row(v), revision: v.revision, move_ids: actions, choices } };
      }
      const played = await games.command(actorId, v.game_id, { command_id: commandId(v.game_id, expected_revision, actions.join(' ')), expected_revision, action: { type: 'turn', actions } });
      const { view, words } = await computerTurn(played, rules), s = summary(view, rules);
      const lead = `You: ${mine.join(' ')}${words.length ? ` Computer: ${words.join(' ')}` : ''} ${s.end ?? `${s.check ? `${s.check} ` : ''}Your move.`}`;
      return { lead, lines: s.lines, data: { result: 'played' as const, you: mine, computer: words, ...s.data } };
    });

  tool('kingdown_end', 'End a game', 'Ends a King Down game against the computer: resign (the computer wins) or abort (no result; only before each side has played a turn). When expected_revision is not the game\'s revision, nothing changes and the current state comes back.',
    'destructive', z.object({ action: z.enum(['resign', 'abort']).describe('resign: the computer wins. abort: no result, only before each side has played a turn.'), expected_revision: revision, game_id: writeGameId }), z.object({ result: z.enum(['ended', 'changed']), ...boardShape }),
    async ({ action, expected_revision, game_id }) => {
      const v = await computerGame(game_id);
      if (v.revision !== expected_revision) { const { data: { you, computer, ...data }, ...rest } = changed(v); return { ...rest, data }; }
      if (v.result) throw new Refusal('MATCH_TERMINAL', `This game is over. ${endWords(v)}`);
      if (action === 'abort' && !v.abort_open) throw new Refusal('NOT_ALLOWED', 'Abort is possible only before each side has played a turn. You can resign.');
      const after = await games.command(actorId, v.game_id, { command_id: commandId(v.game_id, expected_revision, action), expected_revision, action: { type: action } }), s = summary(after, v.rules!);
      return { lead: s.end ?? s.data.status_line, lines: s.lines.slice(1), data: { result: 'ended' as const, ...s.data } };
    });

  return server;
}
