import type { Client } from './client';

const failure = (error: unknown, sending: boolean): string => {
  const status = (error as { status?: unknown } | null)?.status;
  if (status === 429) return 'Too many tries. Wait a minute and try again.';
  if (typeof status !== 'number' || status < 400 || status >= 500) return 'Could not reach the sign-in service. Check your connection and try again.';
  return sending ? 'Could not send a code to that address. Check it and try again.' : 'That code is wrong or has expired. Try again, or ask for a new code.';
};

/** Sign-in with a code sent by email: the address first, then the code. A new address makes a new account. */
export function emailCodeForm(client: () => Promise<Pick<Client, 'sendEmailCode' | 'verifyEmailCode'>>, say: (words: string) => void, signedIn: () => void): HTMLFormElement {
  const form = document.createElement('form'); form.className = 'email-code';
  const emailLabel = document.createElement('label'); emailLabel.textContent = 'Email';
  const email = document.createElement('input'); email.type = 'email'; email.name = 'email'; email.autocomplete = 'email'; email.required = true; emailLabel.append(email);
  const codeLabel = document.createElement('label'); codeLabel.textContent = 'Code from the email'; codeLabel.hidden = true;
  const code = document.createElement('input'); code.type = 'text'; code.name = 'code'; code.inputMode = 'numeric'; code.autocomplete = 'one-time-code'; code.maxLength = 10; codeLabel.append(code);
  const submit = document.createElement('button'); submit.type = 'submit';
  const again = document.createElement('button'); again.type = 'button'; again.textContent = 'Change email or get a new code';
  let sentTo = '', pending = false;
  const show = (): void => {
    emailLabel.hidden = !!sentTo; codeLabel.hidden = !sentTo; again.hidden = !sentTo;
    email.required = !sentTo; code.required = !!sentTo;
    submit.textContent = sentTo ? 'Sign in' : 'Email me a sign-in code';
  };
  const busy = (on: boolean): void => { pending = on; for (const control of [email, code, submit, again]) control.disabled = on; };
  again.onclick = () => { sentTo = ''; code.value = ''; say(''); show(); email.focus(); };
  form.onsubmit = async event => {
    event.preventDefault();
    if (pending) return;
    const sending = !sentTo;
    busy(true); say(sending ? 'Sending your code…' : 'Signing in…');
    try {
      const auth = await client();
      if (sending) {
        const address = email.value.trim();
        await auth.sendEmailCode(address);
        sentTo = address; show(); say(`We sent a code to ${address}. It can take a minute to arrive.`);
      } else {
        await auth.verifyEmailCode(sentTo, code.value.trim());
        code.value = ''; say(''); signedIn();
      }
    } catch (error) { say(failure(error, sending)); }
    finally { busy(false); }
    (sentTo ? code : email).focus();
  };
  show();
  form.append(emailLabel, codeLabel, submit, again);
  return form;
}
