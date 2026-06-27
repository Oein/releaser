import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { resolveProject, canAccessProject } from "@/lib/projects";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; version: string }> }
) {
  const { id: idOrAlias, version } = await params;
  const decodedVersion = decodeURIComponent(version);
  const db = getDb();

  const project = resolveProject(idOrAlias, "id, visibility", db);
  if (!project || !(await canAccessProject(project.visibility, request))) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const versionRow = db
    .prepare("SELECT id FROM versions WHERE project_id = ? AND version = ?")
    .get(project.id, decodedVersion);

  if (!versionRow) {
    return NextResponse.json({ error: "Version not found" }, { status: 404 });
  }

  const v = versionRow as { id: string };
  const files = db
    .prepare(
      "SELECT id, filename, size, mime_type, created_at FROM files WHERE version_id = ? ORDER BY created_at ASC"
    )
    .all(v.id);

  return NextResponse.json({ files });
}
