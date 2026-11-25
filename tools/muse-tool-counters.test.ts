/** The written counter decision of each Muse tool. COUNTER is a Record<MuseTool, ...>, so a new name in MuseTool
 *  (src/muse/tools.ts) fails typecheck here until the tool has a decision: a TOOL_LIMITS key or 'none'.
 *  A write tool that makes games or plays the computer needs a counter. */
import { expect, it } from 'vitest';
import { COUNTERS, type MuseTool } from '../src/muse/tools';
import type { TOOL_LIMITS } from '../src/plugin/service';

const COUNTER = {
  kingdown_games: 'none', kingdown_view: 'none', kingdown_explain: 'none', kingdown_end: 'none',
  kingdown_new_game: 'kingdown_create', kingdown_move: 'kingdown_computer',
} satisfies Record<MuseTool, keyof typeof TOOL_LIMITS | 'none'>;

it('gives each Muse tool the counter of its written decision', () => {
  const counters: Partial<Record<MuseTool, string>> = COUNTERS;
  for (const [name, counter] of Object.entries(COUNTER) as [MuseTool, string][])
    expect(counters[name] ?? 'none', `Muse tool ${name}: COUNTER in tools/muse-tool-counters.test.ts says ${counter}; set COUNTERS.${name} in src/muse/tools.ts to the same TOOL_LIMITS key (or remove it for 'none')`).toBe(counter);
});
