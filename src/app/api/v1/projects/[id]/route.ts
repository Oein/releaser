import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getProjectTags } from "@/lib/tags";
import { resolveProject, canAccessProject } from "@/lib/projects";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  const project = resolveProject(
    id,
    "id, name, alias, visibility, summary, description, created_at",
    db
  );

  if (!project || !(await canAccessProject(project.visibility, request))) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const tags = getProjectTags(db, project.id);
  return NextResponse.json({ project: { ...project, tags } });
}
