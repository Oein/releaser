"use client";

import { useState, use, useEffect, useCallback } from "react";
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

export default function AdminVersionPage({
  params,
}: {
  params: Promise<{ id: string; version: string }>;
}) {
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
      if (vRes.ok) {
        const vData = await vRes.json();
        setVersionData(vData.version);
      }
      if (fRes.ok) {
        const fData = await fRes.json();
        setFiles(fData.files);
      }
    } finally {
      setLoading(false);
    }
  }, [id, version]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUploadError("");
    setUploadSuccess("");
    setUploading(true);

    const form = e.currentTarget;
    const fileInput = form.elements.namedItem("file") as HTMLInputElement;

    if (!fileInput.files || fileInput.files.length === 0) {
      setUploadError("Please select a file");
      setUploading(false);
      return;
    }

    const formData = new FormData();
    formData.append("file", fileInput.files[0]);

    try {
      const res = await fetch(
        `/api/admin/projects/${id}/versions/${encodeURIComponent(version)}/files`,
        { method: "POST", body: formData }
      );

      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error || "Upload failed");
        return;
      }

      setUploadSuccess(`File "${data.file.filename}" uploaded successfully`);
      form.reset();
      await loadData();
    } catch {
      setUploadError("Network error");
    } finally {
      setUploading(false);
    }
  }

  const TYPE_BADGE: Record<string, string> = {
    release: "bg-green-900/50 text-green-300 border-green-800",
    beta: "bg-yellow-900/50 text-yellow-300 border-yellow-800",
    dev: "bg-blue-900/50 text-blue-300 border-blue-800",
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <nav className="text-sm text-gray-500 mb-4">
        <Link href="/admin/projects" className="hover:text-gray-300">Projects</Link>
        <span className="mx-2">/</span>
        <Link href={`/admin/projects/${id}`} className="hover:text-gray-300">Project</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-300 font-mono">{version}</span>
      </nav>

      {versionData && (
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-2xl font-bold text-white font-mono">{versionData.version}</h1>
          <span className={`text-xs px-2 py-0.5 rounded border ${TYPE_BADGE[versionData.type] || "bg-gray-800 text-gray-300"}`}>
            {versionData.type}
          </span>
        </div>
      )}

      {/* Upload Section */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Upload File</h2>
        <form onSubmit={handleUpload} className="flex items-start gap-3">
          <div className="flex-1">
            {uploadError && (
              <div className="bg-red-900/30 border border-red-700 text-red-300 text-sm px-3 py-2 rounded mb-2">
                {uploadError}
              </div>
            )}
            {uploadSuccess && (
              <div className="bg-green-900/30 border border-green-700 text-green-300 text-sm px-3 py-2 rounded mb-2">
                {uploadSuccess}
              </div>
            )}
            <input
              type="file"
              name="file"
              className="w-full text-sm text-gray-300 bg-gray-800 border border-gray-700 rounded px-3 py-2 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
              required
            />
          </div>
          <button
            type="submit"
            disabled={uploading}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded text-sm font-medium whitespace-nowrap transition-colors"
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </form>
      </div>

      {/* Files list */}
      <h2 className="text-lg font-semibold text-white mb-3">Files ({files.length})</h2>

      {files.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 text-center">
          <p className="text-gray-400">No files uploaded yet.</p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left text-xs text-gray-500 uppercase px-4 py-3">Filename</th>
                <th className="text-left text-xs text-gray-500 uppercase px-4 py-3">Size</th>
                <th className="text-left text-xs text-gray-500 uppercase px-4 py-3">MIME Type</th>
                <th className="text-left text-xs text-gray-500 uppercase px-4 py-3">Date</th>
                <th className="text-right text-xs text-gray-500 uppercase px-4 py-3">Actions</th>
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
                      href={`/api/v1/projects/${id}/versions/${encodeURIComponent(version)}/files/${file.id}`}
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
    </div>
  );
}
