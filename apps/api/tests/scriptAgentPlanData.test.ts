import assert from "node:assert/strict";
import test from "node:test";
import { mergePlanData } from "../src/agents/scriptAgent/tools";

test("mergePlanData updates only the requested workspace field", () => {
  const current = {
    storySkeleton: "old skeleton",
    adaptationStrategy: "old strategy",
  };

  assert.deepEqual(mergePlanData(current, "storySkeleton", "new skeleton"), {
    storySkeleton: "new skeleton",
    adaptationStrategy: "old strategy",
  });
});
