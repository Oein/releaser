import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdminAuth } from "@/lib/auth";
import { normalizeAlias, normalizeVisibility } from "@/lib/projects";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  if (!(await requireAdminAuth(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 });
    }

    const aliasResult = normalizeAlias(body.alias);
    if ("error" in aliasResult) {
      return NextResponse.json({ error: aliasResult.error }, { status: 400 });
    }
    const visibilityResult = normalizeVisibility(body.visibility);
    if ("error" in visibilityResult) {
      return NextResponse.json({ error: visibilityResult.error }, { status: 400 });
    }

    const db = getDb();
    const id = randomUUID();

    try {
      db.prepare(
        "INSERT INTO projects (id, name, description, alias, visibility) VALUES (?, ?, ?, ?, ?)"
      ).run(id, name.trim(), description?.trim() || null, aliasResult.alias, visibilityResult.visibility);
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("UNIQUE")) {
        const which = err.message.includes("alias") ? "Alias" : "Project name";
        return NextResponse.json({ error: `${which} already exists` }, { status: 409 });
      }
      throw err;
    }

    const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(id);
    return NextResponse.json({ project }, { status: 201 });
  } catch (err) {
    if (err instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    throw err;
  }
}
