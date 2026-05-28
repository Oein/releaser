"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <button
      onClick={handleLogout}
      className="w-full text-left px-3 py-2 rounded text-sm text-red-400 hover:bg-red-900/30 hover:text-red-300 transition-colors"
    >
      Logout
    </button>
  );
}
