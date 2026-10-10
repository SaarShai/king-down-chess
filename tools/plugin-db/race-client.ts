import pg from 'pg';
import { GameService } from '../../src/match/service';
import { PostgresMatchStore } from '../../src/match/store';
const pool = new pg.Pool({ connectionString: process.env.PLUGIN_TEST_DATABASE_URL, max: 1 });
const service = new GameService(new PostgresMatchStore(pool));
process.send?.({ ready: true });
process.on('message', async (message: { actor: string; gameId: string; command: unknown }) => {
 try { const view = await service.command(message.actor,message.gameId,message.command); process.send?.({ revision:view.revision }); }
 catch (error) { process.send?.({ code:(error as { code?:string }).code, error:(error as Error).message }); }
 finally { await pool.end(); process.disconnect?.(); }
});
