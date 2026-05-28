export async function getLatestVersionByType(
  projectId: string,
  type: "release" | "beta" | "dev"
): Promise<string | null> {
  const { getDb } = await import("@/lib/db");
  const db = getDb();
  const project = db.prepare("SELECT id FROM projects WHERE id = ?").get(projectId);
  if (!project) return null;
  const row = db
    .prepare(
      "SELECT version FROM versions WHERE project_id = ? AND type = ? ORDER BY created_at DESC LIMIT 1"
    )
    .get(projectId, type) as { version: string } | undefined;
  return row?.version ?? null;
}
