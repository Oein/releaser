import { NextRequest, NextResponse } from "next/server";
import { getDb, getFilesDir } from "@/lib/db";
import { requireAdminAuth } from "@/lib/auth";
import { getVersionTags } from "@/lib/tags";
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
  const { description, tags } = body;

  db.prepare("UPDATE versions SET description = ? WHERE id = ?")
    .run(description?.trim() || null, versionRow.id);

  if (tags !== undefined) {
    if (!Array.isArray(tags)) {
      return NextResponse.json({ error: "tags must be an array of strings" }, { status: 400 });
    }
    const normalizedTags = [...new Set(
      (tags as unknown[])
        .filter((t) => typeof t === "string" && (t as string).trim())
        .map((t) => (t as string).trim().toLowerCase())
    )];
    db.transaction(() => {
      db.prepare("DELETE FROM version_tags WHERE version_id = ?").run(versionRow.id);
      const projectTagRows = db
        .prepare("SELECT id, name FROM project_tags WHERE project_id = ?")
        .all(id) as { id: string; name: string }[];
      const tagMap = new Map(projectTagRows.map((t) => [t.name, t.id]));
      for (const tagName of normalizedTags) {
        const tagId = tagMap.get(tagName);
        if (tagId) {
          db.prepare("INSERT OR IGNORE INTO version_tags (version_id, tag_id) VALUES (?, ?)").run(versionRow.id, tagId);
        }
      }
    })();
  }

  const updated = db.prepare("SELECT * FROM versions WHERE id = ?").get(versionRow.id);
  const versionTags = getVersionTags(db, versionRow.id);
  return NextResponse.json({ version: { ...(updated as object), tags: versionTags } });
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
