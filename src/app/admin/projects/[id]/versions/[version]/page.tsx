"use client";

import { useState, use, useEffect, useCallback } from "react";
import FileIcon from "@/components/FileIcon";
import EditVersionForm from "./EditVersionForm";
import Link from "next/link";

interface FileRow {
  id: string;
  filename: string;
  size: number | null;
  mime_type: string | null;
  created_at: string;
}

interface Version {
  id: string;
  version: string;
  type: string;
  description: string | null;
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const TYPE_BADGE: Record<string, { background: string; color: string }> = {
  release: { background: "#dcfce7", color: "#15803d" },
  beta:    { background: "#fef9c3", color: "#a16207" },
  dev:     { background: "#dbeafe", color: "#1d4ed8" },
};

export default function AdminVersionPage({ params }: { params: Promise<{ id: string; version: string }> }) {
  const { id, version: encodedVersion } = use(params);
  const version = decodeURIComponent(encodedVersion);

  const [versionData, setVersionData] = useState<Version | null>(null);
  const [files, setFiles] = useState<FileRow[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [vRes, fRes] = await Promise.all([
        fetch(`/api/v1/projects/${id}/versions/${encodeURIComponent(version)}`),
        fetch(`/api/v1/projects/${id}/versions/${encodeURIComponent(version)}/files`),
      ]);
      if (vRes.ok) setVersionData((await vRes.json()).version);
      if (fRes.ok) setFiles((await fRes.json()).files);
    } finally {
      setLoading(false);
    }
  }, [id, version]);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUploadError("");
    setUploadSuccess("");
    setUploading(true);
    const form = e.currentTarget;
    const fileInput = form.elements.namedItem("file") as HTMLInputElement;
    if (!fileInput.files?.length) { setUploadError("Please select a file"); setUploading(false); return; }
    const formData = new FormData();
    formData.append("file", fileInput.files[0]);
    try {
      const res = await fetch(`/api/admin/projects/${id}/versions/${encodeURIComponent(version)}/files`, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) { setUploadError(data.error || "Upload failed"); return; }
      setUploadSuccess(`"${data.file.filename}" uploaded successfully`);
      form.reset();
      await loadData();
    } catch {
      setUploadError("Network error");
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-sm" style={{ color: "var(--text-muted)" }}>Loading...</div>;
  }

  const badge = versionData ? (TYPE_BADGE[versionData.type] ?? { background: "#f4f4f5", color: "#71717a" }) : null;

  return (
    <div className="p-8">
      <nav className="flex items-center gap-1.5 text-sm mb-6" style={{ color: "var(--text-muted)" }}>
        <Link href="/admin/projects" className="hover:underline" style={{ color: "var(--text-muted)" }}>Projects</Link>
        <span>/</span>
        <Link href={`/admin/projects/${id}`} className="hover:underline" style={{ color: "var(--text-muted)" }}>Project</Link>
        <span>/</span>
        <span className="font-mono" style={{ color: "var(--text)" }}>{version}</span>
      </nav>

      {versionData && badge && (
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold font-mono" style={{ color: "var(--text)" }}>{versionData.version}</h1>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={badge}>{versionData.type}</span>
            <EditVersionForm projectId={id} version={version} initialDescription={versionData.description} />
          </div>
          {versionData.description && (
            <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>{versionData.description}</p>
          )}
        </div>
      )}

      {/* Upload */}
      <div className="bg-white rounded-2xl p-6 mb-6" style={{ border: "1px solid var(--border)" }}>
        <h2 className="text-base font-semibold mb-4" style={{ color: "var(--text)" }}>Upload File</h2>
        <form onSubmit={handleUpload}>
          {uploadError && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-3">{uploadError}</div>
          )}
          {uploadSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl mb-3">{uploadSuccess}</div>
          )}
          <div className="flex items-center gap-3">
            <input
              type="file"
              name="file"
              className="flex-1 text-sm rounded-xl px-4 py-2.5 cursor-pointer"
              style={{
                background: "var(--bg)",
                border: "1px solid var(--border)",
                color: "var(--text)",
              }}
              required
            />
            <button
              type="submit"
              disabled={uploading}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white whitespace-nowrap transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: "var(--brand)" }}
            >
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </div>
        </form>
      </div>

      {/* Files */}
      <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
        Files ({files.length})
      </h2>

      {files.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center" style={{ border: "1px solid var(--border)" }}>
          <p className="font-medium" style={{ color: "var(--text-muted)" }}>No files uploaded yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          {files.map((file, i) => (
            <div
              key={file.id}
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: i < files.length - 1 ? "1px solid var(--border)" : "none" }}
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--bg)" }}>
                  <FileIcon filename={file.filename} />
                </div>
                <div className="min-w-0">
                  <p className="font-mono font-medium text-sm truncate" style={{ color: "var(--text)" }}>{file.filename}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {formatBytes(file.size)}{file.mime_type ? ` · ${file.mime_type}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0 ml-3">
                <span className="text-xs hidden sm:block" style={{ color: "var(--text-muted)" }}>
                  {new Date(file.created_at).toLocaleDateString()}
                </span>
                <a
                  href={`/api/v1/projects/${id}/versions/${encodeURIComponent(version)}/files/${file.id}`}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80"
                  style={{ background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)" }}
                  download={file.filename}
                >
                  Download
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
