# Releaser — GitHub Actions Guide

## Overview

Use `Oein/releaser@main` in any GitHub Actions workflow to create a version and upload files to your Releaser instance.

```yaml
- uses: Oein/releaser@main
  with:
    url: https://oein.fyi
    api-key: ${{ secrets.RELEASER_API_KEY }}
    project: ${{ secrets.RELEASER_PROJECT }}
    version: ${{ github.ref_name }}
    type: release
    files: |
      dist/*.zip
      dist/*.exe
      dist/*.dmg
```

---

## Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `url` | ✅ | — | Base URL of the Releaser instance (e.g. `https://oein.fyi`) |
| `api-key` | ✅ | — | Admin API key — generate at `/admin/api-keys` |
| `project` | ✅ | — | Project ID |
| `version` | ✅ | — | Version string (e.g. `v1.2.3`, `v1.0.0b`, `nightly`) |
| `type` | ❌ | `release` | Version type: `release` \| `beta` \| `dev` |
| `description` | ❌ | `""` | Release notes / version description |
| `files` | ❌ | `""` | Newline-separated file paths or glob patterns to upload |

## Outputs

| Output | Description |
|--------|-------------|
| `version-id` | ID of the created (or existing) version |

---

## Version Naming Rules

| Type | Format | Examples |
|------|--------|---------|
| `release` | `vX.X.X` | `v1.0.0`, `v2.3.4` |
| `beta` | `vX.X.X[.X]b` | `v1.0.9b`, `v3.5.16.88b` |
| `dev` | any string | `nightly-2025-01-15`, `feature-xyz` |

---

## Examples

### 1. Push on tag (automatic)

Triggers automatically when a tag like `v1.2.3` is pushed.

```yaml
name: Release

on:
  push:
    tags: ['v*']

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build
        run: make build

      - uses: Oein/releaser@main
        with:
          url: https://oein.fyi
          api-key: ${{ secrets.RELEASER_API_KEY }}
          project: ${{ secrets.RELEASER_PROJECT }}
          version: ${{ github.ref_name }}
          type: release
          description: "Released from GitHub Actions"
          files: |
            dist/app-linux
            dist/app-win.exe
            dist/*.zip
```

---

### 2. Manual trigger (workflow_dispatch)

Run manually from the GitHub Actions UI with version, type, and description inputs.

```yaml
name: Manual Release

on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Version string (e.g. v1.2.3)'
        required: true
        type: string
      type:
        description: 'Release type'
        required: true
        type: choice
        default: release
        options:
          - release
          - beta
          - dev
      description:
        description: 'Release notes'
        required: false
        type: string

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build
        run: make build

      - uses: Oein/releaser@main
        with:
          url: https://oein.fyi
          api-key: ${{ secrets.RELEASER_API_KEY }}
          project: ${{ secrets.RELEASER_PROJECT }}
          version: ${{ inputs.version }}
          type: ${{ inputs.type }}
          description: ${{ inputs.description }}
          files: |
            dist/*.zip
            dist/*.exe
            dist/*.dmg
```

**How to run manually:**
1. Go to the repo → **Actions** tab
2. Select the workflow → click **Run workflow**
3. Fill in the inputs and click **Run workflow**

---

### 3. Tag push + manual dispatch combined

Runs automatically on tag push, or manually when needed.
When triggered manually with an empty version, falls back to the current git tag.

```yaml
name: Release on Tag

on:
  push:
    tags: ['v*']
  workflow_dispatch:
    inputs:
      version:
        description: 'Version (leave empty to use git tag)'
        required: false
        type: string
      type:
        description: 'Release type'
        required: true
        type: choice
        default: release
        options: [release, beta, dev]

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Resolve version
        id: ver
        run: |
          VERSION="${{ inputs.version }}"
          if [ -z "$VERSION" ]; then
            VERSION="${{ github.ref_name }}"
          fi
          echo "value=$VERSION" >> $GITHUB_OUTPUT

      - name: Build
        run: make build

      - uses: Oein/releaser@main
        with:
          url: https://oein.fyi
          api-key: ${{ secrets.RELEASER_API_KEY }}
          project: ${{ secrets.RELEASER_PROJECT }}
          version: ${{ steps.ver.outputs.value }}
          type: ${{ inputs.type || 'release' }}
          files: dist/**
```

---

### 4. Auto-detect type from version string

Automatically sets the type based on the version string format.

```yaml
- name: Detect version type
  id: vtype
  run: |
    VERSION="${{ github.ref_name }}"
    if [[ "$VERSION" =~ b$ ]]; then
      echo "type=beta" >> $GITHUB_OUTPUT
    else
      echo "type=release" >> $GITHUB_OUTPUT
    fi

- uses: Oein/releaser@main
  with:
    url: https://oein.fyi
    api-key: ${{ secrets.RELEASER_API_KEY }}
    project: ${{ secrets.RELEASER_PROJECT }}
    version: ${{ github.ref_name }}
    type: ${{ steps.vtype.outputs.type }}
    files: dist/**
```

---

## Setup Checklist

- [ ] Generate an API key at `/admin/api-keys`
- [ ] Add `RELEASER_API_KEY` to repo Secrets (Settings → Secrets and variables → Actions)
- [ ] Add `RELEASER_PROJECT` to repo Secrets (Project ID from the admin dashboard URL)
- [ ] Add `uses: Oein/releaser@main` step to your workflow
