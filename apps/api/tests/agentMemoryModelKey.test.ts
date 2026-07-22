import assert from "node:assert/strict";
import test from "node:test";
import Memory from "../src/utils/agent/memory";

test("uses the decision-layer model for script agent memory operations", () => {
  assert.equal((new Memory("scriptAgent", "test") as any).modelKey, "scriptAgent:decisionAgent");
});

test("uses the decision-layer model for production agent memory operations", () => {
  assert.equal((new Memory("productionAgent", "test") as any).modelKey, "productionAgent:decisionAgent");
});

test("keeps an explicit sub-agent model key unchanged", () => {
  assert.equal((new Memory("scriptAgent:storySkeletonAgent", "test") as any).modelKey, "scriptAgent:storySkeletonAgent");
});
