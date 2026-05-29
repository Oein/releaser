import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getVersionTags } from "@/lib/tags";

export type VersionType = "release" | "beta" | "dev" | "all";

export function getLatestVersion(projectId: string, type: VersionType, tag?: string) {
  const db = getDb();

  const project = db.prepare("SELECT id FROM projects WHERE id = ?").get(projectId);
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  let versionRow: unknown;

  if (tag) {
    const base = type === "all"
      ? `SELECT v.id, v.project_id, v.version, v.type, v.description, v.created_at
         FROM versions v
         JOIN version_tags vt ON v.id = vt.version_id
         JOIN project_tags pt ON vt.tag_id = pt.id
         WHERE v.project_id = ? AND pt.name = ?
         ORDER BY v.created_at DESC LIMIT 1`
      : `SELECT v.id, v.project_id, v.version, v.type, v.description, v.created_at
         FROM versions v
         JOIN version_tags vt ON v.id = vt.version_id
         JOIN project_tags pt ON vt.tag_id = pt.id
         WHERE v.project_id = ? AND pt.name = ? AND v.type = ?
         ORDER BY v.created_at DESC LIMIT 1`;
    versionRow = type === "all"
      ? db.prepare(base).get(projectId, tag)
      : db.prepare(base).get(projectId, tag, type);
  } else {
    versionRow = type === "all"
      ? db.prepare(
          "SELECT id, project_id, version, type, description, created_at FROM versions WHERE project_id = ? ORDER BY created_at DESC LIMIT 1"
        ).get(projectId)
      : db.prepare(
          "SELECT id, project_id, version, type, description, created_at FROM versions WHERE project_id = ? AND type = ? ORDER BY created_at DESC LIMIT 1"
        ).get(projectId, type);
  }

  if (!versionRow) return NextResponse.json({ error: "No version found" }, { status: 404 });

  const v = versionRow as { id: string; project_id: string; version: string; type: string; description: string | null; created_at: string };

  const files = db
    .prepare("SELECT id, filename, size, mime_type, created_at FROM files WHERE version_id = ? ORDER BY created_at ASC")
    .all(v.id);

  const tags = getVersionTags(db, v.id);
  return NextResponse.json({ version: { ...v, tags }, files });
}
