/** The deletion notice email (Apple guideline 5.1.1(v)): a Resend sender over fetch (no SDK) and the one message. Server only. */
export interface Mail { to: string; subject: string; text: string; /** Resend drops a second send with the same key (24 h) */ key?: string }
/** `signal` stops the send when the job runs out of time. */
export type Sender = (mail: Mail, signal?: AbortSignal) => Promise<void>;

/** Sent once, after kingdown_jobs.delete_account removes the account. */
export function deletionMail(to: string): Mail {
 return { to, subject: 'Your King Down account is deleted', text: 'We deleted your King Down account, as you asked. This is the last email from King Down to this address.\n\nGames against the computer need no account: https://kingdown.dev\n' };
}

/** Sends through Resend's HTTP API. RESEND_API_KEY and KINGDOWN_MAIL_FROM (for example "King Down <hello@kingdown.dev>") come from the environment. */
export function resendSender(env: Record<string, string | undefined> = process.env): Sender {
 const key = env.RESEND_API_KEY, from = env.KINGDOWN_MAIL_FROM;
 if (!key || !from) throw new Error('RESEND_API_KEY and KINGDOWN_MAIL_FROM are required');
 return async (mail, signal) => {
  const response = await fetch('https://api.resend.com/emails', {
   method: 'POST', signal: signal ? AbortSignal.any([AbortSignal.timeout(10_000), signal]) : AbortSignal.timeout(10_000),
   headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json', ...(mail.key && { 'idempotency-key': mail.key }) },
   body: JSON.stringify({ from, to: [mail.to], subject: mail.subject, text: mail.text }),
  });
  // The status only: the body can echo the address.
  if (!response.ok) throw new Error(`Resend refused the email (${response.status})`);
 };
}
