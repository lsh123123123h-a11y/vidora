import assert from "node:assert/strict";
import test from "node:test";
import { clearVendorBinding, upsertVendorModel } from "../src/lib/configIntegrity";

test("upsertVendorModel replaces only the matching model", () => {
  const result = upsertVendorModel(
    [
      { modelName: "first", type: "text" },
      { modelName: "second", type: "text" },
    ],
    "second",
    { modelName: "second", type: "image" },
  );

  assert.deepEqual(result, [
    { modelName: "first", type: "text" },
    { modelName: "second", type: "image" },
  ]);
});

test("clearVendorBinding removes every executable vendor reference", () => {
  assert.deepEqual(clearVendorBinding(), { model: null, modelName: "", vendorId: null });
});
