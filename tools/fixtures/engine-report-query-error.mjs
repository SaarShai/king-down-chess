import pg from 'pg';

// A query fault must not put private error text in the CLI output.
pg.Client = class {
  async connect() {}
  async query() { throw new Error('private-query-marker'); }
  async end() {}
};
