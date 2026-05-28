"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <>
      <style>{`
        .logout-btn {
          width: 100%;
          text-align: left;
          padding: 10px 12px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 500;
          color: #ef4444;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: background 0.15s;
        }
        .logout-btn:hover { background: #fef2f2; }
      `}</style>
      <button onClick={handleLogout} className="logout-btn">Logout</button>
    </>
  );
}
