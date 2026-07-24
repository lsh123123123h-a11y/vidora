import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import directorManualRouter from "../src/routes/project/queryDirectorManual";
import u from "../src/utils";

test("returns valid director manuals when a sibling directory has no README", async () => {
  const dataDir = await mkdtemp(path.join(os.tmpdir(), "vidora-director-manual-"));
  const manualsDir = path.join(dataDir, "skills", "story_skills");
  await mkdir(path.join(manualsDir, "valid-manual"), { recursive: true });
  await mkdir(path.join(manualsDir, "incomplete-manual"), { recursive: true });
  await writeFile(path.join(manualsDir, "valid-manual", "README.md"), "Valid manual\n", "utf8");

  const originalGetPath = u.getPath;
  const originalGetFileUrl = u.oss.getFileUrl;
  u.getPath = ((segments?: string[] | string) => path.resolve(dataDir, ...(Array.isArray(segments) ? segments : segments ? [segments] : []))) as typeof u.getPath;
  u.oss.getFileUrl = (async (filePath: string) => `/skills/${filePath}`) as typeof u.oss.getFileUrl;

  let statusCode = 200;
  let body: unknown;
  const response = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    send(payload: unknown) {
      body = payload;
      return this;
    },
  };

  try {
    const layer = (directorManualRouter as any).stack[0].route.stack[0];
    await layer.handle({}, response);

    assert.equal(statusCode, 200);
    const manuals = (body as { data: Array<{ directorManual: string }> }).data;
    assert.deepEqual(manuals.map((item) => item.directorManual), ["valid-manual"]);
  } finally {
    u.getPath = originalGetPath;
    u.oss.getFileUrl = originalGetFileUrl;
    await rm(dataDir, { recursive: true, force: true });
  }
});
