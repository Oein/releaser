import { NextResponse } from "next/server";

const UUID_SCHEMA = { type: "string", format: "uuid", example: "0623db54-de41-4e5c-882c-dbc03e7eebca" };

const PROJECT_ID_PARAM = {
  name: "id",
  in: "path",
  required: true,
  schema: UUID_SCHEMA,
  description: "Project UUID — the `id` field returned by `listProjects` or `getProject`.",
};

const VERSION_PARAM = {
  name: "version",
  in: "path",
  required: true,
  schema: { type: "string", example: "v1.2.3" },
  description:
    "Version label string (e.g. `v1.2.3`, `2024-06-01`). " +
    "This is **not** a UUID — it is the human-readable `version` field stored when the version was created. " +
    "Must be URL-encoded when it contains special characters (e.g. `v1.0.0+build.1` → `v1.0.0%2Bbuild.1`).",
};

const TAG_QUERY_PARAM = {
  name: "tag",
  in: "query",
  required: false,
  schema: { type: "string", example: "linux" },
  description: "Restrict to versions that carry this tag. Tag names are stored lowercase.",
};

const FILE_ID_PARAM = {
  name: "fileId",
  in: "path",
  required: true,
  schema: UUID_SCHEMA,
  description: "File UUID — the `id` field from a `File` object returned by `listFiles` or a `VersionWithFiles` response.",
};

const spec = {
  openapi: "3.0.0",
  info: {
    title: "Releaser Public API",
    description: [
      "Read-only public API for browsing projects, versions, and downloading release files.",
      "",
      "## ID types",
      "- **Project `id`** — UUID (v4). Use this in every `{id}` path segment.",
      "- **Version `id`** — UUID (v4). Internal record ID. **Do not use this in URLs.**",
      "- **Version `version`** — Human-readable label set at upload time (e.g. `v1.2.3`). Use this in `{version}` path segments.",
      "- **File `id`** — UUID (v4). Use this in `{fileId}` path segments to download a file.",
      "",
      "## URL encoding",
      "The `{version}` path segment must be URL-encoded if the label contains special characters:",
      "`+` → `%2B`, `#` → `%23`, space → `%20`, etc.",
    ].join("\n"),
    version: "1.0.0",
  },
  servers: [{ url: "/api/v1", description: "Public API v1" }],
  tags: [
    { name: "Projects", description: "Browse projects" },
    { name: "Versions", description: "List and fetch specific versions by their version label" },
    { name: "Latest", description: "Shortcuts to the most recent version in each channel" },
    { name: "Files", description: "List and download release files" },
  ],
  paths: {
    "/projects": {
      get: {
        summary: "List all projects",
        operationId: "listProjects",
        tags: ["Projects"],
        responses: {
          "200": {
            description: "Array of all projects, newest first.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["projects"],
                  properties: {
                    projects: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Project" },
                    },
                  },
                },
                example: {
                  projects: [
                    {
                      id: "0623db54-de41-4e5c-882c-dbc03e7eebca",
                      name: "my-app",
                      description: "Cross-platform desktop app",
                      created_at: "2024-06-01T12:00:00.000Z",
                    },
                  ],
                },
              },
            },
          },
        },
      },
    },
    "/projects/{id}": {
      get: {
        summary: "Get a project by UUID",
        operationId: "getProject",
        tags: ["Projects"],
        parameters: [PROJECT_ID_PARAM],
        responses: {
          "200": {
            description: "Project details.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["project"],
                  properties: { project: { $ref: "#/components/schemas/Project" } },
                },
              },
            },
          },
          "404": {
            description: "No project with that UUID exists.",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
        },
      },
    },
    "/projects/{id}/versions": {
      get: {
        summary: "List versions for a project",
        description: "Returns all versions for the project, ordered newest first. Optionally filter by channel type and/or tag.",
        operationId: "listVersions",
        tags: ["Versions"],
        parameters: [
          PROJECT_ID_PARAM,
          {
            name: "type",
            in: "query",
            required: false,
            schema: { type: "string", enum: ["release", "beta", "dev"] },
            description: "Filter by channel. Omit to return all channels.",
          },
          {
            name: "tag",
            in: "query",
            required: false,
            schema: { type: "string", example: "linux" },
            description: "Filter to versions that have this tag. Tag names are case-insensitive (stored lowercase).",
          },
        ],
        responses: {
          "200": {
            description: "Array of versions, newest first.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["versions"],
                  properties: {
                    versions: { type: "array", items: { $ref: "#/components/schemas/Version" } },
                  },
                },
                example: {
                  versions: [
                    {
                      id: "a1b2c3d4-0000-0000-0000-000000000001",
                      project_id: "0623db54-de41-4e5c-882c-dbc03e7eebca",
                      version: "v2.0.0",
                      type: "release",
                      description: "Stable release",
                      created_at: "2024-06-10T08:00:00.000Z",
                    },
                  ],
                },
              },
            },
          },
          "404": {
            description: "No project with that UUID exists.",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
        },
      },
    },
    "/projects/{id}/versions/{version}": {
      get: {
        summary: "Get a specific version by its version label",
        description:
          "Look up a version using its human-readable label (e.g. `v1.2.3`), **not** its internal UUID. " +
          "URL-encode the label if it contains special characters.",
        operationId: "getVersion",
        tags: ["Versions"],
        parameters: [PROJECT_ID_PARAM, VERSION_PARAM],
        responses: {
          "200": {
            description: "Version details (without files — use `listFiles` to get the file list).",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["version"],
                  properties: { version: { $ref: "#/components/schemas/Version" } },
                },
              },
            },
          },
          "404": {
            description: "No version with that label exists for this project.",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
        },
      },
    },
    "/projects/{id}/versions/latest": {
      get: {
        summary: "Get latest release version",
        description:
          "Returns the most recently created version in the `release` channel, along with its files. " +
          "Use `?tag=` to narrow to the latest release that also carries a specific tag.",
        operationId: "getLatestRelease",
        tags: ["Latest"],
        parameters: [PROJECT_ID_PARAM, TAG_QUERY_PARAM],
        responses: {
          "200": {
            description: "Latest release version with its files.",
            content: { "application/json": { schema: { $ref: "#/components/schemas/VersionWithFiles" } } },
          },
          "404": {
            description: "Project not found, or no matching `release` version exists.",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
        },
      },
    },
    "/projects/{id}/versions/latest/beta": {
      get: {
        summary: "Get latest beta version",
        description:
          "Returns the most recently created version in the `beta` channel, along with its files. " +
          "Use `?tag=` to narrow to the latest beta that also carries a specific tag.",
        operationId: "getLatestBeta",
        tags: ["Latest"],
        parameters: [PROJECT_ID_PARAM, TAG_QUERY_PARAM],
        responses: {
          "200": {
            description: "Latest beta version with its files.",
            content: { "application/json": { schema: { $ref: "#/components/schemas/VersionWithFiles" } } },
          },
          "404": {
            description: "Project not found, or no matching `beta` version exists.",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
        },
      },
    },
    "/projects/{id}/versions/latest/dev": {
      get: {
        summary: "Get latest dev version",
        description:
          "Returns the most recently created version in the `dev` channel, along with its files. " +
          "Use `?tag=` to narrow to the latest dev build that also carries a specific tag.",
        operationId: "getLatestDev",
        tags: ["Latest"],
        parameters: [PROJECT_ID_PARAM, TAG_QUERY_PARAM],
        responses: {
          "200": {
            description: "Latest dev version with its files.",
            content: { "application/json": { schema: { $ref: "#/components/schemas/VersionWithFiles" } } },
          },
          "404": {
            description: "Project not found, or no matching `dev` version exists.",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
        },
      },
    },
    "/projects/{id}/versions/latest/all": {
      get: {
        summary: "Get latest version (any channel)",
        description:
          "Returns the single most recently created version across all channels (`release`, `beta`, `dev`), along with its files. " +
          "Use `?tag=` to narrow to the most recent version that carries a specific tag.",
        operationId: "getLatestAny",
        tags: ["Latest"],
        parameters: [PROJECT_ID_PARAM, TAG_QUERY_PARAM],
        responses: {
          "200": {
            description: "Most recent version (any channel) with its files.",
            content: { "application/json": { schema: { $ref: "#/components/schemas/VersionWithFiles" } } },
          },
          "404": {
            description: "Project not found, or the project has no matching versions.",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
        },
      },
    },
    "/projects/{id}/versions/{version}/files": {
      get: {
        summary: "List files for a version",
        description: "Returns the files attached to a version, ordered by upload time ascending.",
        operationId: "listFiles",
        tags: ["Files"],
        parameters: [PROJECT_ID_PARAM, VERSION_PARAM],
        responses: {
          "200": {
            description: "Array of files.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["files"],
                  properties: {
                    files: { type: "array", items: { $ref: "#/components/schemas/File" } },
                  },
                },
              },
            },
          },
          "404": {
            description: "No version with that label exists for this project.",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
        },
      },
    },
    "/projects/{id}/versions/{version}/files/{fileId}": {
      get: {
        summary: "Download a file",
        description:
          "Streams the raw file content. " +
          "The `{fileId}` is the UUID `id` field from a `File` object — obtain it from `listFiles` or a `Latest` endpoint response. " +
          "The response `Content-Disposition` header is set to `attachment` with the original filename.",
        operationId: "downloadFile",
        tags: ["Files"],
        parameters: [PROJECT_ID_PARAM, VERSION_PARAM, FILE_ID_PARAM],
        responses: {
          "200": {
            description: "Raw file bytes. `Content-Type` reflects the file's MIME type.",
            content: { "application/octet-stream": { schema: { type: "string", format: "binary" } } },
          },
          "404": {
            description: "Project, version, or file not found.",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      Project: {
        type: "object",
        required: ["id", "name", "created_at", "tags"],
        properties: {
          id: {
            ...UUID_SCHEMA,
            description: "Project UUID. Use this as `{id}` in all project-scoped endpoints.",
          },
          name: {
            type: "string",
            description: "Unique human-readable project name.",
            example: "my-app",
          },
          summary: {
            type: "string",
            nullable: true,
            description: "Optional one-line summary. `null` if not set.",
          },
          description: {
            type: "string",
            nullable: true,
            description: "Optional Markdown description. `null` if not set.",
          },
          tags: {
            type: "array",
            items: { type: "string" },
            description: "Tag names available for versions of this project. All lowercase, sorted alphabetically.",
            example: ["arm64", "linux", "windows"],
          },
          created_at: {
            type: "string",
            format: "date-time",
            description: "ISO 8601 UTC timestamp of project creation.",
            example: "2024-06-01T12:00:00.000Z",
          },
        },
      },
      Version: {
        type: "object",
        required: ["id", "project_id", "version", "type", "created_at", "tags"],
        properties: {
          id: {
            ...UUID_SCHEMA,
            description: "Internal UUID for this version record. **Not** used in URL paths — use the `version` string instead.",
          },
          project_id: {
            ...UUID_SCHEMA,
            description: "UUID of the parent project.",
          },
          version: {
            type: "string",
            description:
              "Human-readable version label (e.g. `v1.2.3`, `2024-06-01`). " +
              "This is the value used in `{version}` path parameters. " +
              "URL-encode it when it contains special characters.",
            example: "v1.2.3",
          },
          type: {
            type: "string",
            enum: ["release", "beta", "dev"],
            description: "Release channel. `release` = stable, `beta` = pre-release, `dev` = development/nightly.",
          },
          description: {
            type: "string",
            nullable: true,
            description: "Optional Markdown release notes. `null` if not set.",
          },
          tags: {
            type: "array",
            items: { type: "string" },
            description:
              "Tags attached to this version. Must be a subset of the parent project's tag list. " +
              "All lowercase, sorted alphabetically. Use `?tag=` on list/latest endpoints to filter by tag.",
            example: ["linux", "windows"],
          },
          created_at: {
            type: "string",
            format: "date-time",
            description: "ISO 8601 UTC timestamp of version creation. Used to determine \"latest\" within a channel.",
            example: "2024-06-10T08:00:00.000Z",
          },
        },
      },
      VersionWithFiles: {
        type: "object",
        required: ["version", "files"],
        description: "A version record together with its attached files. Returned by all `Latest` endpoints.",
        properties: {
          version: { $ref: "#/components/schemas/Version" },
          files: {
            type: "array",
            items: { $ref: "#/components/schemas/File" },
            description: "Files attached to this version, ordered by upload time ascending.",
          },
        },
      },
      File: {
        type: "object",
        required: ["id", "filename", "created_at"],
        properties: {
          id: {
            ...UUID_SCHEMA,
            description: "File UUID. Use this as `{fileId}` in the download endpoint.",
          },
          filename: {
            type: "string",
            description: "Original filename as uploaded.",
            example: "my-app-v1.2.3-linux-x64.tar.gz",
          },
          size: {
            type: "integer",
            nullable: true,
            description: "File size in bytes. `null` if unknown.",
            example: 10485760,
          },
          mime_type: {
            type: "string",
            nullable: true,
            description: "MIME type detected at upload time. `null` if unknown.",
            example: "application/gzip",
          },
          created_at: {
            type: "string",
            format: "date-time",
            description: "ISO 8601 UTC timestamp of file upload.",
            example: "2024-06-10T08:05:00.000Z",
          },
        },
      },
      Error: {
        type: "object",
        required: ["error"],
        properties: {
          error: { type: "string", description: "Human-readable error message.", example: "Project not found" },
        },
      },
    },
  },
};

export async function GET() {
  return NextResponse.json(spec);
}
