import { FIRST_DEAL, isFirstVisit } from '../first-deal';
import { defaultSetup, type Setup } from '../new-game';

const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;
const FIRST_DEAL_KEY = 'kingdown.first-deal';
export type TitleChoice = 'continue' | 'play' | 'learn' | 'start';

export function firstVisit(moves: number): boolean {
  let dealt = false;
  try { dealt = localStorage.getItem(FIRST_DEAL_KEY) !== null; } catch { /* private mode: use the moves */ }
  return isFirstVisit(dealt, moves);
}

export function startFirstDeal(setupKey: string, start: (setup: Setup, army: string) => void): void {
  const setup = { ...defaultSetup(), level: 'beginner' as const };
  try { localStorage.setItem(FIRST_DEAL_KEY, '1'); } catch { /* private mode: play on */ }
  try { localStorage.setItem(setupKey, JSON.stringify(setup)); } catch { /* the setup lasts this visit */ }
  start(setup, FIRST_DEAL);
}

export function openTitle(firstVisit: boolean, resumable: boolean, pace: () => string): Promise<TitleChoice> {
  let titleChoice: TitleChoice = 'continue';
  return new Promise(resolve => {
    const dlg = $<HTMLDialogElement>('title-screen');
    $('title-continue').hidden = !resumable;
    $('title-start').hidden = !firstVisit;
    for (const id of ['title-learn', 'title-play', 'title-workshop']) $(id).hidden = firstVisit;
    $('title-play').classList.toggle('primary', !firstVisit && !resumable);
    const pick = (c: TitleChoice) => () => { titleChoice = c; dlg.close(); };
    $('title-start').onclick = pick('start');
    $('title-continue').onclick = pick('continue');
    $('title-play').onclick = pick('play');
    $('title-learn').onclick = pick('learn');
    dlg.addEventListener('close', () => {
      try { sessionStorage.setItem('kingdown.title-seen', '1'); } catch { /* private mode: it shows again next time */ }
      document.body.classList.remove('title-up');
      resolve(titleChoice);
    }, { once: true });
    document.body.classList.add('title-up');
    document.documentElement.dataset.pace = pace(); // before it opens: Animations Off skips the entrance (style.css)
    dlg.showModal();
    // The six kings' resting effects: loaded after the title is up, so its first paint never waits; none
    // with Animations Off or reduced motion (the module checks reduced motion itself).
    if (pace() !== 'off') void import('../../docs/2d-first-pieces/board/title-kings.mjs').then(({ startTitleKings }) => {
      if (!dlg.open) return;
      const kings = startTitleKings(dlg.querySelector('.title-kings')!, { enabled: () => pace() !== 'off' && !document.querySelector('#workshop[open]') });
      (window as unknown as { titleKings?: unknown }).titleKings = kings; // for the browser checks
      dlg.addEventListener('close', () => kings.stop(), { once: true });
    }).catch(() => { /* offline before it was cached: the still kings stay */ });
    ($(firstVisit ? 'title-start' : resumable ? 'title-continue' : 'title-play')).focus();
  });
}
