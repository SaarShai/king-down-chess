import pg from 'pg';

// A source guard must refuse the target before it makes a pool.
pg.Pool = class { constructor() { throw new Error('POOL_CONSTRUCTED'); } };
