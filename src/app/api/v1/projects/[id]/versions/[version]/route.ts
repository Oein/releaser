import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getVersionTags } from "@/lib/tags";
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
    .prepare(
      "SELECT id, project_id, version, type, description, created_at FROM versions WHERE project_id = ? AND version = ?"
    )
    .get(project.id, decodedVersion) as { id: string } | undefined;

  if (!versionRow) {
    return NextResponse.json({ error: "Version not found" }, { status: 404 });
  }

  const tags = getVersionTags(db, versionRow.id);
  return NextResponse.json({ version: { ...versionRow, tags } });
}
