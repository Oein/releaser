import { NextRequest, NextResponse } from "next/server";
import { getDb, getIconsDir } from "@/lib/db";
import { resolveProject, canAccessProject } from "@/lib/projects";
import fs from "fs";
import path from "path";

const EXT_MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".gif": "image/gif",
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();

  const project = resolveProject(id, "icon_path, visibility", db);
  if (
    !project?.icon_path ||
    !(await canAccessProject(project.visibility, req))
  ) {
    return new NextResponse(null, { status: 404 });
  }

  const iconPath = path.join(getIconsDir(), project.icon_path);
  if (!fs.existsSync(iconPath)) return new NextResponse(null, { status: 404 });

  const ext = path.extname(project.icon_path).toLowerCase();
  const contentType = EXT_MIME[ext] ?? "application/octet-stream";
  const buffer = fs.readFileSync(iconPath);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
