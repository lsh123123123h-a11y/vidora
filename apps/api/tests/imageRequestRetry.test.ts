import assert from "node:assert/strict";
import test from "node:test";
import { retryImageGenerationRequest } from "../src/lib/imageRequestRetry";

test("retries a transient image gateway failure", async () => {
  let attempts = 0;
  const result = await retryImageGenerationRequest(async () => {
    attempts += 1;
    if (attempts < 3) throw new Error("图片生成请求失败: HTTP 502 Bad Gateway");
    return "image-data";
  }, 3, 0);

  assert.equal(result, "image-data");
  assert.equal(attempts, 3);
});

test("does not retry a non-transient image error", async () => {
  let attempts = 0;
  await assert.rejects(
    () =>
      retryImageGenerationRequest(async () => {
        attempts += 1;
        throw new Error("图片生成请求失败: HTTP 400 invalid request");
      }, 3, 0),
    /400/,
  );

  assert.equal(attempts, 1);
});
