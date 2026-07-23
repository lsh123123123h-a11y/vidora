# Vidora Verification Record

This record captures the release checks performed while converting the imported applications into the single-container Vidora Web application.

## Passing Checks

- `corepack yarn lint` in `apps/api`
- `corepack yarn test tests/runtimeConfig.test.ts` in `apps/api` (5 tests)
- `corepack yarn test tests/runtimeCors.test.ts` in `apps/api` (3 tests)
- `corepack yarn build-only` in `apps/web`
- `docker compose config --quiet`
- `docker compose up -d --build`, followed by a healthy Compose service
- `tests/smoke.ps1 -BaseUrl http://127.0.0.1:<published-port>`: `/healthz` returns 200, the homepage contains Vidora, an invalid login is not a 5xx response, and a protected route rejects a missing token with 401

## Known Baseline Limitation

`corepack yarn type-check` in `apps/web` does not currently pass. The imported frontend has existing type errors in production-workbench components, markdown theme typing, provider logo typing, and script-agent state typing. The Docker build uses `yarn build-only`, which completes successfully. This limitation must be resolved before claiming a fully clean TypeScript release gate.

## Release Hygiene

- Runtime `.env` files, secrets directories, databases, logs, generated API bundles, and generated Web bundles are ignored.
- The deprecated Toonflow hosted relay is removed from default vendor data and existing database records are cleared during migration.
- Vidora does not ship an official relay credential flow; users configure their own AI provider API keys in the application.
