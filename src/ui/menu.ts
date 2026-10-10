/** One native sheet with stable pages, so settings and Account keep their nodes. */
import { openTricksMenu, refreshTricks } from './tricks';
const PAGES: Record<string, { title: string; parent?: string }> = {
  menu: { title: 'Menu' }, new: { title: 'New game', parent: 'menu' },
  help: { title: 'Board help', parent: 'menu' }, extra: { title: 'Extra', parent: 'menu' },
  game: { title: 'This game', parent: 'extra' }, account: { title: 'Account', parent: 'extra' },
  tricks: { title: 'Tricks', parent: 'extra' },
  resign: { title: 'Resign', parent: 'menu' },
};

export function initMenu(actions: { playAgain: () => void; today: () => void; resignSide: () => number | null }): void {
  const sheet = document.getElementById('menu-sheet') as HTMLDialogElement;
  const button = document.getElementById('menu-btn')!;
  const back = document.getElementById('menu-back')!;
  const title = document.getElementById('menu-title')!;
  const body = sheet.querySelector<HTMLElement>('.sheet-body')!;
  let page = 'menu';
  function updateShade(): void {
    sheet.classList.toggle('has-overflow', body.scrollHeight - body.clientHeight - body.scrollTop > 1);
  }
  body.addEventListener('scroll', updateShade);
  function fitBody(): void {
    body.style.maxHeight = '';
    if (!sheet.open) return;
    if (body.scrollHeight > body.clientHeight + 1) {
      const padding = parseFloat(getComputedStyle(body).paddingBottom);
      const edge = body.getBoundingClientRect().top + body.clientHeight;
      const rows = [...body.querySelectorAll<HTMLElement>('.menu-row, label, #tricks-list > li')].filter(row => row.getClientRects().length > 0);
      const last = rows.filter(row => row.getBoundingClientRect().bottom <= edge - padding).at(-1);
      if (last) body.style.maxHeight = `${last.getBoundingClientRect().bottom - body.getBoundingClientRect().top + padding}px`;
    }
    updateShade();
  }
  window.addEventListener('resize', fitBody);
  new MutationObserver(fitBody).observe(document.getElementById('account')!, { childList: true, subtree: true, characterData: true, attributes: true });
  refreshTricks();
  function go(next: string): void {
    if (next === 'tricks') openTricksMenu();
    const previous = page;
    page = next;
    sheet.querySelectorAll<HTMLElement>('[data-menu-page]').forEach(p => { p.hidden = p.dataset.menuPage !== page; });
    title.textContent = PAGES[page].title;
    back.hidden = !PAGES[page].parent;
    back.innerHTML = `<span class="back-mark" aria-hidden="true">‹</span> ${PAGES[PAGES[page].parent ?? 'menu'].title}`;
    back.setAttribute('aria-label', `Back to ${PAGES[PAGES[page].parent ?? 'menu'].title}`);
    if (page === 'resign') {
      const side = actions.resignSide();
      document.getElementById('resign-detail')!.textContent = `${side === 0 ? 'Black' : 'White'} wins this game.`;
    }
    body.scrollTop = 0;
    fitBody();
    const from = sheet.querySelector<HTMLElement>(`[data-menu-page="${page}"] [data-go="${previous}"]`);
    (from ?? title).focus({ preventScroll: true });
  }
  const close = (): void => sheet.close();
  button.onclick = () => {
    refreshTricks(); sheet.classList.remove('is-placed'); go('menu'); sheet.showModal();
    sheet.style.setProperty('--menu-top', `${sheet.getBoundingClientRect().top}px`);
    sheet.classList.add('is-placed'); fitBody(); title.focus();
  };
  back.onclick = () => go(PAGES[page].parent!);
  document.getElementById('menu-close')!.onclick = close;
  // Page Back handles Esc before the native dialog: repeated cancel events can be non-cancelable.
  sheet.addEventListener('keydown', e => {
    if (e.key === 'Escape' && PAGES[page].parent) { e.preventDefault(); e.stopPropagation(); go(PAGES[page].parent!); }
  });
  sheet.addEventListener('close', () => { button.focus({ preventScroll: true }); });
  sheet.addEventListener('click', e => {
    const target = (e.target as HTMLElement).closest<HTMLElement>('button');
    if (!target) return;
    if (target.getAttribute('aria-disabled') === 'true') { e.stopImmediatePropagation(); return; }
    if (target.dataset.go) { go(target.dataset.go); return; }
    if (['new-game-btn', 'rules-btn', 'workshop-btn', 'resign-confirm'].includes(target.id)) close();
    if (target.id === 'play-again') { close(); actions.playAgain(); }
    if (target.id === 'today-army') { close(); actions.today(); }
  }, true);
  // Delete is owned by Account. Close this sheet before its question opens.
  sheet.addEventListener('click', e => {
    if ((e.target as HTMLElement).closest('[data-act="delete"]')) close();
  }, true);
  for (const id of ['rules', 'new-game', 'delete-account']) {
    document.getElementById(id)!.addEventListener('close', () => button.focus({ preventScroll: true }));
  }
  // Workshop loads on demand; its dialog does not exist at start-up.
  document.addEventListener('close', e => {
    if ((e.target as HTMLElement).id === 'workshop') button.focus({ preventScroll: true });
  }, true);
}
