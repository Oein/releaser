import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface FileRow {
  id: string;
  filename: string;
  size: number | null;
  mime_type: string | null;
  created_at: string;
}

interface Version {
  id: string;
  project_id: string;
  version: string;
  type: string;
  description: string | null;
  created_at: string;
}

interface Project {
  id: string;
  name: string;
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

async function getData(projectId: string, version: string) {
  const { getDb } = await import("@/lib/db");
  const db = getDb();

  const project = db
    .prepare("SELECT id, name FROM projects WHERE id = ?")
    .get(projectId) as Project | undefined;
  if (!project) return null;

  const versionRow = db
    .prepare("SELECT * FROM versions WHERE project_id = ? AND version = ?")
    .get(projectId, version) as Version | undefined;
  if (!versionRow) return null;

  const files = db
    .prepare("SELECT id, filename, size, mime_type, created_at FROM files WHERE version_id = ? ORDER BY created_at ASC")
    .all(versionRow.id) as FileRow[];

  return { project, version: versionRow, files };
}

export default async function VersionPage({
  params,
}: {
  params: Promise<{ id: string; version: string }>;
}) {
  const { id, version: encodedVersion } = await params;
  const version = decodeURIComponent(encodedVersion);
  const data = await getData(id, version);

  if (!data) notFound();

  const { project, version: versionRow, files } = data;

  const typeBadge: Record<string, string> = {
    release: "bg-green-900/50 text-green-300 border-green-800",
    beta: "bg-yellow-900/50 text-yellow-300 border-yellow-800",
    dev: "bg-blue-900/50 text-blue-300 border-blue-800",
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <nav className="text-sm text-gray-500 mb-2">
            <Link href="/" className="hover:text-gray-300 transition-colors">Home</Link>
            <span className="mx-2">/</span>
            <Link href={`/projects/${id}`} className="hover:text-gray-300 transition-colors">{project.name}</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-300 font-mono">{versionRow.version}</span>
          </nav>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-white font-mono">{versionRow.version}</h1>
            <span className={`text-xs px-2 py-0.5 rounded border ${typeBadge[versionRow.type] || "bg-gray-800 text-gray-300"}`}>
              {versionRow.type}
            </span>
          </div>
          {versionRow.description && (
            <p className="text-gray-400 text-sm mt-1">{versionRow.description}</p>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <h2 className="text-lg font-semibold text-white mb-4">Files</h2>

        {files.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-400">No files uploaded yet.</p>
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left text-xs text-gray-500 uppercase px-4 py-3">Filename</th>
                  <th className="text-left text-xs text-gray-500 uppercase px-4 py-3">Size</th>
                  <th className="text-left text-xs text-gray-500 uppercase px-4 py-3">Type</th>
                  <th className="text-left text-xs text-gray-500 uppercase px-4 py-3">Date</th>
                  <th className="text-right text-xs text-gray-500 uppercase px-4 py-3">Download</th>
                </tr>
              </thead>
              <tbody>
                {files.map((file) => (
                  <tr key={file.id} className="border-b border-gray-800 last:border-0 hover:bg-gray-800/50">
                    <td className="px-4 py-3 text-white font-mono text-sm">{file.filename}</td>
                    <td className="px-4 py-3 text-gray-400 text-sm">{formatBytes(file.size)}</td>
                    <td className="px-4 py-3 text-gray-400 text-sm">{file.mime_type || "—"}</td>
                    <td className="px-4 py-3 text-gray-500 text-sm">
                      {new Date(file.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <a
                        href={`/api/v1/projects/${id}/versions/${encodeURIComponent(versionRow.version)}/files/${file.id}`}
                        className="text-indigo-400 hover:text-indigo-300 text-sm transition-colors"
                        download={file.filename}
                      >
                        Download
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
