import assert from "node:assert/strict";
import test from "node:test";
import {
  appendMasterRoleConstraints,
  assertCompletedRoleMaster,
  assertImageReferenceSupport,
  buildRootRoleMasterPrompt,
  resolveRoleDerivativeGeneration,
  getRootRolesUsedForProduction,
} from "../src/lib/characterGenerationPolicy";

test("adds neutral identity-master constraints to a root-role prompt", () => {
  const prompt = appendMasterRoleConstraints("young urban woman");

  assert.match(prompt, /纯白或浅灰无缝背景/);
  assert.match(prompt, /无品牌、无图案、无配饰/);
  assert.match(prompt, /禁止道具/);
});

test("builds a root-role prompt from the asset description instead of retaining plot costume details", () => {
  const prompt = buildRootRoleMasterPrompt("苏晴", "年轻女性，穿灰色卫衣，在餐馆里拿着碎屏手机，眼神灵动。");

  assert.match(prompt, /苏晴/);
  assert.match(prompt, /年轻女性/);
  assert.match(prompt, /纯白或浅灰无缝背景/);
  assert.doesNotMatch(prompt, /灰色卫衣|餐馆|手机/);
});

test("requires a completed parent image before a role derivative can generate", () => {
  assert.throws(() => assertCompletedRoleMaster(undefined), /base role image/i);
  assert.throws(() => assertCompletedRoleMaster({ state: "生成中", filePath: "/role.jpg" }), /completed/i);
  assert.throws(() => assertCompletedRoleMaster({ state: "已完成", filePath: null }), /completed/i);
  assert.throws(() => assertCompletedRoleMaster({ state: "已完成", filePath: "/role.jpg", type: "scene", assetsId: null }), /role as its direct parent/i);
  assert.throws(() => assertCompletedRoleMaster({ state: "已完成", filePath: "/role.jpg", type: "role", assetsId: 1 }), /root role/i);
  assert.doesNotThrow(() => assertCompletedRoleMaster({ state: "已完成", filePath: "/role.jpg" }));
});

test("identifies root roles that are invalid production references", () => {
  const names = getRootRolesUsedForProduction([
    { name: "林风", type: "role", assetsId: null },
    { name: "林风·夜戏造型", type: "role", assetsId: 2 },
    { name: "小餐馆", type: "scene", assetsId: null },
  ]);

  assert.deepEqual(names, ["林风"]);
});
