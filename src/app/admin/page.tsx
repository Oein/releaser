import Link from "next/link";

export const dynamic = "force-dynamic";

async function getStats() {
  const { getDb } = await import("@/lib/db");
  const db = getDb();
  const projects = (db.prepare("SELECT COUNT(*) as count FROM projects").get() as { count: number }).count;
  const versions = (db.prepare("SELECT COUNT(*) as count FROM versions").get() as { count: number }).count;
  const files = (db.prepare("SELECT COUNT(*) as count FROM files").get() as { count: number }).count;
  return { projects, versions, files };
}

export default async function AdminDashboard() {
  const stats = await getStats();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text)" }}>Dashboard</h1>
      <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>Overview of your releases</p>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Projects", value: stats.projects, href: "/admin/projects" },
          { label: "Versions", value: stats.versions, href: null },
          { label: "Files", value: stats.files, href: null },
        ].map(({ label, value, href }) => (
          <div key={label} className="bg-white rounded-2xl p-5" style={{ border: "1px solid var(--border)" }}>
            <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>{label}</p>
            <p className="text-3xl font-bold mt-1" style={{ color: "var(--text)" }}>{value}</p>
            {href && (
              <Link href={href} className="text-xs mt-2 inline-block font-medium" style={{ color: "var(--brand-dark)" }}>
                View all →
              </Link>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Link
          href="/admin/projects/new"
          className="bg-white rounded-2xl p-5 transition-shadow hover:shadow-md"
          style={{ border: "1px solid var(--border)" }}
        >
          <p className="font-semibold text-base" style={{ color: "var(--text)" }}>New Project</p>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Create a new release project</p>
        </Link>
        <Link
          href="/admin/api-keys"
          className="bg-white rounded-2xl p-5 transition-shadow hover:shadow-md"
          style={{ border: "1px solid var(--border)" }}
        >
          <p className="font-semibold text-base" style={{ color: "var(--text)" }}>API Keys</p>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Manage API access keys</p>
        </Link>
      </div>
    </div>
  );
}
