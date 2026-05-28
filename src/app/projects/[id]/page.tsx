import Link from "next/link";
import { notFound } from "next/navigation";

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
  const project = db
    .prepare("SELECT id, name, description, created_at FROM projects WHERE id = ?")
    .get(id) as Project | undefined;

  if (!project) return null;

  const versions = db
    .prepare(
      "SELECT id, project_id, version, type, description, created_at FROM versions WHERE project_id = ? ORDER BY created_at DESC"
    )
    .all(id) as Version[];

  return { project, versions };
}

const TYPE_LABELS = {
  release: { label: "Releases", color: "text-green-400", badge: "bg-green-900/50 text-green-300 border-green-800" },
  beta: { label: "Beta", color: "text-yellow-400", badge: "bg-yellow-900/50 text-yellow-300 border-yellow-800" },
  dev: { label: "Dev", color: "text-blue-400", badge: "bg-blue-900/50 text-blue-300 border-blue-800" },
};

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <nav className="text-sm text-gray-500 mb-2">
            <Link href="/" className="hover:text-gray-300 transition-colors">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-300">{project.name}</span>
          </nav>
          <h1 className="text-xl font-bold text-white">{project.name}</h1>
          {project.description && <p className="text-gray-400 text-sm mt-1">{project.description}</p>}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {versions.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-400">No versions available yet.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {(["release", "beta", "dev"] as const).map((type) => {
              const group = grouped[type];
              if (group.length === 0) return null;
              const meta = TYPE_LABELS[type];

              return (
                <section key={type}>
                  <h2 className={`text-lg font-semibold ${meta.color} mb-3`}>{meta.label}</h2>
                  <div className="space-y-2">
                    {group.map((v) => (
                      <Link
                        key={v.id}
                        href={`/projects/${id}/versions/${encodeURIComponent(v.version)}`}
                        className="flex items-center justify-between bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-lg px-5 py-3 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`text-xs px-2 py-0.5 rounded border font-mono ${meta.badge}`}>
                            {type}
                          </span>
                          <span className="text-white font-mono font-medium">{v.version}</span>
                          {v.description && (
                            <span className="text-gray-400 text-sm">— {v.description}</span>
                          )}
                        </div>
                        <span className="text-gray-500 text-xs">
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
