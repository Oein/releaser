import { NextResponse } from "next/server";

const spec = {
  openapi: "3.0.0",
  info: {
    title: "Deploy Web Public API",
    description: "Public API for browsing projects, versions, and downloading files",
    version: "1.0.0",
  },
  servers: [{ url: "/api/v1", description: "Public API" }],
  paths: {
    "/projects": {
      get: {
        summary: "List all projects",
        operationId: "listProjects",
        tags: ["Projects"],
        responses: {
          "200": {
            description: "List of projects",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    projects: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Project" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/projects/{id}": {
      get: {
        summary: "Get a project by ID",
        operationId: "getProject",
        tags: ["Projects"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Project ID",
          },
        ],
        responses: {
          "200": {
            description: "Project details",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    project: { $ref: "#/components/schemas/Project" },
                  },
                },
              },
            },
          },
          "404": { description: "Project not found" },
        },
      },
    },
    "/projects/{id}/versions": {
      get: {
        summary: "List versions for a project",
        operationId: "listVersions",
        tags: ["Versions"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
          {
            name: "type",
            in: "query",
            required: false,
            schema: { type: "string", enum: ["release", "beta", "dev"] },
            description: "Filter versions by type",
          },
        ],
        responses: {
          "200": {
            description: "List of versions",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    versions: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Version" },
                    },
                  },
                },
              },
            },
          },
          "404": { description: "Project not found" },
        },
      },
    },
    "/projects/{id}/versions/latest": {
      get: {
        summary: "Get latest release version",
        operationId: "getLatestRelease",
        tags: ["Latest"],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" }, description: "Project ID" },
        ],
        responses: {
          "200": {
            description: "Latest release version with files",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/VersionWithFiles" },
              },
            },
          },
          "404": { description: "Project not found or no release version exists" },
        },
      },
    },
    "/projects/{id}/versions/latest/beta": {
      get: {
        summary: "Get latest beta version",
        operationId: "getLatestBeta",
        tags: ["Latest"],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "Latest beta version with files",
            content: { "application/json": { schema: { $ref: "#/components/schemas/VersionWithFiles" } } },
          },
          "404": { description: "Project not found or no beta version exists" },
        },
      },
    },
    "/projects/{id}/versions/latest/dev": {
      get: {
        summary: "Get latest dev version",
        operationId: "getLatestDev",
        tags: ["Latest"],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "Latest dev version with files",
            content: { "application/json": { schema: { $ref: "#/components/schemas/VersionWithFiles" } } },
          },
          "404": { description: "Project not found or no dev version exists" },
        },
      },
    },
    "/projects/{id}/versions/latest/all": {
      get: {
        summary: "Get latest version (any type)",
        operationId: "getLatestAny",
        tags: ["Latest"],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "Most recently created version with files, regardless of type",
            content: { "application/json": { schema: { $ref: "#/components/schemas/VersionWithFiles" } } },
          },
          "404": { description: "Project not found or no versions exist" },
        },
      },
    },
    "/projects/{id}/versions/{version}": {
      get: {
        summary: "Get a specific version",
        operationId: "getVersion",
        tags: ["Versions"],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          {
            name: "version",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Version string (URL-encoded if needed)",
          },
        ],
        responses: {
          "200": {
            description: "Version details",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { version: { $ref: "#/components/schemas/Version" } },
                },
              },
            },
          },
          "404": { description: "Version not found" },
        },
      },
    },
    "/projects/{id}/versions/{version}/files": {
      get: {
        summary: "List files for a version",
        operationId: "listFiles",
        tags: ["Files"],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          { name: "version", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "List of files",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    files: {
                      type: "array",
                      items: { $ref: "#/components/schemas/File" },
                    },
                  },
                },
              },
            },
          },
          "404": { description: "Version not found" },
        },
      },
    },
    "/projects/{id}/versions/{version}/files/{fileId}": {
      get: {
        summary: "Download a file",
        operationId: "downloadFile",
        tags: ["Files"],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          { name: "version", in: "path", required: true, schema: { type: "string" } },
          { name: "fileId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "File binary content",
            content: { "application/octet-stream": { schema: { type: "string", format: "binary" } } },
          },
          "404": { description: "File not found" },
        },
      },
    },
  },
  components: {
    schemas: {
      Project: {
        type: "object",
        properties: {
          id: { type: "string", example: "uuid" },
          name: { type: "string", example: "my-app" },
          description: { type: "string", nullable: true },
          created_at: { type: "string", format: "date-time" },
        },
      },
      Version: {
        type: "object",
        properties: {
          id: { type: "string" },
          project_id: { type: "string" },
          version: { type: "string", example: "v1.0.0" },
          type: { type: "string", enum: ["release", "beta", "dev"] },
          description: { type: "string", nullable: true },
          created_at: { type: "string", format: "date-time" },
        },
      },
      VersionWithFiles: {
        type: "object",
        properties: {
          version: { $ref: "#/components/schemas/Version" },
          files: {
            type: "array",
            items: { $ref: "#/components/schemas/File" },
          },
        },
      },
      File: {
        type: "object",
        properties: {
          id: { type: "string" },
          filename: { type: "string" },
          size: { type: "integer" },
          mime_type: { type: "string" },
          created_at: { type: "string", format: "date-time" },
        },
      },
    },
  },
};

export async function GET() {
  return NextResponse.json(spec);
}
