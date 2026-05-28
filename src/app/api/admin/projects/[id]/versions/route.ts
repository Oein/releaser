import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdminAuth } from "@/lib/auth";
import { validateVersionFormat, getVersionTypeFromString } from "@/lib/validate";
import { randomUUID } from "crypto";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdminAuth(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const db = getDb();

  const project = db.prepare("SELECT id FROM projects WHERE id = ?").get(id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { version, type, description } = body;

    if (!version || typeof version !== "string" || !version.trim()) {
      return NextResponse.json({ error: "Version string is required" }, { status: 400 });
    }

    const versionType = getVersionTypeFromString(type);
    if (!versionType) {
      return NextResponse.json(
        { error: "Type must be one of: release, beta, dev" },
        { status: 400 }
      );
    }

    if (!validateVersionFormat(version.trim(), versionType)) {
      const formatHints: Record<string, string> = {
        release: "v1.0.0 format (e.g., v1.6.4)",
        beta: "v1.0.0b or v1.0.0.0b format (e.g., v1.0.9b)",
        dev: "any non-empty string",
      };
      return NextResponse.json(
        { error: `Invalid version format for type '${versionType}'. Expected ${formatHints[versionType]}` },
        { status: 400 }
      );
    }

    const versionId = randomUUID();

    try {
      db.prepare(
        "INSERT INTO versions (id, project_id, version, type, description) VALUES (?, ?, ?, ?, ?)"
      ).run(versionId, id, version.trim(), versionType, description?.trim() || null);
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("UNIQUE")) {
        return NextResponse.json({ error: "Version already exists for this project" }, { status: 409 });
      }
      throw err;
    }

    const versionRow = db.prepare("SELECT * FROM versions WHERE id = ?").get(versionId);
    return NextResponse.json({ version: versionRow }, { status: 201 });
  } catch (err) {
    if (err instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    throw err;
  }
}
