import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const db = getDb();
  const projects = db
    .prepare(
      "SELECT id, name, alias, summary, description, created_at FROM projects WHERE visibility = 'public' ORDER BY created_at DESC"
    )
    .all();
  return NextResponse.json({ projects });
}
