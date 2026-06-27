import type BetterSqlite3 from "better-sqlite3";
import type { NextRequest } from "next/server";
import { getDb } from "./db";
import { requireAdminAuth, isAdminFromSession } from "./auth";

export type Visibility = "public" | "url-only" | "private";
export const VISIBILITIES: Visibility[] = ["public", "url-only", "private"];

export interface ProjectRow {
  id: string;
  name: string;
  summary: string | null;
  description: string | null;
  alias: string | null;
  visibility: Visibility;
  icon_path: string | null;
  created_at: string;
  [key: string]: unknown;
}

const DEFAULT_COLUMNS =
  "id, name, summary, description, alias, visibility, icon_path, created_at";

/**
 * Resolve a project by its UUID id OR its alias. Returns undefined if neither matches.
 */
export function resolveProject(
  idOrAlias: string,
  columns: string = DEFAULT_COLUMNS,
  db: BetterSqlite3.Database = getDb()
): ProjectRow | undefined {
  return db
    .prepare(`SELECT ${columns} FROM projects WHERE id = ? OR alias = ?`)
    .get(idOrAlias, idOrAlias) as ProjectRow | undefined;
}

/** Whether a project should appear in public listings (API list / web list). */
export function isPubliclyListed(visibility: Visibility): boolean {
  return visibility === "public";
}

/**
 * Whether the current caller may directly access the project.
 * public / url-only → anyone. private → admin only.
 * Use this variant inside API route handlers (session OR API key).
 */
export async function canAccessProject(
  visibility: Visibility,
  request: NextRequest
): Promise<boolean> {
  if (visibility !== "private") return true;
  return requireAdminAuth(request);
}

/**
 * Session-only variant of {@link canAccessProject} for server components/pages.
 */
export async function canAccessProjectFromSession(
  visibility: Visibility
): Promise<boolean> {
  if (visibility !== "private") return true;
  return isAdminFromSession();
}

const ALIAS_RE = /^[a-z0-9][a-z0-9-]{1,63}$/;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Path segments that live under /projects or are otherwise reserved.
const RESERVED_ALIASES = new Set(["new", "latest", "versions", "icon"]);

/**
 * Validate and normalize an alias from user input.
 * Returns `{ alias }` (string or null to clear) on success, or `{ error }`.
 */
export function normalizeAlias(
  raw: unknown
): { alias: string | null } | { error: string } {
  if (raw === null || raw === undefined) return { alias: null };
  if (typeof raw !== "string") return { error: "alias must be a string" };
  const a = raw.trim().toLowerCase();
  if (a === "") return { alias: null };
  if (UUID_RE.test(a)) return { error: "alias cannot look like a UUID" };
  if (!ALIAS_RE.test(a)) {
    return {
      error:
        "alias must be 2–64 characters: lowercase letters, numbers, and hyphens (cannot start with a hyphen)",
    };
  }
  if (RESERVED_ALIASES.has(a)) return { error: `'${a}' is a reserved alias` };
  return { alias: a };
}

/** Validate a visibility value, defaulting to 'public' when absent. */
export function normalizeVisibility(
  raw: unknown
): { visibility: Visibility } | { error: string } {
  if (raw === null || raw === undefined) return { visibility: "public" };
  if (typeof raw !== "string" || !VISIBILITIES.includes(raw as Visibility)) {
    return { error: "visibility must be one of: public, url-only, private" };
  }
  return { visibility: raw as Visibility };
}
