import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getVersionTags } from "@/lib/tags";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; version: string }> }
) {
  const { id, version } = await params;
  const decodedVersion = decodeURIComponent(version);
  const db = getDb();

  const versionRow = db
    .prepare(
      "SELECT id, project_id, version, type, description, created_at FROM versions WHERE project_id = ? AND version = ?"
    )
    .get(id, decodedVersion) as { id: string } | undefined;

  if (!versionRow) {
    return NextResponse.json({ error: "Version not found" }, { status: 404 });
  }

  const tags = getVersionTags(db, versionRow.id);
  return NextResponse.json({ version: { ...versionRow, tags } });
}
