import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getVersionTags } from "@/lib/tags";
import { resolveProject, canAccessProject } from "@/lib/projects";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idOrAlias } = await params;
  const db = getDb();

  const project = resolveProject(idOrAlias, "id, visibility", db);
  if (!project || !(await canAccessProject(project.visibility, request))) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  const id = project.id;

  const typeFilter = request.nextUrl.searchParams.get("type");

  // Support ?tags=a,b,c (multi) and legacy ?tag=a (single)
  const tagsParam = request.nextUrl.searchParams.get("tags");
  const tagParam = request.nextUrl.searchParams.get("tag");
  const tagFilters = tagsParam
    ? tagsParam.split(",").map((t) => t.trim()).filter(Boolean)
    : tagParam
    ? [tagParam.trim()]
    : [];

  const args: unknown[] = [id];
  let query: string;

  if (tagFilters.length > 0) {
    // Each tag requires a separate JOIN to enforce AND semantics
    const joins = tagFilters
      .map((_, i) => `JOIN version_tags vt${i} ON v.id = vt${i}.version_id JOIN project_tags pt${i} ON vt${i}.tag_id = pt${i}.id AND pt${i}.name = ?`)
      .join(" ");
    query = `SELECT DISTINCT v.id, v.project_id, v.version, v.type, v.description, v.created_at FROM versions v ${joins} WHERE v.project_id = ?`;
    // args: [tag1, tag2, ..., projectId]
    args.length = 0;
    args.push(...tagFilters, id);
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
