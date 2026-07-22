# Web-Only Runtime Design

## Goal

Convert Toonflow-app to a Node.js web service and remove every Electron desktop
runtime, packaging, and release path.

## Scope

- Keep Express, SQLite, WebSocket, static `data/web` hosting, API routes, and
  `npm run dev` / `npm start` workflows.
- Remove Electron main-process code, Electron-only path and permission branches,
  desktop packaging scripts/configuration, and desktop release workflows.
- Keep the file-management route but report that opening a local folder is not
  available in the web-only edition.

## Result

Only the system Node runtime loads native dependencies. Rebuilding
`better-sqlite3` for that runtime fixes the ABI mismatch without affecting a
second desktop runtime.
