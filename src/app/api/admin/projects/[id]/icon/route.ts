import { NextRequest, NextResponse } from "next/server";
import { getDb, getIconsDir } from "@/lib/db";
import { requireAdminAuth } from "@/lib/auth";
import fs from "fs";
import path from "path";

const ALLOWED_TYPES: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "image/svg+xml": ".svg",
  "image/gif": ".gif",
};

const MAX_SIZE = 2 * 1024 * 1024; // 2MB

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdminAuth(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const db = getDb();

  const project = db.prepare("SELECT id, icon_path FROM projects WHERE id = ?").get(id) as
    | { id: string; icon_path: string | null }
    | undefined;
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const formData = await request.formData();
  const file = formData.get("icon") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const ext = ALLOWED_TYPES[file.type];
  if (!ext) return NextResponse.json({ error: "Unsupported image type" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.byteLength > MAX_SIZE) {
    return NextResponse.json({ error: "File too large (max 2MB)" }, { status: 400 });
  }

  // Remove old icon if exists
  if (project.icon_path) {
    const oldPath = path.join(getIconsDir(), project.icon_path);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }

  const filename = `${id}${ext}`;
  fs.writeFileSync(path.join(getIconsDir(), filename), buffer);
  db.prepare("UPDATE projects SET icon_path = ? WHERE id = ?").run(filename, id);

  return NextResponse.json({ ok: true });
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

  const project = db.prepare("SELECT id, icon_path FROM projects WHERE id = ?").get(id) as
    | { id: string; icon_path: string | null }
    | undefined;
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  if (project.icon_path) {
    const iconPath = path.join(getIconsDir(), project.icon_path);
    if (fs.existsSync(iconPath)) fs.unlinkSync(iconPath);
    db.prepare("UPDATE projects SET icon_path = NULL WHERE id = ?").run(id);
  }

  return NextResponse.json({ ok: true });
}
