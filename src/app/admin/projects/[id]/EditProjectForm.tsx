"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MarkdownEditor from "@/components/MarkdownEditor";

interface Props {
  id: string;
  initialName: string;
  initialDescription: string | null;
}

export default function EditProjectForm({ id, initialName, initialDescription }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to update"); return; }
      setEditing(false);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-opacity hover:opacity-70"
        style={{ background: "var(--bg)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
        편집
      </button>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-5 mt-4" style={{ border: "1px solid var(--border)" }}>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2.5 rounded-xl mb-4">{error}</div>
      )}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text)" }}>프로젝트 이름</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
            style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--brand)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text)" }}>설명</label>
          <MarkdownEditor value={description} onChange={setDescription} />
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: "var(--brand)" }}
        >
          {loading ? "저장 중..." : "저장"}
        </button>
        <button
          onClick={() => { setEditing(false); setName(initialName); setDescription(initialDescription ?? ""); setError(""); }}
          className="px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
          style={{ background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)" }}
        >
          취소
        </button>
      </div>
    </div>
  );
}
