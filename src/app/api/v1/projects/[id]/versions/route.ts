import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getVersionTags } from "@/lib/tags";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();

  const project = db.prepare("SELECT id FROM projects WHERE id = ?").get(id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const typeFilter = request.nextUrl.searchParams.get("type");
  const tagFilter = request.nextUrl.searchParams.get("tag");

  let query: string;
  const args: unknown[] = [id];

  if (tagFilter) {
    query = `SELECT v.id, v.project_id, v.version, v.type, v.description, v.created_at
             FROM versions v
             JOIN version_tags vt ON v.id = vt.version_id
             JOIN project_tags pt ON vt.tag_id = pt.id
             WHERE v.project_id = ? AND pt.name = ?`;
    args.push(tagFilter);
    if (typeFilter && ["release", "beta", "dev"].includes(typeFilter)) {
      query += " AND v.type = ?";
      args.push(typeFilter);
    }
  } else {
    query = "SELECT id, project_id, version, type, description, created_at FROM versions WHERE project_id = ?";
    if (typeFilter && ["release", "beta", "dev"].includes(typeFilter)) {
      query += " AND type = ?";
      args.push(typeFilter);
    }
  }

  query += " ORDER BY created_at DESC";
  const rows = db.prepare(query).all(...args) as { id: string }[];

  const versions = rows.map((v) => ({ ...v, tags: getVersionTags(db, v.id) }));
  return NextResponse.json({ versions });
}
