"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const VERSION_HINTS: Record<string, string> = {
  release: "e.g., v1.0.0, v2.3.4 — must match /^v\\d+\\.\\d+\\.\\d+$/",
  beta: "e.g., v1.0.9b, v2.0.3b, v3.5.16.88b",
  dev: "any non-empty string, e.g., nightly-2025-01-15, feature-xyz",
};

export default function NewVersionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [version, setVersion] = useState("");
  const [type, setType] = useState<"release" | "beta" | "dev">("release");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/projects/${id}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version, type, description }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create version");
        return;
      }

      router.push(`/admin/projects/${id}/versions/${encodeURIComponent(data.version.version)}`);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-xl">
      <nav className="text-sm text-gray-500 mb-4">
        <Link href="/admin/projects" className="hover:text-gray-300">Projects</Link>
        <span className="mx-2">/</span>
        <Link href={`/admin/projects/${id}`} className="hover:text-gray-300">Project</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-300">New Version</span>
      </nav>

      <h1 className="text-2xl font-bold text-white mb-6">New Version</h1>

      <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-4">
        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-300 text-sm px-3 py-2 rounded">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm text-gray-400 mb-1">Version Type *</label>
          <div className="flex gap-2">
            {(["release", "beta", "dev"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex-1 py-2 rounded text-sm font-medium border transition-colors ${
                  type === t
                    ? "bg-indigo-600 border-indigo-500 text-white"
                    : "bg-gray-800 border-gray-700 text-gray-400 hover:text-white"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Version String *</label>
          <input
            type="text"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 text-white rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-indigo-500"
            placeholder={type === "release" ? "v1.0.0" : type === "beta" ? "v1.0.0b" : "nightly-build"}
            required
            autoFocus
          />
          <p className="text-gray-500 text-xs mt-1">{VERSION_HINTS[type]}</p>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full bg-gray-800 border border-gray-700 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 resize-none"
            placeholder="Optional release notes..."
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
          >
            {loading ? "Creating..." : "Create Version"}
          </button>
          <Link
            href={`/admin/projects/${id}`}
            className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded text-sm font-medium transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
