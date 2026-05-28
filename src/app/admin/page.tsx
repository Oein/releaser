import Link from "next/link";

export const dynamic = "force-dynamic";

async function getStats() {
  const { getDb } = await import("@/lib/db");
  const db = getDb();
  const projects = (db.prepare("SELECT COUNT(*) as count FROM projects").get() as { count: number }).count;
  const versions = (db.prepare("SELECT COUNT(*) as count FROM versions").get() as { count: number }).count;
  const files = (db.prepare("SELECT COUNT(*) as count FROM files").get() as { count: number }).count;
  return { projects, versions, files };
}

export default async function AdminDashboard() {
  const stats = await getStats();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <p className="text-gray-400 text-sm">Projects</p>
          <p className="text-3xl font-bold text-white mt-1">{stats.projects}</p>
          <Link href="/admin/projects" className="text-indigo-400 hover:text-indigo-300 text-xs mt-2 inline-block">
            View all →
          </Link>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <p className="text-gray-400 text-sm">Versions</p>
          <p className="text-3xl font-bold text-white mt-1">{stats.versions}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <p className="text-gray-400 text-sm">Files</p>
          <p className="text-3xl font-bold text-white mt-1">{stats.files}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Link
          href="/admin/projects/new"
          className="bg-gray-900 border border-gray-800 hover:border-indigo-700 rounded-lg p-5 transition-colors"
        >
          <h3 className="text-white font-medium">New Project</h3>
          <p className="text-gray-400 text-sm mt-1">Create a new release project</p>
        </Link>
        <Link
          href="/admin/api-keys"
          className="bg-gray-900 border border-gray-800 hover:border-indigo-700 rounded-lg p-5 transition-colors"
        >
          <h3 className="text-white font-medium">API Keys</h3>
          <p className="text-gray-400 text-sm mt-1">Manage API access keys</p>
        </Link>
      </div>
    </div>
  );
}
