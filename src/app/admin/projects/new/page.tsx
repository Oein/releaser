"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewProjectPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [alias, setAlias] = useState("");
  const [visibility, setVisibility] = useState<"public" | "url-only" | "private">("public");
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
        body: JSON.stringify({ name, description, alias, visibility }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to create project"); return; }
      router.push(`/admin/projects/${data.project.id}`);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    background: "var(--bg)",
    border: "1px solid var(--border)",
    color: "var(--text)",
  };

  return (
    <div className="p-8 max-w-xl">
      <nav className="flex items-center gap-1.5 text-sm mb-6" style={{ color: "var(--text-muted)" }}>
        <Link href="/admin/projects" className="hover:underline" style={{ color: "var(--text-muted)" }}>Projects</Link>
        <span>/</span>
        <span style={{ color: "var(--text)" }}>New Project</span>
      </nav>

      <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--text)" }}>New Project</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl p-6 space-y-5"
        style={{ border: "1px solid var(--border)" }}
      >
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text)" }}>Project Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
            style={inputStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--brand)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            placeholder="my-app"
            required
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text)" }}>URL Alias</label>
          <input
            type="text"
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
            className="w-full rounded-xl px-4 py-2.5 text-sm outline-none font-mono"
            style={inputStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--brand)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            placeholder="my-app (optional)"
          />
          <p className="text-xs mt-1.5" style={{ color: "var(--text-muted)" }}>
            Lowercase letters, numbers, hyphens. Enables <span className="font-mono">/projects/{alias || "alias"}</span>.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text)" }}>Visibility</label>
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as "public" | "url-only" | "private")}
            className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
            style={inputStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--brand)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
          >
            <option value="public">Public — listed in site & API</option>
            <option value="url-only">URL only — hidden from lists, reachable by URL</option>
            <option value="private">Private — admin only</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text)" }}>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-xl px-4 py-2.5 text-sm outline-none resize-none"
            style={inputStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--brand)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            placeholder="Optional project description..."
          />
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: "var(--brand)" }}
          >
            {loading ? "Creating..." : "Create Project"}
          </button>
          <Link
            href="/admin/projects"
            className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            style={{ background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)" }}
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
