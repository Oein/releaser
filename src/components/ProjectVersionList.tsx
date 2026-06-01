"use client";

import { useState } from "react";
import Link from "next/link";

interface Version {
  id: string;
  version: string;
  type: "release" | "beta" | "dev";
  description: string | null;
  created_at: string;
  tags: string[];
}

const TYPE_CONFIG = {
  release: {
    label: "Releases",
    badge: { background: "#dcfce7", color: "#15803d", border: "#bbf7d0" },
  },
  beta: {
    label: "Beta",
    badge: { background: "#fef9c3", color: "#a16207", border: "#fde68a" },
  },
  dev: {
    label: "Dev",
    badge: { background: "#dbeafe", color: "#1d4ed8", border: "#bfdbfe" },
  },
};

function firstLine(s: string | null): string | null {
  if (!s) return null;
  return s.split("\n")[0].trim() || null;
}

export function ProjectVersionList({
  versions,
  projectId,
  availableTags,
}: {
  versions: Version[];
  projectId: string;
  availableTags: string[];
}) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  const filtered =
    selectedTags.length === 0
      ? versions
      : versions.filter((v) => selectedTags.every((t) => v.tags.includes(t)));

  const grouped = {
    release: filtered.filter((v) => v.type === "release"),
    beta: filtered.filter((v) => v.type === "beta"),
    dev: filtered.filter((v) => v.type === "dev"),
  };

  const isEmpty = filtered.length === 0;

  return (
    <div>
      {availableTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Filter by tag
          </span>
          {availableTags.map((tag) => {
            const active = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className="text-xs font-medium px-3 py-1 rounded-full border transition-all"
                style={
                  active
                    ? { background: "var(--brand)", color: "#fff", borderColor: "var(--brand)" }
                    : { background: "var(--bg)", color: "var(--text-muted)", borderColor: "var(--border)" }
                }
              >
                {tag}
              </button>
            );
          })}
          {selectedTags.length > 0 && (
            <button
              onClick={() => setSelectedTags([])}
              className="text-xs px-2 py-1 rounded-full transition-opacity hover:opacity-70"
              style={{ color: "var(--text-muted)" }}
            >
              Clear
            </button>
          )}
        </div>
      )}

      {isEmpty ? (
        <div className="bg-white rounded-2xl p-12 text-center" style={{ border: "1px solid var(--border)" }}>
          <p className="font-medium" style={{ color: "var(--text-muted)" }}>
            {versions.length === 0 ? "No versions available yet." : "No versions match the selected tags."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {(["release", "beta", "dev"] as const).map((type) => {
            const group = grouped[type];
            if (group.length === 0) return null;
            const cfg = TYPE_CONFIG[type];

            return (
              <section key={type}>
                <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
                  {cfg.label}
                </h2>
                <div className="space-y-2">
                  {group.map((v) => {
                    const line = firstLine(v.description);
                    return (
                      <Link
                        key={v.id}
                        href={`/projects/${projectId}/versions/${encodeURIComponent(v.version)}`}
                        className="bg-white rounded-2xl px-5 py-4 flex items-center justify-between transition-shadow hover:shadow-md"
                        style={{ border: "1px solid var(--border)" }}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-wrap">
                          <span
                            className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
                            style={cfg.badge}
                          >
                            {type}
                          </span>
                          <span className="font-mono font-semibold text-sm shrink-0" style={{ color: "var(--text)" }}>
                            {v.version}
                          </span>
                          {v.tags.length > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {v.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="text-xs px-2 py-0.5 rounded-full border"
                                  style={{ background: "var(--bg)", color: "var(--text-muted)", borderColor: "var(--border)" }}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                          {line && (
                            <span className="text-sm hidden sm:block truncate" style={{ color: "var(--text-muted)" }}>
                              — {line}
                            </span>
                          )}
                        </div>
                        <span className="text-xs shrink-0 ml-3" style={{ color: "var(--text-muted)" }}>
                          {new Date(v.created_at).toLocaleDateString()}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
