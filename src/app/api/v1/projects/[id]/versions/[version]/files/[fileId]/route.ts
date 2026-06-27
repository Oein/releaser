import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { resolveProject, canAccessProject } from "@/lib/projects";
import fs from "fs";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; version: string; fileId: string }> }
) {
  const { id: idOrAlias, version, fileId } = await params;
  const decodedVersion = decodeURIComponent(version);
  const db = getDb();

  const project = resolveProject(idOrAlias, "id, visibility", db);
  if (!project || !(await canAccessProject(project.visibility, request))) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const versionRow = db
    .prepare("SELECT id FROM versions WHERE project_id = ? AND version = ?")
    .get(project.id, decodedVersion) as { id: string } | undefined;

  if (!versionRow) {
    return NextResponse.json({ error: "Version not found" }, { status: 404 });
  }

  const file = db
    .prepare("SELECT * FROM files WHERE id = ? AND version_id = ?")
    .get(fileId, versionRow.id) as {
    id: string;
    filename: string;
    size: number;
    mime_type: string;
    path: string;
  } | undefined;

  if (!file) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const filePath = path.resolve(file.path);
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "File not found on disk" }, { status: 404 });
  }

  const fileBuffer = fs.readFileSync(filePath);
  return new NextResponse(fileBuffer, {
    headers: {
      "Content-Type": file.mime_type || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${file.filename}"`,
      "Content-Length": String(fileBuffer.length),
    },
  });
}
