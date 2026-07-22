import express from "express";
import { z } from "zod";
import u from "@/utils";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { buildRootRoleMasterPrompt } from "@/lib/characterGenerationPolicy";

const router = express.Router();

export default router.post(
  "/",
  validateFields({ projectId: z.number(), assetsId: z.number() }),
  async (req, res) => {
    const { projectId, assetsId } = req.body;
    const asset = await u.db("o_assets").where({ id: assetsId, projectId }).select("id", "type", "name", "describe", "prompt", "assetsId").first();
    if (!asset) return res.status(404).send(error("资产不存在或不属于当前项目"));
    const prompt =
      asset.type === "role" && asset.assetsId == null
        ? buildRootRoleMasterPrompt(asset.name || "未命名角色", asset.describe || "")
        : asset.prompt || "";
    if (prompt !== asset.prompt) await u.db("o_assets").where({ id: assetsId, projectId }).update({ prompt });
    return res.status(200).send(success({ prompt, isRootRole: asset.type === "role" && asset.assetsId == null }));
  },
);
