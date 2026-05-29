import type BetterSqlite3 from "better-sqlite3";

export function getProjectTags(db: BetterSqlite3.Database, projectId: string): string[] {
  return (
    db.prepare("SELECT name FROM project_tags WHERE project_id = ? ORDER BY name").all(projectId) as { name: string }[]
  ).map((r) => r.name);
}

export function getVersionTags(db: BetterSqlite3.Database, versionId: string): string[] {
  return (
    db
      .prepare(
        `SELECT pt.name FROM version_tags vt
         JOIN project_tags pt ON vt.tag_id = pt.id
         WHERE vt.version_id = ?
         ORDER BY pt.name`
      )
      .all(versionId) as { name: string }[]
  ).map((r) => r.name);
}
