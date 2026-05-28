import { NextRequest, NextResponse } from "next/server";
import { getDb, getFilesDir } from "@/lib/db";
import { requireAdminAuth } from "@/lib/auth";
import { randomUUID } from "crypto";
import path from "path";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; version: string }> }
) {
  if (!(await requireAdminAuth(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, version } = await params;
  const decodedVersion = decodeURIComponent(version);
  const db = getDb();

  const versionRow = db
    .prepare("SELECT id FROM versions WHERE project_id = ? AND version = ?")
    .get(id, decodedVersion) as { id: string } | undefined;

  if (!versionRow) {
    return NextResponse.json({ error: "Version not found" }, { status: 404 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const filename = file.name;
    const versionFilesDir = path.join(getFilesDir(), versionRow.id);

    if (!fs.existsSync(versionFilesDir)) {
      fs.mkdirSync(versionFilesDir, { recursive: true });
    }

    const filePath = path.join(versionFilesDir, filename);
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(filePath, buffer);

    const fileId = randomUUID();
    db.prepare(
      "INSERT INTO files (id, version_id, filename, size, mime_type, path) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(fileId, versionRow.id, filename, buffer.length, file.type || "application/octet-stream", filePath);

    const fileRow = db.prepare("SELECT id, version_id, filename, size, mime_type, created_at FROM files WHERE id = ?").get(fileId);
    return NextResponse.json({ file: fileRow }, { status: 201 });
  } catch (err) {
    console.error("File upload error:", err);
    return NextResponse.json({ error: "File upload failed" }, { status: 500 });
  }
}
