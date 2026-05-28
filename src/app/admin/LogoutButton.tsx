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
      className="w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors"
      style={{ color: "#ef4444" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#fef2f2")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      Logout
    </button>
  );
}
