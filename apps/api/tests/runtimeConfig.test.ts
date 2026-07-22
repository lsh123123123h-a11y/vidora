import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { readRuntimeConfig } from "../src/runtimeConfig";

const cwd = path.join("C:", "workspace", "vidora");

test("uses the documented runtime defaults", () => {
  assert.deepEqual(readRuntimeConfig({}, cwd), {
    host: "0.0.0.0",
    port: 10588,
    dataDir: path.join(cwd, "data"),
    webDir: path.join(cwd, "public"),
  });
});

test("reads host, port, data directory, and web directory from the environment", () => {
  const env = {
    HOST: "127.0.0.1",
    PORT: "12000",
    VIDORA_DATA_DIR: path.join("D:", "vidora-data"),
    VIDORA_WEB_DIR: path.join("D:", "vidora-web"),
  };

  assert.deepEqual(readRuntimeConfig(env, cwd), {
    host: "127.0.0.1",
    port: 12000,
    dataDir: env.VIDORA_DATA_DIR,
    webDir: env.VIDORA_WEB_DIR,
  });
});

test("rejects a port below 1", () => {
  assert.throws(() => readRuntimeConfig({ PORT: "0" }, cwd), /PORT.*1.*65535/);
});

test("rejects a port above 65535", () => {
  assert.throws(() => readRuntimeConfig({ PORT: "65536" }, cwd), /PORT.*1.*65535/);
});

test("rejects a non-integer port", () => {
  assert.throws(() => readRuntimeConfig({ PORT: "not-a-port" }, cwd), /PORT.*1.*65535/);
});
