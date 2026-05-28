import Link from "next/link";

export const dynamic = "force-dynamic";

interface Project {
  id: string;
  name: string;
  summary: string | null;
  icon_path: string | null;
  created_at: string;
}

async function getProjects(): Promise<Project[]> {
  try {
    const { getDb } = await import("@/lib/db");
    const db = getDb();
    return db
      .prepare("SELECT id, name, summary, icon_path, created_at FROM projects ORDER BY created_at DESC")
      .all() as Project[];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const projects = await getProjects();

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* Navbar */}
      <header className="bg-white border-b" style={{ borderColor: "var(--border)" }}>
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-black" style={{ color: "var(--brand)" }}>◆</span>
            <span className="text-lg font-bold" style={{ color: "var(--text)" }}>Releaser</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/docs" className="text-sm font-medium transition-colors hover:opacity-70" style={{ color: "var(--text-muted)" }}>
              API Docs
            </Link>
            <Link
              href="/login"
              className="text-sm font-semibold px-4 py-2 rounded-xl text-white transition-opacity hover:opacity-90"
              style={{ background: "var(--brand)" }}
            >
              Admin
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--text)" }}>Projects</h1>
        <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>Browse available releases</p>

        {projects.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center" style={{ border: "1px solid var(--border)" }}>
            <p className="text-base font-medium mb-1" style={{ color: "var(--text)" }}>No projects yet</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              <Link href="/login" className="underline underline-offset-2" style={{ color: "var(--brand-dark)" }}>
                Login
              </Link>{" "}
              to create one
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="bg-white rounded-2xl p-5 flex items-center justify-between transition-shadow hover:shadow-md"
                style={{ border: "1px solid var(--border)" }}
              >
                <div className="flex items-center gap-4 min-w-0">
                  {project.icon_path && (
                    <img
                      src={`/api/projects/${project.id}/icon`}
                      alt=""
                      className="w-10 h-10 rounded-xl object-cover shrink-0"
                      style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08)" }}
                    />
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-base" style={{ color: "var(--text)" }}>{project.name}</p>
                    {project.summary && (
                      <p className="text-sm mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>{project.summary}</p>
                    )}
                  </div>
                </div>
                <span className="text-xs ml-4 shrink-0" style={{ color: "var(--text-muted)" }}>
                  {new Date(project.created_at).toLocaleDateString()}
                </span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
