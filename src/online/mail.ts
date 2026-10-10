/** Alert emails (report part 03, section 5.8): a Resend sender over fetch (no SDK), the two alert messages, and a fake sender for tests. Server only. */
export interface Mail { to: string; subject: string; text: string; html: string; /** Resend drops a second send with the same key (24 h) */ key?: string }
export type Sender = (mail: Mail) => Promise<void>;

const SITE = 'https://kingdown.dev';
const escape = (text: string) => text.replace(/[&<>"]/g, c => `&#${c.charCodeAt(0)};`);
function left(ms: number): string {
 const hours = Math.max(0, Math.floor(ms / 3_600_000)), days = Math.floor(hours / 24);
 return days ? `${days} day${days > 1 ? 's' : ''} ${hours % 24} h` : hours ? `${hours} h` : 'less than 1 h';
}

/** "Your move" when the turn passes; "Time almost up" at 80% of the turn time. Short copy, the opponent's handle, one link. */
export function alertMail(kind: 'turn' | 'reminder', { to, gameId, opponent, deadline, now }: { to: string; gameId: string; opponent: string | null; deadline: Date; now: Date }): Mail {
 const who = opponent ? `@${opponent}` : 'your opponent', link = `${SITE}/g/${gameId}`, time = left(deadline.getTime() - now.getTime());
 const subject = kind === 'turn' ? `Your move against ${who}` : `Time almost up against ${who}`;
 const line = kind === 'turn' ? `It is your move in King Down against ${who}. You have ${time} to move.` : `Your move against ${who} in King Down: ${time} left.`;
 const footer = 'Change these emails in King Down: Settings, Alerts.';
 return { to, subject, text: `${line}\n\nOpen the game: ${link}\n\n${footer}\n`, html: `<p>${escape(line)}</p><p><a href="${link}">Open the game</a></p><p>${footer}</p>` };
}

/** Sends through Resend's HTTP API. RESEND_API_KEY and KINGDOWN_MAIL_FROM (for example "King Down <alerts@kingdown.dev>") come from the environment. */
export function resendSender(env: Record<string, string | undefined> = process.env): Sender {
 const key = env.RESEND_API_KEY, from = env.KINGDOWN_MAIL_FROM;
 if (!key || !from) throw new Error('RESEND_API_KEY and KINGDOWN_MAIL_FROM are required');
 return async mail => {
  const response = await fetch('https://api.resend.com/emails', {
   method: 'POST', signal: AbortSignal.timeout(10_000),
   headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json', ...(mail.key && { 'idempotency-key': mail.key }) },
   body: JSON.stringify({ from, to: [mail.to], subject: mail.subject, text: mail.text, html: mail.html }),
  });
  // The status only: the body can echo the address.
  if (!response.ok) throw new Error(`Resend refused the email (${response.status})`);
 };
}

/** For tests: keeps each message instead of sending it. */
export function fakeSender(): Sender & { sent: Mail[] } {
 const sent: Mail[] = [];
 return Object.assign(async (mail: Mail) => { sent.push(mail); }, { sent });
}
