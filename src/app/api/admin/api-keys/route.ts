import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdminSessionOnly, hashApiKey } from "@/lib/auth";
import { randomUUID, randomBytes } from "crypto";

export async function GET() {
  if (!(await requireAdminSessionOnly())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const keys = db
    .prepare("SELECT id, name, key_prefix, created_at FROM api_keys ORDER BY created_at DESC")
    .all();

  return NextResponse.json({ apiKeys: keys });
}

export async function POST(request: NextRequest) {
  if (!(await requireAdminSessionOnly())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "API key name is required" }, { status: 400 });
    }

    const rawKey = randomBytes(32).toString("hex");
    const fullKey = "dw_" + rawKey;
    const prefix = "dw_" + rawKey.slice(0, 8);
    const hash = hashApiKey(fullKey);
    const id = randomUUID();

    const db = getDb();
    db.prepare(
      "INSERT INTO api_keys (id, name, key_hash, key_prefix) VALUES (?, ?, ?, ?)"
    ).run(id, name.trim(), hash, prefix);

    const keyRow = db.prepare("SELECT id, name, key_prefix, created_at FROM api_keys WHERE id = ?").get(id);

    return NextResponse.json(
      {
        apiKey: {
          ...(keyRow as object),
          key: fullKey,
        },
        message: "Store this key securely — it will not be shown again",
      },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    throw err;
  }
}
