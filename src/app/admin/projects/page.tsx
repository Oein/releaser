import Link from "next/link";

export const dynamic = "force-dynamic";

interface Project {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  version_count: number;
}

async function getProjects() {
  const { getDb } = await import("@/lib/db");
  const db = getDb();
  return db.prepare(`
    SELECT p.id, p.name, p.description, p.created_at,
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
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Projects</h1>
        <Link
          href="/admin/projects/new"
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
        >
          New Project
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center">
          <p className="text-gray-400">No projects yet.</p>
          <Link href="/admin/projects/new" className="text-indigo-400 hover:text-indigo-300 mt-2 inline-block text-sm">
            Create your first project →
          </Link>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left text-xs text-gray-500 uppercase px-4 py-3">Name</th>
                <th className="text-left text-xs text-gray-500 uppercase px-4 py-3">Description</th>
                <th className="text-left text-xs text-gray-500 uppercase px-4 py-3">Versions</th>
                <th className="text-left text-xs text-gray-500 uppercase px-4 py-3">Created</th>
                <th className="text-right text-xs text-gray-500 uppercase px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id} className="border-b border-gray-800 last:border-0 hover:bg-gray-800/50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/projects/${project.id}`}
                      className="text-white hover:text-indigo-300 font-medium transition-colors"
                    >
                      {project.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-sm">{project.description || "—"}</td>
                  <td className="px-4 py-3 text-gray-400 text-sm">{project.version_count}</td>
                  <td className="px-4 py-3 text-gray-500 text-sm">
                    {new Date(project.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/projects/${project.id}`}
                      className="text-indigo-400 hover:text-indigo-300 text-sm transition-colors"
                    >
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
