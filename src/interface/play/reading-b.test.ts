import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { finishKind, sentences, summaryLabel } from './reader-rules';
import { readingBText } from './texts';

// Stage "readingb" (launch decisions 33 to 36): the rules of the B reading area and of the game screen that a unit test can read.
// The browser run (runs/tools/launch-readingb/browser.mjs) proves the same rules on the page at each size of the matrix.
const read = (name: string) => readFileSync(new URL(name, import.meta.url), 'utf8');
const css = read('./reading-b.css'), main = read('./main.ts'), motion = read('./motion.ts'), reader = read('./reader.ts');
/** The CSS with the bodies of the @media blocks of one condition removed. */
const outside = (text: string, condition: string) => {
  let out = text, at: number;
  while ((at = out.indexOf(`@media ${condition}`)) >= 0) {
    let depth = 0, end = out.indexOf('{', at);
    for (; end < out.length; end++) { if (out[end] === '{') depth++; else if (out[end] === '}' && --depth === 0) break; }
    out = out.slice(0, at) + out.slice(end + 1);
  }
  return out;
};

describe('the B reading area (decision 33)', () => {
  it('keeps a compact choice summary with its square, outside the shrinking secondary text', () => {
    expect(reader).toContain("primary.prepend(div('play-choice-summary', target, m.summary))");
    expect(css).toMatch(/\.play-b \.play-choice-summary \{[^}]*min-height: 44px/);
    expect(css).toMatch(/\.play-b \.play-primary:has\(\.play-choice-summary\) \{ gap: 0; \}/);
  });
  it('splits a text into the sentences of the copy table', () => {
    expect(sentences('Your Pawn on b2 cannot move on your next turn; it still attacks. The opponent\'s Pawn moves from h7 to h6.'))
      .toEqual(['Your Pawn on b2 cannot move on your next turn; it still attacks.', 'The opponent\'s Pawn moves from h7 to h6.']);
    expect(sentences('Choose a target.')).toEqual(['Choose a target.']);
    expect(sentences('')).toEqual([]);
    // A lower-case word after a full stop does not start a sentence (a square name such as "e5. then").
    expect(sentences('Pawn on e5. then it stops.')).toEqual(['Pawn on e5. then it stops.']);
  });
  it('d2: End turn is quiet after a free action alone and brass after a move', () => {
    expect(finishKind(true)).toBe('quiet');
    expect(finishKind(false)).toBe('main');
  });
  it('a1: one summary control; one source shows its own summary, several show the count of sources', () => {
    expect(summaryLabel([], 'tall')).toBe('');
    expect(summaryLabel(['You: Holy Light protects 3 pieces.'], 'tall')).toBe('You: Holy Light protects 3 pieces.');
    expect(summaryLabel(['You: Holy Light protects 3 pieces.'], 'wide')).toBe('You: Holy Light protects 3 pieces.');
    expect(summaryLabel(['A.', 'B.'], 'tall')).toBe('Active effects · 2');
    // The compact header has no room for a sentence: it always shows the count.
    expect(summaryLabel(['You: Holy Light protects 3 pieces.'], 'compact')).toBe('Active effects · 1');
  });
  it('b1 and the card states use the words of the copy table', () => {
    expect(readingBText).toEqual({ rivalCards: 'Computer’s cards', used: 'Used', notNow: 'Not now', computerTurn: 'Computer’s turn' });
  });
  it('J1 Single-label Exact: a label changes with no second copy and fades from 0.7 to 1 over 120 ms', () => {
    const swap = motion.slice(motion.indexOf('export function swapText'), motion.indexOf('\n}\n', motion.indexOf('export function swapText')));
    expect(swap).not.toMatch(/cloneNode|createElement|position: ?'absolute'/);
    expect(swap).toMatch(/opacity: \.7 \}, \{ opacity: 1 \}/);
    expect(swap).toMatch(/time\(120\)/);
    expect(swap).toMatch(/calm\(\)\) return/);
    // The turn state and the headline keep one node each for the whole game.
    expect(reader).toMatch(/swapText\(nodes\.state, m\.state\)/);
  });
});

describe('touch, pointer and safe areas (decision 35)', () => {
  it('has hover styles only under (hover: hover); a touch screen gets no hover underline', () => {
    const rest = outside(outside(css, '(hover: hover)'), 'not all and (hover: hover)');
    expect(rest).not.toMatch(/:hover/);
    expect(css).toMatch(/@media not all and \(hover: hover\) \{[^}]*\.kd-button[^}]*text-decoration: none/);
  });
  it('turns off selection, callout and tap highlight on the board and the controls', () => {
    const rule = css.match(/\.play-game :is\(\.play-board, \.play-grid, button, a\) \{([^}]*)\}/)?.[1] ?? '';
    for (const part of ['user-select: none', '-webkit-user-select: none', '-webkit-touch-callout: none', '-webkit-tap-highlight-color: transparent']) expect(rule).toContain(part);
    expect(css).toMatch(/\.play-game :is\(button, a\) \{ touch-action: manipulation; \}/);
    expect(css).toMatch(/\.play-game \{[^}]*overscroll-behavior: none/);
  });
  it('reads the safe-area variables and does not define them', () => {
    for (const side of ['top', 'right', 'bottom', 'left']) expect(css).toContain(`var(--safe-${side}, `);
    expect(css).not.toMatch(/--safe-(top|right|bottom|left)\s*:/);
  });
  it('P4: a square has no minimum size, so the tap grid is the painted board after a rotation', () => {
    expect(css).toMatch(/\.play-game \.play-square \{ min-width: 0; min-height: 0; \}/);
  });
  it('P3: the layout runs again when the game box changes, also when only the safe areas change', () => {
    expect(main).toMatch(/const fit = new ResizeObserver\(\(\) => layout\(\)\)/);
    expect(main).toMatch(/fit\.observe\(screen\)/);
    expect(main).toMatch(/gameLayout\(screen\.clientWidth, screen\.clientHeight,/);
  });
  it('Escape cancels an armed card or power', () => {
    const handler = main.slice(main.indexOf("if (event.key !== 'Escape') return;"), main.indexOf('function key(event'));
    expect(handler).toContain('draft.armed = null');
    expect(handler).toContain('cancelLine(cancelled.subject.kind)');
  });
});


it('online action content takes the shared area before it renders', () => {
  const update = main.slice(main.indexOf('function update()'), main.indexOf('const armedResource'));
  expect(update).toMatch(/const actions = net \? onlineActions\(net\) : undefined/);
  expect(update).toMatch(/readerActive = String\([^;]*actions\?\.childElementCount/);
  expect(update).toContain('renderReader(actions)');
});
it('keeps the last three moves in the rail and hides the turn scroll on a phone', () => {
  expect(main).toContain('groups.flatMap(group => group.lines).slice(0, 3)');
  expect(css).toContain(".play-game[data-layout='portrait'] .play-history-strip, .play-game[data-layout='wide'][data-form='compact'] .play-history-strip { display: none; }");
  expect(css).toContain("top: var(--reader-y); height: auto; min-height: var(--reader); max-height: calc(var(--hand-y) - var(--reader-y) - 8px);");
});
it('removes the Effects control and its panel opener, and keeps the effect data functions', () => {
  expect(main).not.toMatch(/effectsButton|play-effects-toggle|toggleScroll\('effects'/);
  expect(read('./texts.ts')).toContain('export function effectGroups');
});
it('the name and level have separate single-line ellipsis boxes', () => {
  expect(main).toContain("el('span', 'play-opponent-name', oppName)");
  expect(css).toMatch(/strong > \* \{[^}]*text-overflow: ellipsis; white-space: nowrap/);
});

it('online name updates keep the single-line name box', () => {
  expect(main).toContain("who.querySelector('.play-opponent-name')!.textContent = oppName");
  expect(main).not.toContain('who.replaceChildren(oppName');
});

it('a compact current sentence uses the header before the turn label', () => {
  expect(reader).toContain("m.title && !m.named ? null : nodes.state, title");
  expect(css).toMatch(/play-bhead \.play-headline-line \{ max-height: 44px; white-space: normal/);
});

it('a blocked-save action stays below the full-width compact warning', () => {
  expect(reader).toContain('m.named && m.tools.length === 1');
  expect(css).toContain(":has(.play-b .play-tools > .kd-button) .play-reader:not([data-floating='true']) { height: calc(var(--reader) + 28px);");
});
