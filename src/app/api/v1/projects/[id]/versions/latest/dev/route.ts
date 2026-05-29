import { NextRequest } from "next/server";
import { getLatestVersion } from "../_helper";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tag = req.nextUrl.searchParams.get("tag") ?? undefined;
  return getLatestVersion(id, "dev", tag);
}
