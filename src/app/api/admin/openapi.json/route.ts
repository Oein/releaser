import { NextRequest, NextResponse } from "next/server";
import { requireAdminSessionOnly } from "@/lib/auth";

const spec = {
  openapi: "3.0.0",
  info: {
    title: "Deploy Web Admin API",
    description: "Admin API for managing projects, versions, files, and API keys",
    version: "1.0.0",
  },
  servers: [{ url: "/api/admin", description: "Admin API" }],
  security: [{ bearerAuth: [] }],
  paths: {
    "/projects": {
      post: {
        summary: "Create a new project",
        operationId: "createProject",
        tags: ["Projects"],
        security: [{ bearerAuth: [] }, { sessionAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string", example: "my-app" },
                  description: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Project created" },
          "400": { description: "Invalid input" },
          "401": { description: "Unauthorized" },
          "409": { description: "Project name already exists" },
        },
      },
    },
    "/projects/{id}/versions": {
      post: {
        summary: "Create a version for a project",
        operationId: "createVersion",
        tags: ["Versions"],
        security: [{ bearerAuth: [] }, { sessionAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["version", "type"],
                properties: {
                  version: { type: "string", example: "v1.0.0" },
                  type: { type: "string", enum: ["release", "beta", "dev"] },
                  description: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Version created" },
          "400": { description: "Invalid version format" },
          "401": { description: "Unauthorized" },
          "404": { description: "Project not found" },
          "409": { description: "Version already exists" },
        },
      },
    },
    "/projects/{id}/versions/{version}/files": {
      post: {
        summary: "Upload a file to a version",
        operationId: "uploadFile",
        tags: ["Files"],
        security: [{ bearerAuth: [] }, { sessionAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          { name: "version", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["file"],
                properties: {
                  file: { type: "string", format: "binary" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "File uploaded" },
          "400": { description: "No file provided" },
          "401": { description: "Unauthorized" },
          "404": { description: "Version not found" },
        },
      },
    },
    "/api-keys": {
      get: {
        summary: "List API keys (session only)",
        operationId: "listApiKeys",
        tags: ["API Keys"],
        security: [{ sessionAuth: [] }],
        responses: {
          "200": {
            description: "List of API keys",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    apiKeys: {
                      type: "array",
                      items: { $ref: "#/components/schemas/ApiKey" },
                    },
                  },
                },
              },
            },
          },
          "401": { description: "Unauthorized" },
        },
      },
      post: {
        summary: "Create API key (session only)",
        operationId: "createApiKey",
        tags: ["API Keys"],
        security: [{ sessionAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: { name: { type: "string" } },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "API key created (key shown only once)",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    apiKey: { $ref: "#/components/schemas/ApiKeyWithSecret" },
                    message: { type: "string" },
                  },
                },
              },
            },
          },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/api-keys/{id}": {
      delete: {
        summary: "Delete API key (session only)",
        operationId: "deleteApiKey",
        tags: ["API Keys"],
        security: [{ sessionAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "Deleted" },
          "401": { description: "Unauthorized" },
          "404": { description: "Key not found" },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        description: "API key (Bearer token)",
      },
      sessionAuth: {
        type: "apiKey",
        in: "cookie",
        name: "deploy-web-session",
        description: "Admin session cookie",
      },
    },
    schemas: {
      ApiKey: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          key_prefix: { type: "string", example: "dw_abc12345" },
          created_at: { type: "string", format: "date-time" },
        },
      },
      ApiKeyWithSecret: {
        allOf: [
          { $ref: "#/components/schemas/ApiKey" },
          {
            type: "object",
            properties: { key: { type: "string", description: "Full API key (shown only once)" } },
          },
        ],
      },
    },
  },
};

export async function GET(request: NextRequest) {
  if (!(await requireAdminSessionOnly())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(spec);
}
