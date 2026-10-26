export function applyMigration(client: { query(sql: string): Promise<unknown> }, sql: string): Promise<void>;
