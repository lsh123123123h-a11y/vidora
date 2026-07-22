import express from "express";
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

// ─── 构建生成提示词 ──────────────────────────────────────────

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

// ─── 生成资产图片 ────────────────────────────────────────────

const requestSchema = {
  projectId: z.number(),
  model: z.string(),
  resolution: z.string(),
  id: z.number(),
  type: z.enum(["role", "scene", "tool", "storyboard"]),
  name: z.string(),
  prompt: z.string(),
  base64: z.string().optional().nullable(),
};

export default router.post("/", validateFields(requestSchema), async (req, res) => {
  const { projectId, model, resolution, id, type, name, prompt, base64 } = req.body;

  // 1. 查询项目 & 获取类型配置
  const project = await u.db("o_project").where("id", projectId).select("artStyle", "type", "intro").first();
  if (!project) return res.status(500).send(success({ message: "项目为空" }));

  const cfg = assetTypeConfig[type as AssetType];
  if (!cfg) return res.status(400).send(error("不支持的类型"));

  // The row-level dialog submits a user-editable (and often legacy) prompt.
  // Resolve role hierarchy on the server so it cannot bypass master/derivative rules.
  let generationPrompt = prompt;
  let referenceBase64 = base64 || "";
  let generationMode = "asset";
  let parentAssetId: number | null = null;
  const asset = await u.db("o_assets").where({ id, projectId }).select("id", "type", "assetsId", "describe").first();
  if (!asset) return res.status(400).send(error("Asset does not exist in this project."));
  if (asset.type !== type) return res.status(400).send(error("The requested asset type does not match the stored asset."));
  if (type === "role") {
    if (asset.assetsId == null) {
      generationPrompt = buildRootRoleMasterPrompt(name, asset.describe || "");
      generationMode = "role-master";
      await u.db("o_assets").where({ id, projectId }).update({ prompt: generationPrompt });
    } else {
      const parent = await u
        .db("o_assets")
        .leftJoin("o_image", "o_assets.imageId", "o_image.id")
        .where({ "o_assets.id": asset.assetsId, "o_assets.projectId": projectId })
        .select("o_assets.prompt", "o_assets.type", "o_assets.assetsId", "o_image.filePath", "o_image.state")
        .first();
      await assertRoleDerivativeModelSupport(model);
      const derivative = await resolveStoredRoleDerivativeGeneration(parent, prompt);
      generationPrompt = derivative.prompt;
      referenceBase64 = derivative.referenceList[0].base64;
      generationMode = "role-derivative";
      parentAssetId = asset.assetsId;
    }
  }

  // 2. 创建图片占位记录
  const [imageId] = await u.db("o_image").insert({
    type,
    state: "生成中",
    assetsId: id,
    model: model.split(/:(.+)/)[1],
    resolution,
  });
  await u.db("o_assets").where("id", id).update({ imageId });

  // 3. 准备生成参数
  const imagePath = `/${projectId}/${cfg.dir}/${uuidv4()}.jpg`;
  const userPrompt = buildPrompt(cfg, project.artStyle!, name, generationPrompt);
  const describe = `Generate ${generationMode} image; name: ${name}; prompt: ${generationPrompt}`;
  const relatedObjects = { id, projectId, type: cfg.label, generationMode, parentAssetId, referenceImageCount: referenceBase64 ? 1 : 0 };

  try {
    const aiImage = u.Ai.Image(model);
    await aiImage.run(
      {
        prompt: userPrompt,
        referenceList: referenceBase64 ? [{ type: "image", base64: referenceBase64 }] : [],
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
    // 5. 更新记录 & 返回结果
    const imageData = await u.db("o_image").where("id", imageId).select("*").first();
    if (!imageData) return res.status(500).send("资产已被删除");
    if (imageData.state === "生成失败") return;
    await u
      .db("o_image")
      .where("id", imageId)
      .update({
        state: "已完成",
        filePath: imagePath,
        type,
        model: model.split(/:(.+)/)[1],
        resolution,
      });

    const path = await u.oss.getSmallImageUrl(imagePath);
    await u.db("o_assets").where("id", id).update({ imageId });

    return res.status(200).send(success({ path, assetsId: id, effectivePrompt: generationPrompt }));
  } catch (e) {
    await u
      .db("o_image")
      .where("id", imageId)
      .update({ state: "生成失败", errorReason: u.error(e).message });
    return res.status(400).send(error(u.error(e).message || "图片生成失败"));
  }
});
