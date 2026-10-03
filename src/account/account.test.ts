import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { accountHtml, userOf } from './account';

const buttons = (html: string) => [...html.matchAll(/<button[^>]*>([^<]*)<\/button>/g)].map(m => m[1]);

describe('Settings → Account', () => {
  it('signed out: the reason to sign in, Google and GitHub, and the privacy and terms links', () => {
    const html = accountHtml(null, false);
    expect(html).toContain('Sign in to save your games on every device');
    expect(buttons(html)).toEqual(['Continue with Google', 'Continue with GitHub']);
    expect(html).toContain('href="./privacy.html"');
    expect(html).toContain('href="./terms.html"');
  });

  it('Facebook shows only with its flag', () => {
    expect(buttons(accountHtml(null, true))).toEqual(['Continue with Google', 'Continue with GitHub', 'Continue with Facebook']);
  });

  it('signed in: picture, name, Sign out and Delete my account', () => {
    const html = accountHtml({ name: 'Ada Lovelace', avatar: 'https://g.example/ada.png', provider: 'google' }, false);
    expect(html).toContain('<img src="https://g.example/ada.png" alt=""');
    expect(html).toContain('<b>Ada Lovelace</b>');
    expect(html).toContain('Signed in with Google');
    expect(buttons(html)).toEqual(['Sign out', 'Delete my account']);
    expect(html).not.toContain('Continue with');
    expect(html).toContain('href="./privacy.html"');
  });

  it('a name from the sign-in service cannot inject markup', () => {
    const html = accountHtml({ name: '<img src=x onerror=alert(1)>', avatar: 'https://a/"onload="x', provider: 'github' }, false);
    expect(html).not.toContain('<img src=x');
    expect(html).toContain('&#60;img src=x onerror=alert(1)&#62;');
    expect(html).not.toContain('"onload="');
  });

  it('reads the name and picture Google and GitHub send, and drops a picture that is not https', () => {
    expect(userOf({ user_metadata: { full_name: 'Ada', name: 'A', picture: 'https://g/p.png' }, app_metadata: { provider: 'google' } }))
      .toEqual({ name: 'Ada', avatar: 'https://g/p.png', provider: 'google' });
    expect(userOf({ user_metadata: { user_name: 'octo', avatar_url: 'https://gh/o.png' }, app_metadata: { provider: 'github' } }))
      .toEqual({ name: 'octo', avatar: 'https://gh/o.png', provider: 'github' });
    expect(userOf({ user_metadata: { avatar_url: 'javascript:alert(1)' } })).toEqual({ name: 'Player', avatar: null, provider: '' });
    expect(userOf(null)).toBeNull();
  });
});

describe('no secrets in what the browser gets', () => {
  // Built from parts, so this file does not match itself.
  const patterns = [
    new RegExp('sb_' + 'secret_'), // Supabase secret key
    new RegExp('service' + '_role'), // Supabase legacy secret (JWT role)
    new RegExp('GOC' + 'SPX-'), // Google OAuth client secret
    new RegExp('client' + '_secret', 'i'),
    new RegExp('gh[opsu]' + '_[A-Za-z0-9]{30,}'), // GitHub tokens
    new RegExp('eyJ[\\w-]{10,}\\.eyJ' + '[\\w-]{10,}\\.'), // any JWT (the publishable key is not one)
    new RegExp('(app|client)[_ ]?secret["\'\\s:=]+[0-9a-f]{32}', 'i'), // Facebook / GitHub app secret
  ];
  const text = /\.(ts|mjs|js|json|html|css|txt|md|webmanifest|svg)$/;
  const walk = (dir: string): string[] => readdirSync(dir).flatMap(n => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : text.test(n) ? [p] : [];
  });
  it('no file under src/ or public/ holds a secret key or an OAuth secret', () => {
    const files = [...walk('src'), ...walk('public')];
    expect(files.length).toBeGreaterThan(50);
    const hits = files.flatMap(f => { const s = readFileSync(f, 'utf8'); return patterns.filter(p => p.test(s)).map(p => `${f}: ${p}`); });
    expect(hits).toEqual([]);
  });
});
