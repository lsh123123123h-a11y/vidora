import assert from "node:assert/strict";
import test from "node:test";
import { assertImageReferenceSupport, resolveRoleDerivativeGeneration } from "../src/lib/characterGenerationPolicy";

test("builds every role derivative from exactly one completed root-role image", async () => {
  const result = await resolveRoleDerivativeGeneration(
    {
      state: "\u5df2\u5b8c\u6210",
      filePath: "/role/master.png",
      type: "role",
      assetsId: null,
      prompt: "Base identity: short black hair, oval face, warm skin tone.",
    },
    "Wardrobe for this story: charcoal hoodie, white sneakers, no accessories.",
    async (filePath) => {
      assert.equal(filePath, "/role/master.png");
      return "data:image/png;base64,parent-image";
    },
  );

  assert.match(result.prompt, /Base identity/);
  assert.match(result.prompt, /Wardrobe for this story/);
  assert.deepEqual(result.referenceList, [{ type: "image", base64: "data:image/png;base64,parent-image" }]);
});

test("rejects derivative generation when the selected image model cannot consume references", () => {
  assert.doesNotThrow(() => assertImageReferenceSupport({ type: "image", mode: ["text", "singleImage"] }));
  assert.throws(() => assertImageReferenceSupport({ type: "image", mode: ["text"] }), /reference image/i);
  assert.throws(() => assertImageReferenceSupport({ type: "text" }), /reference image/i);
});
