import type { Pool } from 'pg';
export function checkPluginDatabase(pool: Pick<Pool, 'query'>, config?: { clientIds: string[] }, resources?: string[]): Promise<{ client_id: string; resource: string }[]>;
