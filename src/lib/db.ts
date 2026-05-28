import path from "path";
import fs from "fs";

// eval("require") prevents webpack/Next.js from bundling the native .node binary
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Database = eval("require")("better-sqlite3") as typeof import("better-sqlite3");
type DbInstance = ReturnType<typeof Database>;

const DATA_DIR = path.join(process.cwd(), "data");
const FILES_DIR = path.join(DATA_DIR, "files");
const DB_PATH = path.join(DATA_DIR, "deploy.db");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(FILES_DIR)) fs.mkdirSync(FILES_DIR, { recursive: true });

let _db: DbInstance | null = null;

function getDb(): DbInstance {
  if (_db) return _db;
  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");
  initTables(_db);
  return _db;
}

function initTables(db: DbInstance): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS versions (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id),
      version TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('release', 'beta', 'dev')),
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(project_id, version)
    );

    CREATE TABLE IF NOT EXISTS files (
      id TEXT PRIMARY KEY,
      version_id TEXT NOT NULL REFERENCES versions(id),
      filename TEXT NOT NULL,
      size INTEGER,
      mime_type TEXT,
      path TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS api_keys (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      key_hash TEXT NOT NULL UNIQUE,
      key_prefix TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

export { getDb, FILES_DIR, DATA_DIR };
