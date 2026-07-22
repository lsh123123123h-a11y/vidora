import assert from "node:assert/strict";
import test from "node:test";
import { withAgentRequestTimeout } from "../src/utils/agent/requestTimeout";

test("aborts an agent request when its timeout elapses", async () => {
  const signal = withAgentRequestTimeout(undefined, 20);
  await new Promise<void>((resolve) => signal.addEventListener("abort", () => resolve(), { once: true }));

  assert.equal(signal.aborted, true);
  assert.equal(signal.reason?.name, "TimeoutError");
});

test("preserves cancellation from the caller", () => {
  const controller = new AbortController();
  const signal = withAgentRequestTimeout(controller.signal, 1_000);
  controller.abort("cancelled by user");

  assert.equal(signal.aborted, true);
  assert.equal(signal.reason, "cancelled by user");
});
