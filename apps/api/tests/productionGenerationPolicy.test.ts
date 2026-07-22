import assert from "node:assert/strict";
import test from "node:test";
import {
  buildVideoPromptContext,
  normalizeProductionAssetIds,
  resolveSupportedVideoSettings,
  validateReferenceCounts,
  validateVideoSettings,
} from "../src/lib/productionGenerationPolicy";

const modelSettings = [
  { duration: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], resolution: ["480p", "720p"] },
];

test("resolves track durations to the nearest supported model value", () => {
  assert.deepEqual(resolveSupportedVideoSettings(modelSettings, 2.5, "720p"), {
    duration: 4,
    resolution: "720p",
    adjusted: true,
  });
  assert.equal(resolveSupportedVideoSettings(modelSettings, 16.5, "720p").duration, 15);
  assert.equal(resolveSupportedVideoSettings([{ duration: [5, 10, 15], resolution: ["720p"] }], 8.5, "720p").duration, 10);
});

test("validates the exact duration and resolution combination before a paid request", () => {
  assert.doesNotThrow(() => validateVideoSettings(modelSettings, 8, "720p"));
  assert.throws(() => validateVideoSettings(modelSettings, 8.5, "720p"), /不支持的视频时长/);
  assert.throws(() => validateVideoSettings(modelSettings, 8, "1080p"), /不支持的分辨率/);
});

test("parses multi-reference limits and rejects excess media before provider calls", () => {
  const mode = JSON.stringify(["imageReference:9", "videoReference:3", "audioReference:3"]);
  assert.doesNotThrow(() =>
    validateReferenceCounts(mode, [
      ...Array.from({ length: 9 }, () => ({ type: "image" as const })),
      ...Array.from({ length: 3 }, () => ({ type: "video" as const })),
      ...Array.from({ length: 3 }, () => ({ type: "audio" as const })),
    ]),
  );
  assert.throws(() => validateReferenceCounts(mode, Array.from({ length: 10 }, () => ({ type: "image" as const }))), /图片参考最多允许 9 个/);
});

test("replaces a root role with its only completed direct derivative", () => {
  const result = normalizeProductionAssetIds(
    [1, 4, 1],
    100,
    [
      { id: 1, projectId: 100, type: "role", name: "苏晴", assetsId: null, imageState: "已完成", filePath: "/root.jpg" },
      { id: 9, projectId: 100, type: "role", name: "苏晴·默认定妆", assetsId: 1, imageState: "已完成", filePath: "/derive.jpg" },
      { id: 4, projectId: 100, type: "scene", name: "餐馆", assetsId: null, imageState: "已完成", filePath: "/scene.jpg" },
    ],
  );

  assert.deepEqual(result, [9, 4]);
});

test("does not guess when a root role has zero or multiple usable derivatives", () => {
  const root = { id: 1, projectId: 100, type: "role", name: "苏晴", assetsId: null, imageState: "已完成", filePath: "/root.jpg" };
  assert.throws(() => normalizeProductionAssetIds([1], 100, [root]), /没有已完成的直接衍生角色/);
  assert.throws(
    () =>
      normalizeProductionAssetIds([1], 100, [
        root,
        { id: 9, projectId: 100, type: "role", name: "苏晴·日常", assetsId: 1, imageState: "已完成", filePath: "/a.jpg" },
        { id: 10, projectId: 100, type: "role", name: "苏晴·晚宴", assetsId: 1, imageState: "已完成", filePath: "/b.jpg" },
      ]),
    /存在多个已完成的直接衍生角色/,
  );
});

test("rejects incomplete and indirect role references in production", () => {
  assert.throws(
    () =>
      normalizeProductionAssetIds([10], 100, [
        { id: 1, projectId: 100, type: "role", name: "苏晴", assetsId: null, imageState: "已完成", filePath: "/root.jpg" },
        { id: 9, projectId: 100, type: "role", name: "苏晴·日常", assetsId: 1, imageState: "已完成", filePath: "/a.jpg" },
        { id: 10, projectId: 100, type: "role", name: "苏晴·二级", assetsId: 9, imageState: "已完成", filePath: "/b.jpg" },
      ]),
    /只能引用根角色的直接衍生角色/,
  );
});

test("includes derivative wardrobe and storyboard bindings in the video prompt context", () => {
  const context = buildVideoPromptContext({
    modelName: "Seedance 2.0 fast",
    assets: [
      {
        id: 9,
        type: "role",
        name: "苏晴·日常定妆",
        assetsId: 1,
        describe: "苏晴本场固定造型",
        prompt: "黑色长直发，灰色连帽卫衣，白色运动鞋，无配饰",
        filePath: "/derive.jpg",
      },
    ],
    storyboards: [
      { id: 6, videoDesc: "苏晴走进餐馆", duration: 6, associateAssetsIds: [9] },
      { id: 7, videoDesc: "苏晴坐下", duration: 5, associateAssetsIds: [9] },
    ],
  });

  assert.match(context, /角色连续性锁/);
  assert.match(context, /灰色连帽卫衣/);
  assert.match(context, /黑色长直发/);
  assert.match(context, /无配饰/);
  assert.match(context, /"storyboardId":6/);
  assert.match(context, /"assetIds":\[9\]/);
  assert.match(context, /同一衍生角色资产 ID/);
});
