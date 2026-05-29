"use client";

import { useState } from "react";
import Link from "next/link";
import DeleteVersionButton from "./DeleteVersionButton";

interface Version {
  id: string;
  version: string;
  type: string;
  description: string | null;
  created_at: string;
  file_count: number;
  tags: string[];
}

interface Props {
  projectId: string;
  projectTags: string[];
  initialVersions: Version[];
}

const TYPE_BADGE: Record<string, { background: string; color: string }> = {
  release: { background: "#dcfce7", color: "#15803d" },
  beta:    { background: "#fef9c3", color: "#a16207" },
  dev:     { background: "#dbeafe", color: "#1d4ed8" },
};

export default function VersionList({ projectId, projectTags, initialVersions }: Props) {
  const [versions, setVersions] = useState<Version[]>(initialVersions);
  const [savingVersionId, setSavingVersionId] = useState<string | null>(null);

  async function toggleTag(v: Version, tag: string) {
    const newTags = v.tags.includes(tag)
      ? v.tags.filter((t) => t !== tag)
      : [...v.tags, tag];

    setSavingVersionId(v.id);
    try {
      const res = await fetch(
        `/api/admin/projects/${projectId}/versions/${encodeURIComponent(v.version)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tags: newTags }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        setVersions((prev) =>
          prev.map((ver) => (ver.id === v.id ? { ...ver, tags: data.version?.tags ?? newTags } : ver))
        );
      }
    } finally {
      setSavingVersionId(null);
    }
  }

  if (versions.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center" style={{ border: "1px solid var(--border)" }}>
        <p className="font-medium mb-1" style={{ color: "var(--text)" }}>No versions yet</p>
        <Link href={`/admin/projects/${projectId}/versions/new`} className="text-sm" style={{ color: "var(--brand-dark)" }}>
          Create first version →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {versions.map((v) => {
        const badge = TYPE_BADGE[v.type] ?? { background: "#f4f4f5", color: "#71717a" };
        const saving = savingVersionId === v.id;
        return (
          <div
            key={v.id}
            className="bg-white rounded-2xl px-5 py-4"
            style={{ border: "1px solid var(--border)" }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0" style={badge}>
                  {v.type}
                </span>
                <span className="font-mono font-semibold text-sm shrink-0" style={{ color: "var(--text)" }}>{v.version}</span>
                {v.description && (
                  <span className="text-sm hidden lg:block truncate" style={{ color: "var(--text-muted)" }}>— {v.description.split("\n")[0].trim()}</span>
                )}
              </div>
              <div className="flex items-center gap-5 shrink-0 ml-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{v.file_count}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>files</p>
                </div>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {new Date(v.created_at).toLocaleDateString()}
                </span>
                <Link
                  href={`/admin/projects/${projectId}/versions/${encodeURIComponent(v.version)}`}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80"
                  style={{ background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)" }}
                >
                  Manage
                </Link>
                <DeleteVersionButton projectId={projectId} version={v.version} />
              </div>
            </div>

            {projectTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                {projectTags.map((tag) => {
                  const active = v.tags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      disabled={saving}
                      onClick={() => toggleTag(v, tag)}
                      className="px-2.5 py-1 rounded-full text-xs font-medium transition-all disabled:opacity-40"
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
                {saving && (
                  <span className="text-xs self-center" style={{ color: "var(--text-muted)" }}>저장 중...</span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
