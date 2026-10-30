/** One native sheet with stable pages, so settings and Account keep their nodes. */
const PAGES: Record<string, { title: string; parent?: string }> = {
  menu: { title: 'Menu' }, new: { title: 'New game', parent: 'menu' },
  help: { title: 'Board help', parent: 'menu' }, account: { title: 'Account', parent: 'menu' },
  resign: { title: 'Resign', parent: 'menu' },
};

export function initMenu(actions: { playAgain: () => void; resignSide: () => number | null }): void {
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
      const bodyTop = body.getBoundingClientRect().top;
      const rows = [...body.querySelectorAll<HTMLElement>('.menu-row, label')].filter(row => row.getClientRects().length > 0);
      const offsets = rows.map(row => row.getBoundingClientRect().bottom - bodyTop + body.scrollTop);
      const last = offsets.filter(off => off <= body.clientHeight - padding).at(-1);
      if (last !== undefined) body.style.maxHeight = `${last + padding}px`;
    }
    updateShade();
  }
  window.addEventListener('resize', fitBody);
  new MutationObserver(fitBody).observe(document.getElementById('account')!, { childList: true, subtree: true, characterData: true, attributes: true });
  function go(next: string): void {
    const previous = page;
    page = next;
    sheet.querySelectorAll<HTMLElement>('[data-menu-page]').forEach(p => { p.hidden = p.dataset.menuPage !== page; });
    title.textContent = PAGES[page].title;
    back.hidden = !PAGES[page].parent;
    back.innerHTML = `<span class="back-mark" aria-hidden="true">‹</span><span class="back-label">${PAGES[PAGES[page].parent ?? 'menu'].title}</span>`;
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
    sheet.classList.remove('is-placed'); go('menu'); sheet.showModal();
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
    if (['new-game-btn', 'rules-btn', 'resign-confirm'].includes(target.id)) close();
    if (target.id === 'play-again') { close(); actions.playAgain(); }
  }, true);
  // Delete is owned by Account. Close this sheet before its question opens.
  sheet.addEventListener('click', e => {
    if ((e.target as HTMLElement).closest('[data-act="delete"]')) close();
  }, true);
  for (const id of ['rules', 'delete-account']) {
    document.getElementById(id)!.addEventListener('close', () => button.focus({ preventScroll: true }));
  }
}
