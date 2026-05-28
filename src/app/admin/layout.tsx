import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import Link from "next/link";
import LogoutButton from "./LogoutButton";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session.isAdmin) redirect("/login");

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg)" }}>
      <style>{`
        .admin-nav-link {
          display: flex;
          align-items: center;
          padding: 10px 12px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 500;
          color: var(--text-muted);
          transition: background 0.15s, color 0.15s;
          text-decoration: none;
        }
        .admin-nav-link:hover {
          background: var(--bg);
          color: var(--text);
        }
      `}</style>

      <aside
        className="w-56 shrink-0 flex flex-col"
        style={{ background: "var(--surface)", borderRight: "1px solid var(--border)" }}
      >
        <div className="p-5" style={{ borderBottom: "1px solid var(--border)" }}>
          <Link href="/admin" className="flex items-center gap-2">
            <span className="text-xl font-black" style={{ color: "var(--brand)" }}>◆</span>
            <span className="font-bold text-base" style={{ color: "var(--text)" }}>Releaser</span>
          </Link>
          <p className="text-xs mt-1 font-medium" style={{ color: "var(--text-muted)" }}>Admin Panel</p>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          <Link href="/admin" className="admin-nav-link">Dashboard</Link>
          <Link href="/admin/projects" className="admin-nav-link">Projects</Link>
          <Link href="/admin/api-keys" className="admin-nav-link">API Keys</Link>
          <Link href="/admin/docs" className="admin-nav-link">API Docs</Link>
        </nav>

        <div className="p-3 space-y-0.5" style={{ borderTop: "1px solid var(--border)" }}>
          <Link href="/" className="admin-nav-link">View Site</Link>
          <LogoutButton />
        </div>
      </aside>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
