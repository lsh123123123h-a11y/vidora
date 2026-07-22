import assert from "node:assert/strict";
import test from "node:test";
import { selectStoryboardsForImageGeneration } from "../src/lib/storyboardGenerationSelection";

test("includes every selected storyboard when generation is compulsory", () => {
  const storyboards = [
    { id: 1, shouldGenerateImage: 0 },
    { id: 2, shouldGenerateImage: 1 },
  ];

  assert.deepEqual(selectStoryboardsForImageGeneration(storyboards, true), storyboards);
});

test("skips unmarked storyboards only for non-compulsory generation", () => {
  const storyboards = [
    { id: 1, shouldGenerateImage: 0 },
    { id: 2, shouldGenerateImage: 1 },
  ];

  assert.deepEqual(selectStoryboardsForImageGeneration(storyboards, false), [storyboards[1]]);
});
