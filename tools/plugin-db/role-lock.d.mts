export function withRoleLock<T>(url: string, work: () => Promise<T>): Promise<T>;
