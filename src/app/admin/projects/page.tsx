import Link from "next/link";

export const dynamic = "force-dynamic";

interface Project {
  id: string;
  name: string;
  summary: string | null;
  created_at: string;
  version_count: number;
}

async function getProjects() {
  const { getDb } = await import("@/lib/db");
  const db = getDb();
  return db.prepare(`
    SELECT p.id, p.name, p.summary, p.created_at,
           COUNT(v.id) as version_count
    FROM projects p
    LEFT JOIN versions v ON p.id = v.project_id
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `).all() as Project[];
}

export default async function AdminProjectsPage() {
  const projects = await getProjects();

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Projects</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{projects.length} project{projects.length !== 1 ? "s" : ""}</p>
        </div>
        <Link
          href="/admin/projects/new"
          className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: "var(--brand)" }}
        >
          New Project
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center" style={{ border: "1px solid var(--border)" }}>
          <p className="font-medium mb-1" style={{ color: "var(--text)" }}>No projects yet</p>
          <Link href="/admin/projects/new" className="text-sm" style={{ color: "var(--brand-dark)" }}>
            Create your first project →
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-white rounded-2xl px-5 py-4 flex items-center justify-between"
              style={{ border: "1px solid var(--border)" }}
            >
              <div>
                <Link
                  href={`/admin/projects/${project.id}`}
                  className="font-semibold text-base transition-colors hover:opacity-70"
                  style={{ color: "var(--text)" }}
                >
                  {project.name}
                </Link>
                {project.summary && (
                  <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>{project.summary}</p>
                )}
              </div>
              <div className="flex items-center gap-6 shrink-0 ml-4">
                <div className="text-right">
                  <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{project.version_count}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>versions</p>
                </div>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {new Date(project.created_at).toLocaleDateString()}
                </span>
                <Link
                  href={`/admin/projects/${project.id}`}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80"
                  style={{ background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)" }}
                >
                  Manage
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
