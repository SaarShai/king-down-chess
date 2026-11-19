import { kings, pieces, playBow, playCollapse, type Army, type CollapseTarget } from './painted';

const bank = document.querySelector<HTMLSelectElement>('#bank')!;
const motion = document.querySelector<HTMLSelectElement>('#motion')!;
const stage = document.querySelector<HTMLElement>('#stage')!;
const square = document.querySelector<HTMLElement>('#square')!;
const figure = document.querySelector<HTMLImageElement>('#figure')!;
const play = document.querySelector<HTMLButtonElement>('#play')!;
const skip = document.querySelector<HTMLButtonElement>('#skip')!;
const status = document.querySelector<HTMLElement>('#status')!;
type King = typeof kings[number];
let active: ReturnType<typeof playCollapse> | undefined;

const label = (name: string) => name[0].toUpperCase() + name.slice(1);
for (const name of [...pieces, ...kings.map(king => `king-${king}`)]) {
  const displayName = name === 'king-mud' ? 'Earth king' : name === 'king-stratus' ? 'Sky king'
    : name.startsWith('king-') ? `${label(name.slice(5))} king` : label(name);
  for (const army of ['white', 'black']) bank.add(new Option(`${displayName} · ${label(army)}`, `${name}/${army}`));
}
bank.value = 'pawn/white';
if (matchMedia('(prefers-reduced-motion: reduce)').matches) motion.value = 'reduce';

const box = (element: HTMLElement) => {
  const { x, y, width, height } = element.getBoundingClientRect();
  const host = stage.getBoundingClientRect();
  return { x: x - host.x, y: y - host.y, width, height };
};

function reset() {
  active?.dispose();
  active = undefined;
  skip.disabled = true;
  status.textContent = '';
  figure.hidden = false;
}

bank.onchange = () => {
  reset();
  const [name, army] = bank.value.split('/');
  figure.src = `${import.meta.env.BASE_URL}ui/pieces/${name}-${army[0]}.webp`;
  square.style.setProperty('--body-height', name === 'pawn' ? '68px' : '94px');
};
bank.onchange(new Event('change'));

play.onclick = async () => {
  reset();
  const [name, army] = bank.value.split('/') as [string, Army];
  const isKing = name.startsWith('king-');
  const target: CollapseTarget = {
    layer: stage,
    measure: () => ({ ...box(square), bodyHeight: figure.getBoundingClientRect().height || parseFloat(square.style.getPropertyValue('--body-height')) }),
    motion: motion.value as CollapseTarget['motion'],
    onReady: () => { figure.hidden = true; status.textContent = isKing ? 'Bow' : 'Collapse'; },
  };
  if (figure.complete && figure.naturalWidth) target.from = { image: figure, rect: box(figure) };
  const effect = active = isKing ? playBow(name.slice(5) as King, army, target) : playCollapse(name, army, target);
  skip.disabled = false;
  const result = await effect.finished;
  if (active !== effect) return;
  skip.disabled = true;
  status.textContent = result === 'not-ready' ? 'Painted art unavailable.' : isKing ? 'Bow ended.' : 'Collapse ended.';
};
skip.onclick = () => active?.skip();
motion.onchange = () => { if (motion.value === 'reduce') active?.skip(); };
