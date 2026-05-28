import Link from "next/link";
import { notFound } from "next/navigation";

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

const TYPE_BADGE: Record<string, string> = {
  release: "bg-green-900/50 text-green-300 border-green-800",
  beta: "bg-yellow-900/50 text-yellow-300 border-yellow-800",
  dev: "bg-blue-900/50 text-blue-300 border-blue-800",
};

export default async function AdminProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getData(id);

  if (!data) notFound();
  const { project, versions } = data;

  return (
    <div className="p-6">
      <nav className="text-sm text-gray-500 mb-4">
        <Link href="/admin/projects" className="hover:text-gray-300">Projects</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-300">{project.name}</span>
      </nav>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{project.name}</h1>
          {project.description && <p className="text-gray-400 text-sm mt-1">{project.description}</p>}
        </div>
        <Link
          href={`/admin/projects/${id}/versions/new`}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
        >
          New Version
        </Link>
      </div>

      <h2 className="text-lg font-semibold text-white mb-3">Versions</h2>

      {versions.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center">
          <p className="text-gray-400">No versions yet.</p>
          <Link
            href={`/admin/projects/${id}/versions/new`}
            className="text-indigo-400 hover:text-indigo-300 mt-2 inline-block text-sm"
          >
            Create first version →
          </Link>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left text-xs text-gray-500 uppercase px-4 py-3">Version</th>
                <th className="text-left text-xs text-gray-500 uppercase px-4 py-3">Type</th>
                <th className="text-left text-xs text-gray-500 uppercase px-4 py-3">Description</th>
                <th className="text-left text-xs text-gray-500 uppercase px-4 py-3">Files</th>
                <th className="text-left text-xs text-gray-500 uppercase px-4 py-3">Created</th>
                <th className="text-right text-xs text-gray-500 uppercase px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {versions.map((v) => (
                <tr key={v.id} className="border-b border-gray-800 last:border-0 hover:bg-gray-800/50">
                  <td className="px-4 py-3 font-mono text-white text-sm">{v.version}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded border font-mono ${TYPE_BADGE[v.type] || "bg-gray-800 text-gray-300"}`}>
                      {v.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-sm">{v.description || "—"}</td>
                  <td className="px-4 py-3 text-gray-400 text-sm">{v.file_count}</td>
                  <td className="px-4 py-3 text-gray-500 text-sm">
                    {new Date(v.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/projects/${id}/versions/${encodeURIComponent(v.version)}`}
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
