import { describe, expect, it } from 'vitest';
import { siteRoute } from './web-online-check.mjs';
import { vercelRoutes } from './plugin-server-build.mjs';
import { ART_HEADERS } from './plugin-art-headers.mjs';

describe('web check site routes', () => {
  const config = { routes: vercelRoutes() };

  it.each(['/', '/assets/app.js', '/play/', '/g/game-id', '/j', '/api', '/api/games'])('preserves %s when the build has no rewrite', path => {
    expect(siteRoute(config, path)).toEqual({ dest: path, headers: {} });
  });

  it('uses the build headers for board art', () => {
    expect(siteRoute(config, '/plugin-art/pawn.svg')).toEqual({
      dest: '/plugin-art/pawn.svg', headers: { ...ART_HEADERS, 'Content-Type': 'image/svg+xml' },
    });
  });

  it('uses a build rewrite and its continued headers', () => {
    const routes = [
      { src: '^/internal/.+$', headers: { 'Cache-Control': 'no-store' }, continue: true },
      { src: '^/internal/.+$', dest: '/internal' },
    ];
    expect(siteRoute({ routes }, '/internal/tick')).toEqual({ dest: '/internal', headers: { 'Cache-Control': 'no-store' } });
  });
});
