import Link from "next/link";

export const dynamic = "force-dynamic";

interface Project {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

async function getProjects(): Promise<Project[]> {
  try {
    const { getDb } = await import("@/lib/db");
    const db = getDb();
    return db
      .prepare("SELECT id, name, description, created_at FROM projects ORDER BY created_at DESC")
      .all() as Project[];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const projects = await getProjects();

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Deploy Web</h1>
            <p className="text-sm text-gray-400">Release Management Platform</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/docs" className="text-sm text-gray-400 hover:text-white transition-colors">
              API Docs
            </Link>
            <Link
              href="/login"
              className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded transition-colors"
            >
              Admin
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-semibold text-white mb-6">Projects</h2>

        {projects.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-400">No projects yet.</p>
            <Link href="/login" className="text-indigo-400 hover:text-indigo-300 mt-2 inline-block">
              Login to create one
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="block bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-lg p-5 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-white">{project.name}</h3>
                    {project.description && (
                      <p className="text-gray-400 text-sm mt-1">{project.description}</p>
                    )}
                  </div>
                  <span className="text-gray-500 text-xs mt-1">
                    {new Date(project.created_at).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
