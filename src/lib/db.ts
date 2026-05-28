import type BetterSqlite3 from "better-sqlite3";

declare global {
  // eslint-disable-next-line no-var
  var __db: BetterSqlite3.Database | undefined;
  // eslint-disable-next-line no-var
  var __filesDir: string | undefined;
  // eslint-disable-next-line no-var
  var __dataDir: string | undefined;
}

export function getDb(): BetterSqlite3.Database {
  if (!global.__db) throw new Error("Database not initialized — use custom server.js");
  return global.__db;
}

export function getFilesDir(): string {
  if (!global.__filesDir) throw new Error("filesDir not initialized");
  return global.__filesDir;
}

export function getDataDir(): string {
  if (!global.__dataDir) throw new Error("dataDir not initialized");
  return global.__dataDir;
}
