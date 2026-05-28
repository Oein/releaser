"use client";

import { useState } from "react";
import Markdown from "react-markdown";

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}

export default function MarkdownEditor({ value, onChange, placeholder = "설명 (Markdown 지원)", rows = 4 }: Props) {
  const [preview, setPreview] = useState(false);

  const inputStyle = {
    background: "var(--bg)",
    border: "1px solid var(--border)",
    color: "var(--text)",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
          Markdown 지원
        </span>
        <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          {["편집", "미리보기"].map((label, i) => {
            const isActive = i === 0 ? !preview : preview;
            return (
              <button
                key={label}
                type="button"
                onClick={() => setPreview(i === 1)}
                className="px-2.5 py-1 text-xs font-medium transition-colors"
                style={{
                  background: isActive ? "var(--brand)" : "transparent",
                  color: isActive ? "white" : "var(--text-muted)",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {preview ? (
        <div
          className="w-full rounded-xl px-4 py-3 text-sm prose prose-sm max-w-none min-h-[80px]"
          style={{ ...inputStyle, minHeight: `${rows * 1.6}rem` }}
        >
          {value ? (
            <Markdown>{value}</Markdown>
          ) : (
            <span style={{ color: "var(--text-muted)" }}>미리보기할 내용이 없습니다</span>
          )}
        </div>
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          className="w-full rounded-xl px-4 py-2.5 text-sm outline-none resize-none"
          style={inputStyle}
          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--brand)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}
