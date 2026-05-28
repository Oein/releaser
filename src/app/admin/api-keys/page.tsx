"use client";

import { useState, useEffect } from "react";

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  created_at: string;
}

export default function AdminApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [name, setName] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingKeys, setLoadingKeys] = useState(true);

  async function loadKeys() {
    try {
      const res = await fetch("/api/admin/api-keys");
      if (res.ok) setKeys((await res.json()).apiKeys);
    } finally {
      setLoadingKeys(false);
    }
  }

  useEffect(() => { loadKeys(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNewKey(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to create API key"); return; }
      setNewKey(data.apiKey.key);
      setName("");
      await loadKeys();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, keyName: string) {
    if (!confirm(`Delete API key "${keyName}"?`)) return;
    const res = await fetch(`/api/admin/api-keys/${id}`, { method: "DELETE" });
    if (res.ok) setKeys((prev) => prev.filter((k) => k.id !== id));
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text)" }}>API Keys</h1>
      <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>Manage programmatic access to the admin API</p>

      {/* Create */}
      <div className="bg-white rounded-2xl p-6 mb-6" style={{ border: "1px solid var(--border)" }}>
        <h2 className="text-base font-semibold mb-4" style={{ color: "var(--text)" }}>Create New API Key</h2>

        {newKey && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
            <p className="text-sm font-semibold text-green-700 mb-2">
              Copy this key now — it won&apos;t be shown again!
            </p>
            <code className="block text-sm font-mono text-green-800 bg-green-100 px-4 py-3 rounded-xl break-all">
              {newKey}
            </code>
            <button
              onClick={() => navigator.clipboard.writeText(newKey)}
              className="mt-2 text-xs font-medium text-green-700 hover:text-green-900 transition-colors"
            >
              Copy to clipboard
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>
        )}

        <form onSubmit={handleCreate} className="flex gap-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 rounded-xl px-4 py-2.5 text-sm outline-none"
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
              color: "var(--text)",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--brand)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            placeholder="Key name (e.g., CI/CD Pipeline)"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white whitespace-nowrap transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: "var(--brand)" }}
          >
            {loading ? "Creating..." : "Create Key"}
          </button>
        </form>
      </div>

      {/* List */}
      <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
        Existing Keys ({keys.length})
      </h2>

      {loadingKeys ? (
        <div className="text-sm" style={{ color: "var(--text-muted)" }}>Loading...</div>
      ) : keys.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center" style={{ border: "1px solid var(--border)" }}>
          <p className="font-medium" style={{ color: "var(--text-muted)" }}>No API keys yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          {keys.map((key, i) => (
            <div
              key={key.id}
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: i < keys.length - 1 ? "1px solid var(--border)" : "none" }}
            >
              <div>
                <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>{key.name}</p>
                <p className="font-mono text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{key.key_prefix}...</p>
              </div>
              <div className="flex items-center gap-4 shrink-0 ml-3">
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {new Date(key.created_at).toLocaleDateString()}
                </span>
                <button
                  onClick={() => handleDelete(key.id, key.name)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80"
                  style={{ background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca" }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
