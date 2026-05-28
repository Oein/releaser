import Link from "next/link";
import { notFound } from "next/navigation";
import EditProjectForm from "./EditProjectForm";
import DeleteProjectButton from "./DeleteProjectButton";
import DeleteVersionButton from "./DeleteVersionButton";

export const dynamic = "force-dynamic";

interface Version {
  id: string;
  version: string;
  type: string;
  description: string | null;
  created_at: string;
  file_count: number;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

async function getData(id: string) {
  const { getDb } = await import("@/lib/db");
  const db = getDb();
  const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(id) as Project | undefined;
  if (!project) return null;
  const versions = db.prepare(`
    SELECT v.id, v.version, v.type, v.description, v.created_at,
           COUNT(f.id) as file_count
    FROM versions v
    LEFT JOIN files f ON v.id = f.version_id
    WHERE v.project_id = ?
    GROUP BY v.id
    ORDER BY v.created_at DESC
  `).all(id) as Version[];
  return { project, versions };
}

const TYPE_BADGE: Record<string, { background: string; color: string }> = {
  release: { background: "#dcfce7", color: "#15803d" },
  beta:    { background: "#fef9c3", color: "#a16207" },
  dev:     { background: "#dbeafe", color: "#1d4ed8" },
};

export default async function AdminProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getData(id);
  if (!data) notFound();
  const { project, versions } = data;

  return (
    <div className="p-8">
      <nav className="flex items-center gap-1.5 text-sm mb-6" style={{ color: "var(--text-muted)" }}>
        <Link href="/admin/projects" className="hover:underline" style={{ color: "var(--text-muted)" }}>Projects</Link>
        <span>/</span>
        <span style={{ color: "var(--text)" }}>{project.name}</span>
      </nav>

      <div className="flex items-start justify-between mb-8">
        <div className="flex-1 min-w-0 mr-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>{project.name}</h1>
            <EditProjectForm id={id} initialName={project.name} initialDescription={project.description} />
          <DeleteProjectButton id={id} name={project.name} />
          </div>
          {project.description && (
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{project.description}</p>
          )}
        </div>
        <Link
          href={`/admin/projects/${id}/versions/new`}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 shrink-0"
          style={{ background: "var(--brand)" }}
        >
          New Version
        </Link>
      </div>

      <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
        Versions ({versions.length})
      </h2>

      {versions.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center" style={{ border: "1px solid var(--border)" }}>
          <p className="font-medium mb-1" style={{ color: "var(--text)" }}>No versions yet</p>
          <Link href={`/admin/projects/${id}/versions/new`} className="text-sm" style={{ color: "var(--brand-dark)" }}>
            Create first version →
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {versions.map((v) => {
            const badge = TYPE_BADGE[v.type] ?? { background: "#f4f4f5", color: "#71717a" };
            return (
              <div
                key={v.id}
                className="bg-white rounded-2xl px-5 py-4 flex items-center justify-between"
                style={{ border: "1px solid var(--border)" }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
                    style={badge}
                  >
                    {v.type}
                  </span>
                  <span className="font-mono font-semibold text-sm" style={{ color: "var(--text)" }}>{v.version}</span>
                  {v.description && (
                    <span className="text-sm hidden md:block" style={{ color: "var(--text-muted)" }}>— {v.description}</span>
                  )}
                </div>
                <div className="flex items-center gap-5 shrink-0 ml-3">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{v.file_count}</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>files</p>
                  </div>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {new Date(v.created_at).toLocaleDateString()}
                  </span>
                  <Link
                    href={`/admin/projects/${id}/versions/${encodeURIComponent(v.version)}`}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80"
                    style={{ background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)" }}
                  >
                    Manage
                  </Link>
                  <DeleteVersionButton projectId={id} version={v.version} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
