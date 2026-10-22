/** The website session uses the same storage key in each entry. */
export const AUTH_KEY = 'kingdown.auth';

export type AccountSession = { userId: string; accessToken: string };
