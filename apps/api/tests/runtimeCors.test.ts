import assert from "node:assert/strict";
import test from "node:test";
import { isAllowedOrigin } from "../src/runtimeCors";

test("allows requests without an Origin header and same-origin production requests", () => {
  assert.equal(isAllowedOrigin(undefined, "vidora.test:10588", "prod"), true);
  assert.equal(isAllowedOrigin("http://vidora.test:10588", "vidora.test:10588", "prod"), true);
});

test("rejects cross-origin production requests", () => {
  assert.equal(isAllowedOrigin("https://attacker.test", "vidora.test:10588", "prod"), false);
  assert.equal(isAllowedOrigin("http://vidora.test:3000", "vidora.test:10588", "prod"), false);
  assert.equal(isAllowedOrigin("not a URL", "vidora.test:10588", "prod"), false);
});

test("allows cross-origin requests only in development", () => {
  assert.equal(isAllowedOrigin("http://localhost:5173", "vidora.test:10588", "dev"), true);
});
