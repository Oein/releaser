import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export type VersionType = "release" | "beta" | "dev" | "all";

export function getLatestVersion(projectId: string, type: VersionType) {
  const db = getDb();

  const project = db.prepare("SELECT id FROM projects WHERE id = ?").get(projectId);
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const versionRow = type === "all"
    ? db.prepare(
        "SELECT id, project_id, version, type, description, created_at FROM versions WHERE project_id = ? ORDER BY created_at DESC LIMIT 1"
      ).get(projectId)
    : db.prepare(
        "SELECT id, project_id, version, type, description, created_at FROM versions WHERE project_id = ? AND type = ? ORDER BY created_at DESC LIMIT 1"
      ).get(projectId, type);

  if (!versionRow) return NextResponse.json({ error: "No version found" }, { status: 404 });

  const v = versionRow as { id: string; project_id: string; version: string; type: string; description: string | null; created_at: string };

  const files = db
    .prepare("SELECT id, filename, size, mime_type, created_at FROM files WHERE version_id = ? ORDER BY created_at ASC")
    .all(v.id);

  return NextResponse.json({ version: v, files });
}
