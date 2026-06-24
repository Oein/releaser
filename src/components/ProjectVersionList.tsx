"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

interface Version {
  id: string;
  version: string;
  type: "release" | "beta" | "dev";
  description: string | null;
  created_at: string;
  tags: string[];
}

type TabType = "release" | "beta" | "dev";

const TABS: TabType[] = ["release", "beta", "dev"];

const PAGE_SIZE = 20;

const TYPE_CONFIG = {
  release: {
    label: "Release",
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
  const [activeTab, setActiveTab] = useState<TabType>("release");
  const [page, setPage] = useState(1);

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
    setPage(1);
  }

  function changeTab(tab: TabType) {
    setActiveTab(tab);
    setPage(1);
  }

  const filtered = useMemo(
    () =>
      selectedTags.length === 0
        ? versions
        : versions.filter((v) => selectedTags.every((t) => v.tags.includes(t))),
    [versions, selectedTags]
  );

  const counts = useMemo(
    () => ({
      release: filtered.filter((v) => v.type === "release").length,
      beta: filtered.filter((v) => v.type === "beta").length,
      dev: filtered.filter((v) => v.type === "dev").length,
    }),
    [filtered]
  );

  const tabVersions = useMemo(
    () => filtered.filter((v) => v.type === activeTab),
    [filtered, activeTab]
  );

  const totalPages = Math.max(1, Math.ceil(tabVersions.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageVersions = tabVersions.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

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
              onClick={() => {
                setSelectedTags([]);
                setPage(1);
              }}
              className="text-xs px-2 py-1 rounded-full transition-opacity hover:opacity-70"
              style={{ color: "var(--text-muted)" }}
            >
              Clear
            </button>
          )}
        </div>
      )}

      <div className="flex items-center gap-1 mb-5 p-1 rounded-xl w-fit" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        {TABS.map((tab) => {
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => changeTab(tab)}
              className="text-sm font-medium px-4 py-1.5 rounded-lg transition-all flex items-center gap-2"
              style={
                active
                  ? { background: "#fff", color: "var(--text)", boxShadow: "0 1px 2px rgba(0,0,0,0.08)" }
                  : { background: "transparent", color: "var(--text-muted)" }
              }
            >
              {TYPE_CONFIG[tab].label}
              <span
                className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
                style={{
                  background: active ? "var(--bg)" : "transparent",
                  color: "var(--text-muted)",
                }}
              >
                {counts[tab]}
              </span>
            </button>
          );
        })}
      </div>

      {pageVersions.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center" style={{ border: "1px solid var(--border)" }}>
          <p className="font-medium" style={{ color: "var(--text-muted)" }}>
            {versions.length === 0
              ? "No versions available yet."
              : selectedTags.length > 0
              ? `No ${TYPE_CONFIG[activeTab].label} versions match the selected tags.`
              : `No ${TYPE_CONFIG[activeTab].label} versions yet.`}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {pageVersions.map((v) => {
            const cfg = TYPE_CONFIG[v.type];
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
                    {v.type}
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
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="text-sm px-3 py-1.5 rounded-lg border transition-all disabled:opacity-40 disabled:cursor-not-allowed enabled:hover:bg-white"
            style={{ background: "var(--bg)", color: "var(--text-muted)", borderColor: "var(--border)" }}
          >
            Prev
          </button>
          {pageNumbers(currentPage, totalPages).map((p, i) =>
            p === "..." ? (
              <span key={`gap-${i}`} className="px-2 text-sm" style={{ color: "var(--text-muted)" }}>
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => setPage(p)}
                className="text-sm font-medium w-9 h-9 rounded-lg border transition-all"
                style={
                  p === currentPage
                    ? { background: "var(--brand)", color: "#fff", borderColor: "var(--brand)" }
                    : { background: "var(--bg)", color: "var(--text-muted)", borderColor: "var(--border)" }
                }
              >
                {p}
              </button>
            )
          )}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="text-sm px-3 py-1.5 rounded-lg border transition-all disabled:opacity-40 disabled:cursor-not-allowed enabled:hover:bg-white"
            style={{ background: "var(--bg)", color: "var(--text-muted)", borderColor: "var(--border)" }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

function pageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "...")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push("...");
  for (let p = start; p <= end; p++) pages.push(p);
  if (end < total - 1) pages.push("...");
  pages.push(total);
  return pages;
}
