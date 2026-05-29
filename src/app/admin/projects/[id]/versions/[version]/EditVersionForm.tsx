"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Drawer from "@/components/Drawer";
import MarkdownEditor from "@/components/MarkdownEditor";

interface Props {
  projectId: string;
  version: string;
  initialDescription: string | null;
  projectTags: string[];
  initialTags: string[];
  onSaved?: (tags: string[]) => void;
}

export default function EditVersionForm({ projectId, version, initialDescription, projectTags, initialTags, onSaved }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState(initialDescription ?? "");
  const [selectedTags, setSelectedTags] = useState<string[]>(initialTags);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // props가 바뀌면 (onSaved 후 parent가 tags를 업데이트) 동기화
  useEffect(() => {
    if (!open) setSelectedTags(initialTags);
  }, [initialTags, open]);

  function handleOpen() {
    setDescription(initialDescription ?? "");
    setSelectedTags(initialTags);
    setError("");
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
    setError("");
  }

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  async function handleSave() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/projects/${projectId}/versions/${encodeURIComponent(version)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ description, tags: selectedTags }),
        }
      );
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to update"); return; }
      setOpen(false);
      onSaved?.(data.version?.tags ?? selectedTags);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-opacity hover:opacity-70"
        style={{ cursor: "pointer", background: "var(--bg)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
        편집
      </button>

      <Drawer open={open} onClose={handleClose} title={`${version} 편집`}>
        <div className="space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2.5 rounded-xl">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text)" }}>설명</label>
            <MarkdownEditor value={description} onChange={setDescription} rows={8} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--text)" }}>태그</label>
            {projectTags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {projectTags.map((tag) => {
                  const active = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                      style={{
                        cursor: "pointer",
                        background: active ? "#0369a1" : "#f0f9ff",
                        color: active ? "#fff" : "#0369a1",
                        border: `1px solid ${active ? "#0369a1" : "#bae6fd"}`,
                      }}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs px-1" style={{ color: "var(--text-muted)" }}>
                이 프로젝트에 태그가 없습니다. 프로젝트 편집에서 태그를 먼저 추가하세요.
              </p>
            )}
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ cursor: "pointer", background: "var(--brand)" }}
            >
              {loading ? "저장 중..." : "저장"}
            </button>
            <button
              onClick={handleClose}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              style={{ cursor: "pointer", background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)" }}
            >
              취소
            </button>
          </div>
        </div>
      </Drawer>
    </>
  );
}
