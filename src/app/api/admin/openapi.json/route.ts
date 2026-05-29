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
                  summary: { type: "string", description: "One-line summary" },
                  description: { type: "string", description: "Markdown description" },
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
    "/projects/{id}": {
      patch: {
        summary: "Update a project",
        description:
          "Updates any combination of the project's name, summary, description, and tag list. " +
          "When `tags` is provided it **replaces** the entire tag list atomically — " +
          "tags removed from the list are also removed from any versions that had them. " +
          "Tag names are normalized to lowercase.",
        operationId: "updateProject",
        tags: ["Projects"],
        security: [{ bearerAuth: [] }, { sessionAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string", example: "my-app" },
                  summary: { type: "string", description: "One-line summary" },
                  description: { type: "string", description: "Markdown description" },
                  tags: {
                    type: "array",
                    items: { type: "string" },
                    description: "Replaces the full tag list. Duplicates and whitespace are ignored. Example: `[\"linux\", \"windows\", \"arm64\"]`",
                    example: ["linux", "windows", "arm64"],
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Updated project including current tag list.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { project: { $ref: "#/components/schemas/AdminProject" } },
                },
              },
            },
          },
          "400": { description: "Invalid input" },
          "401": { description: "Unauthorized" },
          "404": { description: "Project not found" },
          "409": { description: "Project name already exists" },
        },
      },
      delete: {
        summary: "Delete a project",
        description: "Deletes the project and all its versions and files.",
        operationId: "deleteProject",
        tags: ["Projects"],
        security: [{ bearerAuth: [] }, { sessionAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          "200": { description: "Deleted" },
          "401": { description: "Unauthorized" },
          "404": { description: "Project not found" },
        },
      },
    },
    "/projects/{id}/versions": {
      post: {
        summary: "Create a version for a project",
        description:
          "Creates a new version. Tags in `tags` must already exist in the project's tag list " +
          "(set via `updateProject`); unrecognised tag names are silently ignored.",
        operationId: "createVersion",
        tags: ["Versions"],
        security: [{ bearerAuth: [] }, { sessionAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
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
                  tags: {
                    type: "array",
                    items: { type: "string" },
                    description: "Tags to attach. Must be a subset of the project's tag list.",
                    example: ["linux", "windows"],
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Version created.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { version: { $ref: "#/components/schemas/AdminVersion" } },
                },
              },
            },
          },
          "400": { description: "Invalid version format" },
          "401": { description: "Unauthorized" },
          "404": { description: "Project not found" },
          "409": { description: "Version already exists" },
        },
      },
    },
    "/projects/{id}/versions/{version}": {
      patch: {
        summary: "Update a version",
        description:
          "Updates the version's description and/or tags. " +
          "When `tags` is provided it **replaces** the version's tag list atomically. " +
          "Tags must be from the parent project's tag list; unrecognised names are ignored.",
        operationId: "updateVersion",
        tags: ["Versions"],
        security: [{ bearerAuth: [] }, { sessionAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "version", in: "path", required: true, schema: { type: "string" }, description: "URL-encoded version label" },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  description: { type: "string", nullable: true },
                  tags: {
                    type: "array",
                    items: { type: "string" },
                    description: "Replaces the version's tag list. Must be a subset of the project's tag list.",
                    example: ["arm64"],
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Updated version.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { version: { $ref: "#/components/schemas/AdminVersion" } },
                },
              },
            },
          },
          "400": { description: "Invalid input" },
          "401": { description: "Unauthorized" },
          "404": { description: "Version not found" },
        },
      },
      delete: {
        summary: "Delete a version",
        description: "Deletes the version and all its uploaded files from disk.",
        operationId: "deleteVersion",
        tags: ["Versions"],
        security: [{ bearerAuth: [] }, { sessionAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "version", in: "path", required: true, schema: { type: "string" }, description: "URL-encoded version label" },
        ],
        responses: {
          "200": { description: "Deleted" },
          "401": { description: "Unauthorized" },
          "404": { description: "Version not found" },
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
      AdminProject: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string", example: "my-app" },
          summary: { type: "string", nullable: true },
          description: { type: "string", nullable: true },
          icon_path: { type: "string", nullable: true },
          tags: {
            type: "array",
            items: { type: "string" },
            description: "Allowed tag names for this project's versions.",
            example: ["linux", "windows", "arm64"],
          },
          created_at: { type: "string", format: "date-time" },
        },
      },
      AdminVersion: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          project_id: { type: "string", format: "uuid" },
          version: { type: "string", example: "v1.0.0" },
          type: { type: "string", enum: ["release", "beta", "dev"] },
          description: { type: "string", nullable: true },
          tags: {
            type: "array",
            items: { type: "string" },
            description: "Tags attached to this version.",
            example: ["linux", "windows"],
          },
          created_at: { type: "string", format: "date-time" },
        },
      },
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
