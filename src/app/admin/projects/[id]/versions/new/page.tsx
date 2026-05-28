"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const VERSION_HINTS: Record<string, string> = {
  release: "e.g., v1.0.0, v2.3.4 — must match v{Major}.{Minor}.{Patch}",
  beta: "e.g., v1.0.9b, v2.0.3b, v3.5.16.88b",
  dev: "any non-empty string, e.g., nightly-2025-01-15",
};

const TYPE_COLORS: Record<string, { bg: string; text: string; activeBg: string; activeText: string }> = {
  release: { bg: "#f0fdf4", text: "#15803d", activeBg: "#dcfce7", activeText: "#15803d" },
  beta:    { bg: "#fefce8", text: "#a16207", activeBg: "#fef9c3", activeText: "#a16207" },
  dev:     { bg: "#eff6ff", text: "#1d4ed8", activeBg: "#dbeafe", activeText: "#1d4ed8" },
};

export default function NewVersionPage({ params }: { params: Promise<{ id: string }> }) {
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
      if (!res.ok) { setError(data.error || "Failed to create version"); return; }
      router.push(`/admin/projects/${id}/versions/${encodeURIComponent(data.version.version)}`);
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
        <Link href={`/admin/projects/${id}`} className="hover:underline" style={{ color: "var(--text-muted)" }}>Project</Link>
        <span>/</span>
        <span style={{ color: "var(--text)" }}>New Version</span>
      </nav>

      <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--text)" }}>New Version</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl p-6 space-y-5"
        style={{ border: "1px solid var(--border)" }}
      >
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "var(--text)" }}>Version Type *</label>
          <div className="flex gap-2">
            {(["release", "beta", "dev"] as const).map((t) => {
              const colors = TYPE_COLORS[t];
              const isActive = type === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    background: isActive ? colors.activeBg : colors.bg,
                    color: isActive ? colors.activeText : colors.text,
                    border: isActive ? `2px solid ${colors.activeText}30` : `1px solid transparent`,
                  }}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text)" }}>Version String *</label>
          <input
            type="text"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            className="w-full rounded-xl px-4 py-2.5 text-sm font-mono outline-none"
            style={inputStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--brand)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            placeholder={type === "release" ? "v1.0.0" : type === "beta" ? "v1.0.0b" : "nightly-build"}
            required
            autoFocus
          />
          <p className="text-xs mt-1.5" style={{ color: "var(--text-muted)" }}>{VERSION_HINTS[type]}</p>
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
            placeholder="Optional release notes..."
          />
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: "var(--brand)" }}
          >
            {loading ? "Creating..." : "Create Version"}
          </button>
          <Link
            href={`/admin/projects/${id}`}
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
