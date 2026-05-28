import { redirect } from "next/navigation";
import { getLatestVersionByType } from "../_helper";

export const dynamic = "force-dynamic";

export default async function LatestDevPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const version = await getLatestVersionByType(id, "dev");
  if (!version) redirect(`/projects/${id}`);
  redirect(`/projects/${id}/versions/${encodeURIComponent(version)}`);
}
