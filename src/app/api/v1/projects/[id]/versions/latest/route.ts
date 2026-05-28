import { NextRequest } from "next/server";
import { getLatestVersion } from "./_helper";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return getLatestVersion(id, "release");
}
