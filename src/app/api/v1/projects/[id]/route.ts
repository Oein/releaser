import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getProjectTags } from "@/lib/tags";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  const project = db
    .prepare("SELECT id, name, summary, description, created_at FROM projects WHERE id = ?")
    .get(id);

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const tags = getProjectTags(db, id);
  return NextResponse.json({ project: { ...(project as object), tags } });
}
