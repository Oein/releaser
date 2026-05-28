import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdminAuth } from "@/lib/auth";

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
  const { name, description } = body;

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

  if (description !== undefined) {
    db.prepare("UPDATE projects SET description = ? WHERE id = ?")
      .run(description?.trim() || null, id);
  }

  const updated = db.prepare("SELECT * FROM projects WHERE id = ?").get(id);
  return NextResponse.json({ project: updated });
}
