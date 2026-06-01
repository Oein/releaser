export default function FileIcon({ filename }: { filename: string }) {
  const ext = filename.split(".").pop()?.toLowerCase();

  if (ext === "exe" || ext === "msi") {
    return (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" style={{ color: "#0078d4" }}>
        <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.551H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801" />
      </svg>
    );
  }

  if (ext === "dmg" || ext === "pkg" || ext === "app") {
    return (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" style={{ color: "#555" }}>
        <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
      </svg>
    );
  }

  if (ext === "apk" || ext === "aab") {
    return (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" style={{ color: "#3ddc84" }}>
        <path d="M17.523 15.341a.498.498 0 01-.495.495H6.972a.498.498 0 01-.495-.495V8.66a.498.498 0 01.495-.495h10.056a.498.498 0 01.495.495v6.681zm-5.52-12.26l.98-1.7a.2.2 0 00-.347-.2l-.992 1.718a6.432 6.432 0 00-2.57 0L8.082 1.181a.2.2 0 00-.347.2l.98 1.7A6.459 6.459 0 005.14 7.17h13.72a6.459 6.459 0 00-2.857-4.089zM9 5.5a.5.5 0 110-1 .5.5 0 010 1zm6 0a.5.5 0 110-1 .5.5 0 010 1zM5.477 8.165v9.503a1 1 0 001 1h.5v2.833a1 1 0 002 0V18.67h2v2.833a1 1 0 002 0V18.67h.5a1 1 0 001-1V8.165H5.477z" />
      </svg>
    );
  }

  if (ext === "zip" || ext === "tar" || ext === "gz" || ext === "7z" || ext === "rar") {
    return (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ color: "#f59e0b" }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
        <line x1="12" y1="12" x2="12" y2="16" strokeLinecap="round" />
        <line x1="10" y1="14" x2="14" y2="14" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ color: "#71717a" }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z" />
      <polyline strokeLinecap="round" strokeLinejoin="round" points="13 2 13 9 20 9" />
    </svg>
  );
}
