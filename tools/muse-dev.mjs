/** Local Muse endpoint for the MCP Inspector: loopback only, no database, no OAuth. The in-memory fixture plays the
 *  real engine. Send the header `x-kingdown-dev-actor: <uuid>`; each UUID is one player. Run: npm run muse:dev. */
import { createServer } from 'node:http';
import { createMuseHandler } from '../src/muse/http.ts';
import { fixtureService } from './plugin-protocol-fixture.ts';

const port = Number(process.env.PORT || 8787);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid server port');
const publicOrigin = `http://127.0.0.1:${port}`, fixture = fixtureService();
const games = {
  create: fixture.create, command: fixture.command, view: fixture.view, inbox: fixture.inbox, previewDraft: fixture.previewDraft,
  toolTry: async () => {}, // the fixture counts no tool tries
};
const handler = createMuseHandler({ games, publicOrigin, localDev: true });
const server = createServer({ requestTimeout: 20000, headersTimeout: 10000 }, (req, res) => { void handler(req, res).catch(() => { if (!res.headersSent) { res.statusCode = 500; res.end('Request failed'); } else res.destroy(); }); });
server.listen(port, '127.0.0.1', () => console.log(`Muse dev endpoint at ${publicOrigin}/muse/mcp (loopback personas only)`));
