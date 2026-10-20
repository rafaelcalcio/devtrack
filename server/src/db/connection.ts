import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

export type Db = Database.Database;

export const IN_MEMORY_DB = ':memory:';

export function createDatabase(filePath: string): Db {
  const target = filePath === IN_MEMORY_DB ? IN_MEMORY_DB : resolve(filePath);

  if (target !== IN_MEMORY_DB) {
    mkdirSync(dirname(target), { recursive: true });
  }

  const db = new Database(target);

  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  return db;
}
