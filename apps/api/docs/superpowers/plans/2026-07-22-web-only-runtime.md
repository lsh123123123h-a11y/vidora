# Web-Only Runtime Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove Electron desktop support so Toonflow-app runs only as a Node.js web service.

**Architecture:** Express owns all startup, storage paths, and static web hosting. Electron main-process and packaging concerns are deleted, leaving one native-module ABI target: the system Node runtime.

**Tech Stack:** Node.js 24, Express, TypeScript, npm, Vite-built static frontend.

---

### Task 1: Remove Electron runtime code

**Files:**
- Delete: `scripts/main.ts`
- Modify: `src/app.ts`, `src/env.ts`, `src/utils/getPath.ts`, `src/utils/oss.ts`, `src/routes/setting/fileManagement/openFolder.ts`

- [x] Replace Electron-specific startup, data-path, permission, and OSS URL branches with web-only behavior.
- [x] Make the file-manager route return a web-only unsupported response instead of invoking Electron-dependent behavior.
- [x] Run `npm run lint` to verify no Electron imports remain.

### Task 2: Remove packaging and release paths

**Files:**
- Delete: `electron-builder.yml`, `scripts/installer.nsh`, `scripts/logo.ico`, `scripts/logo.png`, `.github/workflows/debug.yml`, `.github/workflows/release.yml`
- Modify: `package.json`, `scripts/build.ts`, `Dockerfile`

- [x] Remove Electron dependencies and desktop scripts from `package.json`.
- [x] Build only `data/serve/app.js`; remove Electron build output and Docker dependency stripping.
- [x] Remove desktop-only CI workflows and packaging files.

### Task 3: Align documentation and verify the web service

**Files:**
- Modify: `README.md`

- [x] Remove desktop client/install/package documentation and replace it with web-only startup instructions.
- [x] Run `npm run lint`, `npm run build`, and focused model-list tests.
- [x] Rebuild `better-sqlite3` for the system Node runtime, start the web service, and verify the provider-list API responds without ABI failure.
