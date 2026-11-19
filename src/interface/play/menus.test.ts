import { readFileSync } from 'node:fs';
import { expect, it, vi } from 'vitest';
import { aboutLinks, menuText, SETTING_ORDER } from './menus';
import { homeText, summaryLine } from './home';
import { guideCounts, guideEntries, kingBlocks, neighbours, pieceGroups } from './guide';
import { KINGS } from '../../rules/engine';

// The node tests have no page: motion reads the page style when it loads.
vi.mock('./motion', () => ({ calm: () => true, ms: () => 0, token: () => '' }));
// In the app the public pages are on the site, not in the app files (iOS need P1).
vi.mock('../../platform', async importOriginal => ({ ...await importOriginal<typeof import('../../platform')>(), apiOrigin: 'https://kingdown.test' }));
const source = (name: string) => readFileSync(`src/interface/${name}`, 'utf8');

it('keeps settings order and omits Motion speed from the game Menu', () => {
  expect(SETTING_ORDER).toEqual(['pieces', 'hand', 'coords', 'sound', 'vibration', 'motion']);
  expect(menuText.vibration).toBe('Vibration');
  // Both places take their rows from the one control set; the Menu adds no row of its own.
  const menus = source('play/menus.ts');
  expect(menus).toContain('group(menuText.soundMotion, c.sound, c.vibration, c.motion)');
  expect(menus.match(/controls\(s, /g)).toHaveLength(2);
  expect(menus).toMatch(/SETTING_ORDER\.filter\(name => name !== 'motion'\)\.map\(name => c\[name\]\)/);
});
it('iOS need P1: the About links use the public origin', () => {
  expect(aboutLinks()).toEqual([
    { name: 'Privacy', href: 'https://kingdown.test/privacy.html' },
    { name: 'Terms', href: 'https://kingdown.test/terms.html' },
    { name: 'Support', href: 'https://kingdown.test/support.html' },
  ]);
  expect(menuText.saved).toBe('Your game stays saved.');
});
it('owner playtest: true level lines and "Your pieces"', () => {
  expect(homeText.levels).toEqual({
    casual: 'The easiest level. A good level for a first game.',
    clever: 'Much stronger than Friendly. It makes some mistakes.',
    club: 'The strongest level. Much stronger than Focused.',
  });
  expect(Object.values(homeText.levels).join(' ')).not.toMatch(/mistakes often/);
  expect(homeText.side).toBe('Your pieces');
  expect(source('play/home.ts')).not.toContain('home-person');
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
  const shortHero = menus.slice(menus.indexOf('@media (min-width: 600px) { .home-hero'));
  expect(shortHero).toMatch(/@media \(max-height: 499px\) \{\s*\.home-hero \{ max-height: calc\(100dvh - var\(--safe-top\) - var\(--safe-bottom\) - var\(--bar-phone\) - 80px\);/);
});
it('iOS needs P2, P4 and P5, and the 56 px phone bar of decision 30', () => {
  const components = source('ui/components.css'), menus = source('play/menus.css'), tokens = source('ui/tokens.css');
  expect(components).toMatch(/html\s*\{[^}]*-webkit-text-size-adjust:\s*100%/);
  expect(components).toMatch(/-webkit-touch-callout:\s*none/);
  expect(components).toMatch(/user-select:\s*none/);
  expect(tokens).toMatch(/--safe-top:\s*env\(safe-area-inset-top/);
  expect(tokens).toMatch(/--bar-phone:\s*56px/);
  // The wide top bar pads by the top safe area.
  expect(menus).toMatch(/\.shell-nav\s*\{[^}]*padding:\s*var\(--safe-top\)/);
  // The bar's top line is part of its 56 px.
  expect(menus).toMatch(/\.shell-nav a\s*\{[^}]*min-height:\s*calc\(var\(--bar-phone\) - 1px\)/);
});
