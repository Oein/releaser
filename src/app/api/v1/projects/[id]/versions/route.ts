import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();

  // Check project exists
  const project = db.prepare("SELECT id FROM projects WHERE id = ?").get(id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const typeFilter = request.nextUrl.searchParams.get("type");
  let query = "SELECT id, project_id, version, type, description, created_at FROM versions WHERE project_id = ?";
  const args: unknown[] = [id];

  if (typeFilter && ["release", "beta", "dev"].includes(typeFilter)) {
    query += " AND type = ?";
    args.push(typeFilter);
  }

  query += " ORDER BY created_at DESC";
  const versions = db.prepare(query).all(...args);

  return NextResponse.json({ versions });
}
