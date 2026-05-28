"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewProjectPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create project");
        return;
      }

      router.push(`/admin/projects/${data.project.id}`);
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
        <span className="text-gray-300">New Project</span>
      </nav>

      <h1 className="text-2xl font-bold text-white mb-6">New Project</h1>

      <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-4">
        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-300 text-sm px-3 py-2 rounded">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm text-gray-400 mb-1">Project Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
            placeholder="my-app"
            required
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full bg-gray-800 border border-gray-700 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 resize-none"
            placeholder="Optional project description..."
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
          >
            {loading ? "Creating..." : "Create Project"}
          </button>
          <Link
            href="/admin/projects"
            className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded text-sm font-medium transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
