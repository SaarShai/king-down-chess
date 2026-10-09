/** The turn press connects the pure turn state to the board and the browser share sheet. */
import type { Game } from './game';
import { copyText } from './clipboard';
import { pressPass, sendLans, waitNotice, turnButton, turnAnnouncement, type Mode, type Turn } from './turn';
import { colorOf, type Color, type Move } from './rules/engine';

interface Controls {
  game(): Game;
  turn(): Turn;
  mode(): Mode;
  linkSide(): Color | null;
  ended(): boolean;
  blocked(): boolean;
  generation(): number;
  lock(value: boolean): void;
  commit(move: Move): Promise<void>;
  handOver(): void;
  refresh(): void;
  save(): void;
  next(): void;
  link(lans: string[]): string;
  notice(line: string): void;
  focusBoard(keyboard: boolean): void;
}

export function connectTurnPress(button: HTMLButtonElement, board: HTMLElement, c: Controls): void {
  button.onclick = async event => {
    const game = c.game(), turn = c.turn(), mode = c.mode();
    if (!turnButton(game, turn, mode, { linkSide: c.linkSide(), over: c.ended(), open: c.blocked() }).on || c.blocked()) return;
    const generation = c.generation(), pass = pressPass(game, turn);
    const url = mode === 'link' ? c.link(sendLans(game, turn)) : '';
    c.lock(true);
    c.refresh();
    let line = '';
    if (mode === 'link') {
      try {
        if (navigator.share && matchMedia('(pointer: coarse)').matches) {
          await navigator.share({ title: 'King Down Chess', url });
          line = "Sent. Wait for your friend's link.";
        } else {
          if (!await copyText(url)) throw new Error('copy');
          line = 'Link copied. Paste it to your friend.';
        }
      } catch (error) {
        if (generation !== c.generation()) return;
        c.lock(false);
        if ((error as Error).name !== 'AbortError') c.notice('Could not copy. Your turn is not sent.');
        c.refresh();
        return;
      }
    }
    if (generation !== c.generation()) return;
    if (pass) await c.commit(pass);
    if (generation !== c.generation()) return;
    c.handOver();
    c.lock(false);
    c.notice(line);
    c.save();
    c.refresh();
    board.focus({ preventScroll: true });
    c.focusBoard(event.detail === 0);
    c.next();
  };
}

export function renderTurnButton(button: HTMLButtonElement, game: Game, turn: Turn, mode: Mode, linkSide: Color | null, over: boolean, open: boolean, lesson: boolean): void {
  const state = turnButton(game, turn, mode, { linkSide, over, open });
  button.hidden = lesson;
  button.textContent = state.label;
  button.setAttribute('aria-disabled', String(!state.on));
  button.classList.toggle('primary', state.primary);
  button.classList.toggle('quiet', state.label === 'Send again');
}

export function announceWaiting(game: Game, turn: Turn, mode: Mode, button: HTMLElement, announce: HTMLElement): void {
  announce.textContent = turnAnnouncement(game, turn, mode, announce.textContent ?? '');
  button.focus({ preventScroll: true });
}

/** A waiting board reads pieces and selects nothing. */
export function waitingRead(game: Game, turn: Turn, mode: Mode, sq: number): { inspected: number | null; notice: string } {
  const piece = game.pos.board[sq];
  return { inspected: piece ? sq : null, notice: !piece || colorOf(piece) === turn.activeSide ? waitNotice(mode, turn.activeSide) : '' };
}
