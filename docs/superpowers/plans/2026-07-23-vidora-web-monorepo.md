# Vidora Web Monorepo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build one Vidora Web application from the two existing dirty worktrees, with one Docker Compose command, same-origin API and Socket.IO, persistent data, preserved AI vendor integrations, and no desktop runtime.

**Architecture:** Create a new `Vidora` repository and copy the current working trees into `apps/api` and `apps/web`, leaving both source repositories untouched. Build the Vue app and API separately in a multi-stage Dockerfile, then run one production Node process that serves the Web bundle, Express API, and Socket.IO. Store mutable SQLite and user-generated resources in a named Docker volume while keeping the Web bundle in the image.

**Tech Stack:** Node.js 24, TypeScript, Express 5, Socket.IO 4, SQLite/Knex, Vue 3, Vite 5, Yarn Classic lockfiles, Docker Compose.

---

### Task 1: Capture source state and create the monorepo layout

**Files:**
- Create: `apps/api/` copied from `E:/AIProjects/ToonFlow-Dev/Toonflow-app`
- Create: `apps/web/` copied from `E:/AIProjects/ToonFlow-Dev/Toonflow-web`
- Create: `docs/migration/source-state.json`
- Modify: `.gitignore`
- Create: `.dockerignore`

- [ ] **Step 1: Record both source repository states.** Save each HEAD commit and complete `git status --short --branch` output to `docs/migration/source-state.json` using PowerShell. This is the before/after migration audit record.
- [ ] **Step 2: Copy both working trees without nested `.git`, `node_modules`, `dist`, local SQLite files, logs, uploads, or caches.** Keep all current source edits, tests, AI vendor templates, skills, and configuration source. Use copy operations only; do not move or delete anything from the source repositories.
- [ ] **Step 3: Add root `.gitignore` and `.dockerignore`.** Ignore `.env*` except `.env.example`, dependencies, build output, SQLite/WAL/SHM files, runtime data, logs, uploads, editor files, and nested `.git` directories.
- [ ] **Step 4: Compare source and destination manifests and verify both original repositories still have the exact status recorded in Step 1.** Record intentional exclusions in `docs/migration/source-state.json`.
- [ ] **Step 5: Commit the imported source boundary.**

```powershell
git add apps docs/migration .gitignore .dockerignore
git commit -m "chore: import api and web sources into Vidora monorepo"
```

### Task 2: Make backend runtime paths and port configurable

**Files:**
- Test: `apps/api/tests/runtimeConfig.test.ts`
- Create: `apps/api/src/runtimeConfig.ts`
- Modify: `apps/api/src/env.ts`
- Modify: `apps/api/src/utils/getPath.ts`
- Modify: `apps/api/src/app.ts`
- Modify: `apps/api/package.json`

- [ ] **Step 1: Write failing tests for `PORT`, `HOST`, `VIDORA_DATA_DIR`, `VIDORA_WEB_DIR`, defaults, and invalid ports.** The pure parser must return `{ host, port, dataDir, webDir }` and reject non-numeric or out-of-range ports.
- [ ] **Step 2: Run `corepack yarn test tests/runtimeConfig.test.ts` in `apps/api` and confirm it fails because the parser is missing.**
- [ ] **Step 3: Implement `readRuntimeConfig(env, cwd)` and make `getPath.ts` use the configured data directory while retaining its path traversal check.** Defaults remain `0.0.0.0`, `10588`, `<cwd>/data`, and `<cwd>/public`.
- [ ] **Step 4: Wire `app.ts` to configured host/port/static directory and add unauthenticated `GET /healthz` before token middleware.** Keep `/api` and Socket.IO namespaces unchanged.
- [ ] **Step 5: Run `corepack yarn test tests/runtimeConfig.test.ts` and `corepack yarn lint` in `apps/api`; both must exit 0.**
- [ ] **Step 6: Commit with `git commit -m "feat(api): configure host port and persistent data paths"`.**

### Task 3: Make the frontend browser-only and same-origin

**Files:**
- Test: `apps/web/tests/runtimeUrl.test.ts`
- Create: `apps/web/src/utils/runtimeUrl.ts`
- Modify: `apps/web/src/stores/setting.ts`
- Modify: `apps/web/src/utils/useSocket.ts`
- Modify: `apps/web/src/App.vue`
- Modify: `apps/web/src/components/titleBar.vue`
- Modify: `apps/web/src/components/setting/components/about.vue`
- Modify: `apps/web/src/components/hello.vue`
- Modify: `apps/web/src/pages/workbench/index.vue`
- Modify: `apps/web/src/components/setting/components/requestConfig.vue`
- Modify: `apps/web/src/pages/login/index.vue`
- Modify: `apps/web/package.json`

- [ ] **Step 1: Write failing tests for origin `http://example.test` producing API `http://example.test/api` and Socket.IO origin `http://example.test`, including exactly-one `/api` normalization.**
- [ ] **Step 2: Run `corepack yarn test tests/runtimeUrl.test.ts` in `apps/web` and confirm the helper is missing.**
- [ ] **Step 3: Implement pure same-origin URL helpers and use them in Pinia, Axios, Agent stores, and Socket.IO.** Keep an explicit development override only when supplied by build configuration.
- [ ] **Step 4: Remove production references to `toonflow://`, Electron title bar actions, local-folder opening, desktop update downloads, installer links, and old repository URLs.** External browser links use `window.open` with `noopener,noreferrer`.
- [ ] **Step 5: Run focused tests and `corepack yarn type-check` in `apps/web`; both must exit 0.**
- [ ] **Step 6: Commit with `git commit -m "feat(web): use same-origin api and socket connections"`.**

### Task 4: Apply Vidora branding and preserve dependency notices

**Files:**
- Create: `apps/web/public/brand/vidora-logo.jpg`
- Modify: `apps/api/package.json`, `apps/web/package.json`
- Modify: root `README.md`, `LICENSE`, `NOTICES.txt`
- Modify: app and web README/docs, UI assets, About views, and locale files containing old identity

- [ ] **Step 1: Copy the supplied logo into `apps/web/public/brand/vidora-logo.jpg` and create only the required favicon/login/about derivatives.** Do not retain old Logo files in the new repository.
- [ ] **Step 2: Replace package metadata, page titles, About content, README links, update sources, contact text, and locale strings with Vidora identity.** Search tracked files for old author names, emails, GitHub/Gitee URLs, `Toonflow-app`, and `Toonflow-web`.
- [ ] **Step 3: Rebuild generated Web assets from source; never hand-edit minified bundles.** Remove stale generated bundles from the imported source when Docker can regenerate them.
- [ ] **Step 4: Use Apache-2.0 project licensing with a Vidora copyright notice and retain all third-party license and NOTICE entries.** Do not treat the authorization from the original owner as permission to remove third-party attribution.
- [ ] **Step 5: Commit with `git commit -m "feat: rebrand the web application as Vidora"`.**

### Task 5: Add production Docker and Compose

**Files:**
- Create: `Dockerfile`, `docker/entrypoint.sh`, `docker-compose.yml`, `.env.example`
- Modify: `.dockerignore`, `.gitignore`
- Test: `tests/docker-config.ps1`

- [ ] **Step 1: Write `tests/docker-config.ps1` to run `docker compose config --quiet`, assert one service, one published port, and volume `vidora_data`.**
- [ ] **Step 2: Add `web-build`, `api-build`, and `runtime` stages using `node:24-bookworm-slim`.** Enable Corepack, install each app using its own Yarn lockfile, build Web, bundle API, copy Web output to `/app/public`, and copy default mutable resources to `/app/data-seed`.
- [ ] **Step 3: Add `docker/entrypoint.sh`.** It creates `/app/data`, copies missing defaults from `/app/data-seed` without overwriting existing files, excludes secrets/databases/logs/uploads, and executes the API bundle.
- [ ] **Step 4: Add one Compose service named `vidora`.** Publish `${VIDORA_PORT:-10588}:10588`, set `VIDORA_DATA_DIR=/app/data`, `VIDORA_WEB_DIR=/app/public`, `NODE_ENV=prod`, mount `vidora_data:/app/data`, restart unless stopped, and healthcheck `/healthz`. Do not add a frontend or proxy service.
- [ ] **Step 5: Add `.env.example` with only non-secret `VIDORA_PORT`, `VIDORA_HOST`, `VIDORA_DATA_DIR`, and `VIDORA_WEB_DIR`; explain that AI keys are entered in Web settings and never committed.**
- [ ] **Step 6: Run `docker compose config --quiet`; expect exit code 0.**
- [ ] **Step 7: Commit with `git commit -m "feat: add single-container Docker deployment"`.**

### Task 6: Write Chinese deployment documentation

**Files:**
- Modify: `README.md`
- Create: `docs/deployment.md`

- [ ] **Step 1: Document clone, optional `.env` creation, and `docker compose up -d --build`; state that the only address is `http://localhost:10588`.**
- [ ] **Step 2: Document update, logs, status, stop, volume contents, backups, and the data-loss warning for `docker compose down -v`.**
- [ ] **Step 3: Document AI vendor base URL/model/API key configuration in the Web settings without SaaS, subscription, or committed secrets.**
- [ ] **Step 4: Document PowerShell and WSL2 command differences and named-volume behavior.**
- [ ] **Step 5: Commit with `git commit -m "docs: add Vidora Docker deployment guide"`.**

### Task 7: Verify application, Docker, persistence, and release hygiene

**Files:**
- Create: `tests/smoke.ps1`
- Create: `docs/migration/verification.md`

- [ ] **Step 1: Run `corepack yarn --cwd apps/api lint`, `corepack yarn --cwd apps/api test`, `corepack yarn --cwd apps/web type-check`, and `corepack yarn --cwd apps/web build`; every command must exit 0.**
- [ ] **Step 2: Run `docker compose config --quiet`, `docker compose up -d --build`, and `docker compose ps`; the service must be healthy.**
- [ ] **Step 3: Make `tests/smoke.ps1` assert `/healthz` is 200, `/` contains Vidora, malformed login is not 5xx, and a protected API route rejects missing tokens with 401.**
- [ ] **Step 4: Connect to both Socket.IO Agent namespaces with invalid and valid tokens; assert invalid authentication is rejected and valid login reaches `connect`.**
- [ ] **Step 5: Restart with `docker compose down` followed by `docker compose up -d`; verify SQLite, skills, vendor, assets, and oss data persist.** Do not use `down -v` for this test.
- [ ] **Step 6: Scan tracked files for `.env`, private keys, API-key prefixes, old author/repository references, `toonflow://`, Electron package names, and `localhost:10588`; document exact results in `docs/migration/verification.md`.**
- [ ] **Step 7: Commit with `git commit -m "test: verify Vidora web deployment and release hygiene"`.**

### Task 8: Create and push the GitHub repository

**Files:**
- Modify: Git remote configuration only

- [ ] **Step 1: Confirm `git status --short --branch` is clean and inspect the last eight commits.**
- [ ] **Step 2: Run `gh repo view lsh123123123h-a11y/vidora`.** If it does not exist, create the public repository with:

```powershell
gh repo create lsh123123123h-a11y/vidora --public --source . --remote origin --description "Vidora single-container AI story production web application"
```

- [ ] **Step 3: Push the verified branch with `git push -u origin main`.**
- [ ] **Step 4: Verify `gh repo view lsh123123123h-a11y/vidora --json nameWithOwner,url,defaultBranchRef`, `git ls-remote --heads origin main`, and a clean `git status --short --branch`.**
