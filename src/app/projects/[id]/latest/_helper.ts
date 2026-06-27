export async function getLatestVersionByType(
  idOrAlias: string,
  type: "release" | "beta" | "dev"
): Promise<string | null> {
  const { getDb } = await import("@/lib/db");
  const { resolveProject, canAccessProjectFromSession } = await import("@/lib/projects");
  const db = getDb();
  const project = resolveProject(idOrAlias, "id, visibility", db);
  if (!project) return null;
  if (!(await canAccessProjectFromSession(project.visibility))) return null;
  const row = db
    .prepare(
      "SELECT version FROM versions WHERE project_id = ? AND type = ? ORDER BY created_at DESC LIMIT 1"
    )
    .get(project.id, type) as { version: string } | undefined;
  return row?.version ?? null;
}
