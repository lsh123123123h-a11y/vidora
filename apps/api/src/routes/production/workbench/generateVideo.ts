import express from "express";
import u from "@/utils";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { ReferenceList } from "@/utils/ai";
import { getProjectAssetRecords, validateVideoRequestSettings } from "@/lib/productionGenerationService";
import { normalizeProductionAssetIds, validateReferenceCounts } from "@/lib/productionGenerationPolicy";
const router = express.Router();

type Type = "imageReference" | "startImage" | "endImage" | "videoReference" | "audioReference";
interface UploadItem {
  fileType: "image" | "video" | "audio";
  type: Type;
  sources?: "assets" | "storyboard";
  id?: number;
  src?: string;
  label?: string;
  prompt?: string;
}

export default router.post(
  "/",
  validateFields({
    projectId: z.number(),
    scriptId: z.number(),
    uploadData: z.array(
      z.object({
        id: z.number(),
        sources: z.string(),
      }),
    ),
    prompt: z.string(),
    model: z.string(),
    mode: z.string(),
    resolution: z.string(),
    duration: z.number(),
    audio: z.boolean().optional(),
    trackId: z.number(),
  }),
  async (req, res) => {
    const { scriptId, projectId, prompt, uploadData, model, duration, resolution, audio, mode, trackId } = req.body;
    try {
      await validateVideoRequestSettings(model, duration, resolution);
    } catch (e) {
      return res.status(400).send(error(u.error(e).message));
    }
    let modeData = [];
    if (Array.isArray(mode)) {
    } else if (typeof mode === "string" && mode.startsWith('["') && mode.endsWith('"]')) {
      try {
        modeData = JSON.parse(mode);
      } catch (e) {}
    }
    const projectAssets = await getProjectAssetRecords(projectId);
    const normalizedUploadData: UploadItem[] = [];
    try {
      for (const item of uploadData as UploadItem[]) {
        if (item.sources !== "assets") {
          normalizedUploadData.push(item);
          continue;
        }
        const [resolvedId] = normalizeProductionAssetIds([item.id!], projectId, projectAssets);
        normalizedUploadData.push({ ...item, id: resolvedId });
      }
    } catch (e) {
      return res.status(400).send(error(u.error(e).message));
    }

    //获取生成视频比例
    const ratio = await u.db("o_project").select("videoRatio").where("id", projectId).first();
    const videoPath = `/${projectId}/video/${uuidv4()}.mp4`; //视频保存路径
    //查询出图片数据
    let images: ({ path: string; type: "image" | "video" | "audio" } | undefined)[];
    try {
      images = await Promise.all(
        normalizedUploadData.map(async (item: UploadItem) => {
        if (item.sources === "storyboard") {
          const filePath = await u.db("o_storyboard").where({ id: item.id, projectId }).select("filePath", "state").first();
          if (!filePath?.filePath || filePath.state !== "已完成") throw new Error(`分镜图片不存在或尚未完成，ID: ${item.id}`);
          return { path: filePath.filePath, type: "image" as const };
        }
        if (item.sources === "assets") {
          const filePath = await u
            .db("o_assets")
            .where({ "o_assets.id": item.id, "o_assets.projectId": projectId })
            .leftJoin("o_image", "o_assets.imageId", "o_image.id")
            .select("o_image.filePath", "o_image.type")
            .first();
          if (!filePath?.filePath) throw new Error(`素材文件不存在，资产ID: ${item.id}`);
          const type = filePath.type === "audio" ? "audio" : filePath.type === "video" ? "video" : "image";
          return { path: filePath.filePath, type };
        }
        }),
      );
      validateReferenceCounts(modeData.length > 0 ? modeData : mode, images.filter(Boolean) as { type: "image" | "video" | "audio" }[]);
    } catch (e) {
      return res.status(400).send(error(u.error(e).message));
    }
    //把images里面的图片转成base64格式
    const base64 = await Promise.all(
      images.map(async (item) => {
        if (!item) return null;
        return { base64: await u.oss.getImageBase64(item.path), type: item.type };
      }),
    );
    //新增
    const [videoId] = await u.db("o_video").insert({
      filePath: videoPath,
      time: Date.now(),
      state: "生成中",
      scriptId,
      projectId,
      videoTrackId: trackId,
    });
    res.status(200).send(success(videoId));
    const relatedObjects = {
      projectId,
      videoId,
      scriptId,
      type: "视频",
    };
    const aiVideo = u.Ai.Video(model);
    aiVideo
      .run(
        {
          prompt,
          referenceList: base64.filter(Boolean) as ReferenceList[],
          mode: modeData.length > 0 ? modeData : mode,
          duration,
          aspectRatio: (ratio?.videoRatio as "16:9" | "9:16") || "16:9",
          resolution,
          audio,
        },
        {
          projectId,
          taskClass: "视频生成",
          describe: "根据提示词生成视频",
          relatedObjects: JSON.stringify(relatedObjects),
        },
      )
      .then(async () => await aiVideo.save(videoPath))
      .then(async () => await u.db("o_video").where("id", videoId).update({ state: "生成成功" }))
      .catch(async (error: any) => {
        await u
          .db("o_video")
          .where("id", videoId)
          .update({
            state: "生成失败",
            errorReason: u.error(error).message,
          });
      });
  },
);
