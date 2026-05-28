"use client";

import dynamic from "next/dynamic";
import Link from "next/link";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <div>
          <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">
            ← Back to home
          </Link>
          <h1 className="text-white font-semibold mt-1">Public API Documentation</h1>
        </div>
      </div>
      <SwaggerUI url="/api/openapi.json" />
    </div>
  );
}
