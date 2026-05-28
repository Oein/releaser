import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdminSessionOnly } from "@/lib/auth";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdminSessionOnly())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const db = getDb();

  const key = db.prepare("SELECT id FROM api_keys WHERE id = ?").get(id);
  if (!key) {
    return NextResponse.json({ error: "API key not found" }, { status: 404 });
  }

  db.prepare("DELETE FROM api_keys WHERE id = ?").run(id);
  return NextResponse.json({ success: true });
}
