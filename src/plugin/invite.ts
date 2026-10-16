import { copyText } from '../clipboard';
import type { Options } from '../match/setup';

export const featureNames = [['fairy', 'fairy', 'Fairy pieces'], ['arrangement', 'arrange', 'Arrangement'], ['classic', 'classic', 'Classic chess'], ['cards', 'cards', 'Cards'], ['kingPowers', 'powers', 'King powers']] as const;
// Codes stay in page memory. A remount must not end an invite by making a new one.
export const friendInvites = new Map<string, { code: string; expires_at: string }>();
export const ruleNames = (options: Options | null | undefined) => featureNames.filter(([field]) => options?.[field]).map(([, , label]) => label).join(', ') || 'Standard pieces';
export const inviteText = (code: string, options: Options | null | undefined) => `Join King Down game ${code}. Rules: ${ruleNames(options)}.`;

export async function sendInvite(text: string, status: HTMLElement, share = true) {
  status.textContent = '';
  if (share && navigator.share) {
    try { await navigator.share({ text }); status.textContent = 'Shared'; return; }
    catch (error) { if (error instanceof Error && error.name === 'AbortError') return; }
  }
  if (await copyText(text)) { status.textContent = 'Copied'; return; }
  const message = document.createElement('span'); message.textContent = text;
  status.append('Select the invite and copy it: ', message);
  const range = document.createRange(); range.selectNodeContents(message);
  const selection = getSelection(); selection?.removeAllRanges(); selection?.addRange(range);
}
