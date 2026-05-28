import { NextRequest, NextResponse } from "next/server";
import { getDb, getFilesDir } from "@/lib/db";
import { requireAdminAuth } from "@/lib/auth";
import fs from "fs";
import path from "path";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; version: string }> }
) {
  if (!(await requireAdminAuth(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, version: encodedVersion } = await params;
  const version = decodeURIComponent(encodedVersion);
  const db = getDb();

  const versionRow = db
    .prepare("SELECT id FROM versions WHERE project_id = ? AND version = ?")
    .get(id, version) as { id: string } | undefined;
  if (!versionRow) return NextResponse.json({ error: "Version not found" }, { status: 404 });

  const body = await request.json();
  const { description } = body;

  db.prepare("UPDATE versions SET description = ? WHERE id = ?")
    .run(description?.trim() || null, versionRow.id);

  const updated = db.prepare("SELECT * FROM versions WHERE id = ?").get(versionRow.id);
  return NextResponse.json({ version: updated });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; version: string }> }
) {
  if (!(await requireAdminAuth(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, version: encodedVersion } = await params;
  const version = decodeURIComponent(encodedVersion);
  const db = getDb();

  const versionRow = db
    .prepare("SELECT id FROM versions WHERE project_id = ? AND version = ?")
    .get(id, version) as { id: string } | undefined;
  if (!versionRow) return NextResponse.json({ error: "Version not found" }, { status: 404 });

  // Delete files from disk
  const versionDir = path.join(getFilesDir(), versionRow.id);
  if (fs.existsSync(versionDir)) fs.rmSync(versionDir, { recursive: true, force: true });

  db.transaction(() => {
    db.prepare("DELETE FROM files WHERE version_id = ?").run(versionRow.id);
    db.prepare("DELETE FROM versions WHERE id = ?").run(versionRow.id);
  })();

  return NextResponse.json({ ok: true });
}
