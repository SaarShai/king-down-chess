import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { parseSync, transformSync } from 'rolldown/utils';
import { expect, it, vi } from 'vitest';

const main = readFileSync(new URL('./main.ts', import.meta.url), 'utf8'), css = readFileSync(new URL('./reading-b.css', import.meta.url), 'utf8');
const page = transformSync('main.ts', parseSync('main.ts', main).program.body
  .filter(node => node.type === 'FunctionDeclaration' && node.id?.name === 'markUses').map(node => main.slice(node.start, node.end)).join('\n')).code;
/** A power with three uses: its notches and the play screen's real drawing of them. */
function power({ reduce = false } = {}) {
  const notches = [0, 1, 2].map(() => ({ dataset: {} as Record<string, string>, animate: vi.fn() }));
  const scope: Record<string, unknown> = { reducedMotion: () => reduce, time: (ms: number) => ms, getComputedStyle: () => ({ backgroundColor: 'teal' }) };
  runInNewContext(page, scope);
  const mark = (left: number | null, spentNow = false) => (scope.markUses as (...args: unknown[]) => void)({ querySelectorAll: () => notches }, left, spentNow);
  return { mark, used: () => notches.filter(notch => notch.dataset.used === 'true').length, moved: () => notches.map(notch => notch.animate.mock.calls.length) };
}
it('a use that the player spends now fills one notch in 180 ms; a redraw moves nothing', () => {
  const { mark, used, moved } = power();
  mark(3); expect([used(), moved()]).toEqual([0, [0, 0, 0]]);
  mark(2, true); expect([used(), moved()]).toEqual([1, [0, 0, 1]]);
  mark(2); mark(2); expect([used(), moved()]).toEqual([1, [0, 0, 1]]);
  mark(1, true); expect([used(), moved()]).toEqual([2, [0, 1, 1]]);
});
it('the filled notches equal the true use count with no motion after a reload, undo and an online update', () => {
  const { mark, used, moved } = power();
  mark(1); expect(used(), 'reload').toBe(2); // the first draw of the screen
  mark(1, true); expect(used(), 'a step that spends no use').toBe(2);
  mark(2); expect(used(), 'undo').toBe(1);
  mark(0); expect(used(), 'online update').toBe(3);
  expect(moved()).toEqual([0, 0, 0]);
});
it('a first draw that comes with a step moves nothing; reduced motion fills at once', () => {
  const first = power(); first.mark(1, true);
  expect([first.used(), first.moved()]).toEqual([2, [0, 0, 0]]);
  const still = power({ reduce: true }); still.mark(3); still.mark(2, true);
  expect([still.used(), still.moved()]).toEqual([1, [0, 0, 0]]);
});
it('the spent notch holds wax, and only a step that the player stages counts as now', () => {
  expect(css).toMatch(/\.play-power-notch\[data-used='true'\] \{ background: var\(--wax\); /);
  // No filter of a spent power greys the wax: only the emblem is grey.
  expect(css).toMatch(/\.play-game \.play-power\[data-spent='true'\] \{[^}]*filter: none/);
  expect(css).not.toMatch(/\[data-spent='true'\] \.play-power-coin \{[^}]*(filter|opacity)/);
  expect(main).toContain('markUses(res.control, left, spentNow)');
  expect(main).toContain('const spentNow = staged; staged = silentStage = false;');
  expect(main.match(/\bstaged = true\b/g)).toHaveLength(1); // afterStage
});
