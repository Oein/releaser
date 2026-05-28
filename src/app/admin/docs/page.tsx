"use client";

import dynamic from "next/dynamic";
import "swagger-ui-react/swagger-ui.css";
import { useState } from "react";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

const TABS = ["API Reference", "GitHub Actions"] as const;
type Tab = (typeof TABS)[number];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="text-xs px-2 py-1 rounded-lg transition-colors"
      style={{
        background: copied ? "#dcfce7" : "var(--bg)",
        color: copied ? "#15803d" : "var(--text-muted)",
        border: "1px solid var(--border)",
      }}
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function CodeBlock({ code, lang = "yaml" }: { code: string; lang?: string }) {
  return (
    <div className="relative rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between px-4 py-2" style={{ background: "#18181b", borderBottom: "1px solid #3f3f46" }}>
        <span className="text-xs font-mono" style={{ color: "#71717a" }}>{lang}</span>
        <CopyButton text={code} />
      </div>
      <pre className="p-4 overflow-x-auto text-sm" style={{ background: "#09090b", color: "#e4e4e7", margin: 0 }}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

const DISPATCH_BASIC = `name: Manual Release

on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Version string (e.g. v1.2.3)'
        required: true
        type: string
      type:
        description: 'Release type'
        required: true
        type: choice
        default: release
        options:
          - release
          - beta
          - dev
      description:
        description: 'Release notes'
        required: false
        type: string

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build
        run: make build

      - uses: Oein/releaser@main
        with:
          url: https://oein.fyi
          api-key: \${{ secrets.RELEASER_API_KEY }}
          project: \${{ secrets.RELEASER_PROJECT }}
          version: \${{ inputs.version }}
          type: \${{ inputs.type }}
          description: \${{ inputs.description }}
          files: |
            dist/*.zip
            dist/*.exe
            dist/*.dmg`;

const DISPATCH_WITH_TAG = `name: Release on Tag

on:
  push:
    tags: ['v*']
  workflow_dispatch:
    inputs:
      version:
        description: 'Version (leave empty to use git tag)'
        required: false
        type: string
      type:
        description: 'Release type'
        required: true
        type: choice
        default: release
        options: [release, beta, dev]

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Resolve version
        id: ver
        run: |
          VERSION="\${{ inputs.version }}"
          if [ -z "$VERSION" ]; then
            VERSION="\${{ github.ref_name }}"
          fi
          echo "value=$VERSION" >> $GITHUB_OUTPUT

      - name: Build
        run: make build

      - uses: Oein/releaser@main
        with:
          url: https://oein.fyi
          api-key: \${{ secrets.RELEASER_API_KEY }}
          project: \${{ secrets.RELEASER_PROJECT }}
          version: \${{ steps.ver.outputs.value }}
          type: \${{ inputs.type || 'release' }}
          files: dist/**`;

const FULL_EXAMPLE = `name: Release

on:
  push:
    tags: ['v*']

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build
        run: |
          # your build steps here
          make build

      - name: Upload to Releaser
        uses: Oein/releaser@main
        with:
          url: https://oein.fyi
          api-key: \${{ secrets.RELEASER_API_KEY }}
          project: \${{ secrets.RELEASER_PROJECT }}
          version: \${{ github.ref_name }}
          type: release
          description: "Released from GitHub Actions"
          files: |
            dist/app-linux
            dist/app-win.exe
            dist/*.zip`;

const INPUTS_TABLE = [
  { name: "url", required: true, default: "", description: "Releaser 인스턴스 base URL (e.g. https://oein.fyi)" },
  { name: "api-key", required: true, default: "", description: "Admin API 키 — /admin/api-keys에서 발급" },
  { name: "project", required: true, default: "", description: "프로젝트 ID" },
  { name: "version", required: true, default: "", description: "버전 문자열 (e.g. v1.2.3, v1.0.0b, nightly)" },
  { name: "type", required: false, default: "release", description: "버전 타입 — release | beta | dev" },
  { name: "description", required: false, default: '""', description: "릴리즈 노트 / 버전 설명" },
  { name: "files", required: false, default: '""', description: "업로드할 파일 경로 (줄바꿈으로 구분, glob 지원)" },
];

function GithubActionsTab() {
  return (
    <div className="max-w-3xl mx-auto p-8 space-y-10">

      {/* Quick start */}
      <section>
        <h2 className="text-xl font-bold mb-1" style={{ color: "var(--text)" }}>GitHub Actions</h2>
        <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>
          <code className="font-mono px-1.5 py-0.5 rounded" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>Oein/releaser@main</code>를 사용해 다른 레포의 워크플로우에서 바로 버전을 만들고 파일을 올릴 수 있습니다.
        </p>
        <CodeBlock code={FULL_EXAMPLE} />
      </section>

      {/* Inputs */}
      <section>
        <h2 className="text-lg font-bold mb-4" style={{ color: "var(--text)" }}>Inputs</h2>
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)" }}>
                {["Input", "필수", "기본값", "설명"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white">
              {INPUTS_TABLE.map((row, i) => (
                <tr key={row.name} style={{ borderBottom: i < INPUTS_TABLE.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <td className="px-4 py-3 font-mono font-medium text-xs" style={{ color: "var(--text)" }}>{row.name}</td>
                  <td className="px-4 py-3">
                    {row.required
                      ? <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "#dcfce7", color: "#15803d" }}>required</span>
                      : <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "var(--bg)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>optional</span>
                    }
                  </td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--text-muted)" }}>{row.default || "—"}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: "var(--text-muted)" }}>{row.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Outputs */}
      <section>
        <h2 className="text-lg font-bold mb-4" style={{ color: "var(--text)" }}>Output</h2>
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)" }}>
                {["Output", "설명"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white">
              <tr>
                <td className="px-4 py-3 font-mono font-medium text-xs" style={{ color: "var(--text)" }}>version-id</td>
                <td className="px-4 py-3 text-sm" style={{ color: "var(--text-muted)" }}>생성된 버전의 ID</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Setup */}
      <section>
        <h2 className="text-lg font-bold mb-4" style={{ color: "var(--text)" }}>사전 준비</h2>
        <div className="space-y-4">
          <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid var(--border)" }}>
            <p className="font-semibold text-sm mb-3" style={{ color: "var(--text)" }}>1. API 키 발급</p>
            <p className="text-sm mb-3" style={{ color: "var(--text-muted)" }}>
              <a href="/admin/api-keys" className="underline underline-offset-2" style={{ color: "var(--brand-dark)" }}>/admin/api-keys</a>에서 API 키를 만드세요. 키는 생성 시에만 전체 값이 표시됩니다.
            </p>
          </div>
          <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid var(--border)" }}>
            <p className="font-semibold text-sm mb-3" style={{ color: "var(--text)" }}>2. 사용할 레포에 Secrets 등록</p>
            <p className="text-sm mb-3" style={{ color: "var(--text-muted)" }}>레포 Settings → Secrets and variables → Actions에서 추가:</p>
            <div className="space-y-2">
              {[
                { name: "RELEASER_API_KEY", desc: "발급한 API 키 전체 값" },
                { name: "RELEASER_PROJECT", desc: "프로젝트 ID (admin URL에서 확인)" },
              ].map((s) => (
                <div key={s.name} className="flex items-center gap-3 px-4 py-2 rounded-xl text-sm" style={{ background: "var(--bg)" }}>
                  <code className="font-mono font-semibold text-xs" style={{ color: "var(--text)" }}>{s.name}</code>
                  <span style={{ color: "var(--text-muted)" }}>—</span>
                  <span style={{ color: "var(--text-muted)" }}>{s.desc}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid var(--border)" }}>
            <p className="font-semibold text-sm mb-3" style={{ color: "var(--text)" }}>3. 워크플로우에 추가</p>
            <CodeBlock lang="yaml" code={`- uses: Oein/releaser@main\n  with:\n    url: https://oein.fyi\n    api-key: \${{ secrets.RELEASER_API_KEY }}\n    project: \${{ secrets.RELEASER_PROJECT }}\n    version: \${{ github.ref_name }}\n    type: release\n    files: |\n      dist/**`} />
          </div>
        </div>
      </section>

      {/* workflow_dispatch */}
      <section>
        <h2 className="text-lg font-bold mb-1" style={{ color: "var(--text)" }}>workflow_dispatch — 수동 트리거</h2>
        <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>
          GitHub Actions UI에서 버전, 타입, 설명을 직접 입력해 수동으로 배포할 수 있습니다.
          <code className="font-mono px-1.5 py-0.5 rounded mx-1" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>type: choice</code>
          를 사용하면 드롭다운으로 release / beta / dev를 선택할 수 있습니다.
        </p>

        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold mb-2" style={{ color: "var(--text)" }}>기본 — 수동 입력만</p>
            <CodeBlock code={DISPATCH_BASIC} />
          </div>

          <div>
            <p className="text-sm font-semibold mb-2" style={{ color: "var(--text)" }}>태그 push + 수동 트리거 병행</p>
            <p className="text-sm mb-2" style={{ color: "var(--text-muted)" }}>
              태그를 push하면 자동으로, 필요할 때는 GitHub UI에서 수동으로도 실행할 수 있습니다.
              수동 실행 시 version을 비워두면 현재 git 태그를 그대로 사용합니다.
            </p>
            <CodeBlock code={DISPATCH_WITH_TAG} />
          </div>
        </div>

        <div className="mt-4 rounded-xl p-4 text-sm" style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}>
          <p className="font-semibold mb-2" style={{ color: "#1d4ed8" }}>수동 실행 방법</p>
          <ol className="space-y-1 list-decimal list-inside" style={{ color: "#1e40af" }}>
            <li>레포 → <strong>Actions</strong> 탭</li>
            <li>워크플로우 선택 → <strong>Run workflow</strong> 버튼</li>
            <li>입력값 채우고 <strong>Run workflow</strong> 클릭</li>
          </ol>
        </div>
      </section>

      {/* Version naming */}
      <section>
        <h2 className="text-lg font-bold mb-4" style={{ color: "var(--text)" }}>버전 네이밍 규칙</h2>
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)" }}>
                {["type", "형식", "예시"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white">
              {[
                { type: "release", badge: { background: "#dcfce7", color: "#15803d" }, format: "vX.X.X", example: "v1.0.0, v2.3.4" },
                { type: "beta",    badge: { background: "#fef9c3", color: "#a16207" }, format: "vX.X.X[.X]b", example: "v1.0.9b, v3.5.16.88b" },
                { type: "dev",     badge: { background: "#dbeafe", color: "#1d4ed8" }, format: "임의 문자열", example: "nightly-2025-01-15, feature-xyz" },
              ].map((row, i, arr) => (
                <tr key={row.type} style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={row.badge}>{row.type}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--text)" }}>{row.format}</td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--text-muted)" }}>{row.example}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
}

export default function AdminDocsPage() {
  const [tab, setTab] = useState<Tab>("API Reference");

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* Tab bar */}
      <div className="bg-white sticky top-0 z-10 px-6" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-1 h-14">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
              style={{
                background: tab === t ? "var(--bg)" : "transparent",
                color: tab === t ? "var(--text)" : "var(--text-muted)",
                border: tab === t ? "1px solid var(--border)" : "1px solid transparent",
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {tab === "API Reference" && (
        <div className="bg-white">
          <SwaggerUI url="/api/admin/openapi.json" />
        </div>
      )}
      {tab === "GitHub Actions" && <GithubActionsTab />}
    </div>
  );
}
