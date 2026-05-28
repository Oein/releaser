import Link from "next/link";
import { notFound } from "next/navigation";
import FileIcon from "@/components/FileIcon";

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
  const project = db.prepare("SELECT id, name FROM projects WHERE id = ?").get(projectId) as Project | undefined;
  if (!project) return null;
  const versionRow = db.prepare("SELECT * FROM versions WHERE project_id = ? AND version = ?").get(projectId, version) as Version | undefined;
  if (!versionRow) return null;
  const files = db.prepare("SELECT id, filename, size, mime_type, created_at FROM files WHERE version_id = ? ORDER BY created_at ASC").all(versionRow.id) as FileRow[];
  return { project, version: versionRow, files };
}

const TYPE_BADGE: Record<string, { background: string; color: string; border: string }> = {
  release: { background: "#dcfce7", color: "#15803d", border: "#bbf7d0" },
  beta:    { background: "#fef9c3", color: "#a16207", border: "#fde68a" },
  dev:     { background: "#dbeafe", color: "#1d4ed8", border: "#bfdbfe" },
};

export default async function VersionPage({ params }: { params: Promise<{ id: string; version: string }> }) {
  const { id, version: encodedVersion } = await params;
  const version = decodeURIComponent(encodedVersion);
  const data = await getData(id, version);
  if (!data) notFound();
  const { project, version: versionRow, files } = data;
  const badge = TYPE_BADGE[versionRow.type] ?? { background: "#f4f4f5", color: "#71717a", border: "#e4e4e7" };

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <header className="bg-white border-b" style={{ borderColor: "var(--border)" }}>
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-black" style={{ color: "var(--brand)" }}>◆</span>
            <span className="text-lg font-bold" style={{ color: "var(--text)" }}>Releaser</span>
          </Link>
          <Link href="/docs" className="text-sm font-medium hover:opacity-70" style={{ color: "var(--text-muted)" }}>
            API Docs
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <nav className="flex items-center gap-1.5 text-sm mb-6" style={{ color: "var(--text-muted)" }}>
          <Link href="/" className="hover:underline" style={{ color: "var(--text-muted)" }}>Home</Link>
          <span>/</span>
          <Link href={`/projects/${id}`} className="hover:underline" style={{ color: "var(--text-muted)" }}>{project.name}</Link>
          <span>/</span>
          <span className="font-mono" style={{ color: "var(--text)" }}>{versionRow.version}</span>
        </nav>

        <div className="bg-white rounded-2xl p-6 mb-6" style={{ border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold font-mono" style={{ color: "var(--text)" }}>{versionRow.version}</h1>
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ ...badge, border: `1px solid ${badge.border}` }}
            >
              {versionRow.type}
            </span>
          </div>
          {versionRow.description && (
            <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>{versionRow.description}</p>
          )}
          <p className="text-xs mt-3" style={{ color: "var(--text-muted)" }}>
            Released {new Date(versionRow.created_at).toLocaleDateString()}
          </p>
        </div>

        <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
          Files ({files.length})
        </h2>

        {files.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center" style={{ border: "1px solid var(--border)" }}>
            <p className="font-medium" style={{ color: "var(--text-muted)" }}>No files uploaded yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
            {files.map((file, i) => (
              <div
                key={file.id}
                className="flex items-center justify-between px-5 py-4"
                style={{
                  borderBottom: i < files.length - 1 ? `1px solid var(--border)` : "none",
                }}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "var(--bg)" }}
                  >
                    <FileIcon filename={file.filename} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-mono font-medium text-sm truncate" style={{ color: "var(--text)" }}>{file.filename}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {formatBytes(file.size)}{file.mime_type ? ` · ${file.mime_type}` : ""}
                    </p>
                  </div>
                </div>
                <a
                  href={`/api/v1/projects/${id}/versions/${encodeURIComponent(versionRow.version)}/files/${file.id}`}
                  className="shrink-0 ml-4 px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
                  style={{ background: "var(--brand)", color: "white" }}
                  download={file.filename}
                >
                  Download
                </a>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
