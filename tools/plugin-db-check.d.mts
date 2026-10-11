import type { Pool } from 'pg';
export function checkPluginDatabase(pool: Pick<Pool, 'query'>, config?: { clientIds: string[] }, resource?: string): Promise<void>;
