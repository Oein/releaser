import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; version: string }> }
) {
  const { id, version } = await params;
  const decodedVersion = decodeURIComponent(version);
  const db = getDb();

  const versionRow = db
    .prepare("SELECT id FROM versions WHERE project_id = ? AND version = ?")
    .get(id, decodedVersion);

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
