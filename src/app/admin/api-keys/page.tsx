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
      if (res.ok) {
        const data = await res.json();
        setKeys(data.apiKeys);
      }
    } finally {
      setLoadingKeys(false);
    }
  }

  useEffect(() => {
    loadKeys();
  }, []);

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
      if (!res.ok) {
        setError(data.error || "Failed to create API key");
        return;
      }

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
    if (!confirm(`Delete API key "${keyName}"? This cannot be undone.`)) return;

    const res = await fetch(`/api/admin/api-keys/${id}`, { method: "DELETE" });
    if (res.ok) {
      setKeys((prev) => prev.filter((k) => k.id !== id));
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">API Keys</h1>

      {/* Create new key */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Create New API Key</h2>

        {newKey && (
          <div className="bg-green-900/20 border border-green-700 rounded-lg p-4 mb-4">
            <p className="text-green-300 text-sm font-medium mb-2">
              API key created — copy it now, it won&apos;t be shown again!
            </p>
            <code className="text-green-200 font-mono text-sm bg-green-900/30 px-3 py-2 rounded block break-all">
              {newKey}
            </code>
            <button
              onClick={() => navigator.clipboard.writeText(newKey)}
              className="mt-2 text-xs text-green-400 hover:text-green-300 transition-colors"
            >
              Copy to clipboard
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-300 text-sm px-3 py-2 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleCreate} className="flex gap-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 bg-gray-800 border border-gray-700 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
            placeholder="Key name (e.g., CI/CD Pipeline)"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded text-sm font-medium whitespace-nowrap transition-colors"
          >
            {loading ? "Creating..." : "Create Key"}
          </button>
        </form>
      </div>

      {/* Keys list */}
      <h2 className="text-lg font-semibold text-white mb-3">Existing Keys</h2>

      {loadingKeys ? (
        <div className="text-gray-400 text-sm">Loading...</div>
      ) : keys.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 text-center">
          <p className="text-gray-400">No API keys yet.</p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left text-xs text-gray-500 uppercase px-4 py-3">Name</th>
                <th className="text-left text-xs text-gray-500 uppercase px-4 py-3">Key Prefix</th>
                <th className="text-left text-xs text-gray-500 uppercase px-4 py-3">Created</th>
                <th className="text-right text-xs text-gray-500 uppercase px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((key) => (
                <tr key={key.id} className="border-b border-gray-800 last:border-0 hover:bg-gray-800/50">
                  <td className="px-4 py-3 text-white text-sm">{key.name}</td>
                  <td className="px-4 py-3 text-gray-400 font-mono text-sm">{key.key_prefix}...</td>
                  <td className="px-4 py-3 text-gray-500 text-sm">
                    {new Date(key.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(key.id, key.name)}
                      className="text-red-400 hover:text-red-300 text-sm transition-colors"
                    >
                      Delete
                    </button>
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
