import express from "express";
import pLimit from "p-limit";
import u from "@/utils";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { buildRootRoleMasterPrompt } from "@/lib/characterGenerationPolicy";
import { assertRoleDerivativeModelSupport, resolveStoredRoleDerivativeGeneration } from "@/lib/roleDerivativeGenerationService";

const router = express.Router();

type AssetType = "role" | "scene" | "tool";

interface AssetTypeConfig {
  label: string;
  taskClass: string;
  dir: string;
  promptTitle: string;
  promptEnd: string;
}

const assetTypeConfig: Record<AssetType, AssetTypeConfig> = {
  role: {
    label: "角色",
    taskClass: "角色图生成",
    dir: "role",
    promptTitle: "角色标准四视图",
    promptEnd: "人物角色四视图",
  },
  scene: {
    label: "场景",
    taskClass: "场景图生成",
    dir: "scene",
    promptTitle: "标准场景图",
    promptEnd: "标准场景图",
  },
  tool: {
    label: "道具",
    taskClass: "道具图生成",
    dir: "props",
    promptTitle: "标准道具图",
    promptEnd: "标准道具图",
  },
};

function buildPrompt(cfg: AssetTypeConfig, artStyle: string, name: string, prompt: string): string {
  return `
    请根据以下参数生成${cfg.promptTitle}：

    **基础参数：**
    - 画风风格: ${artStyle || "未指定"}

    **${cfg.label}设定：**
    - 名称:${name},
    - 提示词:${prompt},

    请严格按照系统规范生成${cfg.promptEnd}。
  `;
}

const requestSchema = {
  projectId: z.number(),
  model: z.string(),
  resolution: z.string(),
  concurrentCount: z.number().int().min(1).optional(),
  items: z.array(
    z.object({
      id: z.number(),
      type: z.enum(["role", "scene", "tool", "storyboard"]),
      name: z.string(),
      prompt: z.string(),
      base64: z.string().optional().nullable(),
    }),
  ),
};

export default router.post("/", validateFields(requestSchema), async (req, res) => {
  const { projectId, model, resolution, concurrentCount, items } = req.body;

  // 1. 查询项目
  const project = await u.db("o_project").where("id", projectId).select("artStyle", "type", "intro").first();
  if (!project) return res.status(500).send(error("项目为空"));

  // 2. 逐条插入 o_image 占位记录，收集 imageId 列表
  const requestedAssets = await u.db("o_assets").where({ projectId }).whereIn("id", items.map((item: { id: number }) => item.id)).select("id", "type", "assetsId", "prompt", "describe");
  const requestedAssetsById = new Map(requestedAssets.map((asset) => [asset.id, asset]));
  const parentIds = requestedAssets.map((asset) => asset.assetsId).filter((id): id is number => id != null);
  const parentAssets = parentIds.length
    ? await u
        .db("o_assets")
        .leftJoin("o_image", "o_assets.imageId", "o_image.id")
        .where("o_assets.projectId", projectId)
        .whereIn("o_assets.id", parentIds)
        .select("o_assets.id", "o_assets.prompt", "o_assets.type", "o_assets.assetsId", "o_image.filePath", "o_image.state")
    : [];
  const parentAssetsById = new Map(parentAssets.map((asset) => [asset.id, asset]));
  const hasRoleDerivatives = requestedAssets.some((asset) => asset.type === "role" && asset.assetsId != null);
  if (hasRoleDerivatives) await assertRoleDerivativeModelSupport(model);

  for (const item of items) {
    const asset = requestedAssetsById.get(item.id);
    if (!asset) return res.status(400).send(error(`Asset ${item.id} does not exist.`));
    if (asset.type !== item.type) return res.status(400).send(error(`Asset ${item.id} type does not match the stored asset.`));
    if (asset.type !== "role") continue;
    if (asset.assetsId == null) {
      item.prompt = buildRootRoleMasterPrompt(item.name, asset.describe || "");
      await u.db("o_assets").where({ id: item.id, projectId }).update({ prompt: item.prompt });
      continue;
    }
    const derivative = await resolveStoredRoleDerivativeGeneration(parentAssetsById.get(asset.assetsId), item.prompt);
    item.prompt = derivative.prompt;
    item.base64 = derivative.referenceList[0].base64;
  }

  const totalNovelId: number[] = [];
  for (const item of items) {
    const [imageId] = await u.db("o_image").insert({
      type: item.type,
      state: "生成中",
      assetsId: item.id,
    });
    await u.db("o_assets").where("id", item.id).update({ imageId });
    totalNovelId.push(imageId);
  }

  // 3. 后台异步并发生成，不阻塞响应
  const limit = pLimit(concurrentCount ?? 1);

  const tasks = items.map((item: { id: number; type: string; name: string; prompt: string; base64: string | null | undefined }, index: number) =>
    limit(async () => {
      const imageId = totalNovelId[index];
      const data = await u.db("o_image").where("id", imageId).select("state").first();
      if (data?.state === "生成失败") {
        return;
      }
      const cfg = assetTypeConfig[item.type as AssetType];
      if (!cfg) return;

      await u.db("o_assets").where("id", item.id).update({ imageId });

      const imagePath = `/${projectId}/${cfg.dir}/${uuidv4()}.jpg`;
      const userPrompt = buildPrompt(cfg, project.artStyle ?? "", item.name, item.prompt);
      const describe = `生成${cfg.label}图，名称：${item.name}，提示词：${item.prompt}`;
      const generationMode = item.type === "role" && requestedAssetsById.get(item.id)?.assetsId != null ? "role-derivative" : item.type === "role" ? "role-master" : "asset";
      const relatedObjects = {
        id: item.id,
        projectId,
        type: cfg.label,
        generationMode,
        parentAssetId: requestedAssetsById.get(item.id)?.assetsId ?? null,
        referenceImageCount: item.base64 ? 1 : 0,
      };
      try {
        const aiImage = u.Ai.Image(model);
        await aiImage.run(
          {
            prompt: userPrompt,
            referenceList: item.base64 ? [{ base64: item.base64, type: "image" }] : [],
            size: resolution,
            aspectRatio: "16:9",
          },
          {
            taskClass: cfg.taskClass,
            describe,
            projectId,
            relatedObjects: JSON.stringify(relatedObjects),
          },
        );
        aiImage.save(imagePath);

        const imageData = await u.db("o_image").where("id", imageId).select("*").first();
        if (!imageData) return res.status(500).send("资产已被删除");
        if (!imageData) return;
        if (imageData.state === "生成失败") return;
        await u
          .db("o_image")
          .where("id", imageId)
          .update({
            state: "已完成",
            filePath: imagePath,
            type: item.type,
            model: model.split(/:(.+)/)[1],
            resolution,
          });

        await u.db("o_assets").where("id", item.id).update({ imageId });
      } catch (e: any) {
        await u
          .db("o_image")
          .where("id", imageId)
          .update({ state: "生成失败", errorReason: u.error(e).message });
      }
    }),
  );

  // 后台执行，不等待结果
  Promise.all(tasks).catch(() => {});

  return res.status(200).send(success({ total: items.length }));
});
