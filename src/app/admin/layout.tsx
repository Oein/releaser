import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import Link from "next/link";
import LogoutButton from "./LogoutButton";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session.isAdmin) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <Link href="/admin" className="text-white font-bold text-lg">
            Deploy Web
          </Link>
          <p className="text-gray-500 text-xs mt-0.5">Admin Panel</p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          <Link
            href="/admin"
            className="flex items-center gap-2 px-3 py-2 rounded text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/admin/projects"
            className="flex items-center gap-2 px-3 py-2 rounded text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          >
            Projects
          </Link>
          <Link
            href="/admin/api-keys"
            className="flex items-center gap-2 px-3 py-2 rounded text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          >
            API Keys
          </Link>
          <Link
            href="/admin/docs"
            className="flex items-center gap-2 px-3 py-2 rounded text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          >
            API Docs
          </Link>
        </nav>

        <div className="p-3 border-t border-gray-800 space-y-2">
          <Link
            href="/"
            className="block px-3 py-2 rounded text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          >
            View Site
          </Link>
          <LogoutButton />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
