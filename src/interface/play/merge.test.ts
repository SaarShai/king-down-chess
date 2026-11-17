import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { Game } from '../../game';
import { parseSq } from '../../rules/engine';
import { POWERS_BALANCED } from '../../rules/rules';
import { DraftTurn } from './turn';
import { armedStep, effectGroups, selectionLines, stateDescriptions } from './texts';

describe('the merged reading area from Dark', () => {
  it('names each Holy Light source and its exact pieces from the player side', () => {
    const game = new Game('RNBQKBNR', { ...POWERS_BALANCED, kings: [{ king: 'Spirit', power: 'HolyLight' }, { king: 'Spirit', power: 'HolyLight' }] });
    game.load(game.context.fromFen('3pkp2/4p3/8/8/8/4P3/3PKP2/8 b - - 0 1'));
    const groups = effectGroups(game.context, game.pos, game.pos.turn, 1);
    expect(groups.map(g => g.summary)).toEqual(['Computer: Holy Light protects 3 pieces.', 'You: Holy Light protects 3 pieces.']);
    expect(groups[0].details[0].line).toContain('the computer’s Pawn');
    expect(groups[1].details[0].line).toContain('your Pawn');
    expect(groups.flatMap(g => g.details)).toEqual(stateDescriptions(game.context, game.pos, 1));
  });

  it('keeps the staged turn duration separate from the Dark player side', () => {
    const game = new Game('RNBQKBNR', { ...POWERS_BALANCED, kings: [null, { king: 'Frost', power: 'Freeze' }] });
    game.load(game.context.fromFen('k7/7p/8/8/8/N7/7P/7K b - - 0 1'));
    const draft = new DraftTurn(game); draft.arm('freeze');
    draft.stage(draft.at(parseSq('a3'), parseSq('a3'))[0]);
    draft.stage(draft.legal.find(m => m.from === parseSq('h7') && m.to === parseSq('h6'))!);
    const expected = 'Frozen: the computer’s Knight on a3 cannot move on the computer’s next turn.';
    expect(selectionLines(game.context, draft.position, parseSq('a3'), draft.base.turn, 1)).toEqual([expected]);
    expect(effectGroups(game.context, draft.position, draft.base.turn, 1)[0]).toMatchObject({ summary: 'You: Freeze stops 1 piece.', details: [{ squares: [parseSq('a3')], line: expected }] });
    expect(stateDescriptions(game.context, draft.position, 1)[0].line).toContain('on this turn');
  });

  it('asks for a Dark actor when Dark uses a movement power', () => {
    const game = new Game('RNBQKBNR', { ...POWERS_BALANCED, kings: [null, { king: 'Flame', power: 'Strike' }] });
    game.load(game.context.fromFen('k7/n6p/8/8/8/8/7P/7K b - - 0 1'));
    const draft = new DraftTurn(game); draft.arm('strike');
    expect(draft.armedMoves.length).toBeGreaterThan(0);
    expect(armedStep(draft.armedMoves, draft.now, null, 1)).toBe('Choose one of your pieces.');
  });
});

it('S1: the home preload uses the page image mode that the lazy board uses', () => {
  const main = readFileSync(new URL('./main.ts', import.meta.url), 'utf8');
  const preload = main.slice(main.indexOf('const loadBoardCode ='), main.indexOf('// Sound unlocks'));
  expect(preload).toContain('new Image()');
  expect(preload).not.toContain('crossOrigin');
});

it('keeps the menus first-load recovery in the launch HTML and entry', () => {
  const read = (path: string) => readFileSync(path, 'utf8');
  const boot = (html: string) => /<script>[\s\S]*?<\/script>/.exec(html)?.[0];
  expect(boot(read('next.html'))).toContain('window.kdBootFault = show');
  expect(boot(read('next.html'))).toContain('window.kingdownSupported === false');
  expect(boot(read('tools/solo-launch/next.html'))).toBe(boot(read('next.html')));
  const entry = read('src/interface/launch-entry.ts');
  expect(entry).toContain('boot.kdBooted = true');
  expect(entry).toContain('catch { boot.kdBootFault?.(); }');
});

it('links the King Down crown icon in both new-page heads', () => {
  const png = readFileSync('public/icons/crown-192.png');
  expect(png.subarray(1, 4).toString()).toBe('PNG');
  expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([192, 192]);
  for (const path of ['next.html', 'tools/solo-launch/next.html']) {
    const html = readFileSync(path, 'utf8');
    expect(html).toContain('<link rel="icon" type="image/png" sizes="192x192" href="/icons/crown-192.png" />');
    expect(html).toContain('<link rel="apple-touch-icon" href="/icons/crown-192.png" />');
  }
});
