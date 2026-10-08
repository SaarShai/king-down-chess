import pg from 'pg';
import { MatchService } from '../../src/match/service';
import { PostgresMatchStore } from '../../src/match/store';
const pool = new pg.Pool({ connectionString: process.env.PLUGIN_TEST_DATABASE_URL, max: 1 });
const service = new MatchService(new PostgresMatchStore(pool));
process.send?.({ ready: true });
process.on('message', async (message: { actor: string; matchId: string; command: { id: string; expectedRevision: number; lan: string } }) => {
 try { const view = await service.move(message.actor,message.matchId,message.command); process.send?.({ revision:view.snapshot.revision }); }
 catch (error) { process.send?.({ code:(error as { code?:string }).code, error:(error as Error).message }); }
 finally { await pool.end(); process.disconnect?.(); }
});
