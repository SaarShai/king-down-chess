/**
 * Copies `text`: the Clipboard API first; where it is missing or refuses, the execCommand fallback
 * once. True only when a copy succeeded, so a caller says "copied" only then.
 */
export async function copyText(text: string, clipboard: Pick<Clipboard, 'writeText'> | null = navigator.clipboard ?? null, fallback = copyByCommand): Promise<boolean> {
  if (clipboard) {
    try { await clipboard.writeText(text); return true; } catch { /* refused: try the fallback */ }
  }
  return fallback(text);
}

/**
 * execCommand on a selected throwaway textarea. Its answer alone is not the truth: under a modal
 * dialog Chrome answers true and copies nothing (the textarea is inert). So the textarea goes in the
 * open dialog, and a copy listener puts the text in and tells whether a copy happened.
 */
function copyByCommand(text: string): boolean {
  let copied = false;
  const put = (e: ClipboardEvent): void => {
    if (e.clipboardData) { e.clipboardData.setData('text/plain', text); e.preventDefault(); }
    copied = true;
  };
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
  (document.querySelector('dialog[open]') ?? document.body).appendChild(ta);
  ta.select();
  document.addEventListener('copy', put);
  try { return document.execCommand('copy') && copied; } catch { return false; } finally { document.removeEventListener('copy', put); ta.remove(); }
}
