// Custom server: initializes better-sqlite3 BEFORE Next.js starts,
// bypassing webpack bundling entirely. DB is stored in global.__db.
//
// IMPORTANT: better-sqlite3 must be required BEFORE next — Next.js installs
// a require hook (require-hook.js) that intercepts native .node loading.
const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");
const http = require("http");
const { parse } = require("url");
const next = require("next");

const port = parseInt(process.env.PORT || "38571", 10);
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

// --- DB setup ---
const DATA_DIR = path.join(process.cwd(), "data");
const FILES_DIR = path.join(DATA_DIR, "files");
const ICONS_DIR = path.join(DATA_DIR, "icons");
const DB_PATH = path.join(DATA_DIR, "deploy.db");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(FILES_DIR)) fs.mkdirSync(FILES_DIR, { recursive: true });
if (!fs.existsSync(ICONS_DIR)) fs.mkdirSync(ICONS_DIR, { recursive: true });

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
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
  CREATE TABLE IF NOT EXISTS project_tags (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    UNIQUE(project_id, name)
  );
  CREATE TABLE IF NOT EXISTS version_tags (
    version_id TEXT NOT NULL REFERENCES versions(id) ON DELETE CASCADE,
    tag_id TEXT NOT NULL REFERENCES project_tags(id) ON DELETE CASCADE,
    PRIMARY KEY(version_id, tag_id)
  );
`);

try { db.exec("ALTER TABLE projects ADD COLUMN icon_path TEXT"); } catch {}
try { db.exec("ALTER TABLE projects ADD COLUMN summary TEXT"); } catch {}

global.__db = db;
global.__filesDir = FILES_DIR;
global.__iconsDir = ICONS_DIR;
global.__dataDir = DATA_DIR;

console.log("Database initialized at", DB_PATH);

// --- Start Next.js ---
app.prepare().then(() => {
  http
    .createServer((req, res) => {
      handle(req, res, parse(req.url, true));
    })
    .listen(port, () => {
      console.log(`> Ready on http://localhost:${port}`);
    });
});
