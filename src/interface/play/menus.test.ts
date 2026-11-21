import { readFileSync } from 'node:fs';
import { expect, it, vi } from 'vitest';
import { aboutLinks, gameMenu, settingsSheet, SETTING_ORDER } from './menus';
import { homeText, summaryLine } from './home';
import { guideCounts, guideEntries, kingBlocks, neighbours, pieceGroups } from './guide';
import { KINGS } from '../../rules/engine';

// In the app the public pages are on the site, not in the app files (iOS need P1).
vi.mock('../../platform', async importOriginal => ({ ...await importOriginal<typeof import('../../platform')>(), apiOrigin: 'https://kingdown.test' }));
const source = (name: string) => readFileSync(`src/interface/${name}`, 'utf8');

it('uses the same five settings in Account & settings and the game Menu', () => {
  expect(SETTING_ORDER).toEqual(['pieces', 'coords', 'sound', 'vibration', 'motion']);
  expect(settingsSheet).toBeTypeOf('function');
  expect(gameMenu).toBeTypeOf('function');
  const menus = source('play/menus.ts');
  expect(menus.match(/append\(\.\.\.controls\(s\)\)/g)).toHaveLength(2);
  expect(menus).toContain("button(text.guide, { icon: 'learn', onPress: o.onGuide })");
  expect(menus).toContain('if (o.onHistory) exits.append(button(text.history, { onPress: o.onHistory }))');
  expect(menus).not.toContain('handView');
});
it('iOS need P1: the About links use the public origin', () => {
  expect(aboutLinks()).toEqual([
    { name: 'Privacy', href: 'https://kingdown.test/privacy.html' },
    { name: 'Terms', href: 'https://kingdown.test/terms.html' },
    { name: 'Support', href: 'https://kingdown.test/support.html' },
  ]);
});
it('owner playtest: true level lines and "Your side"', () => {
  expect(homeText.levels).toEqual({
    casual: 'The easiest level. A good level for a first game.',
    clever: 'Much stronger than Friendly. It makes some mistakes.',
    club: 'The strongest level. Much stronger than Focused.',
  });
  expect(Object.values(homeText.levels).join(' ')).not.toMatch(/mistakes often/);
  expect(homeText.side).toBe('Your side');
  expect(source('play/home.ts')).toContain('button(text.friend');
  expect(source('play/home.ts')).toContain('secondary.append(newGame, friendBtn)');
  expect(summaryLine({ level: 'clever', setup: 'both', sideChoice: 'random' })).toBe('Focused · With powers and cards · Light');
});
it('launch decision 29: the Guide lists come from the content', () => {
  const groups = pieceGroups();
  expect(groups.map(group => group.name)).toEqual(['New pieces', 'Chess pieces']);
  expect(groups.flatMap(group => group.entries).length).toBe(guideEntries('Pieces').length);
  expect(groups[0].entries.length).toBeGreaterThan(0);
  const blocks = kingBlocks();
  expect(blocks.map(block => block.king)).toEqual(Object.keys(KINGS));
  // Each power shows one time, in the block of its own king.
  const shown = blocks.flatMap(block => block.powers.map(power => power.id));
  expect(new Set(shown).size).toBe(shown.length);
  expect(shown.sort()).toEqual(guideEntries('Kings and powers').map(power => power.id).sort());
  expect(guideCounts()).toEqual({ 'Pieces': '12 pieces', 'Kings and powers': '6 kings · 12 powers', 'Cards': `${guideEntries('Cards').length} cards`, 'How a turn works': '5 steps' });
  // Previous and Next stop at the ends of a section.
  const cards = guideEntries('Cards');
  expect(neighbours('Cards', cards[0].id)).toEqual({ previous: undefined, next: cards[1] });
  expect(neighbours('Cards', cards.at(-1)!.id)).toEqual({ previous: cards.at(-2), next: undefined });
});
it('launch decision 45: home does not wait for the board code or the symbol files', () => {
  const main = source('play/main.ts');
  // Only types come from the board code at load time; the code itself is a dynamic import.
  expect(main).toMatch(/^import type \{[^}]*\} from '\.\.\/board-api';$/m);
  expect(main).not.toMatch(/^import \{[^}]*\} from '\.\.\/(\.\.\/render\/sfx|board-api)';$/m);
  expect(main).toMatch(/import\('\.\.\/board-api'\)/);
  expect(main).toMatch(/^shell\.start\(\);$/m);
  expect(main).not.toMatch(/symbolsReady\.then\(\(\) => shell\.start\(\)\)/);
});
it('keeps the hero action in the first view of a short screen after the wide hero rule', () => {
  const menus = source('play/menus.css');
  expect(menus).toMatch(/@media \(min-aspect-ratio: 5\/4\)[^]*?\.home-hero\s*\{[^}]*max-height: calc\(100dvh - 28px\)/);
});
it('keeps Start game outside the inactive setup controls while options are open', () => {
  const setup = source('play/setup-table.ts');
  expect(setup).toContain('foot.append(start); table.append(head, body, foot)');
  expect(setup).toContain('head.inert = body.inert = true');
  expect(setup).not.toMatch(/(?:table|foot|start)\.inert\s*=\s*true/);
});
it('keeps iOS safe areas and has no persistent shell bar', () => {
  const components = source('ui/components.css'), shell = source('play/shell.css'), tokens = source('ui/tokens.css');
  expect(components).toMatch(/html\s*\{[^}]*-webkit-text-size-adjust:\s*100%/);
  expect(components).toMatch(/-webkit-touch-callout:\s*none/);
  expect(components).toMatch(/user-select:\s*none/);
  expect(tokens).toMatch(/--safe-top:\s*env\(safe-area-inset-top/);
  expect(shell + source('play/menus.css')).not.toContain('--daylight-bar');
  expect(shell + source('play/shell.ts')).not.toContain('shell-nav');
});
