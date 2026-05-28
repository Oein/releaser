"use client";

import dynamic from "next/dynamic";
import "swagger-ui-react/swagger-ui.css";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

export default function AdminDocsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-3">
        <h1 className="text-white font-semibold">Admin API Documentation</h1>
        <p className="text-gray-400 text-xs mt-0.5">Requires authentication (session or Bearer token)</p>
      </div>
      <SwaggerUI url="/api/admin/openapi.json" />
    </div>
  );
}
