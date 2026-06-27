import Link from "next/link";
import { notFound } from "next/navigation";
import EditProjectForm from "./EditProjectForm";
import DeleteProjectButton from "./DeleteProjectButton";
import VersionList from "./VersionList";

export const dynamic = "force-dynamic";

const VISIBILITY_BADGE: Record<string, { label: string; background: string; color: string; border: string }> = {
  "public": { label: "Public", background: "#dcfce7", color: "#15803d", border: "#bbf7d0" },
  "url-only": { label: "URL only", background: "#fef9c3", color: "#a16207", border: "#fde68a" },
  "private": { label: "Private", background: "#fee2e2", color: "#b91c1c", border: "#fecaca" },
};

interface Version {
  id: string;
  version: string;
  type: string;
  description: string | null;
  created_at: string;
  file_count: number;
  tags: string[];
}

interface Project {
  id: string;
  name: string;
  summary: string | null;
  description: string | null;
  alias: string | null;
  visibility: "public" | "url-only" | "private";
  icon_path: string | null;
  created_at: string;
}

async function getData(id: string) {
  const { getDb } = await import("@/lib/db");
  const { getProjectTags, getVersionTags } = await import("@/lib/tags");
  const db = getDb();
  const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(id) as Project | undefined;
  if (!project) return null;
  const projectTags = getProjectTags(db, id);
  const versionRows = db.prepare(`
    SELECT v.id, v.version, v.type, v.description, v.created_at,
           COUNT(f.id) as file_count
    FROM versions v
    LEFT JOIN files f ON v.id = f.version_id
    WHERE v.project_id = ?
    GROUP BY v.id
    ORDER BY v.created_at DESC
  `).all(id) as Version[];
  const versions = versionRows.map((v) => ({ ...v, tags: getVersionTags(db, v.id) }));
  return { project, projectTags, versions };
}


export default async function AdminProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getData(id);
  if (!data) notFound();
  const { project, projectTags, versions } = data;

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
            <EditProjectForm id={id} initialName={project.name} initialSummary={project.summary} initialDescription={project.description} initialTags={projectTags} initialAlias={project.alias} initialVisibility={project.visibility} hasIcon={!!project.icon_path} />
          <DeleteProjectButton id={id} name={project.name} />
          </div>
          {project.summary && (
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{project.summary}</p>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {(() => {
              const v = VISIBILITY_BADGE[project.visibility] ?? VISIBILITY_BADGE.public;
              return (
                <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: v.background, color: v.color, border: `1px solid ${v.border}` }}>
                  {v.label}
                </span>
              );
            })()}
            {project.alias && (
              <span className="text-xs px-2.5 py-1 rounded-full font-mono" style={{ background: "var(--bg)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                /projects/{project.alias}
              </span>
            )}
          </div>
          {projectTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {projectTags.map((tag) => (
                <span key={tag} className="text-xs px-2.5 py-1 rounded-full" style={{ background: "#f0f9ff", color: "#0369a1", border: "1px solid #bae6fd" }}>
                  {tag}
                </span>
              ))}
            </div>
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

      <VersionList projectId={id} projectTags={projectTags} initialVersions={versions} />
    </div>
  );
}
