import type { IncomingMessage, ServerResponse } from 'node:http';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import type { RunCoordinator } from './coordinator';

const id = z.string().regex(/^study-\d{8}-[a-f0-9]{12}$/);
const request = z.discriminatedUnion('action', [
  z.strictObject({ action: z.literal('connect') }),
  z.strictObject({ action: z.literal('prepare'), document: z.unknown(), target: z.enum(['m1', 'kaggle', 'both']) }),
  z.strictObject({ action: z.literal('approve'), id, key: z.uuidv4() }),
  z.strictObject({ action: z.literal('list'), studyId: z.string().min(1).max(200) }),
  ...(['status', 'result', 'document'] as const).map(action => z.strictObject({ action: z.literal(action), id })),
]);
const json = (res: ServerResponse, status: number, value: unknown) => {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(value));
};

/** The exact listening socket defines the sole permitted browser origin. */
export function createRunHandler(getCoordinator: () => Promise<RunCoordinator>) {
  const token = randomBytes(32).toString('hex');
  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    if (req.url?.split('?')[0] !== '/api/study-runs') { next(); return; }
    res.setHeader('cache-control', 'no-store'); res.setHeader('x-content-type-options', 'nosniff');
    try {
      const host = `127.0.0.1:${req.socket.localPort}`;
      if (req.socket.localAddress !== '127.0.0.1' || req.headers.host !== host || req.headers.origin !== `http://${host}` || (req.headers['sec-fetch-site'] && req.headers['sec-fetch-site'] !== 'same-origin')) { json(res, 403, { error: 'Use this studio from its local browser address.' }); return; }
      if (req.method !== 'POST') { json(res, 405, { error: 'Use a JSON POST request.' }); return; }
      if (!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(req.headers['content-type'] ?? '')) { json(res, 415, { error: 'A JSON request is required.' }); return; }
      const chunks: Buffer[] = []; let size = 0;
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 1024 * 1024 + 4096) { json(res, 413, { error: 'Study request exceeds the size limit.' }); return; }
        chunks.push(chunk);
      }
      let value;
      try { value = request.parse(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
      catch { json(res, 400, { error: 'Invalid studio request.' }); return; }
      if (value.action !== 'connect') {
        const supplied = req.headers['x-king-down-studio'];
        if (typeof supplied !== 'string' || supplied.length !== token.length || !timingSafeEqual(Buffer.from(supplied), Buffer.from(token))) { json(res, 403, { error: 'Reconnect to this local studio.' }); return; }
      }
      const service = await getCoordinator();
      switch (value.action) {
        case 'connect': json(res, 200, { studioId: service.studioId, token, transportVerification: 'unverified' }); break;
        case 'prepare': json(res, 200, await service.prepare(value.document, value.target)); break;
        case 'approve': json(res, 200, await service.approve(value.id, value.key)); break;
        case 'list': json(res, 200, service.list(value.studyId)); break;
        case 'status': json(res, 200, service.status(value.id)); break;
        case 'document': json(res, 200, service.document(value.id)); break;
        case 'result': res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' }); res.end(service.result(value.id)); break;
      }
    } catch (error) {
      if (!res.headersSent) json(res, 409, { error: error instanceof Error ? error.message : 'Studio request failed.' });
      else res.destroy();
    }
  };
}
