import { NextRequest, NextResponse } from "next/server";
import { getDb, getFilesDir } from "@/lib/db";
import { requireAdminAuth } from "@/lib/auth";
import { getProjectTags } from "@/lib/tags";
import { randomUUID } from "crypto";
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
  const { name, summary, description, tags } = body;

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

  if (tags !== undefined) {
    if (!Array.isArray(tags)) {
      return NextResponse.json({ error: "tags must be an array of strings" }, { status: 400 });
    }
    const newTags = [...new Set(
      (tags as unknown[])
        .filter((t) => typeof t === "string" && (t as string).trim())
        .map((t) => (t as string).trim().toLowerCase())
    )];

    db.transaction(() => {
      const currentTags = db
        .prepare("SELECT id, name FROM project_tags WHERE project_id = ?")
        .all(id) as { id: string; name: string }[];
      const currentMap = new Map(currentTags.map((t) => [t.name, t.id]));
      const newSet = new Set(newTags);

      for (const [name, tagId] of currentMap) {
        if (!newSet.has(name)) {
          db.prepare("DELETE FROM project_tags WHERE id = ?").run(tagId);
        }
      }

      for (const tagName of newTags) {
        if (!currentMap.has(tagName)) {
          db.prepare("INSERT OR IGNORE INTO project_tags (id, project_id, name) VALUES (?, ?, ?)")
            .run(randomUUID(), id, tagName);
        }
      }
    })();
  }

  const updated = db.prepare("SELECT * FROM projects WHERE id = ?").get(id);
  const projectTags = getProjectTags(db, id);
  return NextResponse.json({ project: { ...(updated as object), tags: projectTags } });
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
