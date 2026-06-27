"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Drawer from "@/components/Drawer";
import MarkdownEditor from "@/components/MarkdownEditor";

type Visibility = "public" | "url-only" | "private";

interface Props {
  id: string;
  initialName: string;
  initialSummary: string | null;
  initialDescription: string | null;
  initialTags: string[];
  initialAlias: string | null;
  initialVisibility: Visibility;
  hasIcon: boolean;
}

export default function EditProjectForm({ id, initialName, initialSummary, initialDescription, initialTags, initialAlias, initialVisibility, hasIcon }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initialName);
  const [summary, setSummary] = useState(initialSummary ?? "");
  const [description, setDescription] = useState(initialDescription ?? "");
  const [alias, setAlias] = useState(initialAlias ?? "");
  const [visibility, setVisibility] = useState<Visibility>(initialVisibility);
  const [tags, setTags] = useState<string[]>(initialTags);
  const [tagInput, setTagInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconCacheBust, setIconCacheBust] = useState(0);
  const [currentHasIcon, setCurrentHasIcon] = useState(hasIcon);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleOpen() {
    setName(initialName);
    setSummary(initialSummary ?? "");
    setDescription(initialDescription ?? "");
    setAlias(initialAlias ?? "");
    setVisibility(initialVisibility);
    setTags(initialTags);
    setTagInput("");
    setError("");
    setIconPreview(null);
    setIconFile(null);
    setOpen(true);
  }

  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t].sort());
    setTagInput("");
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  function handleClose() {
    setOpen(false);
    setError("");
    setIconPreview(null);
    setIconFile(null);
  }

  function handleIconChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIconFile(file);
    const url = URL.createObjectURL(file);
    setIconPreview(url);
  }

  async function handleRemoveIcon() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/projects/${id}/icon`, { method: "DELETE" });
      if (!res.ok) { setError("아이콘 삭제 실패"); return; }
      setCurrentHasIcon(false);
      setIconPreview(null);
      setIconFile(null);
      setIconCacheBust((n) => n + 1);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setError("");
    setLoading(true);
    try {
      // Save name/description
      const res = await fetch(`/api/admin/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, summary, description, tags, alias, visibility }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to update"); return; }

      // Upload icon if selected
      if (iconFile) {
        const form = new FormData();
        form.append("icon", iconFile);
        const iconRes = await fetch(`/api/admin/projects/${id}/icon`, { method: "POST", body: form });
        if (!iconRes.ok) {
          const iconData = await iconRes.json();
          setError(iconData.error || "아이콘 업로드 실패");
          return;
        }
        setCurrentHasIcon(true);
        setIconCacheBust((n) => n + 1);
      }

      setOpen(false);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  const displayIcon = iconPreview ?? (currentHasIcon ? `/api/projects/${id}/icon?v=${iconCacheBust}` : null);

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

      <Drawer open={open} onClose={handleClose} title="프로젝트 편집">
        <div className="space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2.5 rounded-xl">{error}</div>
          )}

          {/* Icon */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--text)" }}>아이콘</label>
            <div className="flex items-center gap-3">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden"
                style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
              >
                {displayIcon ? (
                  <img src={displayIcon} alt="icon" className="w-full h-full object-cover rounded-2xl" style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08)" }} />
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-muted)" }}>
                    <rect x="3" y="3" width="18" height="18" rx="4"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <path d="M21 15l-5-5L5 21"/>
                  </svg>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium transition-opacity hover:opacity-70"
                  style={{ cursor: "pointer", background: "var(--bg)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
                >
                  {displayIcon ? "변경" : "업로드"}
                </button>
                {(currentHasIcon || iconPreview) && (
                  <button
                    type="button"
                    onClick={() => {
                      if (iconPreview) {
                        setIconPreview(null);
                        setIconFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      } else {
                        handleRemoveIcon();
                      }
                    }}
                    disabled={loading}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium transition-opacity hover:opacity-70 disabled:opacity-50"
                    style={{ cursor: "pointer", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}
                  >
                    삭제
                  </button>
                )}
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
              className="hidden"
              onChange={handleIconChange}
            />
            <p className="text-xs mt-1.5" style={{ color: "var(--text-muted)" }}>PNG, JPG, WebP, SVG, GIF · 최대 2MB</p>
          </div>

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
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text)" }}>한줄 설명</label>
            <input
              type="text"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="프로젝트를 한 문장으로 소개해주세요"
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
              style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--brand)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text)" }}>URL 별칭 (Alias)</label>
            <input
              type="text"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              placeholder="예: my-app (비워두면 ID로만 접근)"
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none font-mono"
              style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--brand)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            />
            <p className="text-xs mt-1.5" style={{ color: "var(--text-muted)" }}>
              소문자, 숫자, 하이픈. 설정 시 <span className="font-mono">/projects/{alias || "별칭"}</span> 으로 접근 가능합니다.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text)" }}>공개 범위</label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as Visibility)}
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
              style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--brand)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            >
              <option value="public">Public — 목록·API에 노출</option>
              <option value="url-only">URL only — 목록·API 숨김, URL로 접근 가능</option>
              <option value="private">Private — 관리자만 접근 가능</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text)" }}>본문 설명 (Markdown)</label>
            <MarkdownEditor value={description} onChange={setDescription} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text)" }}>태그</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                placeholder="태그 이름 입력 후 Enter"
                className="flex-1 rounded-xl px-3 py-2 text-sm outline-none"
                style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--brand)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
              />
              <button
                type="button"
                onClick={addTag}
                className="px-3 py-2 rounded-xl text-sm font-medium transition-opacity hover:opacity-70"
                style={{ cursor: "pointer", background: "var(--brand)", color: "#fff" }}
              >
                추가
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                    style={{ background: "#f0f9ff", color: "#0369a1", border: "1px solid #bae6fd" }}
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-0.5 hover:opacity-60 transition-opacity"
                      style={{ cursor: "pointer", lineHeight: 1 }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            {tags.length === 0 && (
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>태그가 없습니다. 버전별로 이 태그들을 달 수 있습니다.</p>
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
