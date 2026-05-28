import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import Link from "next/link";
import LogoutButton from "./LogoutButton";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session.isAdmin) redirect("/login");

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg)" }}>
      {/* Sidebar */}
      <aside
        className="w-56 shrink-0 flex flex-col"
        style={{
          background: "var(--surface)",
          borderRight: "1px solid var(--border)",
        }}
      >
        <div className="p-5" style={{ borderBottom: "1px solid var(--border)" }}>
          <Link href="/admin" className="flex items-center gap-2">
            <span className="text-xl font-black" style={{ color: "var(--brand)" }}>◆</span>
            <span className="font-bold text-base" style={{ color: "var(--text)" }}>Releaser</span>
          </Link>
          <p className="text-xs mt-1 font-medium" style={{ color: "var(--text-muted)" }}>Admin Panel</p>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {[
            { href: "/admin", label: "Dashboard" },
            { href: "/admin/projects", label: "Projects" },
            { href: "/admin/api-keys", label: "API Keys" },
            { href: "/admin/docs", label: "API Docs" },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
              style={{ color: "var(--text-muted)" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "var(--bg)";
                (e.currentTarget as HTMLElement).style.color = "var(--text)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "transparent";
                (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
              }}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="p-3 space-y-0.5" style={{ borderTop: "1px solid var(--border)" }}>
          <Link
            href="/"
            className="block px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "var(--bg)";
              (e.currentTarget as HTMLElement).style.color = "var(--text)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
              (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
            }}
          >
            View Site
          </Link>
          <LogoutButton />
        </div>
      </aside>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
