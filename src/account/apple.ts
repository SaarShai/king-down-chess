/** shortcut: keep this release switch off until Apple setup and server token revocation pass a signed-device check. */
export const appleSignInEnabled = (env: Record<string, unknown>) => env.VITE_KINGDOWN_APPLE_SIGN_IN === '1';

export interface AppleBridge {
  authorize(options: { nonce: string; state: string }): Promise<{ identityToken: string; state: string }>;
}

/** The native sheet stays on this page, so the current invite or game stays in place. */
export async function nativeAppleToken(bridge: AppleBridge): Promise<{ token: string; nonce: string }> {
  const random = () => Array.from(crypto.getRandomValues(new Uint8Array(32)), byte => byte.toString(16).padStart(2, '0')).join('');
  const nonce = random(), state = random();
  const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(nonce))), byte => byte.toString(16).padStart(2, '0')).join('');
  const result = await bridge.authorize({ nonce: digest, state });
  if (result.state !== state || typeof result.identityToken !== 'string' || !result.identityToken) throw new Error('Invalid Apple sign-in return');
  return { token: result.identityToken, nonce };
}
