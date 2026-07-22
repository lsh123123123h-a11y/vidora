import assert from "node:assert/strict";
import test from "node:test";
import { assertMediaGenerationResult } from "../src/lib/mediaGenerationResult";

test("rejects an empty image generation result instead of saving a zero-byte file", () => {
  assert.throws(() => assertMediaGenerationResult(""), /empty/i);
  assert.throws(() => assertMediaGenerationResult("   "), /empty/i);
});

test("accepts a usable image URL or base64 payload", () => {
  assert.equal(assertMediaGenerationResult("https://images.example.com/result.png"), "https://images.example.com/result.png");
  assert.equal(assertMediaGenerationResult("iVBORw0KGgoAAAANSUhEUg"), "iVBORw0KGgoAAAANSUhEUg");
});
