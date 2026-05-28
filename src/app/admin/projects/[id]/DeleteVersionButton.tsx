"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteVersionButton({ projectId, version }: { projectId: string; version: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm(`"${version}" 버전을 삭제하시겠습니까?\n업로드된 파일이 함께 삭제됩니다.`)) return;
    setLoading(true);
    const res = await fetch(
      `/api/admin/projects/${projectId}/versions/${encodeURIComponent(version)}`,
      { method: "DELETE" }
    );
    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json();
      alert(data.error || "삭제 실패");
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80 disabled:opacity-50"
      style={{ cursor: "pointer", background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca" }}
    >
      {loading ? "..." : "삭제"}
    </button>
  );
}
