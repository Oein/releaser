import Link from "next/link";
import { notFound } from "next/navigation";
import Markdown from "react-markdown";

export const dynamic = "force-dynamic";

interface Version {
  id: string;
  project_id: string;
  version: string;
  type: "release" | "beta" | "dev";
  description: string | null;
  created_at: string;
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
  const project = db.prepare("SELECT id, name, description, created_at FROM projects WHERE id = ?").get(id) as Project | undefined;
  if (!project) return null;
  const versions = db.prepare(
    "SELECT id, project_id, version, type, description, created_at FROM versions WHERE project_id = ? ORDER BY created_at DESC"
  ).all(id) as Version[];
  return { project, versions };
}

const TYPE_CONFIG = {
  release: {
    label: "Releases",
    badge: { background: "#dcfce7", color: "#15803d", border: "#bbf7d0" },
  },
  beta: {
    label: "Beta",
    badge: { background: "#fef9c3", color: "#a16207", border: "#fde68a" },
  },
  dev: {
    label: "Dev",
    badge: { background: "#dbeafe", color: "#1d4ed8", border: "#bfdbfe" },
  },
};

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getData(id);
  if (!data) notFound();
  const { project, versions } = data;

  const grouped = {
    release: versions.filter((v) => v.type === "release"),
    beta: versions.filter((v) => v.type === "beta"),
    dev: versions.filter((v) => v.type === "dev"),
  };

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
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>{project.name}</h1>
          {project.description && (
            <div className="prose prose-sm mt-2 max-w-none" style={{ color: "var(--text-muted)" }}>
              <Markdown>{project.description}</Markdown>
            </div>
          )}
        </div>

        {versions.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center" style={{ border: "1px solid var(--border)" }}>
            <p className="font-medium" style={{ color: "var(--text-muted)" }}>No versions available yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {(["release", "beta", "dev"] as const).map((type) => {
              const group = grouped[type];
              if (group.length === 0) return null;
              const cfg = TYPE_CONFIG[type];

              return (
                <section key={type}>
                  <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
                    {cfg.label}
                  </h2>
                  <div className="space-y-2">
                    {group.map((v) => (
                      <Link
                        key={v.id}
                        href={`/projects/${id}/versions/${encodeURIComponent(v.version)}`}
                        className="bg-white rounded-2xl px-5 py-4 flex items-center justify-between transition-shadow hover:shadow-md"
                        style={{ border: "1px solid var(--border)" }}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="text-xs font-semibold px-2.5 py-1 rounded-full"
                            style={cfg.badge}
                          >
                            {type}
                          </span>
                          <span className="font-mono font-semibold text-sm" style={{ color: "var(--text)" }}>{v.version}</span>
                          {v.description && (
                            <span className="text-sm hidden sm:block" style={{ color: "var(--text-muted)" }}>— {v.description}</span>
                          )}
                        </div>
                        <span className="text-xs shrink-0 ml-3" style={{ color: "var(--text-muted)" }}>
                          {new Date(v.created_at).toLocaleDateString()}
                        </span>
                      </Link>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
