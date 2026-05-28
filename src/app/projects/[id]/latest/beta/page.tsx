import { redirect, notFound } from "next/navigation";
import { getLatestVersionByType } from "../_helper";

export const dynamic = "force-dynamic";

export default async function LatestBetaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const version = await getLatestVersionByType(id, "beta");
  if (version === null) notFound();
  redirect(`/projects/${id}/versions/${encodeURIComponent(version)}`);
}
