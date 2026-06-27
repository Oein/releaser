import Link from "next/link";
import { notFound } from "next/navigation";
import Markdown from "react-markdown";
import { ProjectVersionList } from "@/components/ProjectVersionList";

export const dynamic = "force-dynamic";

interface Version {
  id: string;
  project_id: string;
  version: string;
  type: "release" | "beta" | "dev";
  description: string | null;
  created_at: string;
  tags: string[];
}

interface Project {
  id: string;
  name: string;
  summary: string | null;
  description: string | null;
  visibility: "public" | "url-only" | "private";
  icon_path: string | null;
  created_at: string;
}

async function getData(idOrAlias: string) {
  const { getDb } = await import("@/lib/db");
  const { getVersionTags, getProjectTags } = await import("@/lib/tags");
  const { resolveProject, canAccessProjectFromSession } = await import("@/lib/projects");
  const db = getDb();
  const project = resolveProject(idOrAlias, "id, name, summary, description, visibility, icon_path, created_at", db) as Project | undefined;
  if (!project) return null;
  if (!(await canAccessProjectFromSession(project.visibility))) return null;
  const rows = db.prepare(
    "SELECT id, project_id, version, type, description, created_at FROM versions WHERE project_id = ? ORDER BY created_at DESC"
  ).all(project.id) as Omit<Version, "tags">[];
  const versions: Version[] = rows.map((v) => ({ ...v, tags: getVersionTags(db, v.id) }));
  const availableTags = getProjectTags(db, project.id);
  return { project, versions, availableTags };
}

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getData(id);
  if (!data) notFound();
  const { project, versions, availableTags } = data;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <header className="bg-white border-b" style={{ borderColor: "var(--border)" }}>
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-black" style={{ color: "var(--brand)" }}>◆</span>
            <span className="text-lg font-bold" style={{ color: "var(--text)" }}>Releaser</span>
          </Link>
          <Link href="/docs" className="text-sm font-medium transition-colors hover:opacity-70" style={{ color: "var(--text-muted)" }}>
            API Docs
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <nav className="flex items-center gap-1.5 text-sm mb-6" style={{ color: "var(--text-muted)" }}>
          <Link href="/" className="hover:underline" style={{ color: "var(--text-muted)" }}>Home</Link>
          <span>/</span>
          <span style={{ color: "var(--text)" }}>{project.name}</span>
        </nav>

        <div className="bg-white rounded-2xl p-6 mb-6" style={{ border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-4">
            {project.icon_path && (
              <img
                src={`/api/projects/${id}/icon`}
                alt=""
                className="w-14 h-14 rounded-2xl object-cover shrink-0"
                style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.14), 0 2px 6px rgba(0,0,0,0.08)" }}
              />
            )}
            <div className="min-w-0">
              <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>{project.name}</h1>
              {project.summary && (
                <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{project.summary}</p>
              )}
            </div>
          </div>
          {project.description && (
            <div className="markdown mt-4 text-sm" style={{ color: "var(--text-muted)" }}>
              <Markdown>{project.description}</Markdown>
            </div>
          )}
        </div>

        <ProjectVersionList versions={versions} projectId={id} availableTags={availableTags} />
      </main>
    </div>
  );
}
