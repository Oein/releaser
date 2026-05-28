import { NextRequest, NextResponse } from "next/server";
import { getDb, getFilesDir } from "@/lib/db";
import { requireAdminAuth } from "@/lib/auth";
import fs from "fs";
import path from "path";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdminAuth(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const db = getDb();

  const project = db.prepare("SELECT id FROM projects WHERE id = ?").get(id);
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const body = await request.json();
  const { name, summary, description } = body;

  if (name !== undefined) {
    if (typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
    }
    try {
      db.prepare("UPDATE projects SET name = ? WHERE id = ?").run(name.trim(), id);
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("UNIQUE")) {
        return NextResponse.json({ error: "Project name already exists" }, { status: 409 });
      }
      throw err;
    }
  }

  if (summary !== undefined) {
    db.prepare("UPDATE projects SET summary = ? WHERE id = ?")
      .run(summary?.trim() || null, id);
  }

  if (description !== undefined) {
    db.prepare("UPDATE projects SET description = ? WHERE id = ?")
      .run(description?.trim() || null, id);
  }

  const updated = db.prepare("SELECT * FROM projects WHERE id = ?").get(id);
  return NextResponse.json({ project: updated });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdminAuth(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const db = getDb();

  const project = db.prepare("SELECT id FROM projects WHERE id = ?").get(id);
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  // Collect all version IDs to clean up files
  const versions = db.prepare("SELECT id FROM versions WHERE project_id = ?").all(id) as { id: string }[];

  db.transaction(() => {
    for (const v of versions) {
      // Delete files from disk
      const versionDir = path.join(getFilesDir(), v.id);
      if (fs.existsSync(versionDir)) fs.rmSync(versionDir, { recursive: true, force: true });
      db.prepare("DELETE FROM files WHERE version_id = ?").run(v.id);
    }
    db.prepare("DELETE FROM versions WHERE project_id = ?").run(id);
    db.prepare("DELETE FROM projects WHERE id = ?").run(id);
  })();

  return NextResponse.json({ ok: true });
}
